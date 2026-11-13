/**
 * ==============================================================================
 * NOMINATIM OPENSTREETMAP GEOCODING SERVICE (FREE, ZERO API KEY)
 * ==============================================================================
 * Features:
 * - Restricted to India (countrycodes=in) with Mangalore / Dakshina Kannada viewbox
 * - Client-side rate-limiting: Strictly enforces maximum 1 request per second
 * - Debouncing & in-memory/localStorage caching
 * - Reverse geocoding for map pin drop/drag
 * - Browser Geolocation API integration ("Use my current location")
 * ==============================================================================
 */

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type: string;
}

// In-memory cache for ultra-fast instant lookups
const searchCache = new Map<string, GeocodingResult[]>();
const reverseCache = new Map<string, string>();

// Rate limiting queue state (strictly <= 1 req/sec as per OSM usage policy)
let lastRequestTimestamp = 0;
const RATE_LIMIT_DELAY_MS = 1050; // 1.05s between requests

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTimestamp;
  if (timeSinceLast < RATE_LIMIT_DELAY_MS) {
    const waitTime = RATE_LIMIT_DELAY_MS - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTimestamp = Date.now();
}

/**
 * Search places and addresses in Mangalore / Dakshina Kannada (India)
 */
export async function searchNominatim(query: string): Promise<GeocodingResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const cacheKey = cleanQuery.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(`raahdost_geo_${cacheKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      searchCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {
    // Ignore storage parse error
  }

  await waitForRateLimit();

  // Query Nominatim with viewbox prioritised over Mangalore region (74.6 to 75.1 E, 12.7 to 13.3 N)
  const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&countrycodes=in&viewbox=74.60,13.30,75.15,12.70&bounded=0&limit=6&addressdetails=1`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      console.warn('Nominatim service returned status:', res.status);
      return getFallbackLocalPlaces(cleanQuery);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: GeocodingResult[] = data.map((item: any) => {
      const parts = (item.display_name || '').split(',');
      const short = parts.slice(0, 2).join(',').trim();
      return {
        placeId: String(item.place_id || Math.random()),
        displayName: item.display_name,
        shortName: short || item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || 'place',
      };
    });

    // Cache the results
    searchCache.set(cacheKey, results);
    try {
      localStorage.setItem(`raahdost_geo_${cacheKey}`, JSON.stringify(results.slice(0, 4)));
    } catch (e) {
      // Storage quota safe
    }

    return results.length > 0 ? results : getFallbackLocalPlaces(cleanQuery);
  } catch (err) {
    console.warn('Nominatim network error, using local Mangalore fallback:', err);
    return getFallbackLocalPlaces(cleanQuery);
  }
}

/**
 * Reverse Geocode: Given latitude & longitude, retrieve readable street / town name
 */
export async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  await waitForRateLimit();

  const endpoint = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`;

  try {
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;

    const data = await res.json();
    const parts = (data.display_name || '').split(',');
    const readable = parts.slice(0, 3).join(',').trim() || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
    reverseCache.set(cacheKey, readable);
    return readable;
  } catch (err) {
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  }
}

/**
 * Browser Geolocation API ("Use my current location")
 */
export function getCurrentBrowserLocation(): Promise<{ lat: number; lng: number; address: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const address = await reverseGeocodeNominatim(lat, lng);
          resolve({ lat, lng, address });
        } catch {
          resolve({ lat, lng, address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
        }
      },
      (err) => {
        // Fallback default to Mulki Bus Stand if location is denied on desktop/laptop
        console.warn('Geolocation permission denied or timed out, defaulting to Mangalore hub:', err);
        resolve({
          lat: 13.0906,
          lng: 74.7925,
          address: 'Mulki Bus Stand, Dakshina Kannada'
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

/**
 * Fallback static match in case of internet timeout or offline testing
 */
function getFallbackLocalPlaces(query: string): GeocodingResult[] {
  const localHubs: GeocodingResult[] = [
    { placeId: 'loc-1', shortName: 'Mulki Bus Stand', displayName: 'Mulki Bus Stand, NH-66, Dakshina Kannada', lat: 13.0906, lng: 74.7925, type: 'bus_station' },
    { placeId: 'loc-2', shortName: 'Surathkal Junction', displayName: 'Surathkal Junction, Mangaluru, Karnataka', lat: 13.0076, lng: 74.7958, type: 'town' },
    { placeId: 'loc-3', shortName: 'NITK Main Gate', displayName: 'NITK Surathkal Main Gate, NH-66, Karnataka', lat: 13.0110, lng: 74.7930, type: 'institution' },
    { placeId: 'loc-4', shortName: 'Kinnigoli Bus Stand', displayName: 'Kinnigoli Main Road, Dakshina Kannada', lat: 13.1167, lng: 74.8667, type: 'village' },
    { placeId: 'loc-5', shortName: 'Kateel Temple Junction', displayName: 'Kateel Temple Entrance, Dakshina Kannada', lat: 13.0833, lng: 74.8500, type: 'village' },
    { placeId: 'loc-6', shortName: 'Bajpe Airport Road', displayName: 'Bajpe Bus Stop, Mangaluru, Karnataka', lat: 12.9667, lng: 74.8833, type: 'junction' },
    { placeId: 'loc-7', shortName: 'Kadri Polytechnic', displayName: 'Government Polytechnic College, Kadri Hills, Mangalore', lat: 12.8875, lng: 74.8562, type: 'institution' },
    { placeId: 'loc-8', shortName: 'Moodbidri Bus Stand', displayName: 'Moodbidri Bus Stand, NH-169, Dakshina Kannada', lat: 13.0697, lng: 74.9961, type: 'town' },
    { placeId: 'loc-9', shortName: 'Ullal Bus Stand', displayName: 'Ullal Main Road, Dakshina Kannada', lat: 12.8058, lng: 74.8519, type: 'town' },
    { placeId: 'loc-10', shortName: 'St. Aloysius College', displayName: 'St. Aloysius College, Light House Hill Rd, Mangalore', lat: 12.8715, lng: 74.8436, type: 'institution' },
  ];

  const q = query.toLowerCase();
  return localHubs.filter(h => h.shortName.toLowerCase().includes(q) || h.displayName.toLowerCase().includes(q));
}


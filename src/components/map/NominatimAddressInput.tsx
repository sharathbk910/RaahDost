import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, Check, AlertCircle } from 'lucide-react';
import { searchNominatim, getCurrentBrowserLocation, GeocodingResult } from '../../services/nominatimService';

interface Props {
  label?: string;
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  onPickOnMap?: () => void;
}

export const NominatimAddressInput: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'Search village, junction, or college in Mangalore...',
  onPickOnMap
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search (500 ms)
  useEffect(() => {
    if (!query || query.length < 2 || !isOpen) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const results = await searchNominatim(query);
        setSuggestions(results);
      } catch (err) {
        setErrorMsg('Search service busy. Try picking on map or using GPS.');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: GeocodingResult) => {
    setQuery(item.shortName);
    onChange(item.displayName, { lat: item.lat, lng: item.lng });
    setIsOpen(false);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setErrorMsg(null);
    try {
      const loc = await getCurrentBrowserLocation();
      setQuery(loc.address);
      onChange(loc.address, { lat: loc.lat, lng: loc.lng });
    } catch (err: any) {
      setErrorMsg('Could not fetch GPS. Please pick a location on the map.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5 text-xs font-sans">
      {label && (
        <label className="block font-bold text-slate-700">{label}</label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-24 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />

        {/* Quick Action Buttons: GPS & Map */}
        <div className="absolute right-1.5 flex items-center space-x-1">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Use current GPS location"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
          </button>

          {onPickOnMap && (
            <button
              type="button"
              onClick={onPickOnMap}
              title="Pick location on map"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-amber-700 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      {/* Nominatim Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>OpenStreetMap Nominatim Places</span>
            <span className="text-emerald-600">Free & Live</span>
          </div>

          {suggestions.map((item) => (
            <button
              key={item.placeId}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/80 flex items-start space-x-2.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block truncate text-xs">{item.shortName}</span>
                <span className="text-[11px] text-slate-500 block truncate">{item.displayName}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

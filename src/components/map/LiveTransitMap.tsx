import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { DEMO_VILLAGES, DEMO_INSTITUTIONS } from '../../data/demoData';
import { Village, Institution } from '../../types';

// Custom icons using Leaflet DivIcon for clean modern styling without asset loading issues
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        font-weight: 800;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 9999px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span>${label}</span>
      </div>
    `,
    iconSize: [80, 30],
    iconAnchor: [40, 15]
  });
};

const villageIcon = createCustomIcon('#16a34a', '🏡 Village');
const institutionIcon = createCustomIcon('#2563eb', '🎓 Campus');
const hazardIcon = createCustomIcon('#dc2626', '⛔ Flooded Bridge');

interface RouteMapProps {
  isFlooded?: boolean;
}

export const LiveTransitMap: React.FC<RouteMapProps> = ({ isFlooded = true }) => {
  // Center of our rural Lucknow-Sitapur corridor
  const center: [number, number] = [26.858, 80.950];

  // Route Coordinates:
  // 1. Direct Canal Route (Rampur [26.8467, 80.9462] -> Govt Poly [26.8700, 80.9700])
  const directRouteCoords: [number, number][] = [
    [26.8467, 80.9462], // Rampur Village
    [26.8580, 80.9580], // Canal Bridge checkpoint
    [26.8700, 80.9700]  // Govt Polytechnic
  ];

  // 2. Active Detour via Shivpur & Balarampur Bypass
  const detourRouteCoords: [number, number][] = [
    [26.8467, 80.9462], // Rampur Village
    [26.8520, 80.9310], // Shivpur Hamlet
    [26.8390, 80.9200], // Balarampur Junction
    [26.8610, 80.9400], // Bypass Expressway Link
    [26.8700, 80.9700]  // Govt Polytechnic
  ];

  return (
    <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-10">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Villages */}
        {DEMO_VILLAGES.map((v: Village) => (
          <Marker 
            key={v.id} 
            position={[v.coordinates?.lat || 26.8467, v.coordinates?.lng || 80.9462]}
            icon={villageIcon}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-slate-900 block text-sm">{v.name}</strong>
                <p className="text-slate-500">Student Pickup Hub</p>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Active Waiting Shelter
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Institutions */}
        {DEMO_INSTITUTIONS.map((inst: Institution) => (
          <Marker 
            key={inst.id} 
            position={[inst.coordinates?.lat || 26.8700, inst.coordinates?.lng || 80.9700]}
            icon={institutionIcon}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-slate-900 block text-sm">{inst.name}</strong>
                <p className="text-slate-500">Destination Examination Center</p>
                <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                  Exam Timing: 09:00 AM
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hazard Marker at Canal Spillway */}
        {isFlooded && (
          <Marker position={[26.8580, 80.9580]} icon={hazardIcon}>
            <Popup>
              <div className="text-xs font-sans text-red-700 font-bold">
                ⚠️ Canal Bridge Spillway Overflow (Closed by Police)
              </div>
            </Popup>
          </Marker>
        )}

        {/* Direct Route Line: Red dashed if flooded, green if open */}
        <Polyline
          positions={directRouteCoords}
          pathOptions={{
            color: isFlooded ? '#ef4444' : '#16a34a',
            weight: 4,
            dashArray: isFlooded ? '8, 8' : undefined,
            opacity: isFlooded ? 0.6 : 0.9
          }}
        >
          <Tooltip sticky>
            {isFlooded ? '⛔ Direct Canal Road (Flooded & Impassable)' : 'Direct Canal Road (Normal: 20 mins)'}
          </Tooltip>
        </Polyline>

        {/* Detour Route Line: Solid Emerald/Blue */}
        {isFlooded && (
          <Polyline
            positions={detourRouteCoords}
            pathOptions={{
              color: '#059669',
              weight: 5,
              opacity: 0.95
            }}
          >
            <Tooltip sticky>
              ✅ Active Detour via Balarampur Bypass (45 mins, 21.5 km)
            </Tooltip>
          </Polyline>
        )}
      </MapContainer>

      {/* Map Floating Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 text-[11px] font-sans space-y-1.5 z-[1000]">
        <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Transit Corridor Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-emerald-600 rounded"></span>
          <span className="text-slate-700 font-medium">Balarampur Safe Detour (45m)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-red-500 border-dashed rounded"></span>
          <span className="text-slate-700 font-medium">Blocked Canal Road (Flooded)</span>
        </div>
      </div>
    </div>
  );
};

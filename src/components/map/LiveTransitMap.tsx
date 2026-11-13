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

const villageIcon = createCustomIcon('#16a34a', '🏡 Village/Town');
const institutionIcon = createCustomIcon('#2563eb', '🎓 Campus');
const hazardIcon = createCustomIcon('#dc2626', '⛔ Kuloor Bridge Flooded');

interface RouteMapProps {
  isFlooded?: boolean;
}

export const LiveTransitMap: React.FC<RouteMapProps> = ({ isFlooded = true }) => {
  // Center around Mangalore / Dakshina Kannada coastal corridor
  const center: [number, number] = [12.980, 74.860];

  // Coordinates:
  // 1. Direct NH-66 Coastal Route (Mulki [13.0906, 74.7925] -> Surathkal [13.0076, 74.7958] -> Kuloor Bridge [12.9150, 74.8320] -> Kadri Poly [12.8875, 74.8562])
  const directRouteCoords: [number, number][] = [
    [13.0906, 74.7925], // Mulki
    [13.0076, 74.7958], // Surathkal
    [12.9150, 74.8320], // Kuloor Bridge (Flooded)
    [12.8875, 74.8562]  // Kadri Polytechnic
  ];

  // 2. Safe Detour via Kinnigoli -> Kateel -> Bajpe -> Kavoor -> Kadri
  const detourRouteCoords: [number, number][] = [
    [13.0906, 74.7925], // Mulki
    [13.1167, 74.8667], // Kinnigoli
    [13.0833, 74.8500], // Kateel
    [12.9667, 74.8833], // Bajpe
    [12.9250, 74.8680], // Kavoor
    [12.8875, 74.8562]  // Kadri Polytechnic
  ];

  return (
    <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-10">
      <MapContainer 
        center={center} 
        zoom={11} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Villages & Towns in Dakshina Kannada */}
        {DEMO_VILLAGES.map((v: Village) => (
          <Marker 
            key={v.id} 
            position={[v.coordinates?.lat || 12.980, v.coordinates?.lng || 74.850]}
            icon={villageIcon}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-slate-900 block text-sm">{v.name}</strong>
                <p className="text-slate-500">Dakshina Kannada Transit Hub</p>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Student Pickup Center
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Educational Institutions */}
        {DEMO_INSTITUTIONS.map((inst: Institution) => (
          <Marker 
            key={inst.id} 
            position={[inst.coordinates?.lat || 12.8875, inst.coordinates?.lng || 74.8562]}
            icon={institutionIcon}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-slate-900 block text-sm">{inst.name}</strong>
                <p className="text-slate-500">Destination Campus & Exam Hall</p>
                <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                  Semester Exams: 09:00 AM / 10:30 AM
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hazard Marker at Kuloor River Bridge */}
        {isFlooded && (
          <Marker position={[12.9150, 74.8320]} icon={hazardIcon}>
            <Popup>
              <div className="text-xs font-sans text-red-700 font-bold">
                ⚠️ NH-66 Kuloor River Bridge Submerged (Traffic Diverted)
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
            {isFlooded ? '⛔ Direct NH-66 via Kuloor Bridge (Flooded & Impassable)' : 'NH-66 Coastal Highway (Normal: 38 mins)'}
          </Tooltip>
        </Polyline>

        {/* Detour Route Line via Kinnigoli & Bajpe */}
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
              ✅ Active Detour via Kinnigoli ➔ Kateel ➔ Bajpe Airport Road (65 mins)
            </Tooltip>
          </Polyline>
        )}
      </MapContainer>

      {/* Map Floating Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 text-[11px] font-sans space-y-1.5 z-[1000]">
        <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Mangalore Corridor Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-emerald-600 rounded"></span>
          <span className="text-slate-700 font-medium">Kateel-Bajpe Safe Detour (65m)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-red-500 border-dashed rounded"></span>
          <span className="text-slate-700 font-medium">Blocked Kuloor Bridge (NH-66 Flooded)</span>
        </div>
      </div>
    </div>
  );
};

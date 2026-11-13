import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { DEMO_VILLAGES, DEMO_INSTITUTIONS } from '../../data/demoData';
import { Village, Institution, Vehicle, DriverProfile } from '../../types';

// Custom icons using Leaflet DivIcon for clean modern styling
const createBadgeIcon = (bg: string, text: string, subtext?: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bg};
        color: white;
        font-weight: 800;
        font-size: 11px;
        padding: 5px 10px;
        border-radius: 9999px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        cursor: pointer;
      ">
        <span>${text}</span>
        ${subtext ? `<span style="background: rgba(255,255,255,0.25); padding: 1px 6px; border-radius: 6px; font-size: 9px;">${subtext}</span>` : ''}
      </div>
    `,
    iconSize: [110, 32],
    iconAnchor: [55, 16]
  });
};

const studentPinIcon = L.divIcon({
  className: 'custom-student-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: #0284c7; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const villageIcon = createBadgeIcon('#059669', '🏡 Stop');
const institutionIcon = createBadgeIcon('#4f46e5', '🎓 College');
const hazardIcon = createBadgeIcon('#dc2626', '⛔ Flooded Road');

interface LiveTransitMapProps {
  isFlooded?: boolean;
  studentLocation?: { lat: number; lng: number; name?: string };
  buses?: Vehicle[];
  drivers?: DriverProfile[];
  selectedRouteCoords?: [number, number][];
  heightClass?: string;
}

export const LiveTransitMap: React.FC<LiveTransitMapProps> = ({ 
  isFlooded = true,
  studentLocation,
  buses = [],
  drivers = [],
  selectedRouteCoords,
  heightClass = "h-80 sm:h-96"
}) => {
  // Center around Mangalore / Dakshina Kannada coastal corridor
  const center: [number, number] = studentLocation 
    ? [studentLocation.lat, studentLocation.lng]
    : [12.980, 74.860];

  // Coordinates: Direct NH-66 Coastal Route (Mulki -> Surathkal -> Kuloor Bridge -> Kadri Poly)
  const directRouteCoords: [number, number][] = [
    [13.0906, 74.7925], // Mulki
    [13.0076, 74.7958], // Surathkal
    [12.9150, 74.8320], // Kuloor Bridge (Flooded)
    [12.8875, 74.8562]  // Kadri Polytechnic
  ];

  // Safe Detour via Kinnigoli -> Kateel -> Bajpe -> Kavoor -> Kadri
  const detourRouteCoords: [number, number][] = [
    [13.0906, 74.7925], // Mulki
    [13.1167, 74.8667], // Kinnigoli
    [13.0833, 74.8500], // Kateel
    [12.9667, 74.8833], // Bajpe
    [12.9250, 74.8680], // Kavoor
    [12.8875, 74.8562]  // Kadri Polytechnic
  ];

  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-10`}>
      <MapContainer 
        center={center} 
        zoom={studentLocation ? 12 : 11} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Student Current Location Marker */}
        {studentLocation && (
          <Marker position={[studentLocation.lat, studentLocation.lng]} icon={studentPinIcon}>
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-sky-700 block text-sm">📍 Your Location</strong>
                <p className="text-slate-600 font-semibold">{studentLocation.name || 'Current Boarding Point'}</p>
                <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">
                  Student Origin
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Available Drivers on the Road */}
        {drivers.filter(d => d.isAvailable && d.currentLocation).map((drv) => {
          const icon = createBadgeIcon(
            '#0d9488', 
            `🚗 ${drv.fullName.split(' ')[0]}`,
            `${drv.seatsFree} seats`
          );
          return (
            <Marker 
              key={drv.id} 
              position={[drv.currentLocation!.lat, drv.currentLocation!.lng]}
              icon={icon}
            >
              <Popup>
                <div className="text-xs font-sans space-y-1.5 p-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-teal-900 block text-sm">{drv.fullName}</strong>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                      ★ {drv.rating}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Vehicle: <strong>{drv.vehicleType}</strong> ({drv.vehicleNumberPlate})
                  </p>
                  <p className="text-emerald-700 font-bold">
                    Free Seats: {drv.seatsFree} / {drv.totalSeats}
                  </p>
                  {drv.activeRoute && (
                    <p className="text-[11px] text-slate-500">
                      Destination: {drv.activeRoute.destinationLocation}
                    </p>
                  )}
                  <div className="pt-1">
                    <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200 block text-center">
                      Live GPS Active (Driver Portal)
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Buses on the Route */}
        {buses.map((bus) => {
          const isBroken = bus.availabilityStatus === 'unavailable';
          const icon = createBadgeIcon(
            isBroken ? '#dc2626' : '#ea580c',
            `🚌 ${bus.vehicleCode.split('-').pop() || 'Bus'}`,
            isBroken ? 'Down' : `${bus.availableSeats} seats`
          );
          // Approximate coordinate along coastal route
          const lat = bus.id.includes('01') ? 13.045 : bus.id.includes('02') ? 12.985 : 12.920;
          const lng = 74.810;
          return (
            <Marker key={bus.id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <strong className="text-slate-900 block text-sm">{bus.name}</strong>
                  <p className="text-slate-600">{bus.routeName}</p>
                  <p className={isBroken ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                    Status: {isBroken ? 'Broken Down' : `Running (${bus.availableSeats} seats free)`}
                  </p>
                  <p className="text-slate-500">Driver: {bus.driverName}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Selected Route Polyline or Default Highway Paths */}
        {selectedRouteCoords && selectedRouteCoords.length > 0 ? (
          <Polyline 
            positions={selectedRouteCoords} 
            color="#2563eb" 
            weight={5} 
            dashArray="2, 6"
          />
        ) : isFlooded ? (
          <>
            {/* Direct Blocked Highway (Red Dashed) */}
            <Polyline 
              positions={directRouteCoords} 
              color="#ef4444" 
              weight={5} 
              dashArray="6, 8" 
              opacity={0.7}
            />
            {/* Active Flood Hazard Marker at Kuloor Bridge */}
            <Marker position={[12.9150, 74.8320]} icon={hazardIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong className="text-red-700 block">Kuloor Gurupura Estuary Bridge</strong>
                  <p className="text-slate-600">Flooded & completely closed due to coastal rain surge.</p>
                </div>
              </Popup>
            </Marker>
            {/* Safe Inland Detour (Emerald Solid) */}
            <Polyline 
              positions={detourRouteCoords} 
              color="#059669" 
              weight={5} 
              opacity={0.9}
            />
          </>
        ) : (
          <Polyline 
            positions={directRouteCoords} 
            color="#059669" 
            weight={5} 
            opacity={0.8}
          />
        )}

        {/* Villages & Rural Stops */}
        {DEMO_VILLAGES.map((v: Village) => (
          <Marker 
            key={v.id} 
            position={[v.coordinates?.lat || 12.980, v.coordinates?.lng || 74.850]}
            icon={villageIcon}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-slate-900 block text-sm">{v.name}</strong>
                <p className="text-slate-500">Dakshina Kannada Transit Stop</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Educational Institutions */}
        {DEMO_INSTITUTIONS.map((inst: Institution) => (
          <Marker 
            key={inst.id} 
            position={[inst.coordinates?.lat || 12.870, inst.coordinates?.lng || 74.840]}
            icon={institutionIcon}
          >
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-slate-900 block text-sm">{inst.name}</strong>
                <p className="text-slate-500">Examination Center & Campus</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

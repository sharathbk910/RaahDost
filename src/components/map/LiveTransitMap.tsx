import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEMO_VILLAGES, DEMO_INSTITUTIONS } from '../../data/demoData';
import { Village, Institution, Vehicle, DriverProfile, RoadSegment } from '../../types';
import { db } from '../../services/dataStore';
import { getRoadRouteWithDetours } from '../../services/osrmRoutingService';
import { AlertTriangle, MapPin, Navigation, Loader2 } from 'lucide-react';

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
        padding: 4px 8px;
        border-radius: 9999px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        cursor: pointer;
        transition: transform 0.3s ease;
      ">
        <span>${text}</span>
        ${subtext ? `<span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 6px; font-size: 9px;">${subtext}</span>` : ''}
      </div>
    `,
    iconSize: [110, 32],
    iconAnchor: [55, 16]
  });
};

const studentPinIcon = L.divIcon({
  className: 'custom-student-marker',
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #0284c7; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #0284c7; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">📍</div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
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
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  allowPinDrop?: boolean;
}

// Inner component to handle Leaflet map click events
const MapClickHandler: React.FC<{ onMapClick?: (coords: { lat: number; lng: number }) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });
  return null;
};

export const LiveTransitMap: React.FC<LiveTransitMapProps> = ({ 
  isFlooded = true,
  studentLocation,
  buses = [],
  drivers = [],
  selectedRouteCoords,
  heightClass = "h-80 sm:h-96",
  onMapClick,
  allowPinDrop = false
}) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [osrmRoute, setOsrmRoute] = useState<[number, number][]>([]);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Center around Mangalore / Dakshina Kannada coastal corridor
  const center: [number, number] = studentLocation 
    ? [studentLocation.lat, studentLocation.lng]
    : [12.980, 74.860];

  // Load road network state from database
  useEffect(() => {
    const updateRoadState = () => {
      setRoads(db.getRoads());
    };
    updateRoadState();
    const unsub = db.subscribe(updateRoadState);
    return () => unsub();
  }, []);

  // Fetch real OSRM road geometry if origin and destination are present
  useEffect(() => {
    if (selectedRouteCoords && selectedRouteCoords.length >= 2) {
      setOsrmRoute(selectedRouteCoords);
      return;
    }

    const start: [number, number] = studentLocation ? [studentLocation.lat, studentLocation.lng] : [13.0906, 74.7925];
    const dest: [number, number] = [12.8875, 74.8562]; // Kadri Polytechnic

    setIsRoutingLoading(true);
    getRoadRouteWithDetours(start, dest)
      .then(res => {
        if (res.coordinates && res.coordinates.length > 0) {
          setOsrmRoute(res.coordinates);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsRoutingLoading(false);
        setIsMapReady(true);
      });
  }, [studentLocation, isFlooded, selectedRouteCoords, roads]);

  // Blocked NH-66 Kuloor River Bridge direct coords
  const directBlockedCoords: [number, number][] = [
    [13.0906, 74.7925], // Mulki
    [13.0076, 74.7958], // Surathkal
    [12.9150, 74.8320], // Kuloor Bridge (Flooded)
    [12.8875, 74.8562]  // Kadri Polytechnic
  ];

  const hasBlockedRoad = roads.some(r => r.isBlocked);

  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-10 font-sans`}>
      {/* Friendly Loading State */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-20 text-xs font-bold text-slate-500 space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading OpenStreetMap...</span>
        </div>
      )}

      {/* Interactive Helper Banner */}
      {allowPinDrop && (
        <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Click anywhere on map to set boarding location</span>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={studentLocation ? 12 : 11} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setIsMapReady(true)}
      >
        <MapClickHandler onMapClick={onMapClick} />

        {/* Free OpenStreetMap Tiles with Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Student Location Marker (Pulsating radar marker) */}
        {studentLocation && (
          <Marker position={[studentLocation.lat, studentLocation.lng]} icon={studentPinIcon}>
            <Popup>
              <div className="text-xs font-sans space-y-1">
                <strong className="text-sky-700 block text-sm">📍 Student Location</strong>
                <p className="text-slate-600 font-semibold">{studentLocation.name || 'Boarding Point'}</p>
                <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">
                  Live Coordinates: {studentLocation.lat.toFixed(4)}, {studentLocation.lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Moving Drivers (Updated from real-time database listener) */}
        {drivers.filter(d => d.isAvailable && d.currentLocation && d.seatsFree > 0).map((drv) => {
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
                      Heading to: {drv.activeRoute.destinationLocation}
                    </p>
                  )}
                  <div className="pt-1">
                    <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200 block text-center">
                      Live 5s GPS Pulse
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Buses (KSRTC & Coastal Transit) */}
        {buses.map((bus) => {
          const isBroken = bus.availabilityStatus === 'unavailable';
          const icon = createBadgeIcon(
            isBroken ? '#dc2626' : '#ea580c',
            `🚌 ${bus.vehicleCode.split('-').pop() || 'Bus'}`,
            isBroken ? 'Broken' : `${bus.availableSeats} seats`
          );
          // Coordinates along coastal Mangalore highway
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
                  <p className="text-slate-500">Driver: {bus.driverName || 'KSRTC Pilot'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* OSRM Road Geometry Route Polyline */}
        {osrmRoute && osrmRoute.length > 0 && (
          <Polyline 
            positions={osrmRoute} 
            color="#059669" 
            weight={5} 
            opacity={0.85}
          />
        )}

        {/* Blocked Road Display (Bold Red line with label) */}
        {(hasBlockedRoad || isFlooded) && (
          <>
            <Polyline 
              positions={directBlockedCoords} 
              color="#dc2626" 
              weight={6} 
              dashArray="6, 8" 
              opacity={0.8}
            />
            <Marker position={[12.9150, 74.8320]} icon={hazardIcon}>
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <strong className="text-red-700 block text-sm">⛔ NH-66 Kuloor Bridge Blocked</strong>
                  <p className="text-slate-600">Gurupura river estuary tidal overflow. Rerouting via inland bypass.</p>
                </div>
              </Popup>
            </Marker>
          </>
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
                <p className="text-slate-500">Dakshina Kannada Public Boarding Shelter</p>
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
                <p className="text-slate-500">Destination College & Examination Center</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

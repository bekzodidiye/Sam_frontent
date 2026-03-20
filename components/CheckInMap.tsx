import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CheckInMapProps {
  currentLocation: { lat: number; lng: number } | null;
  workLocation: { lat: number; lng: number } | null;
  workRadius?: number;
  workType?: 'office' | 'mobile' | 'desk';
  className?: string;
}

const MapUpdater: React.FC<{ currentLocation: { lat: number; lng: number } | null; workLocation: { lat: number; lng: number } | null }> = ({ currentLocation, workLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (currentLocation && workLocation) {
      const bounds = L.latLngBounds([
        [currentLocation.lat, currentLocation.lng],
        [workLocation.lat, workLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 14);
    } else if (workLocation) {
      map.setView([workLocation.lat, workLocation.lng], 14);
    }
  }, [currentLocation, workLocation, map]);

  return null;
};



const CheckInMap: React.FC<CheckInMapProps> = ({ currentLocation, workLocation, workRadius = 300, workType, className }) => {
  const center: [number, number] = workLocation ? [workLocation.lat, workLocation.lng] : (currentLocation ? [currentLocation.lat, currentLocation.lng] : [41.2995, 69.2401]);

  const getWorkIconHtml = () => {
    let emoji = '📍';
    if (workType === 'office') emoji = '🏢';
    if (workType === 'mobile') emoji = '🚐';
    if (workType === 'desk') emoji = '💻';

    return `<div style="background: white; width: 36px; height: 36px; border-radius: 50%; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">${emoji}</div>`;
  };

  const workIcon = L.divIcon({
    className: 'work-marker',
    html: getWorkIconHtml(),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="background: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className={`relative ${className || "h-64 w-full rounded-2xl overflow-hidden border border-white/10 mt-4"}`}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />

        {workLocation && (
          <>
            <Circle
              center={[workLocation.lat, workLocation.lng]}
              radius={workRadius}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                Ish radiusi: {workRadius}m
              </Tooltip>
            </Circle>
            <Marker position={[workLocation.lat, workLocation.lng]} icon={workIcon} />
          </>
        )}

        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon} />
        )}

        <MapUpdater currentLocation={currentLocation} workLocation={workLocation} />

      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-brand-dark/90 backdrop-blur-md p-2 rounded-lg border border-white/10 text-[8px] sm:text-[10px] space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
          <span className="text-white/70 uppercase font-black tracking-widest">Sizning joylashuvingiz</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
          <span className="text-white/70 uppercase font-black tracking-widest">Ish joyi</span>
        </div>
        {workLocation && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full border border-[#3b82f6] bg-[#3b82f6]/30"></div>
            <span className="text-white/70 uppercase font-black tracking-widest">Ish radiusi ({workRadius}m)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInMap;

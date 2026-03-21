import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { t, Language } from '../translations';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;


interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
  workType?: 'office' | 'mobile' | 'desk';
  radius?: number;
  language: Language;
}

const LocationMarker: React.FC<{ lat: number; lng: number; onChange: (lat: number, lng: number) => void; workType?: 'office' | 'mobile' | 'desk'; radius?: number }> = ({ lat, lng, onChange, workType, radius }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  const getIconHtml = () => {
    let emoji = '📍';
    if (workType === 'office') emoji = '🏢';
    if (workType === 'mobile') emoji = '🚐';
    if (workType === 'desk') emoji = '💻';

    return `<div style="background: white; width: 36px; height: 36px; border-radius: 50%; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">${emoji}</div>`;
  };

  const customIcon = L.divIcon({
    className: 'custom-work-marker',
    html: getIconHtml(),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return lat && lng ? (
    <>
      {radius && radius > 0 && (
        <Circle 
          center={[lat, lng]} 
          radius={radius} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }} 
        />
      )}
      <Marker position={[lat, lng]} icon={workType ? customIcon : DefaultIcon} />
    </>
  ) : null;
};

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onChange, className, workType, radius, language }) => {
  const center: [number, number] = lat && lng ? [lat, lng] : [41.2995, 69.2401]; // Default to Tashkent
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const goToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onChange(latitude, longitude);
          if (mapInstance) {
            mapInstance.flyTo([latitude, longitude], 16);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className={`relative ${className || "h-64 w-full rounded-2xl overflow-hidden border border-white/10 mt-2"}`}>
      <button
        onClick={(e) => { e.preventDefault(); goToCurrentLocation(); }}
        className="absolute top-4 right-4 z-[400] bg-white text-brand-black p-3 rounded-xl shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-bold text-sm"
        title={t(language, 'my_location')}
      >
        <Navigation className="w-5 h-5 text-brand-gold" />
        <span className="hidden sm:inline">{t(language, 'my_location')}</span>
      </button>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        ref={setMapInstance}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} workType={workType} radius={radius} />
      </MapContainer>
    </div>
  );
};

export default MapPicker;

import React, { useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Role, User, CheckIn, DailyReport } from '../types';
import { Language, t } from '../translations';
import { isDateMatch, getLatenessStatus } from '../utils';

const StaffMap: React.FC<{ checkIns: CheckIn[], reports: DailyReport[], users: User[], today: string, onUserSelect: (userId: string) => void, selectedUserId?: string | null, isDarkMode: boolean, language: Language, className?: string }> = ({ checkIns, reports, users, today, onUserSelect, selectedUserId, isDarkMode, language, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);

  const operators = useMemo(() => users.filter(u => u.isApproved && u.role !== Role.MANAGER), [users]);

  const staffStatus = useMemo(() => {
    return operators.map(user => {
      const userCheckIns = checkIns
        .filter(ci => ci.userId === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const lastKnownLocation = userCheckIns[0];
      const todayCheckIn = userCheckIns.find(ci => isDateMatch(ci.timestamp, today));
      const todayReport = reports.find(r => r.userId === user.id && r.date === today);

      return { user, todayCheckIn, todayReport, lastKnownLocation, isPresent: !!todayCheckIn, hasFinished: !!todayReport };
    });
  }, [operators, checkIns, reports, today]);

  const fitToMarkers = () => {
    if (leafletMap.current && markersGroup.current) {
      const layers = markersGroup.current.getLayers();
      if (layers.length > 0) {
        const boundsArr = layers.map((l: any) => l.getLatLng());
        leafletMap.current.fitBounds(L.latLngBounds(boundsArr as any), { padding: [80, 80], maxZoom: 14 });
      }
    }
  };

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { scrollWheelZoom: true, dragging: true, zoomControl: false }).setView([41.311081, 69.240562], 12);

      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      tileLayerRef.current = L.tileLayer(tileUrl, { attribution: isDarkMode ? '&copy; CARTO' : '&copy; Google Maps', maxZoom: 20 });
      tileLayerRef.current.addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      markersGroup.current = L.layerGroup().addTo(leafletMap.current);

      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 250);

      const resizeObserver = new ResizeObserver(() => {
        leafletMap.current?.invalidateSize();
      });
      resizeObserver.observe(mapRef.current);
      return () => {
        resizeObserver.disconnect();
        if (leafletMap.current) {
          leafletMap.current.remove();
          leafletMap.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (leafletMap.current && tileLayerRef.current) {
      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      tileLayerRef.current.setUrl(tileUrl);

      // Update attribution
      const oldAttribution = isDarkMode ? '&copy; Google Maps' : '&copy; CARTO';
      const newAttribution = isDarkMode ? '&copy; CARTO' : '&copy; Google Maps';
      if (leafletMap.current.attributionControl) {
        leafletMap.current.attributionControl.removeAttribution(oldAttribution);
        leafletMap.current.attributionControl.addAttribution(newAttribution);
      }
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (leafletMap.current && markersGroup.current) {
      markersGroup.current.clearLayers();
      staffStatus.forEach(({ user, lastKnownLocation, todayCheckIn, isPresent, hasFinished }) => {
        if (user.workLocation) {
          const radius = user.workRadius || 200;
          L.circle([user.workLocation.lat, user.workLocation.lng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5, 5',
            radius: radius
          }).addTo(markersGroup.current!);

          let emoji = '📍';
          if (user.workType === 'office') emoji = '🏢';
          if (user.workType === 'mobile') emoji = '🚐';
          if (user.workType === 'desk') emoji = '💻';

          const workIcon = L.divIcon({
            className: 'work-location-marker',
            html: `<div style="background: white; width: 36px; height: 36px; border-radius: 50%; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">${emoji}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          L.marker([user.workLocation.lat, user.workLocation.lng], { icon: workIcon })
            .addTo(markersGroup.current!)
            .bindPopup(`<b>${user.firstName} ${user.lastName}</b><br/>${t(language, 'work_location')} (${t(language, 'radius')}: ${radius}m)<br/>${t(language, 'type')}: ${user.workType === 'office' ? t(language, 'office_label') : user.workType === 'mobile' ? t(language, 'mobile_office_label') : user.workType === 'desk' ? t(language, 'desk') : t(language, 'not_specified')}`);
        }
        if (!lastKnownLocation?.location_lat || !lastKnownLocation?.location_lng) return;
        const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, user.workingHours) : null;
        const statusColor = isPresent ? (hasFinished ? '#ef4444' : '#22c55e') : '#64748b';

        L.marker([lastKnownLocation.location_lat, lastKnownLocation.location_lng], {
          icon: L.divIcon({
            className: 'staff-marker',
            html: `
              <div style="
                background: ${statusColor}; 
                width: 32px; 
                height: 32px; 
                border-radius: 8px; 
                border: 2px solid white; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-size: 12px; 
                font-weight: bold; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                position: relative;
                z-index: ${selectedUserId === user.id ? 1000 : 1};
                ${selectedUserId === user.id ? 'transform: scale(1.1);' : ''}
              ">
                ${user.firstName[0]}${user.lastName[0]}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        })
          .addTo(markersGroup.current!)
          .on('click', () => onUserSelect(user.id))
          .bindPopup(`
          <div class="p-2">
            <div class="font-bold text-sm mb-1">${user.firstName} ${user.lastName}</div>
            <div class="text-xs text-gray-600">
              ${todayCheckIn ? `${t(language, 'checked_in_at')}: ${new Date(todayCheckIn.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false })}` : t(language, 'not_arrived_yet')}
              ${lateness ? `<br/><span class="${lateness.isLate ? 'text-red-500' : 'text-green-500'} font-bold">${lateness.isLate ? t(language, 'late_label') : t(language, 'early_arrival_label')}: ${lateness.durationStr}</span>` : ''}
            </div>
          </div>
        `);
      });
      if (!selectedUserId) {
        fitToMarkers();
      }
    }
  }, [staffStatus, onUserSelect, selectedUserId]);

  useEffect(() => {
    if (leafletMap.current && selectedUserId) {
      const selectedUserStatus = staffStatus.find(s => s.user.id === selectedUserId);
      if (selectedUserStatus?.lastKnownLocation?.location_lat && selectedUserStatus?.lastKnownLocation?.location_lng) {
        leafletMap.current.flyTo(
          [selectedUserStatus.lastKnownLocation.location_lat, selectedUserStatus.lastKnownLocation.location_lng],
          14,
          { duration: 1.5 }
        );
      }
    }
  }, [selectedUserId, staffStatus]);

  return <div ref={mapRef} className={`w-full h-full ${className || ''}`} />;
};

export default StaffMap;

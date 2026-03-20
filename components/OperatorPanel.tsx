
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, AppState, CheckIn, SimSale, DailyReport, Achievement } from '../types';
import L from 'leaflet';
import { Maximize2, LayoutGrid, Award, Phone, CalendarDays, BarChart2, PackageSearch, FileText, LogIn as LogInIcon, LogOut as LogOutIcon, Clock } from 'lucide-react';
import { Camera, MapPin, CheckCircle2, Send, Plus, History, Trash2, Smartphone, Upload, Image as ImageIcon, TrendingUp, Loader2, Edit3, AlertTriangle, RefreshCw, LogIn, LogOut, X, Trophy, Activity, ChevronLeft, ChevronRight, RotateCcw, BarChart3, Calendar, PlusCircle, Edit, Check, Users, ChevronDown, ExternalLink, Globe, Star } from 'lucide-react';
import { getTodayStr, isDateMatch, getLatenessStatus, getEarlyDepartureStatus, getUzTime, formatUzTime, formatUzDateTime, calculateDistance } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend, LabelList } from 'recharts';
import * as XLSX from 'xlsx';
import { t, Language, translations } from '../translations';
import CheckInMap from './CheckInMap';

import { authService, userService, checkInService, saleService, messageService, ruleService, targetService } from '../api';

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'gold': return <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-lg" />;
      case 'silver': return <Trophy className="w-10 h-10 text-gray-300 drop-shadow-lg" />;
      case 'bronze': return <Trophy className="w-10 h-10 text-amber-700 drop-shadow-lg" />;
      default: return <Trophy className="w-10 h-10 text-brand-gold" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'gold': return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 shadow-yellow-500/10';
      case 'silver': return 'bg-gradient-to-br from-gray-400/20 to-gray-500/5 border-gray-400/30 shadow-gray-400/10';
      case 'bronze': return 'bg-gradient-to-br from-amber-700/20 to-amber-800/5 border-amber-700/30 shadow-amber-700/10';
      default: return 'bg-brand-gold/20 border-brand-gold/30';
    }
  };

  const getTitleColor = (type: string) => {
    switch (type) {
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-gray-300';
      case 'bronze': return 'text-amber-600';
      default: return 'text-brand-gold';
    }
  };

  return (
    <div
      className="relative w-full h-64 cursor-pointer perspective-1000 group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rounded-[2rem] border ${getBgColor(achievement.type)} backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] transition-transform ${isFlipped ? 'z-0' : 'z-10'}`}>
          <div className={`p-5 rounded-full bg-white/5 border border-white/5 shadow-inner`}>
            {getIcon(achievement.type)}
          </div>
          <div className="text-center space-y-1">
            <h3 className={`text-2xl font-black uppercase tracking-tight ${getTitleColor(achievement.type)}`}>{achievement.title}</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Batafsil ko'rish</p>
          </div>
        </div>

        {/* Back */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[2rem] border border-white/10 bg-brand-black p-8 flex flex-col items-center justify-center text-center gap-4 shadow-2xl ${isFlipped ? 'z-10' : 'z-0'}`}>
          <p className="text-sm font-bold text-white/80 leading-relaxed">{achievement.reason}</p>
          <div className="mt-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{achievement.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OperatorPanelProps {
  user: User;
  state: AppState;
  setState: any;
  activeTab: string;
  language: Language;
  refreshData: () => Promise<void>;
  isDarkMode: boolean;
  showNotification: (message: string, type?: 'error' | 'success') => void;
}

const CustomAxisTick = ({ x, y, payload, index }: any) => {
  if (!payload) return null;
  const isNumber = /^\d+$/.test(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={isNumber ? (index % 2 === 0 ? 10 : 22) : 15}
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontSize={isNumber ? 8 : 10}
        fontWeight={900}
      >
        {payload.value}
      </text>
    </g>
  );
};

/* Styles for map markers (Ported from ManagerPanel) */
const mapMarkerStyles = `
  .map-marker-pin-tear {
    width: 42px;
    height: 42px;
    background: #D4AF37;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #111111;
    box-shadow: 0 0 25px rgba(212, 175, 55, 0.8), 0 5px 15px rgba(0, 0, 0, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pin-initials {
    transform: rotate(45deg);
    color: #111111;
    font-weight: 900;
    font-size: 13px;
    letter-spacing: -0.02em;
  }
  .leaflet-container {
    background: transparent !important;
  }
  .custom-staff-icon-pin {
    background: transparent !important;
    border: none !important;
  }
`;


const getMediaUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
  return `${cleanBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const SingleLocationMap: React.FC<{
  location: { lat: number; lng: number } | null,
  endLocation?: { lat: number; lng: number } | null,
  initials: string,
  isDarkMode: boolean,
  language: any
}> = ({ location, endLocation, initials, isDarkMode, language }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current && (location || endLocation)) {
      const center = location || endLocation!;
      leafletMap.current = L.map(mapRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: false,
        attributionControl: false
      }).setView([center.lat, center.lng], 15);

      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      tileLayerRef.current = L.tileLayer(tileUrl, { 
        maxZoom: 20,
        attribution: isDarkMode ? '&copy; CARTO' : '&copy; OpenStreetMap'
      }).addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 500);
    }

    if (leafletMap.current) {
      if (location) {
        const startIcon = L.divIcon({
          className: 'custom-staff-icon-pin',
          html: `<div class="map-marker-pin-tear"><div class="pin-initials">${initials}</div></div>`,
          iconSize: [42, 42], iconAnchor: [21, 42]
        });
        if (startMarkerRef.current) {
          startMarkerRef.current.setLatLng([location.lat, location.lng]);
        } else {
          startMarkerRef.current = L.marker([location.lat, location.lng], { icon: startIcon }).addTo(leafletMap.current);
        }
        leafletMap.current.setView([location.lat, location.lng], 16);
      }
    }
  }, [location, endLocation, initials]);

  useEffect(() => {
    if (leafletMap.current && tileLayerRef.current) {
      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        startMarkerRef.current = null;
        endMarkerRef.current = null;
      }
    };
  }, []);

  if (!location && !endLocation) return (
    <div className="h-64 flex flex-col items-center justify-center text-white/30 italic font-black text-[10px] uppercase tracking-[0.2em] bg-brand-black rounded-[2.5rem] border-2 border-dashed border-white/5 p-10 text-center group transition-all hover:bg-white/[0.02] hover:border-brand-gold/20">
      <div className="w-20 h-20 bg-brand-dark rounded-full flex items-center justify-center shadow-2xl mb-8 border border-white/5 relative">
        <div className="absolute inset-0 bg-brand-gold/10 rounded-full animate-ping opacity-20" />
        <div className="absolute inset-0 bg-brand-gold/5 rounded-full scale-150 blur-xl opacity-30" />
        <MapPin className="w-10 h-10 text-brand-gold opacity-50 relative z-10 transition-transform group-hover:scale-110" />
      </div>
      <p className="max-w-[180px] leading-[1.6]">Joylashuv ma'lumotlari topilmadi</p>
    </div>
  );

  return (
    <div className="h-56 rounded-[2rem] overflow-hidden border border-white/10 shadow-inner relative group">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <a
          href={`https://www.google.com/maps?q=${(endLocation || location!).lat},${(endLocation || location!).lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand-black/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white/10 text-brand-gold hover:text-brand-gold/80 transition-all block hover:scale-105"
          title="Google Maps'da ko'rish"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="absolute bottom-4 left-6 z-10 bg-brand-gold text-brand-black px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl ring-4 ring-brand-gold/30">
        {t(language, 'live_location')}
      </div>
    </div>
  );
};

const PhotoViewer: React.FC<{ photo: string; onClose: () => void }> = ({ photo, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
    <div className="relative z-10 max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in-95">
      <button
        onClick={onClose}
        className="absolute -top-14 right-0 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/20 z-50"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={getMediaUrl(photo)}
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        alt="Full view"
      />
      <div className="mt-4 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full border border-white/10">
        Yopish uchun ekranga bosing
      </div>
    </div>
  </div>
);

const RefinedStatCard = ({ label, value, icon, color, onClick, isActive }: any) => (
  <div
    onClick={onClick}
    className={`bg-brand-dark p-5 rounded-2xl border-2 transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isActive ? 'ring-4 ring-brand-gold/10 border-brand-gold shadow-xl' : 'border-white/10 shadow-sm hover:border-brand-gold/30'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-xl shadow-md`}>{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 truncate ${isActive ? 'text-brand-gold' : 'text-white/40'}`}>{label}</p>
        <p className="text-lg font-black text-white truncate w-full">
          {typeof value === 'number' ? value.toLocaleString('uz-UZ') : value}
        </p>
      </div>
    </div>
  </div>
);

const OperatorPanel: React.FC<OperatorPanelProps> = ({ user, state, setState, activeTab, language, refreshData, isDarkMode, showNotification }) => {
  const formatLargeNumber = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    if (num > 999999999) return '999M+';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return Math.round(num).toLocaleString('uz-UZ');
  };

  const today = getTodayStr();

  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const handleUpdateCheckIn = async (userId: string, date: string, updates: any) => {};
  
  const handleResetChart = () => {
    setSelectedDay(null);
    setMonitoringWeekOffset(0);
    setMonitoringMonthOffset(0);
    setMonitoringYear(new Date().getFullYear());
  };

  const getUserSalesCount = (userId: string, timeframe: string) => {
    let sales = state.sales.filter(s => s.userId === userId);
    if (timeframe === 'today') sales = sales.filter(s => s.date === today);
    if (timeframe === 'month') sales = sales.filter(s => s.date.startsWith(today.substring(0, 7)));
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      sales = sales.filter(s => new Date(s.date) >= weekAgo);
    }
    return sales.reduce((sum, s) => sum + s.count + s.bonus, 0);
  };

  const targetMonth = today.substring(0, 7);
  const monthlyTarget = state.monthlyTargets.find(t => t.month === targetMonth);
  const userSales = state.sales.filter(s => s.userId === user.id);
  const totalTarget = monthlyTarget ? Object.values(monthlyTarget.targets).reduce((sum: number, t: any) => sum + Number(t), 0) : 0;
  const totalSales = state.sales
    .filter(s => s.date.startsWith(targetMonth))
    .reduce((sum, s) => sum + s.count + s.bonus, 0);
  const percentage = Number(totalTarget) > 0 ? Math.min(100, (totalSales / Number(totalTarget)) * 100) : 0;

  const userCheckIn = state.checkIns.find(c => c.userId === user.id && isDateMatch(c.timestamp, today));
  const hasCheckedIn = !!userCheckIn;
  const currentReport = state.reports.find(r => r.userId === user.id && r.date === today);
  const hasReported = !!currentReport;

  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
  const [isCheckInConfirmOpen, setIsCheckInConfirmOpen] = useState(false);
  const [checkInConfirmData, setCheckInConfirmData] = useState<{ distance: number, allowedRadius: number } | null>(null);
  const [isWorkLocationConfirmOpen, setIsWorkLocationConfirmOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<{ type: 'checkIn' | 'checkOut', current: string } | null>(null);
  const [newTime, setNewTime] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [deletingReportPhotoIndex, setDeletingReportPhotoIndex] = useState<number | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [showSimEntryForm, setShowSimEntryForm] = useState(false);
  const [newSimEntry, setNewSimEntry] = useState({ company: 'Ucell', count: '1' });
  const [newSale, setNewSale] = useState({ company: 'Ucell', tariff: '', count: '1', bonus: '0' });
  const [openDropdown, setOpenDropdown] = useState<'company' | 'tariff' | 'simCompany' | null>(null);
  const [ratingTimeframe, setRatingTimeframe] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [ratingCustomStart, setRatingCustomStart] = useState(today);
  const [ratingCustomEnd, setRatingCustomEnd] = useState(today);
  const [ratingMonthOffset, setRatingMonthOffset] = useState(0);
  const [monitoringTimeframe, setMonitoringTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [monitoringWeekOffset, setMonitoringWeekOffset] = useState(0);
  const [monitoringMonthOffset, setMonitoringMonthOffset] = useState(0);
  const [monitoringYear, setMonitoringYear] = useState(getUzTime().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTargetMonth, setSelectedTargetMonth] = useState(today.substring(0, 7));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedSalesPanelUrl, setSelectedSalesPanelUrl] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isEndDayModalOpen, setIsEndDayModalOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error("Geocoding error:", error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportPhotoInputRef = useRef<HTMLInputElement>(null);

  const [showCheckInUI, setShowCheckInUI] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname || user.phone || '',
    phone: user.phone,
    password: user.password || '',
    photo: user.photo
  });
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification("Profil rasmi hajmi 10MB dan oshmasligi kerak!");
        if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [isEditingReport, setIsEditingReport] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSimRequestModalOpen, setIsSimRequestModalOpen] = useState(false);
  const [simRequestText, setSimRequestText] = useState('');

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await userService.updateUser(userId, updates);
      await refreshData();
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };
  const handleSendMessage = async (text: string) => {
    try {
      await messageService.sendMessage({ text });
      await refreshData();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleAddSale = async (company: string, tariff: string, count: number, bonus: number) => {
    try {
      await saleService.createSale({ company, tariff, count, bonus });
      await refreshData();
    } catch (err) {
      console.error("Failed to add sale", err);
    }
  };

  const handleCheckIn = async (location: any, options: any = {}) => {
    try {
      // Use the dedicated photo-upload function that sends FormData (multipart/form-data)
      // This is required because the backend photo field is an ImageField.
      await checkInService.createCheckInWithPhoto(
        location.lat,
        location.lng,
        capturedPhoto  // base64 data URL from camera/file input
      );
      // Real-time sync will happen via WebSocket
    } catch (err) {
      console.error("Failed to check in", err);
    }
  };

  const handleRemoveSale = async (saleId: string) => {
    try {
      await saleService.deleteSale(saleId);
      // Removed reload
    } catch (err) {
      console.error("Failed to remove sale", err);
    }
  };

  const handleUpdateSale = async (saleId: string, updates: any) => {
    try {
      await saleService.updateSale(saleId, updates);
      await refreshData();
    } catch (err) {
      console.error("Failed to update sale", err);
    }
  };

  const handleAddReport = async (report: any) => {
    try {
      await saleService.createReport(report);
      await refreshData();
    } catch (err) {
      console.error("Failed to add report", err);
    }
  };

  const handleUpdateReport = async (userId: string, date: string, updates: any) => {
    try {
      // Placeholder logic for updating report
      const res = await saleService.getSales();
      setState(prev => ({ ...prev, sales: res.data }));
    } catch (err) {
      console.error("Failed to update report", err);
    }
  };

  const addCheckIn = (data: any) => handleCheckIn(data.location, data);
  const updateCheckIn = (userId: string, date: string, updates: any) => handleCheckIn(updates.location, updates);

  const addSimInventory = async (company: string, count: number) => {
    const currentInventory = { ...user.inventory };
    currentInventory[company] = (Number(currentInventory[company]) || 0) + count;
    await handleUpdateUser(user.id, { inventory: currentInventory });
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      const res = await messageService.getMessages();
      setState(prev => ({ ...prev, messages: res.data }));
    } catch (err) {
      console.error("Failed to mark message as read", err);
    }
  };

  const updateSale = (saleId: string, updates: any) => handleUpdateSale(saleId, updates);

  useEffect(() => {
    if (activeTab === 'messages') {
      const unreadMyMessages = state.messages.filter(m =>
        !m.isRead &&
        m.senderId !== user.id &&
        (!m.recipientId || m.recipientId === user.id || m.recipientId === 'all')
      );
      if (unreadMyMessages.length > 0) {
        Promise.all(unreadMyMessages.map(m => messageService.markAsRead(m.id))).then(async () => {
          const res = await messageService.getMessages();
          setState(prev => ({ ...prev, messages: res.data }));
        }).catch(err => console.error("Failed to mark messages as read", err));
      }
    }
  }, [activeTab, state.messages, user.id]);

  useEffect(() => {
    if (isEditingReport && currentReport) {
      setReportText(currentReport.summary);
      setReportPhotos(currentReport.photos || []);
    }
  }, [isEditingReport, currentReport]);

  const refreshLocation = () => {
    if (navigator.geolocation) {
      console.log("Starting geolocation request...");
      setIsLocating(true);
      setLocationError(null);

      // Check permission state to give immediate feedback if blocked
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' as any }).then(result => {
          console.log("Permission state:", result.state);
          if (result.state === 'denied') {
            setIsLocating(false);
            setLocationError("Joylashuvga ruxsat bloklangan! Iltimos, brauzer manzili (URL) yonidagi qulf (🔒) belgisini bosib, 'Joylashuv' (Location) ruxsatini yoqing va sahifani yangilang.");
          }
          result.onchange = () => {
            if (result.state === 'granted') refreshLocation();
          };
        }).catch(err => console.log("Permission query error:", err));
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000 // Allow 3s cache to avoid cold-start hangs
      };

      const success = async (pos: GeolocationPosition) => {
        console.log("Geolocation success:", pos.coords.latitude, pos.coords.longitude);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setIsLocating(false);
        setLocationError(null);
        
        // Fetch address
        const addr = await getAddressFromCoords(lat, lng);
        setAddress(addr);
      };

      const error = (err: GeolocationPositionError) => {
        console.error("Geolocation error code:", err.code, "message:", err.message);

        // If high accuracy failed or timed out, try once more without it
        if (options.enableHighAccuracy) {
          console.log("Retrying without high accuracy...");
          options.enableHighAccuracy = false;
          navigator.geolocation.getCurrentPosition(success, finalError, options);
          return;
        }
        finalError(err);
      };

      const finalError = (err: GeolocationPositionError) => {
        setIsLocating(false);
        let msg = "Joylashuvni aniqlashda xatolik yuz berdi.";
        if (err.code === 1) {
          msg = "Joylashuvga ruxsat berilmadi. Iltimos, brauzer manzili yonidagi qulf (🔒) belgisini bosib, ruxsat bering.";
        } else if (err.code === 2) {
          msg = "Joylashuv ma'lumotlari aniqlanmadi. GPS yoqilganligini va internetni tekshiring.";
        } else if (err.code === 3) {
          msg = "Joylashuvni aniqlash vaqti tugadi. Qaytadan urinib ko'ring yoki sahifani yangilang.";
        }

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          msg += " (DIQQAT: HTTPS ulanishi talab qilinadi)";
        }
        setLocationError(msg);
      };

      navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
      setLocationError("Brauzeringiz joylashuvni aniqlashni qo'llab-quvvatlamaydi.");
    }
  };

  useEffect(() => {
    if (isEditingCheckIn && userCheckIn) {
      setCapturedPhoto(userCheckIn.photo);
      setLocation({ lat: userCheckIn.location_lat, lng: userCheckIn.location_lng });
    }
  }, [isEditingCheckIn, userCheckIn]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification("Rasm hajmi 10MB dan oshmasligi kerak!");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setCapturedPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReportPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    let hasError = false;
    if (files) {
      Array.from(files).forEach((file: File) => {
        if (file.size > 10 * 1024 * 1024) {
          showNotification(`${file.name}: Rasm hajmi 10MB dan oshmasligi kerak!`);
          hasError = true;
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setReportPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (hasError && reportPhotoInputRef.current) {
      reportPhotoInputRef.current.value = '';
    } else {
      e.target.value = '';
    }
  };

  const removeReportPhoto = (index: number) => {
    setReportPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckOut = async () => {
    try {
      await checkInService.createCheckIn({ checkOutTime: getUzTime().toISOString() });
      const res = await checkInService.getCheckIns();
      setState(prev => ({ ...prev, checkIns: res.data }));
    } catch (err) {
      console.error("Failed to check out", err);
    }
  };

  const handleCheckInAction = () => {
    if (capturedPhoto && location) {
      // Geofencing check
      if (user.workLocation && user.workLocation.lat && user.workLocation.lng) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          user.workLocation.lat,
          user.workLocation.lng
        );

        const allowedRadius = user.workRadius || 300;

        if (distance > allowedRadius) {
          setCheckInConfirmData({ distance, allowedRadius });
          setIsCheckInConfirmOpen(true);
          return;
        }
      }

      executeCheckIn();
    } else {
      console.warn("Iltimos, rasm yuklang va joylashuvni kiting.");
    }
  };

  const executeCheckIn = () => {
    if (!location) return;
    if (isEditingCheckIn) {
      // Update existing check-in (using handleCheckIn with updated data)
      handleCheckIn(location, { photo: capturedPhoto });
      setIsEditingCheckIn(false);
    } else {
      // Create new check-in with photo and location from current state
      handleCheckIn(location, { photo: capturedPhoto });
    }
    setIsCheckInConfirmOpen(false);
    setCheckInConfirmData(null);
  };

  const todaySales = useMemo(() => state.sales.filter(s => s.userId === user.id && s.date === today), [state.sales, user.id, today]);

  const dailySalesByOperator = useMemo(() => {
    const operatorSales: { [key: string]: number } = {
      'Ucell': 0,
      'Mobiuz': 0,
      'Beeline': 0,
      'Uztelecom': 0,
    };

    todaySales.forEach(sale => {
      if (operatorSales[sale.company] !== undefined) {
        operatorSales[sale.company] += (sale.count + sale.bonus);
      }
    });
    return operatorSales;
  }, [todaySales]);

  const lateness = useMemo(() => {
    if (!userCheckIn) return null;
    const wh = userCheckIn.workingHours || user.workingHours;
    return getLatenessStatus(userCheckIn.timestamp, wh);
  }, [userCheckIn, user.workingHours]);

  const earlyDeparture = useMemo(() => {
    const coTime = userCheckIn?.checkOutTime || currentReport?.timestamp;
    if (!coTime) return null;
    const wh = userCheckIn?.workingHours || user.workingHours;
    return getEarlyDepartureStatus(coTime, wh);
  }, [userCheckIn, currentReport, user.workingHours]);

  const distanceToWorkPoint = useMemo(() => {
    if (location && user.workLocation && user.workLocation.lat && user.workLocation.lng) {
      return calculateDistance(location.lat, location.lng, user.workLocation.lat, user.workLocation.lng);
    }
    return null;
  }, [location, user.workLocation]);

  const getWorkingTimes = () => {
    let wh = userCheckIn?.workingHours;
    if (typeof wh !== 'string' || !wh) wh = user.workingHours;
    if (typeof wh !== 'string' || !wh) wh = '09:00-18:00';
    wh = wh.replace(/\s*(AM|PM)/gi, '');
    const [start, end] = wh.split('-');
    return { start, end };
  };

  const renderCheckInForm = () => (
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-3 sm:px-4">
      <div className="bg-brand-dark rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
        <div className="p-8 sm:p-12 text-center border-b border-white/10 bg-gradient-to-br from-brand-gold/10 to-brand-gold/5">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-gold tracking-tight uppercase">{isEditingCheckIn ? "Ma'lumotlarni yangilash" : "Xush kelibsiz!"}</h2>
          <p className="text-white/40 mt-2 sm:mt-3 font-medium text-xs sm:text-base">Ishni boshlash uchun rasm va manzilingizni yuboring.</p>
        </div>
        <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative border-2 sm:border-4 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-brand-gold/30 transition-all">
            {capturedPhoto ? <img src={capturedPhoto} className="w-full h-full object-cover" /> : (
              <div className="text-center">
                <Camera className="w-10 h-10 sm:w-16 sm:h-16 text-white/10 mx-auto mb-3 sm:mb-4" />
                <p className="text-white/20 font-black uppercase text-[8px] sm:text-[10px] tracking-widest">Ish joyidan rasm yuklang</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>
          <div className="bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-3 sm:p-4 rounded-xl ${isLocating ? 'bg-brand-gold/10 text-brand-gold animate-pulse' : 'bg-green-500/10 text-green-500'}`}><MapPin className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest">{isLocating ? 'Aniqlanmoqda...' : 'Joylashuv'}</p>
                <p className="text-sm sm:text-lg font-black text-white">{location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Kutilmoqda...'}</p>
              </div>
            </div>
            {!isEditingCheckIn && (
              <button onClick={refreshLocation} disabled={isLocating} className="p-2.5 sm:p-3.5 bg-white/5 text-brand-gold rounded-xl shadow-sm border border-white/10 hover:rotate-180 transition-all duration-700">
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {locationError && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-tight">{locationError}</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-tight">Iltimos, GPS yoqilganligini tekshiring va qayta urinib ko'ring.</p>
              </div>
            </div>
          )}

          {/* Map Display */}
          <CheckInMap
            currentLocation={location}
            workLocation={user.workLocation || null}
            workRadius={user.workRadius || 300}
            workType={user.workType}
            className="h-48 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10"
          />

          {distanceToWorkPoint !== null && distanceToWorkPoint > (user.workRadius || 300) && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  Siz ish nuqtasidan uzoqdasiz ({Math.round(distanceToWorkPoint)}m). {user.workRadius || 300}m radiusga kiring!
                </p>
              </div>
              <button
                onClick={() => {
                  if (location) {
                    setIsWorkLocationConfirmOpen(true);
                  }
                }}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Joylashuvni to'g'irlash
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleCheckInAction}
              disabled={!location || isLocating || !capturedPhoto}
              className="flex-1 py-4 sm:py-6 gold-gradient text-brand-black rounded-xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              {isEditingCheckIn ? "Saqlash" : "Ishni boshlash"}
            </button>
            {(isEditingCheckIn || (!hasCheckedIn && showCheckInUI)) && (
              <button
                onClick={() => {
                  setIsEditingCheckIn(false);
                  setShowCheckInUI(false);
                }}
                className="px-6 sm:px-10 py-4 sm:py-6 bg-white/5 border border-white/10 text-white/40 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white/10 transition-all"
              >
                Bekor qilish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );




  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return `+${phoneNumber}`;
    if (phoneNumberLength < 6) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 9) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5)}`;
    }
    if (phoneNumberLength < 11) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8)}`;
    }
    return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8, 10)} ${phoneNumber.slice(10, 12)}`;
  };

  const last30Days = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const monitoringChartData = useMemo(() => {
    const data = [];
    if (monitoringTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));

      const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];

      for (let i = 0; i < 7; i++) {
        const current = new Date(targetMonday);
        current.setDate(targetMonday.getDate() + i);
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const daySales = state.sales.filter(s => s.userId === user.id && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({
          name: uzDays[current.getDay()],
          simcards,
          bonuses,
          fullDate: dateStr
        });
      }
    } else if (monitoringTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monitoringMonthOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const current = new Date(year, month, i);
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const daySales = state.sales.filter(s => s.userId === user.id && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: i.toString(), simcards, bonuses, fullDate: dateStr });
      }
    } else if (monitoringTimeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${monitoringYear}-${String(monthNum).padStart(2, '0')}`;
        const monthSales = state.sales.filter(s => s.userId === user.id && s.date.startsWith(monthPrefix));
        const simcards = monthSales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = monthSales.reduce((sum, s) => sum + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], simcards, bonuses, fullDate: monthPrefix });
      }
    }
    return data;
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear, state.sales, user.id]);

  const monitoringTotals = useMemo(() => {
    const totalSimcards = monitoringChartData.reduce((sum, item) => sum + (item.simcards || 0), 0);
    const totalBonuses = monitoringChartData.reduce((sum, item) => sum + (item.bonuses || 0), 0);
    return { totalSimcards, totalBonuses };
  }, [monitoringChartData]);

  const monitoringTotalMonthlySales = useMemo(() => state.sales
    .filter(s => s.userId === user.id && new Date(s.date) >= last30Days)
    .reduce((acc, s) => acc + s.count + s.bonus, 0), [state.sales, user.id, last30Days]);

  const monitoringOnTimeCheckIns = useMemo(() => state.checkIns
    .filter(c => c.userId === user.id && new Date(c.timestamp) >= last30Days)
    .filter(c => !getLatenessStatus(c.timestamp, user.workingHours)).length, [state.checkIns, user.id, user.workingHours, last30Days]);

  const monitoringTotalCheckIns = useMemo(() => state.checkIns
    .filter(c => c.userId === user.id && new Date(c.timestamp) >= last30Days).length, [state.checkIns, user.id, last30Days]);

  const monitoringPunctualityRate = monitoringTotalCheckIns > 0 ? Math.round((monitoringOnTimeCheckIns / monitoringTotalCheckIns) * 100) : 100;

  const monitoringPeriodTotals = useMemo(() => {
    let filteredSales = state.sales.filter(s => s.userId === user.id);

    if (monitoringTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));
      targetMonday.setHours(0, 0, 0, 0);
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);
      targetSunday.setHours(23, 59, 59, 999);

      filteredSales = filteredSales.filter(s => {
        const sd = new Date(s.date);
        return sd >= targetMonday && sd <= targetSunday;
      });
    } else if (monitoringTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monitoringMonthOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      filteredSales = filteredSales.filter(s => s.date.startsWith(monthPrefix));
    } else if (monitoringTimeframe === 'year') {
      const yearPrefix = monitoringYear.toString();
      filteredSales = filteredSales.filter(s => s.date.startsWith(yearPrefix));
    }

    const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    filteredSales.forEach(s => {
      if (totals[s.company] !== undefined) {
        totals[s.company] += s.count + s.bonus;
      }
    });
    return totals;
  }, [state.sales, user.id, monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear]);

  const monitoringAllTimeTotals = useMemo(() => {
    const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    state.sales.filter(s => s.userId === user.id).forEach(s => {
      if (totals[s.company] !== undefined) {
        totals[s.company] += s.count + s.bonus;
      }
    });
    return totals;
  }, [state.sales, user.id]);

  const monitoringCurrentPeriodLabel = useMemo(() => {
    if (monitoringTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);

      const startDay = targetMonday.getDate();
      const endDay = targetSunday.getDate();
      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];

      if (targetMonday.getMonth() !== targetSunday.getMonth()) {
        return `${startDay} ${monthNames[targetMonday.getMonth()]} - ${endDay} ${monthNames[targetSunday.getMonth()]}`;
      }
      return `${startDay}-${endDay} ${monthNames[targetMonday.getMonth()]}`;
    }
    if (monitoringTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monitoringMonthOffset);
      const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    return monitoringYear.toString();
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear]);

  const renderContent = () => {

    switch (activeTab) {
      case 'rating': {
        if (state.globalSettings?.rating_enabled === false) {
           return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
               <div className="w-24 h-24 bg-brand-gold/10 rounded-[2.5rem] flex items-center justify-center text-brand-gold mb-8 border border-brand-gold/20 shadow-2xl relative">
                  <div className="absolute inset-0 bg-brand-gold/5 rounded-[2.5rem] animate-ping opacity-20" />
                  <Trophy className="w-12 h-12 relative z-10 text-brand-gold shadow-2xl" />
               </div>
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 text-center">Reyting Tizimi</h2>
               <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] text-center max-w-[280px] leading-loose">
                  Reyting tizimi oyning oxirida paydo bo'ladi.
               </p>
               <div className="mt-8 px-5 py-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[9px] font-black text-brand-gold/60 uppercase tracking-widest">Yaqinda ochiladi</span>
               </div>
            </div>
           );
        }
        let startDate = new Date();
        let endDate = new Date();
        if (ratingTimeframe === 'today') {
          startDate = new Date(today);
          endDate = new Date(today);
        } else if (ratingTimeframe === 'week') {
          const d = new Date(today);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          startDate = new Date(d.setDate(diff));
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
        } else if (ratingTimeframe === 'month') {
          const d = new Date();
          d.setMonth(d.getMonth() + ratingMonthOffset);
          startDate = new Date(d.getFullYear(), d.getMonth(), 1);
          endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        } else if (ratingTimeframe === 'custom') {
          startDate = new Date(ratingCustomStart);
          endDate = new Date(ratingCustomEnd);
        }
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const operatorRankings = state.users
          .filter(u => u.role !== 'manager')
          .map(u => {
            // Determine historical league based on endDate
            let historicalLeague = u.league || 'bronze';
            if (u.leagueHistory && u.leagueHistory.length > 0) {
              const sorted = [...u.leagueHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const match = sorted.find(h => new Date(h.date) <= endDate);
              if (match) {
                historicalLeague = match.league;
              } else {
                historicalLeague = 'bronze';
              }
            }

            const userSales = state.sales
              .filter(s => {
                const saleDate = new Date(s.date);
                saleDate.setHours(12, 0, 0, 0);
                const inRange = saleDate >= startDate && saleDate <= endDate;
                return s.userId === u.id && inRange;
              });
            const sales = userSales.reduce((acc, s) => acc + s.count + s.bonus, 0);
            return { ...u, sales, historicalLeague };
          })
          .sort((a, b) => b.sales - a.sales);

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[1400px] mx-auto py-8 px-4">
            {/* Header & Filters */}
            <div className="flex flex-col gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-gold font-bold text-[10px] uppercase tracking-[0.2em]">
                    <Trophy className="w-4 h-4" />
                    <span>Reyting</span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-white tracking-tight">
                    Operatorlar <span className="text-brand-gold">Reytingi</span>
                  </h2>
                </div>

                {/* Timeframe Filters */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <div className="flex items-center justify-center md:justify-start gap-2 bg-brand-black p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
                    {[
                      { id: 'today', label: 'Bugun' },
                      { id: 'week', label: 'Hafta' },
                      { id: 'month', label: 'Oy' },
                      { id: 'custom', label: 'Oraliq' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setRatingTimeframe(t.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${ratingTimeframe === t.id ? 'bg-brand-gold text-brand-black shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {ratingTimeframe === 'month' && (
                    <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-white/5 shadow-sm self-center md:self-end">
                      <button
                        onClick={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset - 1);
                          // Limit: Site started in Feb 2026
                          if (d.getFullYear() < 2026 || (d.getFullYear() === 2026 && d.getMonth() < 1)) return;
                          setRatingMonthOffset(prev => prev - 1);
                        }}
                        className={`p-2 rounded-lg transition-colors ${(() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset - 1);
                          const isDisabled = d.getFullYear() < 2026 || (d.getFullYear() === 2026 && d.getMonth() < 1);
                          return isDisabled ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-brand-gold hover:bg-white/5';
                        })()}`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-white/60 px-4 uppercase tracking-widest min-w-[120px] text-center">
                        {(() => {
                          const monthName = translations[language].month_names[startDate.getMonth()];
                          return `${monthName} ${startDate.getFullYear()}`;
                        })()}
                      </span>
                      <button
                        onClick={() => {
                          if (ratingMonthOffset >= 0) return; // Limit: Cannot go to future months
                          setRatingMonthOffset(prev => prev + 1);
                        }}
                        className={`p-2 rounded-lg transition-colors ${ratingMonthOffset >= 0 ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-brand-gold hover:bg-white/5'}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {ratingTimeframe === 'custom' && (
                    <div className="flex items-center gap-2 self-center md:self-end">
                      <input type="date" value={ratingCustomStart} onChange={e => setRatingCustomStart(e.target.value)} className="bg-brand-black border border-white/10 text-white text-xs p-2 rounded-lg outline-none focus:border-brand-gold" />
                      <span className="text-white/40">-</span>
                      <input type="date" value={ratingCustomEnd} onChange={e => setRatingCustomEnd(e.target.value)} className="bg-brand-black border border-white/10 text-white text-xs p-2 rounded-lg outline-none focus:border-brand-gold" />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {operatorRankings.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <Users className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Hali operatorlar qo'shilmagan</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                  {['gold', 'silver', 'bronze'].map((leagueName) => {
                    const groupUsers = operatorRankings.filter(u => u.historicalLeague === leagueName);

                    const leagueInfo = leagueName === 'gold'
                      ? { color: 'text-yellow-400', bg: 'bg-yellow-400/10', title: "1 Gold", border: 'border-yellow-400/20' }
                      : leagueName === 'silver'
                        ? { color: 'text-gray-300', bg: 'bg-gray-300/10', title: "2 Silver", border: 'border-gray-300/20' }
                        : { color: 'text-orange-500', bg: 'bg-orange-500/10', title: "3 Bronza", border: 'border-orange-500/20' };

                    return (
                      <div key={leagueName} className={`bg-brand-dark rounded-[2rem] border ${leagueInfo.border} shadow-2xl overflow-hidden flex flex-col max-h-[800px]`}>
                        <div className={`px-6 py-5 border-b border-white/10 flex items-center justify-between ${leagueInfo.bg}`}>
                          <div className="flex items-center gap-3">
                            <Trophy className={`w-5 h-5 ${leagueInfo.color}`} />
                            <span className={`text-sm font-black uppercase tracking-[0.2em] ${leagueInfo.color}`}>{leagueInfo.title}</span>
                          </div>
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{groupUsers.length} ta operator</span>
                        </div>
                        <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
                          {groupUsers.length === 0 ? (
                            <div className="p-8 text-center text-white/20 text-xs font-bold uppercase tracking-widest">Operatorlar yo'q</div>
                          ) : groupUsers.map((u, idx) => {
                            return (
                              <div key={u.id} className={`px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors group ${u.id === user.id ? 'bg-brand-gold/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                  <span className="w-5 text-center font-bold text-white/20 group-hover:text-brand-gold transition-colors">{idx + 1}</span>
                                  <div className="w-10 h-10 rounded-xl bg-brand-black border border-white/5 flex items-center justify-center font-bold text-white/20 text-xs group-hover:scale-110 group-hover:bg-brand-dark transition-all overflow-hidden">
                                    {u.photo ? <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" /> : <>{u.firstName?.[0]}{u.lastName?.[0]}</>}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white flex items-center gap-2 text-sm">
                                      {u.nickname || `${u.firstName} ${u.lastName}`}
                                      {u.id === user.id && <span className="text-[8px] bg-brand-gold text-brand-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Siz</span>}
                                    </p>
                                    <p className="text-[9px] font-medium text-white/40">{u.nickname ? `${u.firstName} ${u.lastName}` : (u.department || 'Bo\'limsiz')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right min-w-[50px]">
                                    <p className="text-base font-black text-white">{u.sales}</p>
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Sotuv</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      }
      case 'monitoring': {
        const selectedUser = user;
        const chartTimeframe = monitoringTimeframe;
        const setChartTimeframe = setMonitoringTimeframe;
        const weekOffset = monitoringWeekOffset;
        const setWeekOffset = setMonitoringWeekOffset;
        const monthOffset = monitoringMonthOffset;
        const setMonthOffset = setMonitoringMonthOffset;
        const selectedYear = monitoringYear;
        const setSelectedYear = setMonitoringYear;
        const currentChartData = monitoringChartData;
        const userChartTotals = monitoringTotals;
        const periodTotals = monitoringPeriodTotals;
        const chartTitleLabel = monitoringCurrentPeriodLabel;
        
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {viewingPhoto && <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar no-scrollbar bg-brand-black">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <RefinedStatCard
                  label={t(language, 'today_sales')}
                  value={getUserSalesCount(selectedUser.id, 'today')}
                  icon={<Clock />}
                  color="bg-brand-gold"
                  isActive={chartTimeframe === 'week'}
                  onClick={() => setChartTimeframe('week')}
                />
                <RefinedStatCard
                  label={t(language, 'this_month')}
                  value={getUserSalesCount(selectedUser.id, 'month')}
                  icon={<CalendarDays />}
                  color="bg-white/10"
                  isActive={chartTimeframe === 'month'}
                  onClick={() => setChartTimeframe('month')}
                />
                <RefinedStatCard
                  label={t(language, 'phone')}
                  value={selectedUser.phone}
                  icon={<Phone />}
                  color="bg-brand-gold"
                />
                <RefinedStatCard
                  label={t(language, 'total')}
                  value={getUserSalesCount(selectedUser.id, 'total')}
                  icon={<Award />}
                  color="bg-white/10"
                  isActive={chartTimeframe === 'year'}
                  onClick={() => setChartTimeframe('year')}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-brand-dark rounded-[2rem] p-6 shadow-sm overflow-hidden border border-white/10 outline-none select-none no-outline-container">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-brand-gold" />
                            Sotuvlar Dinamikasi ({chartTitleLabel})
                          </h3>
                          <div className="flex flex-wrap gap-2 pl-0 sm:pl-7">
                            {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                              const count = periodTotals[company] || 0;
                              const styles: any = {
                                'Ucell': 'text-[#9b51e0] bg-[#9b51e0]/10 border-[#9b51e0]/20',
                                'Uztelecom': 'text-[#009ee0] bg-[#009ee0]/10 border-[#009ee0]/20',
                                'Mobiuz': 'text-[#eb1c24] bg-[#eb1c24]/10 border-[#eb1c24]/20',
                                'Beeline': 'text-[#fdb913] bg-[#fdb913]/10 border-[#fdb913]/20'
                              }[company];
                              return (
                                <span key={company} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${styles}`}>
                                  {company}: {count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-1 bg-brand-black p-1 rounded-xl border border-white/10 shadow-inner w-full sm:w-auto mt-2 sm:mt-0">
                          <button
                            onClick={() => {
                              if (chartTimeframe === 'week') setWeekOffset(prev => prev - 1);
                              else if (chartTimeframe === 'month') setMonthOffset(prev => prev - 1);
                              else if (chartTimeframe === 'year') setSelectedYear(prev => prev - 1);
                            }}
                            className="p-1.5 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/30 hover:text-brand-gold focus:outline-none"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] font-black text-brand-gold px-2 uppercase tracking-tighter whitespace-nowrap min-w-[120px] text-center">
                            {chartTimeframe === 'week' ? (
                              currentChartData.length === 7 ? (() => {
                                const s = new Date(currentChartData[0].fullDate);
                                const e = new Date(currentChartData[6].fullDate);
                                const fmt = (d: Date) => `M${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}`;
                                return `${fmt(s)} — ${fmt(e)}`;
                              })() : '...'
                            ) : chartTimeframe === 'month' ? (
                              chartTitleLabel
                            ) : (
                              selectedYear
                            )}
                          </span>
                          <button
                            onClick={() => {
                              if (chartTimeframe === 'week') setWeekOffset(prev => prev + 1);
                              else if (chartTimeframe === 'month') setMonthOffset(prev => prev + 1);
                              else if (chartTimeframe === 'year') setSelectedYear(prev => prev + 1);
                            }}
                            className="p-1.5 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/30 hover:text-brand-gold focus:outline-none"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        {(selectedDay || weekOffset !== 0 || monthOffset !== 0 || (chartTimeframe === 'year' && selectedYear !== new Date().getFullYear())) && (
                          <button
                            onClick={handleResetChart}
                            className="w-full sm:w-auto px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold/20 transition shadow-sm focus:outline-none border border-brand-gold/20"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> {t(language, 'back_to_today')}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-72 border-none outline-none bg-brand-dark focus:outline-none focus:ring-0 chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%" style={{ border: 'none', outline: 'none' }}>
                        <BarChart
                          data={currentChartData}
                          onClick={(e: any) => {
                            if (e && e.activePayload && e.activePayload.length > 0) {
                              const payload = e.activePayload[0].payload;
                              if (payload && payload.fullDate) {
                                setSelectedDay(payload.fullDate);
                              }
                            } else if (e && e.activeTooltipIndex !== undefined) {
                              const payload = currentChartData[e.activeTooltipIndex];
                              if (payload && payload.fullDate) {
                                setSelectedDay(payload.fullDate);
                              }
                            }
                          }}
                          margin={{ top: 30, right: 10, left: 0, bottom: 40 }}
                          style={{ border: 'none', outline: 'none' }}
                        >
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={<CustomAxisTick />}
                            interval={0}
                          />
                          <YAxis hide axisLine={false} tickLine={false} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-brand-black p-4 rounded-2xl shadow-2xl border border-white/10">
                                    <p className="text-white font-bold mb-2 text-sm">{label}</p>
                                    <div className="flex flex-col gap-1">
                                      {payload.filter((p: any) => p.dataKey === 'simcards').map((p: any) => (
                                        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-bold text-brand-gold">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                            <span>Simkartalar:</span>
                                          </div>
                                          <span>{p.value}</span>
                                        </div>
                                      ))}
                                      {payload.filter((p: any) => p.dataKey === 'bonuses').map((p: any) => (
                                        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-bold text-[#10B981]">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                                            <span>Bonuslar:</span>
                                          </div>
                                          <span>{p.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            content={() => (
                              <div className="flex items-center justify-start gap-6 pl-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Simkartalar: {userChartTotals.totalSimcards}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Bonuslar: {userChartTotals.totalBonuses}</span>
                                </div>
                              </div>
                            )}
                          />

                          <Bar
                            name="Simkartalar"
                            dataKey="simcards"
                            fill="var(--theme-gold)"
                            radius={[4, 4, 0, 0]}
                            barSize={chartTimeframe === 'week' ? 20 : undefined}
                          >
                            <LabelList dataKey="simcards" position="top" fill="var(--theme-gold)" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                          </Bar>
                          <Bar
                            name="Bonuslar"
                            dataKey="bonuses"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                            barSize={chartTimeframe === 'week' ? 20 : undefined}
                          >
                            <LabelList dataKey="bonuses" position="top" fill="#10B981" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-white/5 bg-brand-dark">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><Smartphone className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-white tracking-tight">
                              {selectedDay ? (chartTimeframe === 'year' ? `${(() => {
                                const d = new Date(selectedDay);
                                const monthName = translations[language].month_names[d.getMonth()];
                                return `${monthName} ${d.getFullYear()}`;
                              })()} ${t(language, 'monthly_sales_title')}` : `${selectedDay} ${t(language, 'daily_sales_title')}`) : (chartTimeframe === 'month' ? `${chartTitleLabel} ${t(language, 'monthly_sales_title')}` : `${today} ${t(language, 'daily_sales_title')}`)}
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 pl-0 lg:pl-10">
                            {(() => {
                              const targetDate = selectedDay || today;
                              let daySales = [];
                              if (selectedDay) {
                                if (chartTimeframe === 'year') {
                                  const monthPrefix = selectedDay.substring(0, 7);
                                  daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                                } else {
                                  daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === selectedDay);
                                }
                              } else if (chartTimeframe === 'month') {
                                const d = new Date();
                                d.setDate(1);
                                d.setMonth(d.getMonth() + monthOffset);
                                const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                              } else {
                                daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === today);
                              }
    
                              const companies = [
                                { name: 'Ucell', color: 'border-[#9b51e0]/20 text-[#9b51e0] bg-[#9b51e0]/10' },
                                { name: 'Uztelecom', color: 'border-[#009ee0]/20 text-[#009ee0] bg-[#009ee0]/10' },
                                { name: 'Mobiuz', color: 'border-[#eb1c24]/20 text-[#eb1c24] bg-[#eb1c24]/10' },
                                { name: 'Beeline', color: 'border-[#fdb913]/20 text-[#fdb913] bg-[#fdb913]/10' }
                              ];
    
                              return companies.map(c => {
                                const count = daySales.filter(s => s.company === c.name).reduce((acc, s) => acc + s.count + s.bonus, 0);
                                return (
                                  <div key={c.name} className={`px-4 py-2 rounded-xl border-2 ${c.color} font-black text-[10px] flex items-center gap-3 shadow-sm hover:scale-105 transition-transform duration-300`}>
                                    <span className="uppercase tracking-widest opacity-60">{c.name}:</span>
                                    <span className="text-sm">{count}</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center self-end lg:self-center">
                          {selectedDay && (
                            <div className="flex items-center gap-3 text-[10px] font-black text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-2xl uppercase tracking-widest shadow-xl border border-brand-gold/20 animate-in zoom-in-95 duration-500">
                              <Calendar className="w-4 h-4" /> Tanlangan kun
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-brand-black text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest">
                          <tr>
                            <th className="px-4 sm:px-8 py-3 sm:py-4">Kompaniya</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4">Tarif</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">Soni</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">Bonus</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">{t(language, 'total')}</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-right">Vaqt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(() => {
                            let daySales = [];
                            if (selectedDay) {
                              if (chartTimeframe === 'year') {
                                const monthPrefix = selectedDay.substring(0, 7);
                                daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                              } else {
                                daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === selectedDay);
                              }
                            } else if (chartTimeframe === 'month') {
                              const d = new Date();
                              d.setDate(1);
                              d.setMonth(d.getMonth() + monthOffset);
                              const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                              daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                            } else {
                              daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === today);
                            }

                            if (daySales.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-4 sm:px-8 py-10 sm:py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                        <PackageSearch className="w-6 h-6 sm:w-10 sm:h-10" />
                                      </div>
                                      <p className="text-xs sm:text-sm font-black text-white/20 italic">Bu davrda hech nima sotilmagan</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return daySales.sort((a, b) => {
                              const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
                              return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
                            }).map(sale => (
                              <tr key={sale.id} className="hover:bg-white/5 transition group">
                                <td className="px-4 sm:px-8 py-4 sm:py-5">
                                  <span className={`px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[10px] font-black uppercase transition-colors border whitespace-nowrap ${sale.company === 'Ucell' ? 'bg-[#9b51e0]/10 text-[#9b51e0] border-[#9b51e0]/20 group-hover:bg-[#9b51e0] group-hover:text-white' :
                                    sale.company === 'Uztelecom' ? 'bg-[#009ee0]/10 text-[#009ee0] border-[#009ee0]/20 group-hover:bg-[#009ee0] group-hover:text-white' :
                                      sale.company === 'Mobiuz' ? 'bg-[#eb1c24]/10 text-[#eb1c24] border-[#eb1c24]/20 group-hover:bg-[#eb1c24] group-hover:text-white' :
                                        sale.company === 'Beeline' ? 'bg-[#fdb913]/10 text-[#fdb913] border-[#fdb913]/20 group-hover:bg-[#fdb913] group-hover:text-black' :
                                          'bg-brand-gold/10 text-brand-gold border-brand-gold/20 group-hover:bg-brand-gold group-hover:text-brand-black'
                                    }`}>
                                    {sale.company}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-bold text-white/70">{sale.tariff}</td>
                                <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-black text-base sm:text-lg text-brand-gold">{sale.count.toLocaleString()}</td>
                                <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-black text-base sm:text-lg text-white/70">{sale.bonus.toLocaleString()}</td>
                                <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-black text-base sm:text-lg text-brand-gold">{(sale.count + sale.bonus).toLocaleString()}</td>
                                <td className="px-4 sm:px-8 py-4 sm:py-5 text-right text-[9px] sm:text-[10px] font-bold text-white/20">
                                  <div className="flex flex-col items-end">
                                    <span>{formatUzTime(sale.timestamp)}</span>
                                    <span className="text-[7px] sm:text-[8px] text-white/10">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden p-4 space-y-4">
                      {(() => {
                        let daySales = [];
                        if (selectedDay) {
                          if (chartTimeframe === 'year') {
                            const monthPrefix = selectedDay.substring(0, 7);
                            daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                          } else {
                            daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === selectedDay);
                          }
                        } else if (chartTimeframe === 'month') {
                          const d = new Date();
                          d.setDate(1);
                          d.setMonth(d.getMonth() + monthOffset);
                          const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                          daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                        } else {
                          daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === today);
                        }

                        if (daySales.length === 0) {
                          return (
                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                <PackageSearch className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-black text-white/20 italic">Bu davrda hech nima sotilmagan</p>
                            </div>
                          );
                        }

                        return daySales.sort((a, b) => {
                          const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
                          return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
                        }).map(sale => (
                          <div key={sale.id} className="bg-brand-black p-5 rounded-2xl border border-white/5 hover:border-brand-gold/30 transition-all shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${sale.company === 'Ucell' ? 'bg-[#9b51e0]/10 text-[#9b51e0] border-[#9b51e0]/20' :
                                sale.company === 'Uztelecom' ? 'bg-[#009ee0]/10 text-[#009ee0] border-[#009ee0]/20' :
                                  sale.company === 'Mobiuz' ? 'bg-[#eb1c24]/10 text-[#eb1c24] border-[#eb1c24]/20' :
                                    sale.company === 'Beeline' ? 'bg-[#fdb913]/10 text-[#fdb913] border-[#fdb913]/20' :
                                      'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                                }`}>
                                {sale.company}
                              </span>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-lg">
                                  {formatUzTime(sale.timestamp)}
                                </p>
                                <p className="text-[7px] font-bold text-white/20 mt-0.5">{new Date(sale.timestamp).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Tarif</p>
                              <p className="text-sm font-bold text-white">{sale.tariff}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                              <div className="text-center">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Soni</p>
                                <p className="text-sm font-black text-brand-gold">{sale.count.toLocaleString()}</p>
                              </div>
                              <div className="text-center border-l border-white/5">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Bonus</p>
                                <p className="text-sm font-black text-white/70">{sale.bonus.toLocaleString()}</p>
                              </div>
                              <div className="text-center border-l border-white/5">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Jami</p>
                                <p className="text-sm font-black text-brand-gold">{(sale.count + sale.bonus).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* OPTIMIZED DAILY REPORT DISPLAY MATCHING SCREENSHOT */}
                  <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-white/5 bg-brand-dark">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><FileText className="w-5 h-5" /></div>
                        <h3 className="text-lg font-black text-white tracking-tight">
                          {t(language, 'daily_report')} {selectedDay ? `(${selectedDay})` : `(${t(language, 'today')})`}
                        </h3>
                      </div>
                    </div>
                    <div className="p-8">
                      {(() => {
                        const targetDate = selectedDay || today;
                        const dailyReport = state.reports.find(r => r.userId === selectedUser.id && r.date === targetDate);

                        if (!dailyReport) {
                          return (
                            <div className="flex flex-col items-center py-10 text-center gap-4">
                              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                <AlertTriangle className="w-8 h-8" />
                              </div>
                              <p className="text-sm font-black text-white/20 italic">Bu kun uchun hisobot yuborilmagan</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-10">
                            {dailyReport.photos && dailyReport.photos.length > 0 && (
                              <div className="space-y-5">
                                <div className="flex items-center gap-3 px-2">
                                  <div className="w-7 h-7 bg-brand-gold/10 rounded-lg flex items-center justify-center">
                                    <LayoutGrid className="w-4 h-4 text-brand-gold" />
                                  </div>
                                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">ILOVA QILINGAN RASMLAR ({dailyReport.photos.length})</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                  {dailyReport.photos.map((photo, idx) => (
                                    <div
                                      key={idx}
                                      className="relative group cursor-pointer overflow-hidden rounded-[2.2rem] border-4 border-white/10 shadow-xl aspect-square transition-all hover:scale-[1.02]"
                                      onClick={() => setViewingPhoto(photo)}
                                    >
                                      <img src={getMediaUrl(photo)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-75 group-hover:scale-100 transition-all">
                                          <Maximize2 className="w-6 h-6" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="bg-brand-black rounded-[2rem] border border-white/10 p-8 shadow-sm flex flex-col gap-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Kunlik Xulosa</span>
                                </div>
                                <span className="text-[10px] font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
                                  {formatUzTime(dailyReport.timestamp)}
                                </span>
                              </div>
                              <p className="text-white font-bold text-xl sm:text-2xl leading-relaxed tracking-tight break-words">
                                {dailyReport.summary}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm focus:outline-none">
                    <h3 className="p-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-gold" /> {selectedDay || today} DAVOMAT</div>
                      {(() => {
                        const date = selectedDay || today;
                        const ci = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, date));
                        const workingHoursStr = typeof ci?.workingHours === 'string' ? ci.workingHours : (typeof selectedUser.workingHours === 'string' ? selectedUser.workingHours : null);
                        return workingHoursStr ? <span className="bg-brand-black px-2 py-1 rounded-md text-white/50 border border-white/10">{workingHoursStr.replace(/\s*(AM|PM)/gi, '')}</span> : null;
                      })()}
                    </h3>
                    <div className="p-6 space-y-4">
                      {(() => {
                        const date = selectedDay || today;
                        const ci = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, date));
                        const co = state.reports.find(r => r.userId === selectedUser.id && r.date === date);
                        const workingHours = ci?.workingHours || selectedUser.workingHours;
                        const lateness = ci ? getLatenessStatus(ci.timestamp, workingHours) : null;
                        const earlyDeparture = co ? getEarlyDepartureStatus(co.timestamp, workingHours) : null;

                        const arrivalCardStyle = ci
                          ? (lateness ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/20')
                          : 'bg-red-500/5 border-red-500/10';

                        const departureCardStyle = co
                          ? (earlyDeparture ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/20')
                          : 'bg-white/5 border-white/10 opacity-60';

                        return (
                          <>
                            <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-2 shadow-sm ${arrivalCardStyle}`}>
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-md ${ci ? (lateness ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-red-600 text-white'}`}><LogInIcon className="w-5 h-5" /></div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Kelish</p>
                                    <div className="flex items-center gap-2">
                                      {lateness && (
                                        <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                      )}
                                    </div>
                                  </div>
                                  {editingTime?.type === 'checkIn' ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="time"
                                        value={newTime}
                                        lang="en-GB"
                                        step="60"
                                        onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                        onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                        onChange={e => setNewTime(e.target.value)}
                                        className="bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-lg font-bold w-32 outline-none focus:border-brand-gold text-white"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          if (newTime) {
                                            const [h, m] = newTime.split(':').map(Number);
                                            const d = new Date(ci!.timestamp);
                                            d.setHours(h, m);
                                            handleUpdateCheckIn(selectedUser.id, date, { timestamp: d.toISOString() });
                                            setEditingTime(null);
                                          }
                                        }}
                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => setEditingTime(null)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition shadow-sm border border-white/10"><X className="w-4 h-4" /></button>
                                    </div>
                                  ) : (
                                    <p className={`text-2xl font-black leading-none mt-1 ${ci ? (lateness ? 'text-red-500' : 'text-white') : 'text-red-500/40'}`}>
                                      {ci ? formatUzTime(ci.timestamp) : t(language, 'not_come')}
                                    </p>
                                  )}
                                  {lateness && editingTime?.type !== 'checkIn' && (
                                    <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>{lateness.durationStr} kechikish</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`p-6 rounded-[2rem] border-2 flex flex-col gap-2 shadow-sm transition-all ${departureCardStyle}`}>
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-md ${co ? (earlyDeparture ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white') : 'bg-white/10 text-white/30'}`}><LogOutIcon className="w-5 h-5" /></div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Ketish</p>
                                    <div className="flex items-center gap-2">
                                      {earlyDeparture && (
                                        <div className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">EARLY</div>
                                      )}
                                    </div>
                                  </div>
                                  {editingTime?.type === 'checkOut' ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="time"
                                        value={newTime}
                                        lang="en-GB"
                                        step="60"
                                        onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                        onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                        onChange={e => setNewTime(e.target.value)}
                                        className="bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-lg font-bold w-32 outline-none focus:border-brand-gold text-white"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          if (newTime) {
                                            const [h, m] = newTime.split(':').map(Number);
                                            const d = new Date(co!.timestamp);
                                            d.setHours(h, m);
                                            handleUpdateReport(selectedUser.id, date, { timestamp: d.toISOString() });
                                            setEditingTime(null);
                                          }
                                        }}
                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => setEditingTime(null)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition shadow-sm border border-white/10"><X className="w-4 h-4" /></button>
                                    </div>
                                  ) : (
                                    <p className={`text-2xl font-black leading-none mt-1 ${co ? (earlyDeparture ? 'text-orange-500' : 'text-white') : 'text-white/20'}`}>
                                      {co ? formatUzTime(co.timestamp) : 'Hali ketmagan'}
                                    </p>
                                  )}
                                  {earlyDeparture && editingTime?.type !== 'checkOut' && (
                                    <div className="mt-2 pt-2 border-t border-orange-500/20 flex items-center gap-1.5 text-orange-500 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>{earlyDeparture.durationStr} erta ketish</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-brand-dark rounded-[2rem] border border-white/10 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-brand-gold" /> {selectedDay ? 'KUNDAGI FOTO' : 'OXIRGI FOTO'}
                    </h3>
                    {(() => {
                      const targetDate = selectedDay || today;
                      const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                      return dayCi ? (
                        <div
                          className="relative group cursor-pointer overflow-hidden rounded-[1.5rem]"
                          onClick={() => setViewingPhoto(dayCi.photo)}
                        >
                          <img src={getMediaUrl(dayCi.photo)} className="w-full h-40 object-cover shadow-sm border border-white/5 group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-90 group-hover:scale-100 transition-transform">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-white/20 italic font-black text-xs uppercase tracking-widest bg-brand-black rounded-[1.5rem] border-2 border-dashed border-white/10">
                          {selectedDay ? 'Bu kunda foto yo\'q' : 'Hali foto yo\'q'}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-brand-dark rounded-[2rem] border border-white/10 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-gold" /> {selectedDay ? 'KUNDAGI JOYLAHUV' : 'OXIRGI JOYLAHUV'}
                    </h3>
                    {(() => {
                      const targetDate = selectedDay || today;
                      const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                      const dayReport = state.reports.find(r => r.userId === selectedUser.id && r.date === targetDate);

                      let startLoc = (dayCi?.location_lat && dayCi?.location_lng)
                        ? { lat: dayCi.location_lat, lng: dayCi.location_lng }
                        : null;

                      let endLoc = (dayReport?.locationLat && dayReport?.locationLng)
                        ? { lat: dayReport.locationLat, lng: dayReport.locationLng }
                        : null;

                      // Fallback to absolute last location if today is empty
                      if (!startLoc && !endLoc && !selectedDay) {
                        const sortedCis = [...state.checkIns]
                          .filter(c => c.userId === selectedUser.id && c.location_lat && c.location_lng)
                          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                        if (sortedCis[0]) {
                          startLoc = { lat: sortedCis[0].location_lat, lng: sortedCis[0].location_lng };
                        }
                        
                        const sortedReports = [...state.reports]
                          .filter(r => r.userId === selectedUser.id && r.locationLat && r.locationLng)
                          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                        if (sortedReports[0]) {
                           endLoc = { lat: sortedReports[0].locationLat, lng: sortedReports[0].locationLng };
                        }
                      }

                      // CRITICAL: If only one is available, force it into GOLD marker
                      if (!startLoc && endLoc) {
                        startLoc = endLoc;
                        endLoc = null;
                      }

                      const initials = `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase();
                      return <SingleLocationMap location={startLoc || endLoc} initials={initials} isDarkMode={isDarkMode} language={language} />;
                    })()}
                  </div>

                  {(() => {
                    const targetDate = selectedDay || today;
                    const rating = state.operatorRatings?.find(r => r.operatorId === user.id && r.date === targetDate);
                    if (!rating) return null;
                    return (
                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 p-6 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Star className="w-4 h-4 text-brand-gold animate-bounce" /> MENEJER BAHOSI
                        </h3>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1.5 p-3 bg-brand-black/50 rounded-2xl w-fit">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star 
                                key={s} 
                                className={`w-5 h-5 transition-all duration-300 ${s <= rating.stars ? 'text-brand-gold fill-brand-gold scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/5'}`} 
                              />
                            ))}
                          </div>
                          {rating.comment && (
                            <div className="relative p-5 bg-brand-gold/5 rounded-[1.5rem] border border-brand-gold/10">
                              <p className="text-white font-medium text-sm leading-relaxed italic">
                                "{rating.comment}"
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-brand-gold/10 flex items-center justify-center text-[10px] font-black text-brand-gold border border-brand-gold/20">
                              {rating.ratedByName?.[0]}
                            </div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                              Menejer: <span className="text-white/60">{rating.ratedByName}</span> • {formatUzTime(rating.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <style>{mapMarkerStyles}</style>
                </div>

              </div>
            </div>
          </div>
        );
      }
      case 'simcards': {
        const companies = [
          { name: 'Ucell', color: 'bg-[#9b51e0]', textColor: 'text-[#9b51e0]' },
          { name: 'Uztelecom', color: 'bg-[#009ee0]', textColor: 'text-[#009ee0]' },
          { name: 'Mobiuz', color: 'bg-[#eb1c24]', textColor: 'text-[#eb1c24]' },
          { name: 'Beeline', color: 'bg-[#fdb913]', textColor: 'text-[#fdb913]' }
        ];

        const totalInventory = Object.values(user.inventory || {}).reduce((sum: number, count: number) => sum + count, 0);

        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-brand-dark p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-4 sm:gap-6">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3"><Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-brand-gold" /> {t(language, 'sim_inventory')}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-gold/10 rounded-xl sm:2xl border border-brand-gold/20">
                    <span className="text-[9px] sm:text-[10px] font-black text-brand-gold uppercase tracking-widest">Jami: {totalInventory} dona</span>
                  </div>
                </div>
              </div>

              {showSimEntryForm && (
                <div className="mb-10 p-8 bg-brand-black rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white">Yangi simkarta kiritish</h3>
                    <button onClick={() => setShowSimEntryForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Kompaniya</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === 'simCompany' ? null : 'simCompany')}
                          className="w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-black text-sm font-bold outline-none focus:border-brand-gold transition text-white text-left flex items-center justify-between shadow-inner"
                        >
                          <span>{newSimEntry.company}</span>
                          <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'simCompany' ? 'rotate-180' : ''}`} />
                        </button>

                        {openDropdown === 'simCompany' && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              {companies.map((c) => (
                                <button
                                  type="button"
                                  key={c.name}
                                  onClick={() => {
                                    setNewSimEntry({ ...newSimEntry, company: c.name });
                                    setOpenDropdown(null);
                                  }}
                                  className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newSimEntry.company === c.name ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Soni (dona)</label>
                      <input
                        max="200"
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black text-white text-sm font-bold outline-none focus:border-brand-gold transition shadow-inner"
                        value={newSimEntry.count}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setNewSimEntry({ ...newSimEntry, count: Math.min(200, val).toString() });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        const count = parseInt(newSimEntry.count) || 0;
                        if (count <= 0) return;
                        addSimInventory(newSimEntry.company, count);
                        setShowSimEntryForm(false);
                        setNewSimEntry({ company: 'Ucell', count: '1' });
                      }}
                      className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all"
                    >
                      Saqlash
                    </button>
                    <button
                      onClick={() => setShowSimEntryForm(false)}
                      className="px-10 py-5 bg-brand-black border border-white/10 text-white/40 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(company => {
                  const count = user.inventory?.[company.name] || 0;
                  const percentage = Math.min(100, (count / 200) * 100);
                  return (
                    <div key={company.name} className="p-8 bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-14 h-14 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white keep-white group-hover:rotate-12 transition-transform`}>
                          <Smartphone className="w-7 h-7" />
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-black ${company.textColor}`}>{formatLargeNumber(count)}</p>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Mavjud</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-white/60 text-lg">{company.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${count > 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {count > 0 ? t(language, 'in_stock') : t(language, 'out_of_stock_status')}
                          </span>
                        </div>
                        <div className="w-full bg-brand-black h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-widest">
                          <span>Zaxira holati</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-brand-dark p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl text-white relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-brand-gold/5 rounded-full -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4 max-w-xl text-center lg:text-left">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-brand-gold uppercase">Simkartalar yetishmayaptimi?</h3>
                  <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed">Agar omboringizda simkartalar kamayib qolgan bo'lsa, menejerga so'rov yuboring. Yangi partiya 24 soat ichida yetkazib beriladi.</p>
                </div>
                <button
                  onClick={() => {
                    setIsSimRequestModalOpen(true);
                    setSimRequestText('');
                  }}
                  className="w-full lg:w-auto px-8 sm:px-10 py-4 sm:py-5 gold-gradient text-brand-black rounded-xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  So'rov yuborish
                </button>
              </div>
            </div>

            {isSimRequestModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsSimRequestModalOpen(false)}></div>
                <div className="bg-brand-dark w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-gold text-brand-black rounded-2xl shadow-lg">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Simkarta so'rovi</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">Menejerga so'rov yuborish</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSimRequestModalOpen(false)} className="p-2 bg-brand-black rounded-xl text-white/40 hover:text-white transition shadow-sm border border-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-brand-gold/10 rounded-3xl flex items-center justify-center text-brand-gold border border-brand-gold/20 relative">
                      <div className="absolute inset-0 bg-brand-gold/5 rounded-3xl animate-ping opacity-20" />
                      <Smartphone className="w-10 h-10 relative z-10" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white uppercase tracking-tight">Tez Orada</h3>
                       <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] leading-relaxed max-w-[240px]">
                          Simkarta so'rov tizimi tez orada ishga tushadi. Iltimos kuting.
                       </p>
                    </div>
                    <button 
                       onClick={() => setIsSimRequestModalOpen(false)}
                       className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] border border-white/5 transition-all"
                    >
                       Tushunarli
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'messages': {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-brand-gold/10 rounded-[2.5rem] flex items-center justify-center text-brand-gold mb-8 border border-brand-gold/20 shadow-2xl relative">
              <div className="absolute inset-0 bg-brand-gold/5 rounded-[2.5rem] animate-ping opacity-20" />
              <div className="absolute inset-0 bg-brand-gold/5 rounded-[2.5rem] scale-150 blur-xl opacity-30" />
              <Send className="w-10 h-10 relative z-10" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 text-center">Tez Orada</h2>
            <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] text-center max-w-[280px] leading-loose">
              Xabarlar bo'limi ustida ish olib borilmoqda. Tez orada foydalanishga topshiriladi.
            </p>
            <div className="mt-12 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">In Development</span>
            </div>
          </div>
        );
      }
      case 'sales_panel':
        return (
          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${selectedSalesPanelUrl ? 'h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]' : 'space-y-6 pb-20'}`}>
            {!selectedSalesPanelUrl && (
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">Savdo <span className="text-brand-gold">Paneli</span></h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Kerakli saytlarga tezkor kirish</p>
                </div>
              </div>
            )}

            {!selectedSalesPanelUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.salesLinks?.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
                      const targetUrl = (isMobile && link.mobileUrl && link.mobileUrl.trim() !== '') ? link.mobileUrl : link.url;
                      console.log('isMobile:', isMobile, 'userAgent:', navigator.userAgent, 'innerWidth:', window.innerWidth, 'targetUrl:', targetUrl, 'link:', link);
                      setSelectedSalesPanelUrl(targetUrl);
                    }}
                    className="group relative bg-brand-dark p-8 rounded-[2.5rem] border border-white/10 hover:border-brand-gold/50 transition-all text-left overflow-hidden shadow-xl hover:shadow-brand-gold/10"
                  >
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-white/10">
                        {link.image ? (
                          <img src={getMediaUrl(link.image)} alt={link.name} className="w-full h-full object-cover" />
                        ) : (
                          <Globe className="w-6 h-6 text-white/40" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{link.name}</h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                          {(() => {
                            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
                            const displayUrl = (isMobile && link.mobileUrl && link.mobileUrl.trim() !== '') ? link.mobileUrl : link.url;
                            return displayUrl.replace('https://', '').replace('http://', '');
                          })()}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                        Kirish <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                ))}

                {(!state.salesLinks || state.salesLinks.length === 0) && (
                  <div className="col-span-full py-20 text-center bg-brand-black/50 rounded-[3rem] border-2 border-dashed border-white/5">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20">
                      <Smartphone className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-white/40 uppercase tracking-tight">Havolalar mavjud emas</h3>
                    <p className="text-white/20 text-xs font-bold uppercase tracking-widest mt-2">Admin tomonidan havolalar qo'shilmagan</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl relative">
                <iframe
                  src={selectedSalesPanelUrl}
                  className="w-full h-full border-none"
                  title="Sales Panel View"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setSelectedSalesPanelUrl(null)}
                    className="px-4 py-3 bg-brand-black/80 backdrop-blur-md hover:bg-brand-black text-white rounded-xl border border-white/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Orqaga
                  </button>
                  <a
                    href={selectedSalesPanelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-brand-black/80 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-brand-black transition-all shadow-xl"
                    title="Yangi oynada ochish"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      case 'profile': {
        const totalSales = state.sales.filter(s => s.userId === user.id).reduce((acc, s) => acc + s.count + s.bonus, 0);
        const totalCheckIns = state.checkIns.filter(c => c.userId === user.id).length;
        const joinDate = (() => {
          const d = new Date(user.createdAt);
          const monthName = translations[language].month_names[d.getMonth()];
          return `${d.getDate()}-${monthName}, ${d.getFullYear()}`;
        })();

        return (
          <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Profile Header Card */}
            <div className="bg-brand-dark rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-brand-gold/5 rounded-full blur-3xl -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 transition-all group-hover:bg-brand-gold/10"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl sm:rounded-[2.5rem] bg-brand-black p-2 shadow-xl border border-white/5">
                    {user.photo ? (
                      <img src={getMediaUrl(user.photo)} alt="Profile" className="w-full h-full rounded-xl sm:rounded-[2rem] object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-xl sm:rounded-[2rem] bg-brand-gold/10 flex items-center justify-center text-4xl sm:text-5xl font-black text-brand-gold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setProfileForm({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        nickname: user.nickname || user.phone || '',
                        phone: user.phone,
                        password: user.password || '',
                        photo: user.photo
                      });
                      setIsEditingProfile(true);
                    }}
                    className="absolute -bottom-2 -right-2 p-3 bg-brand-gold text-brand-black rounded-2xl shadow-lg hover:scale-110 transition-all active:scale-95 group"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center md:text-left space-y-3 flex-1 min-w-0 w-full pr-0 md:pr-40">
                  <div className="w-full min-w-0 overflow-hidden">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight truncate w-full">{user.firstName} {user.lastName}</h2>
                    <p className="text-brand-gold font-bold uppercase tracking-widest text-xs mt-1">{user.role}</p>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 bg-brand-black rounded-xl border border-white/10 flex items-center gap-2 text-white/60 font-bold text-xs">
                      <Smartphone className="w-4 h-4 text-brand-gold" />
                      {user.phone}
                    </div>
                    <div className="px-4 py-2 bg-brand-black rounded-xl border border-white/10 flex items-center gap-2 text-white/60 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-brand-gold" />
                      {joinDate}
                    </div>
                  </div>
                </div>

                {/* JAMI Badge */}
                <div className="absolute top-4 right-4 sm:top-8 sm:right-8 scale-90 sm:scale-100">
                  <div className="bg-brand-gold/10 border-2 border-brand-gold/20 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center shadow-2xl">
                    <p className="text-2xl sm:text-3xl font-black text-brand-gold tracking-tighter leading-none">
                      {totalSales.toLocaleString()}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-black text-brand-gold/60 uppercase tracking-[0.2em] mt-1.5 sm:mt-2">JAMI</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                const count = state.sales
                  .filter(s => s.userId === user.id && s.company === company)
                  .reduce((acc, s) => acc + s.count + s.bonus, 0);

                const styles = {
                  'Ucell': { bg: 'bg-[#9b51e0]/10', border: 'border-[#9b51e0]/20', text: 'text-[#9b51e0]', icon: 'text-[#9b51e0]' },
                  'Uztelecom': { bg: 'bg-[#009ee0]/10', border: 'border-[#009ee0]/20', text: 'text-[#009ee0]', icon: 'text-[#009ee0]' },
                  'Mobiuz': { bg: 'bg-[#eb1c24]/10', border: 'border-[#eb1c24]/20', text: 'text-[#eb1c24]', icon: 'text-[#eb1c24]' },
                  'Beeline': { bg: 'bg-[#fdb913]/10', border: 'border-[#fdb913]/20', text: 'text-[#fdb913]', icon: 'text-[#fdb913]' }
                }[company] || { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/70', icon: 'text-white/30' };

                return (
                  <div key={company} className={`bg-brand-dark border ${styles.border} p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
                    <div className={`absolute inset-0 ${styles.bg} opacity-20`}></div>
                    <div className="relative z-10">
                      <div className="mb-6">
                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${styles.text} opacity-80`}>{company}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-4xl font-black tracking-tight ${styles.text}`}>
                          {count.toLocaleString()}
                        </p>
                        <span className="text-white/30 font-bold text-sm">dona</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Achievements Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-brand-gold" />
                Yutuqlar
              </h3>

              {user.achievements && user.achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.achievements.map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              ) : (
                <div className="bg-brand-dark rounded-[2.5rem] p-10 text-center border border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white/20">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <p className="text-white/40 font-medium">Hozircha yutuqlar yo'q</p>
                </div>
              )}
            </div>

            {isEditingProfile && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-brand-dark rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t(language, 'edit_profile')}</h3>
                    <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="w-5 h-5 text-white/40" /></button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-center mb-8">
                      <div className="relative group cursor-pointer" onClick={() => profilePhotoInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full bg-brand-black overflow-hidden border-4 border-brand-dark shadow-lg">
                          {profileForm.photo ? (
                            <img src={profileForm.photo} alt="Profile Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <Camera className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-brand-gold/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <input
                          type="file"
                          ref={profilePhotoInputRef}
                          onChange={handleProfilePhotoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Ism</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Familiya</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Telefon</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: formatPhoneNumber(e.target.value) })}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                        placeholder="Telefon"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Username</label>
                      <input
                        type="text"
                        value={profileForm.nickname}
                        onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                        placeholder="Usernameni kiriting"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Parol</label>
                      <div className="relative">
                        <input
                          type={isPasswordVisible ? "text" : "password"}
                          value={profileForm.password}
                          onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                          className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {isPasswordVisible ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L14.12 14.12" /><path d="M2 2l20 20" /><path d="M10.37 4.54A11.24 11.24 0 0122 12a11.24 11.24 0 01-3.1 4.5" /><path d="M16 16.5A11.24 11.24 0 0112 17a11.24 11.24 0 01-7.15-2.67" /><path d="M6 10c.1-1.3.6-2.5 1.4-3.5" /><circle cx="12" cy="12" r="3" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleUpdateUser(user.id, {
                          firstName: profileForm.firstName,
                          lastName: profileForm.lastName,
                          nickname: profileForm.nickname,
                          phone: profileForm.phone,
                          password: profileForm.password,
                          photo: profileForm.photo
                        });
                        setIsEditingProfile(false);
                        setIsPasswordVisible(false);
                      }}
                      className="w-full py-5 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      default: {
        const today = getTodayStr();
        const targetMonth = today.substring(0, 7);
        const monthlyTarget = state.monthlyTargets.find(t => t.month === targetMonth);
        const userSales = state.sales.filter(s => s.userId === user.id);
        const totalTarget = monthlyTarget ? Object.values(monthlyTarget.targets).reduce((sum: number, t: any) => sum + Number(t), 0) : 0;
        const totalSales = state.sales
          .filter(s => s.date.startsWith(targetMonth))
          .reduce((sum, s) => sum + s.count + s.bonus, 0);
        const percentage = Number(totalTarget) > 0 ? Math.min(100, (totalSales / Number(totalTarget)) * 100) : 0;

        if (isEditingCheckIn || (!hasCheckedIn && showCheckInUI)) {
          return renderCheckInForm();
        }

        if (!hasCheckedIn) {
          return (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 px-3 sm:px-4">
              <div className="bg-brand-dark rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="p-8 sm:p-12 text-center bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 border-b border-white/10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-black rounded-2xl sm:rounded-3xl shadow-xl border border-white/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 text-brand-gold">
                    <LogIn className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-brand-gold tracking-tight">{t(language, 'welcome')}</h2>
                  <p className="text-white/40 mt-2 sm:mt-3 font-medium text-sm sm:text-lg">{t(language, 'start_work_day')}</p>
                </div>
                <div className="p-6 sm:p-10">
                  <button
                    onClick={() => {
                      setShowCheckInUI(true);
                      refreshLocation();
                    }}
                    className="w-full py-6 sm:py-8 bg-brand-gold text-brand-black rounded-2xl sm:rounded-[2.5rem] font-black uppercase tracking-widest text-xs sm:text-sm shadow-2xl shadow-brand-gold/20 hover:bg-brand-gold/90 active:scale-95 transition-all"
                  >
                    Ishni boshlash
                  </button>
                </div>
              </div>
            </div>
          );
        }

        const checkInForToday = state.checkIns.find(c => c.userId === user.id && isDateMatch(c.timestamp, today));

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="w-full">

              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div></div>
                {checkInForToday && !checkInForToday.checkOutTime && !hasReported && (
                  <button
                    onClick={() => {
                      refreshLocation();
                      setIsEndDayModalOpen(true);
                    }}
                    className="px-6 py-3 gold-gradient text-brand-black rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Ishni yakunlash (Finish)
                  </button>
                )}
                {hasReported && (
                   <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ish yakunlandi</span>
                   </div>
                )}
              </div>

              <div className="mb-6">
                <div className="w-full">
                  {/* Oylik Reja va Sotuvlar */}
                  <div className="bg-brand-dark p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-white/10 h-full animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 sm:mb-10 gap-4 sm:gap-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3"><Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-brand-gold" /> {t(language, 'monthly_plan_sales')}</h2>
                      </div>

                      <div className="relative">
                        <div
                          onClick={() => setShowMonthPicker(!showMonthPicker)}
                          className="flex items-center gap-3 bg-brand-black pl-3 pr-5 sm:pr-6 py-2 rounded-xl sm:2xl border border-white/10 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all cursor-pointer"
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:xl bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span className="text-xs sm:text-sm font-black text-white capitalize leading-none">
                            {(() => {
                              if (!selectedTargetMonth) return t(language, 'select_month');
                              const [y, m] = selectedTargetMonth.split('-');
                              const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                              return `${monthNames[parseInt(m) - 1]} ${y}`;
                            })()}
                          </span>
                        </div>

                        {showMonthPicker && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)}></div>
                            <div className="absolute top-full right-0 mt-4 bg-brand-dark rounded-3xl shadow-2xl border border-white/10 p-6 z-50 w-80 animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex items-center justify-between mb-6">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const [y, m] = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                    setSelectedTargetMonth(`${parseInt(y) - 1}-${m}`);
                                  }}
                                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-lg font-black text-white">
                                  {selectedTargetMonth.split('-')[0]}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const [y, m] = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                    setSelectedTargetMonth(`${parseInt(y) + 1}-${m}`);
                                  }}
                                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                {['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'].map((mName, i) => {
                                  const monthNum = String(i + 1).padStart(2, '0');
                                  const currentYear = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-')[0];
                                  const isSelected = selectedTargetMonth === `${currentYear}-${monthNum}`;

                                  return (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setSelectedTargetMonth(`${currentYear}-${monthNum}`);
                                        setShowMonthPicker(false);
                                      }}
                                      className={`py-3 rounded-xl text-sm font-bold transition-all ${isSelected
                                        ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20 scale-105'
                                        : 'bg-white/5 text-white/60 hover:bg-brand-gold/10 hover:text-brand-gold'
                                        }`}
                                    >
                                      {mName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { name: 'Ucell', color: 'bg-[#9b51e0]', textColor: 'text-[#9b51e0]' },
                        { name: 'Uztelecom', color: 'bg-[#009ee0]', textColor: 'text-[#009ee0]' },
                        { name: 'Mobiuz', color: 'bg-[#eb1c24]', textColor: 'text-[#eb1c24]' },
                        { name: 'Beeline', color: 'bg-[#fdb913]', textColor: 'text-[#fdb913]' }
                      ].map(company => {
                        const target = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.targets?.[company.name] || 0;
                        const officeCount = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.officeCounts?.[company.name] || 0;
                        const mobileOfficeCount = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.mobileOfficeCounts?.[company.name] || 0;
                        const sales = state.sales.filter(s => s.company === company.name && s.date.startsWith(selectedTargetMonth)).reduce((sum, s) => sum + s.count + s.bonus, 0);
                        const rawPercentage = target > 0 ? (sales / target) * 100 : 0;
                        const percentage = Math.min(100, rawPercentage);

                        return (
                          <div key={company.name} className="p-6 bg-brand-black rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                            <div className="flex items-center justify-between mb-5">
                              <div className={`w-12 h-12 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white keep-white group-hover:rotate-12 transition-transform`}>
                                <Smartphone className="w-6 h-6" />
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-black ${company.textColor}`}>{sales}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t(language, 'sold')}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-black text-white text-lg">{company.name}</h3>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${sales >= target && target > 0 ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                                  {sales >= target && target > 0 ? 'Bajarildi' : 'Jarayonda'}
                                </span>
                              </div>
                              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                                <span>{sales} / {target}</span>
                                <span>{Math.round(rawPercentage)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2 flex flex-col">
                  {/* Savdo Paneli */}
                  <div className="bg-brand-dark rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-white/10 p-6 sm:p-8 animate-in fade-in duration-500 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Savdo Paneli</h2>
                      <button
                        onClick={() => setShowSaleForm(true)}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 gold-gradient text-brand-black font-black rounded-lg shadow-sm hover:scale-105 transition-all duration-200 flex items-center gap-2 text-[8px] sm:text-[10px] uppercase tracking-widest"
                      >
                        <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{t(language, 'add_sale')}</span>
                      </button>
                    </div>

                    {/* Sales Form Modal */}
                    {showSaleForm && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const count = Number(newSale.count);
                          const bonus = Number(newSale.bonus);
                          setSaleError(null);
                          if (count <= 0) return;

                          let effectiveInventory = user.inventory?.[newSale.company] || 0;
                          if (editingSaleId) {
                            const originalSale = state.sales.find(s => s.id === editingSaleId);
                            if (originalSale && originalSale.company === newSale.company) {
                              effectiveInventory += (originalSale.count + originalSale.bonus);
                            }
                          }

                          if (effectiveInventory < (count + bonus)) {
                            setSaleError(`Omborda yetarli simkarta yo'q! (Mavjud: ${effectiveInventory})`);
                            return;
                          }

                          if (bonus > count) {
                            setSaleError("Bonuslar soni sotilganlar sonidan ko'p bo'lishi mumkin emas!");
                            return;
                          }

                          if (editingSaleId) {
                            updateSale(editingSaleId, {
                              company: newSale.company,
                              tariff: newSale.tariff,
                              count: count,
                              bonus: bonus
                            });
                            setEditingSaleId(null);
                          } else {
                            // Check if a sale with the same company and tariff already exists for today
                            const existingSale = state.sales.find(s =>
                              s.userId === user.id &&
                              s.date === today &&
                              s.company === newSale.company &&
                              s.tariff === newSale.tariff
                            );

                            if (existingSale) {
                              handleUpdateSale(existingSale.id, {
                                count: existingSale.count + count,
                                bonus: existingSale.bonus + bonus
                              });
                            } else {
                              handleAddSale(newSale.company, newSale.tariff, count, bonus);
                            }
                          }
                          setNewSale({ company: 'Ucell', tariff: '', count: '1', bonus: '0' });
                          setShowSaleForm(false);
                        }}
                        className="p-8 bg-brand-black space-y-6 border-b border-white/10 animate-in slide-in-from-top duration-300"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-black text-brand-gold uppercase tracking-widest">{editingSaleId ? t(language, 'edit_sale') : t(language, 'new_sale')}</h3>
                        </div>

                        {saleError && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-xs font-bold text-red-500 leading-tight">{saleError}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5 relative z-20">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Kompaniya</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                                className="w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-dark text-sm font-bold outline-none focus:border-brand-gold transition text-white text-left flex items-center justify-between"
                              >
                                <span>{newSale.company}</span>
                                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`} />
                              </button>

                              {openDropdown === 'company' && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map((company) => (
                                      <button
                                        type="button"
                                        key={company}
                                        onClick={() => {
                                          setNewSale({ ...newSale, company, tariff: '' });
                                          setOpenDropdown(null);
                                        }}
                                        className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newSale.company === company ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                                      >
                                        {company}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                            {(user.inventory?.[newSale.company] || 0) <= 0 && (
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-2 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {t(language, 'out_of_stock')}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5 relative z-10">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Tarif</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'tariff' ? null : 'tariff')}
                                className={`w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-dark text-sm font-bold outline-none focus:border-brand-gold transition text-left flex items-center justify-between ${newSale.tariff ? 'text-white' : 'text-white/40'}`}
                              >
                                <span>{newSale.tariff || 'Tarifni tanlang'}</span>
                                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'tariff' ? 'rotate-180' : ''}`} />
                              </button>

                              {openDropdown === 'tariff' && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                                    {state.tariffs?.[newSale.company]?.map((t, i) => (
                                      <button
                                        type="button"
                                        key={i}
                                        onClick={() => {
                                          setNewSale({ ...newSale, tariff: t });
                                          setOpenDropdown(null);
                                        }}
                                        className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newSale.tariff === t ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                                      >
                                        {t}
                                      </button>
                                    ))}
                                    {(!state.tariffs?.[newSale.company] || state.tariffs[newSale.company].length === 0) && (
                                      <div className="p-4 text-center text-white/30 text-xs italic">
                                        Tariflar mavjud emas
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Soni</label>
                            <input
                              type="number"
                              min="1"
                              className={`w-full p-4 border rounded-2xl bg-brand-dark text-sm font-bold outline-none transition text-white ${(user.inventory?.[newSale.company] || 0) < (Number(newSale.count) + Number(newSale.bonus)) ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-gold'}`}
                              value={newSale.count}
                              onChange={e => {
                                const val = e.target.value;
                                if (val.length <= 7) setNewSale({ ...newSale, count: val });
                              }}
                            />
                            <p className="text-[9px] font-bold text-white/30 pl-2 mt-1">Mavjud: {formatLargeNumber(user.inventory?.[newSale.company] || 0)} dona</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Bonus (ta)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0 ta"
                              className={`w-full p-4 border rounded-2xl bg-brand-dark text-sm font-bold outline-none transition text-white ${Number(newSale.bonus) > Number(newSale.count) ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-gold'}`}
                              value={newSale.bonus}
                              onChange={e => {
                                const val = e.target.value;
                                if (val.length <= 7) setNewSale({ ...newSale, bonus: val });
                              }}
                            />
                            {Number(newSale.bonus) > Number(newSale.count) && (
                              <p className="text-[9px] font-bold text-red-500 pl-2 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Bonus simkarta sonidan ko'p bo'lishi mumkin emas
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 pt-2">
                          <button
                            type="submit"
                            disabled={(() => {
                              if (!newSale.tariff) return true;
                              const count = Number(newSale.count);
                              const bonus = Number(newSale.bonus);
                              if (count <= 0) return true;
                              if (bonus > count) return true;
                              let effectiveInventory = user.inventory?.[newSale.company] || 0;
                              if (editingSaleId) {
                                const originalSale = state.sales.find(s => s.id === editingSaleId);
                                if (originalSale && originalSale.company === newSale.company) {
                                  effectiveInventory += (originalSale.count + originalSale.bonus);
                                }
                              }
                              return effectiveInventory < (count + bonus);
                            })()}
                            className="flex-1 gold-gradient text-brand-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white/20"
                          >
                            {(() => {
                              const count = Number(newSale.count);
                              const bonus = Number(newSale.bonus);
                              let effectiveInventory = user.inventory?.[newSale.company] || 0;
                              if (editingSaleId) {
                                const originalSale = state.sales.find(s => s.id === editingSaleId);
                                if (originalSale && originalSale.company === newSale.company) {
                                  effectiveInventory += (originalSale.count + originalSale.bonus);
                                }
                              }
                              return effectiveInventory < (count + bonus) ? 'Omborda yetarli emas' : 'Saqlash';
                            })()}
                          </button>
                          <button type="button" onClick={() => { setShowSaleForm(false); setEditingSaleId(null); setNewSale({ company: 'Ucell', tariff: '', count: '1', bonus: '0' }); }} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Bekor qilish</button>
                        </div>
                      </form>
                    )}

                    {/* Sales List */}
                    <div className="overflow-x-auto flex-1 no-scrollbar">
                      <table className="w-full text-left">
                        <thead className="bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em]"><tr className="border-b border-white/5"><th className="px-8 py-4">Brend</th><th className="px-8 py-4">Tarif</th><th className="px-8 py-4 text-center">Soni</th><th className="px-8 py-4 text-center">Bonus</th><th className="px-8 py-4 text-center">Jami</th><th className="px-8 py-4 text-right">Vaqt</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                          {todaySales.sort((a, b) => {
                            const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
                            return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
                          }).map(sale => (
                            <tr key={sale.id} className="hover:bg-white/5 transition group">
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${sale.company === 'Ucell' ? 'bg-[#9b51e0]/10 text-[#9b51e0]' :
                                  sale.company === 'Uztelecom' ? 'bg-[#009ee0]/10 text-[#009ee0]' :
                                    sale.company === 'Mobiuz' ? 'bg-[#eb1c24]/10 text-[#eb1c24]' :
                                      sale.company === 'Beeline' ? 'bg-[#fdb913]/10 text-[#fdb913]' :
                                        'bg-blue-500/10 text-blue-500'
                                  }`}>
                                  {sale.company}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-sm font-bold text-white/70">{sale.tariff}</td>
                              <td className="px-8 py-5 text-center font-black text-xl text-blue-500">{sale.count.toLocaleString()}</td>
                              <td className="px-8 py-5 text-center font-black text-lg text-white/70">{sale.bonus.toLocaleString()}</td>
                              <td className="px-8 py-5 text-center font-black text-lg text-indigo-500">{(sale.count + sale.bonus).toLocaleString()}</td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <span className="text-[10px] font-bold text-white/30">{formatUzTime(sale.timestamp)}</span>
                                  <button
                                    onClick={() => {
                                      setEditingSaleId(sale.id);
                                      setNewSale({
                                        company: sale.company,
                                        tariff: sale.tariff,
                                        count: sale.count.toString(),
                                        bonus: sale.bonus.toString()
                                      });
                                      setShowSaleForm(true);
                                    }}
                                    className="p-2 text-white/30 hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingSaleId(sale.id)}
                                    className="p-2 text-white/30 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {todaySales.length === 0 && <tr><td colSpan={6} className="px-8 py-16 text-center text-white/30 font-bold italic">{t(language, 'no_today_sales')}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-1 flex flex-col">
                  {/* Bugungi davomat */}
                  <div className="bg-brand-dark p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-white/10 relative overflow-hidden animate-in fade-in duration-700">
                    <h2 className="font-black text-white/40 text-[8px] sm:text-[9px] uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2"><History className="w-4 h-4 text-brand-gold" /> BUGUNGI DAVOMAT</h2>

                    <div className="space-y-4 sm:space-y-5">
                      {hasReported ? (() => {
                        const todayStr = getTodayStr();
                        const existingRating = state.operatorRatings?.find(
                          r => r.operatorId === user.id && r.date === todayStr
                        );

                        return (
                          <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
                            <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center text-green-500 mb-6 border border-green-500/20 shadow-2xl relative">
                              <div className="absolute inset-0 bg-green-500/5 rounded-[2rem] animate-ping opacity-20" />
                              <CheckCircle2 className="w-10 h-10 relative z-10" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Ish muvaffaqiyatli yakunlandi</h3>
                            
                            {existingRating ? (

                              <div className="w-full bg-brand-black/50 border border-brand-gold/20 rounded-[2rem] p-6 animate-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center justify-center gap-1 mb-3">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                      key={star} 
                                      className={`w-5 h-5 ${star <= existingRating.stars ? 'text-brand-gold fill-brand-gold' : 'text-white/10'}`} 
                                    />
                                  ))}
                                </div>
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-3">Manager bahosi</p>
                                {existingRating.comment && (
                                  <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 italic text-xs text-white/70">
                                    "{existingRating.comment}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="px-6 py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-[1.5rem] flex flex-col gap-2 items-center">
                                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                                  <Clock className="w-4 h-4 animate-spin-slow" />
                                </div>
                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest text-center leading-relaxed">
                                  Manager tomonidan hisobotingiz baholanishi kutilmoqda
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })() : userCheckIn ? (() => {
                        const checkTime = formatUzTime(userCheckIn.timestamp);
                        const isLate = !!lateness?.isLate;
                        const { start } = getWorkingTimes();
                        const boxStyle = isLate ? 'bg-red-600 dark:bg-red-500/10 border-red-500/20' : 'bg-green-600 dark:bg-green-500/10 border-green-500/20';

                        return (
                          <>
                            <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 transition-all flex flex-col gap-3 ${boxStyle}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className={`p-3 sm:p-4 rounded-xl sm:2xl shadow-md ${isLate ? 'bg-white text-red-600 dark:bg-red-600 dark:text-white' : 'bg-white text-green-600 dark:bg-green-600 dark:text-white'}`}><LogIn className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isLate ? '!text-white keep-white dark:!text-red-500' : '!text-white keep-white dark:!text-green-500'}`}>Kelish</p>
                                      <span className="text-[7px] sm:text-[8px] font-bold opacity-60 text-white keep-white">({start})</span>
                                      {isLate && (
                                        <div className="bg-red-600 text-white keep-white text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse shadow-md ring-1 sm:ring-2 ring-white">LATE</div>
                                      )}
                                    </div>
                                    {editingTime?.type === 'checkIn' ? (
                                      <div className="flex items-center gap-2 mt-1">
                                        <input
                                          type="time"
                                          value={newTime}
                                          lang="en-GB"
                                          step="60"
                                          onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                          onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                          onChange={e => setNewTime(e.target.value)}
                                          className="bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-base sm:text-lg font-bold w-28 sm:w-32 outline-none focus:border-brand-gold text-white"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => {
                                            if (newTime) {
                                              const { end } = getWorkingTimes();
                                              const newWh = `${newTime}-${end}`;
                                              handleCheckIn({ ...user.location }, { workingHours: newWh }); // Simplified rename call logic
                                              setEditingTime(null);
                                            }
                                          }}
                                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
                                        >
                                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <button onClick={() => setEditingTime(null)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition shadow-sm border border-white/10"><X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                      </div>
                                    ) : (
                                      <p className={`text-xl sm:text-2xl font-black tracking-tight ${isLate ? '!text-white keep-white dark:!text-red-500' : '!text-white keep-white'}`}>{checkTime}</p>
                                    )}
                                  </div>
                                </div>
                                <button onClick={() => setIsEditingCheckIn(true)} className="p-2.5 sm:p-3 bg-white text-green-600 dark:bg-brand-black dark:text-brand-gold rounded-xl shadow-md border border-white/20 dark:border-brand-gold/20 active:scale-90 transition-all hover:bg-white/90 dark:hover:bg-brand-gold/10"><Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                              </div>
                              {isLate && editingTime?.type !== 'checkIn' && (
                                <div className="mt-1 flex items-center gap-2 bg-red-600 text-white keep-white p-2.5 sm:p-3 rounded-xl sm:2xl text-[8px] sm:text-[10px] font-black uppercase animate-in slide-in-from-top-2 duration-300">
                                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>{lateness?.durationStr} kechikish (LATE)</span>
                                </div>
                              )}
                            </div>

                            <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border flex items-center justify-between bg-blue-600 dark:bg-blue-500/10 border-blue-500/20`}>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`p-3 sm:p-3.5 rounded-xl shadow-md bg-white text-blue-600 dark:bg-blue-600 dark:text-white`}><LogOut className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[8px] sm:text-[9px] font-black !text-white keep-white dark:!text-white/30 uppercase tracking-widest">Ketish</p>
                                    <span className="text-[7px] sm:text-[8px] font-bold opacity-60 text-white keep-white">({getWorkingTimes().end})</span>
                                  </div>
                                  {editingTime?.type === 'checkOut' ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="time"
                                        value={newTime}
                                        lang="en-GB"
                                        step="60"
                                        onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                        onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                                        onChange={e => setNewTime(e.target.value)}
                                        className="bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-base sm:text-lg font-bold w-28 sm:w-32 outline-none focus:border-brand-gold text-white"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          if (newTime) {
                                            const { start } = getWorkingTimes();
                                            const newWh = `${start}-${newTime}`;
                                            handleCheckIn({ ...user.location }, { workingHours: newWh }); // Simplified rename call logic
                                            setEditingTime(null);
                                          }
                                        }}
                                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
                                      >
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </button>
                                      <button onClick={() => setEditingTime(null)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition shadow-sm border border-white/10"><X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                    </div>
                                  ) : (
                                    <p className="text-xl sm:text-2xl font-black !text-white/50 keep-white dark:!text-white/30 truncate">Hali ketmagan</p>
                                  )}
                                </div>
                              </div>
                              {checkInForToday && !checkInForToday.checkOutTime && (
                                <button
                                  onClick={() => {
                                    refreshLocation();
                                    setIsEndDayModalOpen(true);
                                  }}
                                  className="p-2.5 sm:p-3 bg-white text-blue-600 dark:bg-brand-black dark:text-brand-gold rounded-xl shadow-md border border-white/20 dark:border-brand-gold/20 active:scale-90 transition-all hover:bg-white/90 dark:hover:bg-brand-gold/10"
                                >
                                  <LogOutIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-gold" />
                                </button>
                              )}
                            </div>
                          </>
                        );
                      })() : (
                        <div className="p-6 rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 text-white/40 italic text-center text-xs sm:text-sm">
                          Kelish ma'lumotlari topilmadi
                        </div>
                      )}

                      {!hasReported && (
                        <div className="p-8 bg-brand-gold rounded-[2.5rem] !text-white keep-white relative overflow-hidden group">
                          <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-black/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                          <p className="text-[9px] font-black !text-white/80 keep-white uppercase tracking-widest mb-1 relative z-10">{t(language, 'today_total_sales')}</p>
                          <p className="text-4xl font-black tracking-tight relative z-10 text-white keep-white">{state.sales.filter(s => s.date === today).reduce((acc, s) => acc + s.count + s.bonus, 0).toLocaleString()} <span className="text-xs opacity-60 capitalize text-white keep-white">{t(language, 'pcs')}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="w-full">
      {renderContent()}

      {/* End Day Modal (integrated reporting) */}
      {isEndDayModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-brand-dark w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-sm border border-blue-500/20">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{hasReported ? 'Hisobotni tahrirlash' : t(language, 'end_day_report')}</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Kun yakuni ma'lumotlarini kiriting</p>
                </div>
              </div>
              <button onClick={() => setIsEndDayModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-white/30 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Photos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand-gold" /> HISOBOT RASMLARI
                  </h4>
                  <button
                    onClick={() => reportPhotoInputRef.current?.click()}
                    className="px-4 py-2 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Qo'shish
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {reportPhotos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 group ring-2 ring-white/5">
                      <img src={photo} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeReportPhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={() => reportPhotoInputRef.current?.click()}
                    className="aspect-video rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 hover:border-brand-gold/20 hover:text-brand-gold/40 cursor-pointer transition-all bg-white/[0.02]"
                  >
                    <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-[9px] font-black uppercase">Yuklash</span>
                  </div>
                </div>
                <input type="file" ref={reportPhotoInputRef} onChange={handleReportPhotoUpload} accept="image/*" multiple className="hidden" />
              </div>

              {/* Comment */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">IZOH / COMMENT</h4>
                <textarea
                  className="w-full p-6 bg-brand-black border border-white/10 rounded-[2rem] text-sm font-medium text-white focus:border-brand-gold outline-none transition shadow-inner h-32 resize-none overflow-y-auto"
                  placeholder="Bugungi ish bo'yicha hisobotingizga izoh qoldiring..."
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-gold" /> JOYLASHUV
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold ${location ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-2 py-1 rounded-lg border border-current/20`}>
                      {location ? 'ANIQLANDI' : 'ANIQLANMAGAN'}
                    </span>
                    <button onClick={refreshLocation} disabled={isLocating} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-brand-gold transition-all">
                      <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {locationError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-tight">{locationError}</p>
                  </div>
                )}

                <div className="h-40 rounded-[1.5rem] overflow-hidden border border-white/10">
                  <CheckInMap
                    currentLocation={location}
                    workLocation={user.workLocation || null}
                    workRadius={user.workRadius || 300}
                    workType={user.workType}
                    className="w-full h-full"
                  />
                </div>

                {distanceToWorkPoint !== null && distanceToWorkPoint > (user.workRadius || 300) && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-tight">
                      Radiusdan chiqqansiz! ({Math.round(distanceToWorkPoint)}m)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-brand-black border-t border-white/5 flex gap-4">
              <button
                onClick={() => setIsEndDayModalOpen(false)}
                className="flex-1 py-5 bg-white/5 text-white/40 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                Bekor qilish
              </button>
              <button
                disabled={!reportText.trim() || reportPhotos.length === 0 || isLocating || (distanceToWorkPoint !== null && distanceToWorkPoint > (user.workRadius || 300))}
                onClick={() => {
                  if (hasReported) {
                    handleUpdateReport(user.id, today, {
                      summary: reportText,
                      photos: reportPhotos.length > 0 ? reportPhotos : undefined
                    });
                  } else {
                    handleAddReport({
                      userId: user.id,
                      date: today,
                      summary: reportText,
                      locationLat: location?.lat,
                      locationLng: location?.lng,
                      timestamp: getUzTime().toISOString(),
                      photos: reportPhotos.length > 0 ? reportPhotos : undefined
                    });
                    handleCheckOut();
                  }
                  setIsEndDayModalOpen(false);
                }}
                className="flex-[2] py-5 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
              >
                {hasReported ? "Saqlash" : "Ishni yakunlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Report Photo Confirmation Modal */}
      {deletingReportPhotoIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-brand-dark border border-white/10 rounded-[2rem] sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white text-center uppercase tracking-tight mb-2">
              Rasmni o'chirish
            </h3>
            <p className="text-white/60 text-xs sm:text-sm text-center mb-6 sm:mb-8">
              Haqiqatan ham ushbu rasmni hisobotdan o'chirmoqchimisiz?
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setDeletingReportPhotoIndex(null)}
                className="py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl sm:rounded-2xl transition-all border border-white/10"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  if (deletingReportPhotoIndex !== null) {
                    removeReportPhoto(deletingReportPhotoIndex);
                    setDeletingReportPhotoIndex(null);
                  }
                }}
                className="py-3.5 sm:py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-red-500/20 border border-red-400/20"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmations */}
      {isCheckInConfirmOpen && checkInConfirmData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCheckInConfirmOpen(false)}></div>
          <div className="bg-brand-dark w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Diqqat!
            </h3>
            <p className="text-white/60 text-sm mb-8">
              Siz ish nuqtasidan uzoqdasiz ({Math.round(checkInConfirmData.distance)}m). <br/>
              Manzil: <span className="text-white font-bold">{address || `${location?.lat}, ${location?.lng}`}</span>
              <br /><br />
              Baribir ishni boshlashni xohlaysizmi?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsCheckInConfirmOpen(false)}
                className="flex-1 py-4 rounded-2xl font-black text-white/60 uppercase tracking-widest hover:bg-white/5 transition border border-white/10"
              >
                Bekor qilish
              </button>
              <button
                onClick={executeCheckIn}
                className="flex-1 py-4 rounded-2xl font-black text-brand-black uppercase tracking-widest bg-brand-gold hover:bg-yellow-400 transition shadow-lg shadow-brand-gold/20"
              >
                Davom etish
              </button>
            </div>
          </div>
        </div>
      )}

      {isWorkLocationConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsWorkLocationConfirmOpen(false)}></div>
          <div className="bg-brand-dark w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Joylashuvni saqlash
            </h3>
            <p className="text-white/60 text-sm mb-8">
              Hozirgi joylashuvingizni yangi ish joyi sifatida saqlaysizmi?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsWorkLocationConfirmOpen(false)}
                className="flex-1 py-4 rounded-2xl font-black text-white/60 uppercase tracking-widest hover:bg-white/5 transition border border-white/10"
              >
                Yo'q
              </button>
              <button
                onClick={() => {
                  if (location) {
                    handleUpdateUser(user.id, { 
                      workLocation: { 
                        lat: location.lat, 
                        lng: location.lng, 
                        address: address 
                      } 
                    });
                  }
                  setIsWorkLocationConfirmOpen(false);
                }}
                className="flex-1 py-4 rounded-2xl font-black text-brand-black uppercase tracking-widest bg-brand-gold hover:bg-yellow-400 transition shadow-lg shadow-brand-gold/20"
              >
                Ha, saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingSaleId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-brand-dark border border-white/10 rounded-[2rem] sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white text-center mb-2 uppercase tracking-tight">O'chirishni tasdiqlang</h3>
            <p className="text-white/50 text-center text-[11px] sm:text-sm mb-6 sm:mb-8 font-medium leading-relaxed">Haqiqatan ham bu sotuvni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setDeletingSaleId(null)}
                className="py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl sm:rounded-2xl transition-all border border-white/5"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  if (deletingSaleId) {
                    handleRemoveSale(deletingSaleId);
                    setDeletingSaleId(null);
                  }
                }}
                className="py-3.5 sm:py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-red-500/20 border border-red-400/20"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorPanel;


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Role, AppState, User, CheckIn, SimSale, DailyReport, SalesLink } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Search, MapPin, Activity,
  Phone, X, Clock,
  ChevronRight, Smartphone, ExternalLink,
  ChevronDown,
  CheckCircle, FileText, UserPlus, Award, BarChart2,
  ArrowLeft, CalendarDays,
  Plus,
  PlusCircle,
  Image as ImageIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Navigation2,
  AlertTriangle,
  Trophy,
  ChevronLeft,
  PackageSearch,
  RotateCcw,
  Calendar,
  Maximize2,
  Quote,
  LayoutGrid,
  Edit,
  Check,
  Send,
  Trash2,
  Globe,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, LabelList, Cell } from 'recharts';
import * as L from 'leaflet';
import { getTodayStr, isDateMatch, getLatenessStatus, getEarlyDepartureStatus, getUzTime, formatUzTime, formatUzDateTime } from '../utils';
import MapPicker from './MapPicker';
import StaffMap from './StaffMap';
import { t, Language, translations } from '../translations';
import { userService, checkInService, saleService, messageService, targetService, ruleService, linkService, settingsService, operatorRatingService } from '../api';

const StatCard = ({ label, value, icon, color, companySales = [], operators = [], isExpanded, onToggle }: any) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;

  const operatorSales = useMemo(() => {
    return operators.map((op: any) => {
      const sales = companySales.filter((s: any) => s.userId === op.id).reduce((sum: number, s: any) => sum + s.count + (s.bonus || 0), 0);
      return { ...op, sales };
    }).sort((a: any, b: any) => b.sales - a.sales);
  }, [companySales, operators]);

  const totalPages = Math.ceil(operatorSales.length / itemsPerPage);
  const currentSales = operatorSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-brand-dark rounded-3xl border border-white/5 shadow-xl transition-all overflow-hidden">
      <div
        className="p-4 sm:p-6 flex items-center justify-between group cursor-pointer"
        onClick={(e) => onToggle(e)}
      >
        <div className="flex flex-col justify-center">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl sm:text-4xl font-black text-white leading-none">{value}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`${color} text-white keep-white p-4 sm:p-5 rounded-2xl shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6`}>
            {React.cloneElement(icon, { className: 'w-6 h-6 sm:w-7 sm:h-7' })}
          </div>
          <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 pt-0 border-t border-white/5 bg-black/20">
          {operatorSales.length > 0 ? (
            <div className="flex flex-col gap-2 mt-3 overflow-y-auto custom-scrollbar pr-1">
              {currentSales.map((op: any) => (
                <div key={op.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-black flex items-center justify-center text-[10px] font-bold border border-white/10 overflow-hidden shrink-0">
                      {op.photo ? (
                        <img src={getMediaUrl(op.photo)} alt={op.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <>{op.firstName?.[0]}{op.lastName?.[0]}</>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white/80 truncate max-w-[120px]">{op.firstName} {op.lastName}</span>
                  </div>
                  <span className="text-sm font-black text-brand-gold">{op.sales}</span>
                </div>
              ))}
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pb-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                    disabled={currentPage === 1}
                    className="p-1 px-3 bg-brand-black border border-white/10 rounded-lg text-[10px] font-black uppercase text-white/40 disabled:opacity-20 transition-all hover:text-white"
                  >
                    Oldingi
                  </button>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{currentPage} / {totalPages}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                    disabled={currentPage === totalPages}
                    className="p-1 px-3 bg-brand-black border border-white/10 rounded-lg text-[10px] font-black uppercase text-white/40 disabled:opacity-20 transition-all hover:text-white"
                  >
                    Keyingi
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/40 text-center mt-3 py-2">Xodimlar yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

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

interface ManagerPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isDarkMode: boolean;
  language: 'uz' | 'ru' | 'en';
  calculateAchievements: (force?: boolean) => void;
  refreshData: () => Promise<void>;
  activeTab: 'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards' | 'monitoring' | 'rating' | 'sales_panel' | 'settings';
  setActiveTab: (tab: 'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards' | 'monitoring' | 'rating' | 'sales_panel' | 'settings') => void;
  showNotification: (message: string, type?: 'error' | 'success') => void;
}


const getFormattedDateStr = (d: Date | string | number) => {
  const uzDate = getUzTime(d);
  const y = uzDate.getFullYear();
  const m = String(uzDate.getMonth() + 1).padStart(2, '0');
  const day = String(uzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMediaUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
  // If baseUrl ends with /api/v1/, strip it for media
  const cleanBaseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
  return `${cleanBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const SingleLocationMap: React.FC<{
  location: { lat: number; lng: number } | null,
  endLocation?: { lat: number; lng: number } | null,
  initials: string,
  isDarkMode: boolean,
  language: Language
}> = ({ location, endLocation, initials, isDarkMode, language }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

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

      L.tileLayer(tileUrl, { maxZoom: 20 }).addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 100);
    }

    if (leafletMap.current) {
      // Update Start Marker
      if (location) {
        const startIcon = L.divIcon({
          className: 'custom-staff-icon-pin',
          html: `<div class="map-marker-pin-tear bg-green-500"><div class="pin-initials">${initials}</div></div>`,
          iconSize: [40, 48], iconAnchor: [20, 48]
        });
        if (startMarkerRef.current) {
          startMarkerRef.current.setLatLng([location.lat, location.lng]);
        } else {
          startMarkerRef.current = L.marker([location.lat, location.lng], { icon: startIcon }).addTo(leafletMap.current);
        }
      } else if (startMarkerRef.current) {
        leafletMap.current.removeLayer(startMarkerRef.current);
        startMarkerRef.current = null;
      }

      // Update End Marker
      if (endLocation) {
        const endIcon = L.divIcon({
          className: 'custom-staff-icon-pin',
          html: `<div class="map-marker-pin-tear bg-red-600"><div class="pin-initials">${initials}</div></div>`,
          iconSize: [40, 48], iconAnchor: [20, 48]
        });
        if (endMarkerRef.current) {
          endMarkerRef.current.setLatLng([endLocation.lat, endLocation.lng]);
        } else {
          endMarkerRef.current = L.marker([endLocation.lat, endLocation.lng], { icon: endIcon }).addTo(leafletMap.current);
        }
      } else if (endMarkerRef.current) {
        leafletMap.current.removeLayer(endMarkerRef.current);
        endMarkerRef.current = null;
      }

      // Adjust view if both exist
      if (location && endLocation) {
        const bounds = L.latLngBounds([
          [location.lat, location.lng],
          [endLocation.lat, endLocation.lng]
        ]);
        leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (location) {
        leafletMap.current.setView([location.lat, location.lng], 16);
      } else if (endLocation) {
        leafletMap.current.setView([endLocation.lat, endLocation.lng], 16);
      }
    }
  }, [location, endLocation, initials, isDarkMode]);

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
    <div className="h-56 flex flex-col items-center justify-center text-white/20 italic font-black text-xs uppercase tracking-widest bg-brand-black rounded-[2rem] border-2 border-dashed border-white/10 p-8 text-center">
      <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center shadow-sm mb-4 border border-white/10">
        <MapPin className="w-8 h-8 opacity-20" />
      </div>
      Joylashuv ma'lumotlari topilmadi
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



const CustomAxisTick = ({ x, y, payload, index }: any) => {
  if (!payload) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={index % 2 === 0 ? 10 : 25}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontWeight={700}
      >
        {payload.value}
      </text>
    </g>
  );
};

const ManagerPanel: React.FC<ManagerPanelProps> = ({ 
  state, 
  setState, 
  activeTab, 
  setActiveTab, 
  isDarkMode, 
  language, 
  calculateAchievements, 
  refreshData,
  showNotification 
}) => {
  const today = getTodayStr();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const { userNameOrId } = useParams<{ userNameOrId?: string }>();
  const navigate = useNavigate();

  const [selectedUserIdInternal, setSelectedUserIdInternal] = useState<string | null>(null);

  const setSelectedUserId = (id: string | null | ((prev: string | null) => string | null)) => {
    const newId = typeof id === 'function' ? id(selectedUserIdInternal) : id;
    if (activeTab === 'users') {
      if (newId) {
        const u = state.users.find(x => x.id === newId);
        if (u) {
          const param = u.nickname || u.username || u.phone || u.id;
          navigate(`/manager/users/${encodeURIComponent(param)}`);
        }
      } else {
        navigate(`/manager/users`);
      }
    }
    setSelectedUserIdInternal(newId);
  };

  const selectedUserId = selectedUserIdInternal;

  useEffect(() => {
    if (activeTab === 'users') {
      if (userNameOrId) {
        const decoded = decodeURIComponent(userNameOrId);
        const user = state.users.find(u => 
          u.nickname === decoded || 
          u.username === decoded || 
          u.phone === decoded || 
          u.phone === '+' + decoded ||
          u.id === decoded
        );
        if (user && selectedUserIdInternal !== user.id) {
          setSelectedUserIdInternal(user.id);
        }
      } else if (selectedUserIdInternal !== null) {
        setSelectedUserIdInternal(null);
      }
    }
  }, [activeTab, userNameOrId, state.users]);
  const [mapSelectedUserId, setMapSelectedUserId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<{ type: 'checkIn' | 'checkOut', current: string } | null>(null);
  const [newTime, setNewTime] = useState('');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingTimeframe, setRatingTimeframe] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [isRatingTimeframeDropdownOpen, setIsRatingTimeframeDropdownOpen] = useState(false);
  const [ratingMonthOffset, setRatingMonthOffset] = useState(0);
  const [ratingCustomStart, setRatingCustomStart] = useState(getTodayStr());
  const [ratingCustomEnd, setRatingCustomEnd] = useState(getTodayStr());
  const [ratingMode, setRatingMode] = useState('overall');
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);
  const [leagueForm, setLeagueForm] = useState<{ league: 'gold' | 'silver' | 'bronze', userId: string }>({ league: 'gold', userId: '' });
  const [chartTimeframe, setChartTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isRecipientDropdownOpen, setIsRecipientDropdownOpen] = useState(false);
  const [messageRecipientId, setMessageRecipientId] = useState<string>('all');
  const [messageText, setMessageText] = useState('');

  // Monitoring Tab State
  const [monitoringTimeframe, setMonitoringTimeframe] = useState<'today' | 'month' | 'year'>('today');
  const [monitoringWeekOffset, setMonitoringWeekOffset] = useState(0);
  const [monitoringMonthOffset, setMonitoringMonthOffset] = useState(0);
  const [monitoringYear, setMonitoringYear] = useState(new Date().getFullYear());
  const [monitoringSelectedDay, setMonitoringSelectedDay] = useState<string | null>(null);
  const [isWorkPointModalOpen, setIsWorkPointModalOpen] = useState(false);
  const [workPointForm, setWorkPointForm] = useState<{ userId: string, location: { lat: number, lng: number } | null, radius: number, workType: 'office' | 'mobile' | 'desk' }>({ userId: '', location: null, radius: 200, workType: 'office' });
  const [isWorkPointOperatorDropdownOpen, setIsWorkPointOperatorDropdownOpen] = useState(false);
  const [isLeagueDeleteConfirmOpen, setIsLeagueDeleteConfirmOpen] = useState(false);
  const [leagueUserToDelete, setLeagueUserToDelete] = useState<User | null>(null);

  const [simPage, setSimPage] = useState(1);
  const simPerPage = 6;
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const leaderboardPerPage = 5;
  const [approvalsPage, setApprovalsPage] = useState(1);
  const approvalsPerPage = 12;
  const [monitoringOperatorsPage, setMonitoringOperatorsPage] = useState(1);
  const monitoringOperatorsPerPage = 9;
  const [staffPage, setStaffPage] = useState(1);
  const staffPerPage = 12;
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPerPage = 9;

  const userSalesPerPage = 5;
  const [userSalesPage, setUserSalesPage] = useState(1);
  const userReportsPerPage = 3;
  const [userReportsPage, setUserReportsPage] = useState(1);

  const userFilteredSales = useMemo(() => {
    if (!selectedUserIdInternal) return [];
    let daySales = [];
    if (selectedDay) {
      if (chartTimeframe === 'year') {
        const monthPrefix = selectedDay.substring(0, 7);
        daySales = state.sales.filter(s => s.userId === selectedUserIdInternal && s.date.startsWith(monthPrefix));
      } else {
        daySales = state.sales.filter(s => s.userId === selectedUserIdInternal && s.date === selectedDay);
      }
    } else if (chartTimeframe === 'year') {
      const yearPrefix = selectedYear.toString();
      daySales = state.sales.filter(s => s.userId === selectedUserIdInternal && s.date.startsWith(yearPrefix));
    } else if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      daySales = state.sales.filter(s => s.userId === selectedUserIdInternal && s.date.startsWith(monthPrefix));
    } else {
      daySales = state.sales.filter(s => s.userId === selectedUserIdInternal && s.date === today);
    }
    return daySales.sort((a, b) => {
      const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
      return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
    });
  }, [selectedUserIdInternal, state.sales, selectedDay, chartTimeframe, selectedYear, monthOffset]);

  const userFilteredReports = useMemo(() => {
    if (!selectedUserIdInternal) return [];
    let timeframeReports = [];
    if (selectedDay) {
      if (chartTimeframe === 'year') {
        const monthPrefix = selectedDay.substring(0, 7);
        timeframeReports = state.reports.filter(r => r.userId === selectedUserIdInternal && r.date.startsWith(monthPrefix));
      } else {
        timeframeReports = state.reports.filter(r => r.userId === selectedUserIdInternal && r.date === selectedDay);
      }
    } else if (chartTimeframe === 'year') {
      const yearPrefix = selectedYear.toString();
      timeframeReports = state.reports.filter(r => r.userId === selectedUserIdInternal && r.date.startsWith(yearPrefix));
    } else if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      timeframeReports = state.reports.filter(r => r.userId === selectedUserIdInternal && r.date.startsWith(monthPrefix));
    } else {
      timeframeReports = state.reports.filter(r => r.userId === selectedUserIdInternal && r.date === today);
    }
    return timeframeReports.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [selectedUserIdInternal, state.reports, selectedDay, chartTimeframe, selectedYear, monthOffset]);
  
  const paginatedUserSales = useMemo(() => userFilteredSales.slice((userSalesPage - 1) * userSalesPerPage, userSalesPage * userSalesPerPage), [userFilteredSales, userSalesPage]);
  const paginatedUserReports = useMemo(() => userFilteredReports.slice((userReportsPage - 1) * userReportsPerPage, userReportsPage * userReportsPerPage), [userFilteredReports, userReportsPage]);

  // Sync these when timeframe or user changes
  useEffect(() => {
    setUserSalesPage(1);
    setUserReportsPage(1);
  }, [selectedUserIdInternal, chartTimeframe, selectedDay, monthOffset, selectedYear, weekOffset]);

  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [targetForm, setTargetForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [officeForm, setOfficeForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });
  const [mobileOfficeForm, setMobileOfficeForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });
  const [showTariffForm, setShowTariffForm] = useState(false);
  const [newTariff, setNewTariff] = useState({ company: 'Ucell', name: '' });
  const [deletingTariff, setDeletingTariff] = useState<{ company: string, tariff: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<'tariffCompany' | null>(null);

  const formatLargeNumber = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    if (num > 999999999) return '999M+';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return Math.round(num).toLocaleString('uz-UZ');
  };

  const [inventoryModalUser, setInventoryModalUser] = useState<User | null>(null);
  const [inventoryForm, setInventoryForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });

  const [isSalesLinkModalOpen, setIsSalesLinkModalOpen] = useState(false);
  const [isSalesLinkSubmitting, setIsSalesLinkSubmitting] = useState(false);
  const [editingSalesLinkId, setEditingSalesLinkId] = useState<string | null>(null);
  const [deletingSalesLinkId, setDeletingSalesLinkId] = useState<string | null>(null);
  const [salesLinkForm, setSalesLinkForm] = useState<{ name: string, url: string, mobileUrl?: string, image?: string }>({
    name: '',
    url: '',
    mobileUrl: '',
    image: ''
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFormUserId, setPasswordFormUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'success' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'success'
  });

  // Operator Rating State
  const [ratingStars, setRatingStars] = useState(0); // hover state
  const [ratingSelectedStars, setRatingSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordFormUserId || !newPassword.trim()) return;
    try {
      await handleUpdateUser(passwordFormUserId, { password: newPassword });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setPasswordFormUserId(null);
    } catch (err) {
      console.error("Failed to change password", err);
    }
  };

  const monthInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await userService.updateUser(userId, updates);
      // Removed reload
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await userService.approveUser(userId);
      // Removed reload
    } catch (err) {
      console.error("Failed to approve user", err);
    }
  };

  const handleSendMessage = async (text: string, recipientId?: string) => {
    try {
      await messageService.sendMessage({ text, recipient_id: recipientId === 'all' ? null : recipientId });
      // Removed reload
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleSetTarget = async (month: string, targets: any, officeCounts: any, mobileOfficeCounts: any) => {
    try {
      await targetService.setTarget({ month, targets, officeCounts, mobileOfficeCounts });
      await refreshData();
    } catch (err) {
      console.error("Failed to set target", err);
    }
  };

  const handleUpdateCheckIn = async (userId: string, date: string, updates: any) => {
    try {
      console.log("Updating check-in", userId, date, updates);
      // Logic for updating check-in via API
    } catch (err) {
      console.error("Failed to update check-in", err);
    }
  };

  const handleUpdateReport = async (userId: string, date: string, updates: any) => {
    try {
      console.log("Updating report", userId, date, updates);
    } catch (err) {
      console.error("Failed to update report", err);
    }
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      const res = await messageService.getMessages();
      setState(prev => ({ ...prev, messages: res.data }));
    } catch (err) {
      console.error("Failed to mark message as read", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages' && state.currentUser) {
      const unreadMyMessages = state.messages.filter(m =>
        !m.isRead &&
        m.senderId !== state.currentUser?.id
      );
      if (unreadMyMessages.length > 0) {
        Promise.all(unreadMyMessages.map(m => messageService.markAsRead(m.id))).then(async () => {
          const res = await messageService.getMessages();
          setState(prev => ({ ...prev, messages: res.data }));
        }).catch(err => console.error("Failed to mark messages as read", err));
      }
    }
  }, [activeTab, state.messages, state.currentUser]);

  const handleAddTariff = async (company: string, tariff: string) => {
    try {
      await ruleService.addTariff({ company, name: tariff });
      await refreshData();
    } catch (err) {
      console.error("Failed to add tariff", err);
    }
  };

  const handleRemoveTariff = async (company: string, tariff: string) => {
    try {
      await ruleService.removeTariff({ company, name: tariff });
      await refreshData();
    } catch (err) {
      console.error("Failed to remove tariff", err);
    }
  };

  const handleAddSalesLink = async (link: any) => {
    setIsSalesLinkSubmitting(true);
    try {
      await linkService.createSalesLink(link);
      await refreshData();
      setIsSalesLinkModalOpen(false);
    } catch (err: any) {
      console.error("Failed to add sales link", err);
      // Removed alert as per user request
    } finally {
      setIsSalesLinkSubmitting(false);
    }
  };

  const handleUpdateSalesLink = async (id: string, link: any) => {
    setIsSalesLinkSubmitting(true);
    try {
      await linkService.updateSalesLink(id, link);
      await refreshData();
      setIsSalesLinkModalOpen(false);
    } catch (err: any) {
      console.error("Failed to update sales link", err);
      // Removed alert as per user request
    } finally {
      setIsSalesLinkSubmitting(false);
    }
  };

  const handleRemoveSalesLink = async (id: string) => {
    try {
      await linkService.deleteSalesLink(id);
    } catch (err) {
      console.error("Failed to remove sales link", id, err);
    }
  };

  const approvedUsers = useMemo(() => state.users.filter(u => u.isApproved), [state.users]);
  const operators = useMemo(() => approvedUsers.filter(u => u.role !== Role.MANAGER), [approvedUsers]);
  const pendingUsers = useMemo(() => state.users.filter(u => !u.isApproved), [state.users]);
  const unreadMessagesCount = useMemo(() => state.messages.filter(m => !m.isRead && m.senderId !== state.currentUser?.id).length, [state.messages, state.currentUser]);
  const selectedUser = useMemo(() => state.users.find(u => u.id === selectedUserId) || null, [state.users, selectedUserId]);

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

  const getSalesChartData = (userId: string, timeframe: 'week' | 'month' | 'year', targetYear: number, wOffset: number, mOffset: number) => {
    const data = [];

    if (timeframe === 'week') {
      const d = getUzTime();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (wOffset * 7));
      const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];

      for (let i = 0; i < 7; i++) {
        const current = new Date(targetMonday);
        current.setDate(targetMonday.getDate() + i);
        const dateStr = getFormattedDateStr(current);
        const daySales = state.sales.filter(s => s.userId === userId && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({
          name: uzDays[current.getDay()],
          fullDate: dateStr,
          simcards,
          bonuses
        });
      }
    } else if (timeframe === 'month') {
      const d = getUzTime();
      d.setDate(1);
      d.setMonth(d.getMonth() + mOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const current = new Date(year, month, i);
        const dateStr = getFormattedDateStr(current);
        const daySales = state.sales.filter(s => s.userId === userId && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: i.toString(), fullDate: dateStr, simcards, bonuses });
      }
    } else if (timeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${targetYear}-${String(monthNum).padStart(2, '0')}`;
        const monthSales = state.sales.filter(s => s.userId === userId && s.date.startsWith(monthPrefix));
        const simcards = monthSales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = monthSales.reduce((sum, s) => sum + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], fullDate: `${targetYear}-${String(monthNum).padStart(2, '0')}-01`, simcards, bonuses });
      }
    }
    return data;
  };

  const currentChartData = useMemo(() => {
    if (!selectedUserId) return [];
    return getSalesChartData(selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset);
  }, [selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset, state.sales]);

  const userChartTotals = useMemo(() => {
    const totalSimcards = currentChartData.reduce((sum, item) => sum + (item.simcards || 0), 0);
    const totalBonuses = currentChartData.reduce((sum, item) => sum + (item.bonuses || 0), 0);
    return { totalSimcards, totalBonuses };
  }, [currentChartData]);

  const chartTitleLabel = useMemo(() => {
    if (chartTimeframe === 'week') return 'Haftalik';
    if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      const monthName = translations[language].month_names[d.getMonth()];
      return `${monthName} ${d.getFullYear()}`;
    }
    if (chartTimeframe === 'year') return `${t(language, 'yearly')} - ${selectedYear}`;
    return '';
  }, [chartTimeframe, monthOffset, selectedYear]);

  const activeReferencePoint = useMemo(() => {
    if (!selectedDay) return null;
    return currentChartData.find(d => d.fullDate === selectedDay);
  }, [selectedDay, currentChartData]);

  const filteredUsers = useMemo(() => {
    return approvedUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [approvedUsers, searchTerm]);

  const handleResetChart = () => {
    setSelectedDay(null);
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedYear(getUzTime().getFullYear());
  };

  useEffect(() => {
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedYear(new Date().getFullYear());
  }, [chartTimeframe, selectedUserId]);

  const periodTotals = useMemo(() => {
    if (!selectedUserId) return { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };

    let filteredSales = state.sales.filter(s => s.userId === selectedUserId);

    if (chartTimeframe === 'week') {
      const d = getUzTime();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (weekOffset * 7));
      targetMonday.setHours(0, 0, 0, 0);
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);
      targetSunday.setHours(23, 59, 59, 999);

      filteredSales = filteredSales.filter(s => {
        const sd = new Date(s.date);
        return sd >= targetMonday && sd <= targetSunday;
      });
    } else if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      filteredSales = filteredSales.filter(s => s.date.startsWith(monthPrefix));
    } else if (chartTimeframe === 'year') {
      const yearPrefix = selectedYear.toString();
      filteredSales = filteredSales.filter(s => s.date.startsWith(yearPrefix));
    }

    const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    filteredSales.forEach(s => {
      if (totals[s.company] !== undefined) {
        totals[s.company] += s.count + s.bonus;
      }
    });
    return totals;
  }, [selectedUserId, chartTimeframe, weekOffset, monthOffset, selectedYear, state.sales]);

  // Reset selected day when timeframe changes
  useEffect(() => {
    setMonitoringSelectedDay(null);
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear]);

  // Get all sales for the current monitoring period
  const monitoringPeriodSales = useMemo(() => {
    let filteredSales = state.sales;

    if (monitoringTimeframe === 'today') {
      const d = getUzTime();
      d.setDate(d.getDate() + monitoringWeekOffset);
      const targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filteredSales = filteredSales.filter(s => s.date === targetDate);
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
    return filteredSales;
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear, state.sales]);

  const monitoringChartData = useMemo(() => {
    const data = [];
    if (monitoringTimeframe === 'today') {
      const d = getUzTime();
      d.setDate(d.getDate() + monitoringWeekOffset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const daySales = monitoringPeriodSales.filter(s => s.date === dateStr);
      const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
      const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
      data.push({ name: 'Bugun', simcards, bonuses, fullDate: dateStr });
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
        const daySales = monitoringPeriodSales.filter(s => s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: i.toString(), simcards, bonuses, fullDate: dateStr });
      }
    } else if (monitoringTimeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${monitoringYear}-${String(monthNum).padStart(2, '0')}`;
        const monthSales = monitoringPeriodSales.filter(s => s.date.startsWith(monthPrefix));
        const simcards = monthSales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = monthSales.reduce((sum, s) => sum + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], simcards, bonuses, fullDate: monthPrefix });
      }
    }
    return data;
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear, monitoringPeriodSales]);

  const monitoringTotals = useMemo(() => {
    const totalSimcards = monitoringPeriodSales.reduce((sum, s) => sum + s.count, 0);
    const totalBonuses = monitoringPeriodSales.reduce((sum, s) => sum + s.bonus, 0);

    // Calculate company totals for the chart period
    const companyTotals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    monitoringPeriodSales.forEach(s => {
      if (companyTotals[s.company] !== undefined) {
        companyTotals[s.company] += s.count + s.bonus;
      }
    });

    return { totalSimcards, totalBonuses, companyTotals };
  }, [monitoringPeriodSales]);

  // Sales data for the table (filtered by selected day if any)
  const tableSales = useMemo(() => {
    if (monitoringSelectedDay) {
      if (monitoringSelectedDay.length === 7) {
        return monitoringPeriodSales.filter(s => s.date.startsWith(monitoringSelectedDay));
      }
      return monitoringPeriodSales.filter(s => s.date === monitoringSelectedDay);
    }
    return monitoringPeriodSales;
  }, [monitoringPeriodSales, monitoringSelectedDay]);

  const tableTotals = useMemo(() => {
    const companyTotals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    tableSales.forEach(s => {
      if (companyTotals[s.company] !== undefined) {
        companyTotals[s.company] += s.count + s.bonus;
      }
    });
    const totalAll = Object.values(companyTotals).reduce((a, b) => a + b, 0);
    return { companyTotals, totalAll };
  }, [tableSales]);

  const sortedOperators = useMemo(() => {
    const operators = state.users.filter(u => u.role !== 'manager');
    return operators.sort((a, b) => {
      const salesA = tableSales.filter(s => s.userId === a.id);
      const salesB = tableSales.filter(s => s.userId === b.id);
      const maxTimeA = salesA.length > 0 ? Math.max(...salesA.map(s => new Date(s.timestamp || s.date).getTime())) : 0;
      const maxTimeB = salesB.length > 0 ? Math.max(...salesB.map(s => new Date(s.timestamp || s.date).getTime())) : 0;
      if (maxTimeB !== maxTimeA) return maxTimeB - maxTimeA;
      
      const totalA = salesA.reduce((sum, s) => sum + s.count + s.bonus, 0);
      const totalB = salesB.reduce((sum, s) => sum + s.count + s.bonus, 0);
      return totalB - totalA;
    });
  }, [state.users, tableSales]);

  return (
    <div className="space-y-6">
      {viewingPhoto && <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />}

      {isSendMessageModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSendMessageModalOpen(false)}></div>
          <div className="bg-brand-dark w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 bg-brand-gold text-brand-black rounded-xl sm:rounded-2xl shadow-lg">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Xabar yuborish</h3>
                  <p className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">Yangi xabar yaratish</p>
                </div>
              </div>
              <button onClick={() => setIsSendMessageModalOpen(false)} className="p-2 bg-brand-black rounded-xl text-white/40 hover:text-white transition shadow-sm border border-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-brand-gold/10 rounded-3xl flex items-center justify-center text-brand-gold border border-brand-gold/20 relative">
                <div className="absolute inset-0 bg-brand-gold/5 rounded-3xl animate-ping opacity-20" />
                <Send className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">Tez Orada</h3>
                 <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] leading-relaxed max-w-[240px]">
                    Xabar yuborish tizimi tez orada ishga tushadi. Iltimos kuting.
                 </p>
              </div>
              <button 
                 onClick={() => setIsSendMessageModalOpen(false)}
                 className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] border border-white/5 transition-all"
              >
                 Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <StatCard
              label="Ucell"
              value={state.sales.filter(s => s.date === today && s.company === 'Ucell').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)}
              icon={<Smartphone />}
              color="bg-[#9b51e0]"
              companySales={state.sales.filter(s => s.date === today && s.company === 'Ucell')}
              operators={operators}
              isExpanded={expandedCard === 'Ucell'}
              onToggle={(e) => { e.stopPropagation(); setExpandedCard(prev => prev === 'Ucell' ? null : 'Ucell'); }}
            />
            <StatCard
              label="Uztelecom"
              value={state.sales.filter(s => s.date === today && s.company === 'Uztelecom').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)}
              icon={<Smartphone />}
              color="bg-[#009ee0]"
              companySales={state.sales.filter(s => s.date === today && s.company === 'Uztelecom')}
              operators={operators}
              isExpanded={expandedCard === 'Uztelecom'}
              onToggle={(e) => { e.stopPropagation(); setExpandedCard(prev => prev === 'Uztelecom' ? null : 'Uztelecom'); }}
            />
            <StatCard
              label="Mobiuz"
              value={state.sales.filter(s => s.date === today && s.company === 'Mobiuz').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)}
              icon={<Smartphone />}
              color="bg-[#eb1c24]"
              companySales={state.sales.filter(s => s.date === today && s.company === 'Mobiuz')}
              operators={operators}
              isExpanded={expandedCard === 'Mobiuz'}
              onToggle={(e) => { e.stopPropagation(); setExpandedCard(prev => prev === 'Mobiuz' ? null : 'Mobiuz'); }}
            />
            <StatCard
              label="Beeline"
              value={state.sales.filter(s => s.date === today && s.company === 'Beeline').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)}
              icon={<Smartphone />}
              color="bg-[#fdb913]"
              companySales={state.sales.filter(s => s.date === today && s.company === 'Beeline')}
              operators={operators}
              isExpanded={expandedCard === 'Beeline'}
              onToggle={(e) => { e.stopPropagation(); setExpandedCard(prev => prev === 'Beeline' ? null : 'Beeline'); }}
            />
          </div>

          <section className="bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-brand-black">
              <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><Trophy className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-white tracking-tight">{t(language, 'staff_efficiency')}</h3>
            </div>
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-brand-black text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 w-12 sm:w-16 text-center">#</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4">{t(language, 'employee')}</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4">{t(language, 'position')}</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">{t(language, 'today_sales')}</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">{t(language, 'monthly_sales')}</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-right">{t(language, 'status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...operators]
                    .sort((a, b) => getUserSalesCount(b.id, 'month') - getUserSalesCount(a.id, 'month'))
                    .slice((leaderboardPage - 1) * leaderboardPerPage, leaderboardPage * leaderboardPerPage)
                    .map((op, idx) => {
                      const globalIdx = (leaderboardPage - 1) * leaderboardPerPage + idx;
                      const todayCount = getUserSalesCount(op.id, 'today');
                      const monthCount = getUserSalesCount(op.id, 'month');
                      const todayCheckIn = state.checkIns.find(ci => ci.userId === op.id && isDateMatch(ci.timestamp, today));
                      const workingHours = todayCheckIn?.workingHours || op.workingHours;
                      const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, workingHours) : null;

                      return (
                        <tr
                          key={op.id}
                          className={`transition group cursor-pointer ${lateness?.isLate ? 'bg-red-500/5 hover:bg-red-500/10' : (lateness?.isEarly ? 'bg-brand-gold/5 hover:bg-brand-gold/10' : 'hover:bg-white/5')}`}
                          onClick={() => {
                            setSelectedUserId(op.id);
                            setSelectedDay(null); // Defaults to today
                            setChartTimeframe('week');
                          }}
                        >
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-lg flex items-center justify-center font-black text-xs sm:text-sm ${globalIdx === 0 ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' :
                              globalIdx === 1 ? 'bg-white/20 text-white' :
                                globalIdx === 2 ? 'bg-white/10 text-white/60' :
                                  'bg-brand-black text-white/20'
                              }`}>
                              {globalIdx + 1}
                            </div>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-[10px] sm:text-xs border shrink-0 ${lateness?.isLate ? 'bg-red-600 text-white border-red-700 shadow-sm' : (lateness?.isEarly ? 'bg-brand-gold text-brand-black border-brand-gold shadow-sm' : 'bg-brand-black text-brand-gold border-white/10')} overflow-hidden`}>
                                {op.photo ? (
                                  <img src={getMediaUrl(op.photo)} alt={op.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <>{op.firstName?.[0]}{op.lastName?.[0]}</>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-white text-xs sm:text-sm truncate">{op.firstName} {op.lastName}</span>
                                {lateness?.isLate && <span className="text-[7px] sm:text-[8px] font-black text-red-500 uppercase tracking-widest truncate">{t(language, 'late')}: {lateness.durationStr}</span>}
                                {lateness?.isEarly && <span className="text-[7px] sm:text-[8px] font-black text-brand-gold uppercase tracking-widest truncate">{t(language, 'early_arrival')}: {lateness.durationStr}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5">
                            <span className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-md whitespace-nowrap">
                              {op.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center">
                            <div className="inline-flex flex-col">
                              <span className="text-lg sm:text-xl font-black text-brand-gold">{todayCount}</span>
                              <span className="text-[7px] sm:text-[8px] font-black text-white/20 uppercase">dona</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-center">
                            <div className="inline-flex flex-col">
                              <span className="text-lg sm:text-xl font-black text-white">{monthCount}</span>
                              <span className="text-[7px] sm:text-[8px] font-black text-white/20 uppercase">dona</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <div key={star} className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${monthCount > (star * 20) ? 'bg-brand-gold' : 'bg-white/10'}`}></div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout for Staff Efficiency */}
            <div className="md:hidden flex flex-col divide-y divide-white/5">
              {[...operators]
                .sort((a, b) => getUserSalesCount(b.id, 'month') - getUserSalesCount(a.id, 'month'))
                .slice((leaderboardPage - 1) * leaderboardPerPage, leaderboardPage * leaderboardPerPage)
                .map((op, idx) => {
                  const globalIdx = (leaderboardPage - 1) * leaderboardPerPage + idx;
                  const todayCount = getUserSalesCount(op.id, 'today');
                  const monthCount = getUserSalesCount(op.id, 'month');
                  const todayCheckIn = state.checkIns.find(ci => ci.userId === op.id && isDateMatch(ci.timestamp, today));
                  const workingHours = todayCheckIn?.workingHours || op.workingHours;
                  const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, workingHours) : null;

                  return (
                    <div
                      key={op.id}
                      className={`p-4 transition group cursor-pointer ${lateness?.isLate ? 'bg-red-500/5 hover:bg-red-500/10' : (lateness?.isEarly ? 'bg-brand-gold/5 hover:bg-brand-gold/10' : 'hover:bg-white/5')}`}
                      onClick={() => {
                        setSelectedUserId(op.id);
                        setSelectedDay(null);
                        setChartTimeframe('week');
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${globalIdx === 0 ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' :
                            globalIdx === 1 ? 'bg-white/20 text-white' :
                              globalIdx === 2 ? 'bg-white/10 text-white/60' :
                                'bg-brand-black text-white/20'
                            }`}>
                            {globalIdx + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] border shrink-0 ${lateness?.isLate ? 'bg-red-600 text-white border-red-700 shadow-sm' : (lateness?.isEarly ? 'bg-brand-gold text-brand-black border-brand-gold shadow-sm' : 'bg-brand-black text-brand-gold border-white/10')} overflow-hidden`}>
                              {op.photo ? (
                                <img src={getMediaUrl(op.photo)} alt={op.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <>{op.firstName?.[0]}{op.lastName?.[0]}</>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-white text-sm truncate">{op.firstName} {op.lastName}</span>
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-md w-fit mt-0.5">
                                {op.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <div key={star} className={`w-1.5 h-1.5 rounded-full ${monthCount > (star * 20) ? 'bg-brand-gold' : 'bg-white/10'}`}></div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-brand-black/50 p-3 rounded-2xl border border-white/5">
                        <div className="flex flex-col items-center justify-center p-2">
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t(language, 'today_sales')}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-brand-gold">{todayCount}</span>
                            <span className="text-[8px] font-black text-white/20 uppercase">dona</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 border-l border-white/5">
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t(language, 'monthly_sales')}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white">{monthCount}</span>
                            <span className="text-[8px] font-black text-white/20 uppercase">dona</span>
                          </div>
                        </div>
                      </div>

                      {(lateness?.isLate || lateness?.isEarly) && (
                        <div className="mt-2 text-center">
                          {lateness?.isLate && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{t(language, 'late')}: {lateness.durationStr}</span>}
                          {lateness?.isEarly && <span className="text-[9px] font-black text-brand-gold uppercase tracking-widest">{t(language, 'early_arrival')}: {lateness.durationStr}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>  {operators.length > leaderboardPerPage && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                <button
                  onClick={() => {
                    setLeaderboardPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={leaderboardPage === 1}
                  className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <span className="text-xs font-bold text-white/60">
                  {leaderboardPage} / {Math.ceil(operators.length / leaderboardPerPage)}
                </span>
                <button
                  onClick={() => {
                    setLeaderboardPage(p => Math.min(Math.ceil(operators.length / leaderboardPerPage), p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={leaderboardPage === Math.ceil(operators.length / leaderboardPerPage)}
                  className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>
            )}
          </section>

          <div className="bg-brand-dark p-4 rounded-3xl shadow-sm border border-white/10 h-[800px] sm:h-[650px] flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-white/5 p-2 flex flex-col gap-3 shrink-0">
              <h3 className="text-base font-black text-white mb-0 sm:mb-4 shrink-0 sm:shrink">Operatorlar bo'limi</h3>

              {/* Mobile Dropdown */}
              <div className="sm:hidden relative">
                <select
                  className="w-full p-4 bg-brand-black border border-white/10 rounded-2xl text-sm font-medium text-white appearance-none focus:outline-none focus:border-brand-gold"
                  value={mapSelectedUserId || ''}
                  onChange={(e) => setMapSelectedUserId(e.target.value)}
                >
                  <option value="" disabled>Operatorni tanlang</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.firstName} {op.lastName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </div>
              </div>

              {/* Desktop List */}
              <div className="hidden sm:flex sm:flex-col gap-3 overflow-y-auto custom-scrollbar">
                {operators.map(op => (
                  <div
                    key={op.id}
                    onClick={() => setMapSelectedUserId(op.id)}
                    className={`group w-full text-left p-4 rounded-2xl text-sm font-medium transition-all duration-300 border cursor-pointer flex justify-between items-center shrink-0 sm:shrink ${mapSelectedUserId === op.id ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <span className="truncate font-semibold">{op.firstName} {op.lastName}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUserId(op.id); }}
                      className={`p-2 rounded-xl transition-all shrink-0 ${mapSelectedUserId === op.id ? 'bg-brand-black/10 hover:bg-brand-black/20 text-brand-black' : 'bg-white/5 hover:bg-white/10 text-white/60 group-hover:text-white'}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-[400px] sm:min-h-0">
              <div className="p-2 mb-2 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-base font-black text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-gold" /> Jonli Monitoring</h3>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{new Date().toISOString().slice(0, 10)}</span>
                  <button
                    onClick={() => setIsWorkPointModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-gold/20 shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" /> Ish nuqtasini kiritish
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-2xl"><StaffMap className="h-full" checkIns={state.checkIns} reports={state.reports} users={state.users} today={today} onUserSelect={setMapSelectedUserId} selectedUserId={mapSelectedUserId || undefined} isDarkMode={isDarkMode} language={language} /></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-brand-gold" />
                Monitoring
              </h2>
              <p className="text-white/40 font-medium mt-1 text-xs sm:text-sm">Barcha operatorlarning savdo ko'rsatkichlari</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex p-1 bg-brand-black rounded-xl border border-white/10">
                <button
                  onClick={() => setMonitoringTimeframe('today')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'today' ? 'bg-brand-gold text-brand-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  Bugun
                </button>
                <button
                  onClick={() => setMonitoringTimeframe('month')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'month' ? 'bg-brand-gold text-brand-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  {t(language, 'month')}
                </button>
                <button
                  onClick={() => setMonitoringTimeframe('year')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'year' ? 'bg-brand-gold text-brand-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  {t(language, 'yearly')}
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-1 bg-brand-black p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    setMonitoringSelectedDay(null);
                    if (monitoringTimeframe === 'today') setMonitoringWeekOffset(prev => prev - 1);
                    else if (monitoringTimeframe === 'month') setMonitoringMonthOffset(prev => prev - 1);
                    else if (monitoringTimeframe === 'year') setMonitoringYear(prev => prev - 1);
                  }}
                  className="p-2 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/40 hover:text-brand-gold"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] sm:text-xs font-black text-white/60 px-2 sm:px-4 uppercase tracking-widest min-w-[100px] sm:min-w-[140px] text-center">
                  {(() => {
                    if (monitoringTimeframe === 'today') {
                      const d = getUzTime();
                      d.setDate(d.getDate() + monitoringWeekOffset);
                      return `${d.getDate()}-${['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'][d.getMonth()]} ${d.getFullYear()}`;
                    } else if (monitoringTimeframe === 'month') {
                      const d = new Date();
                      d.setDate(1);
                      d.setMonth(d.getMonth() + monitoringMonthOffset);
                      return `${['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'][d.getMonth()]} ${d.getFullYear()}`;
                    } else {
                      return monitoringYear.toString();
                    }
                  })()}
                </span>
                <button
                  onClick={() => {
                    setMonitoringSelectedDay(null);
                    if (monitoringTimeframe === 'today') setMonitoringWeekOffset(prev => prev + 1);
                    else if (monitoringTimeframe === 'month') setMonitoringMonthOffset(prev => prev + 1);
                    else if (monitoringTimeframe === 'year') setMonitoringYear(prev => prev + 1);
                  }}
                  className="p-2 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/40 hover:text-brand-gold"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Aggregated Chart */}
          <div className="bg-brand-dark p-8 rounded-[3rem] shadow-xl border border-white/10">
            <div className="h-[300px] sm:h-[400px] w-full chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monitoringChartData}
                  margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      const clickedDate = data.activePayload[0].payload.fullDate;
                      if (clickedDate) {
                        setMonitoringSelectedDay(prev => prev === clickedDate ? null : clickedDate);
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" opacity={0.1} />
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
                    height={60}
                    content={() => (
                      <div className="flex flex-col items-center justify-center gap-4 mb-8">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Simkartalar: {monitoringTotals.totalSimcards}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Bonuslar: {monitoringTotals.totalBonuses}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  <Bar
                    name="Simkartalar"
                    dataKey="simcards"
                    fill="var(--theme-gold)"
                    radius={[4, 4, 0, 0]}
                    barSize={monitoringTimeframe === 'today' ? 40 : undefined}
                    onClick={(data, index, e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      if (data && data.fullDate) {
                        setMonitoringSelectedDay(prev => prev === data.fullDate ? null : data.fullDate);
                      }
                    }}
                  >
                    {monitoringChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fullDate === monitoringSelectedDay ? '#fff' : 'var(--theme-gold)'} />
                    ))}
                    <LabelList dataKey="simcards" position="top" fill="var(--theme-gold)" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar
                    name="Bonuslar"
                    dataKey="bonuses"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={monitoringTimeframe === 'week' ? 20 : undefined}
                    onClick={(data, index, e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      if (data && data.fullDate) {
                        setMonitoringSelectedDay(prev => prev === data.fullDate ? null : data.fullDate);
                      }
                    }}
                  >
                    {monitoringChartData.map((entry, index) => (
                      <Cell key={`cell-bonus-${index}`} fill={entry.fullDate === monitoringSelectedDay ? '#a7f3d0' : '#10B981'} />
                    ))}
                    <LabelList dataKey="bonuses" position="top" fill="#10B981" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operator Breakdown Table */}
          <div className="bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-brand-black border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-brand-gold/10 rounded-2xl text-brand-gold shadow-sm"><Smartphone className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {monitoringSelectedDay ? `${monitoringSelectedDay} Kunlik Sotuvlar` : "Operatorlar bo'yicha hisobot"}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                  const count = tableTotals.companyTotals[company] || 0;
                  const styles: any = {
                    'Ucell': 'bg-[#9b51e0]/10 text-[#9b51e0] border-[#9b51e0]/20',
                    'Uztelecom': 'bg-[#009ee0]/10 text-[#009ee0] border-[#009ee0]/20',
                    'Mobiuz': 'bg-[#eb1c24]/10 text-[#eb1c24] border-[#eb1c24]/20',
                    'Beeline': 'bg-[#fdb913]/10 text-[#fdb913] border-[#fdb913]/20'
                  }[company];
                  return (
                    <div key={company} className={`px-4 py-2 rounded-xl border ${styles} text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                      {company}: <span className="ml-1">{count}</span>
                    </div>
                  );
                })}

                {monitoringSelectedDay && (
                  <button
                    onClick={() => setMonitoringSelectedDay(null)}
                    className="ml-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    Filtrni tozalash
                  </button>
                )}
              </div>
            </div>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-brand-black text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 sm:px-8 py-3 sm:py-4">Xodim</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">Ucell</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">Uztelecom</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">Mobiuz</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center">Beeline</th>
                    <th className="px-4 sm:px-8 py-3 sm:py-4 text-center text-brand-gold">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedOperators
                    .slice((monitoringOperatorsPage - 1) * monitoringOperatorsPerPage, monitoringOperatorsPage * monitoringOperatorsPerPage)
                    .map(u => {
                    // Calculate sales for this user in the selected timeframe or day
                    const getUserSales = () => {
                      const userSales = tableSales.filter(s => s.userId === u.id);

                      const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
                      userSales.forEach(s => {
                        if (totals[s.company] !== undefined) {
                          totals[s.company] += s.count + s.bonus;
                        }
                      });
                      return totals;
                    };

                    const sales = getUserSales();
                    const total = Object.values(sales).reduce((a, b) => a + b, 0);

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-white/5 transition group cursor-pointer"
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <td className="px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-black border border-white/10 flex items-center justify-center font-black text-white/20 overflow-hidden shrink-0">
                            {u.photo ? (
                              <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs sm:text-sm truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest truncate">{u.phone?.startsWith('+') ? u.phone : '+' + u.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-bold text-[#9b51e0] text-sm sm:text-base">{sales['Ucell'].toLocaleString()}</td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-bold text-[#009ee0] text-sm sm:text-base">{sales['Uztelecom'].toLocaleString()}</td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-bold text-[#eb1c24] text-sm sm:text-base">{sales['Mobiuz'].toLocaleString()}</td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-bold text-[#fdb913] text-sm sm:text-base">{sales['Beeline'].toLocaleString()}</td>
                        <td className="px-4 sm:px-8 py-4 sm:py-5 text-center font-black text-base sm:text-lg text-brand-gold">{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden p-4 space-y-4">
              {sortedOperators
                .slice((monitoringOperatorsPage - 1) * monitoringOperatorsPerPage, monitoringOperatorsPage * monitoringOperatorsPerPage)
                .map(u => {
                const getUserSales = () => {
                  const userSales = tableSales.filter(s => s.userId === u.id);
                  const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
                  userSales.forEach(s => {
                    if (totals[s.company] !== undefined) {
                      totals[s.company] += s.count + s.bonus;
                    }
                  });
                  return totals;
                };

                const sales = getUserSales();
                const total = Object.values(sales).reduce((a, b) => a + b, 0);

                return (
                  <div
                    key={u.id}
                    className="bg-brand-black p-5 rounded-2xl border border-white/5 hover:border-brand-gold/30 transition-all cursor-pointer group shadow-sm"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-white/30 group-hover:bg-brand-gold group-hover:text-brand-black transition-colors shrink-0 overflow-hidden">
                          {u.photo ? (
                            <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{u.phone?.startsWith('+') ? u.phone : '+' + u.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-brand-gold">{total}</p>
                        <p className="text-[8px] font-black text-brand-gold/50 uppercase tracking-widest">Jami</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Ucell', color: 'text-[#9b51e0]', bg: 'bg-[#9b51e0]/10', val: sales['Ucell'] },
                        { name: 'Uztelecom', color: 'text-[#009ee0]', bg: 'bg-[#009ee0]/10', val: sales['Uztelecom'] },
                        { name: 'Mobiuz', color: 'text-[#eb1c24]', bg: 'bg-[#eb1c24]/10', val: sales['Mobiuz'] },
                        { name: 'Beeline', color: 'text-[#fdb913]', bg: 'bg-[#fdb913]/10', val: sales['Beeline'] }
                      ].map(c => (
                        <div key={c.name} className={`p-2 rounded-xl ${c.bg} flex items-center justify-between`}>
                          <span className={`text-[9px] font-black uppercase tracking-widest opacity-70 ${c.color}`}>{c.name}</span>
                          <span className={`text-xs font-black ${c.color}`}>{c.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination for Monitoring Operators */}
          {state.users.filter(u => u.role !== 'manager').length > monitoringOperatorsPerPage && (
            <div className="flex items-center justify-center gap-3 p-6 border-t border-white/5 bg-brand-black/20 rounded-[2.5rem] mt-8">
              <button
                onClick={() => setMonitoringOperatorsPage(p => Math.max(1, p - 1))}
                disabled={monitoringOperatorsPage === 1}
                className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(state.users.filter(u => u.role !== 'manager').length / monitoringOperatorsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMonitoringOperatorsPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border ${
                      monitoringOperatorsPage === i + 1 
                        ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' 
                        : 'bg-brand-black text-white/30 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMonitoringOperatorsPage(p => Math.min(Math.ceil(state.users.filter(u => u.role !== 'manager').length / monitoringOperatorsPerPage), p + 1))}
                disabled={monitoringOperatorsPage === Math.ceil(state.users.filter(u => u.role !== 'manager').length / monitoringOperatorsPerPage)}
                className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-white">{t(language, 'staff_team')}</h2>
            <div className="flex items-center gap-4 w-full md:w-96">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" placeholder="Xodimni qidirish..." className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-2xl bg-brand-black focus:border-brand-gold transition outline-none text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredUsers.slice((staffPage - 1) * staffPerPage, staffPage * staffPerPage).map(u => {
              const todayCheckIn = state.checkIns.find(ci => ci.userId === u.id && isDateMatch(ci.timestamp, today));
              const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, u.workingHours) : null;

              return (
                <div key={u.id} onClick={() => { setSelectedUserId(u.id); setChartTimeframe('week'); setSelectedDay(null); }} className={`p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group text-center relative overflow-hidden ${lateness?.isLate ? 'bg-red-500/10 border-red-500/20' : (lateness?.isEarly ? 'bg-brand-gold/10 border-brand-gold/20' : 'bg-brand-dark border-white/10')}`}>
                  {lateness?.isLate && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">LATE</div>
                  )}
                  {lateness?.isEarly && (
                    <div className="absolute top-4 right-4 bg-brand-gold text-brand-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">EARLY</div>
                  )}
                  <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 font-black text-2xl group-hover:scale-110 transition-transform ${lateness?.isLate ? 'bg-red-600 text-white shadow-lg shadow-red-200' : (lateness?.isEarly ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' : 'bg-brand-black text-brand-gold border border-white/10')} overflow-hidden`}>
                    {u.photo ? (
                      <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white truncate px-2">{u.firstName} {u.lastName}</h3>
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-1 truncate px-2">{u.role.replace('_', ' ')}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-around">
                    <div className="text-center"><p className="text-[10px] font-black text-white/30 uppercase">{t(language, 'today')}</p><p className={`font-black ${lateness?.isLate ? 'text-red-600' : 'text-brand-gold'}`}>{getUserSalesCount(u.id, 'today')}</p></div>
                    <div className="text-center"><p className="text-[10px] font-black text-white/30 uppercase">{t(language, 'month')}</p><p className="font-black text-white">{getUserSalesCount(u.id, 'month')}</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Staff Team */}
          {filteredUsers.length > staffPerPage && (
            <div className="flex items-center justify-center gap-3 p-6 border-t border-white/5 bg-brand-black/20 rounded-[2.5rem] mt-8">
              <button
                onClick={() => setStaffPage(p => Math.max(1, p - 1))}
                disabled={staffPage === 1}
                className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(filteredUsers.length / staffPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStaffPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border ${
                      staffPage === i + 1 
                        ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' 
                        : 'bg-brand-black text-white/30 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStaffPage(p => Math.min(Math.ceil(filteredUsers.length / staffPerPage), p + 1))}
                disabled={staffPage === Math.ceil(filteredUsers.length / staffPerPage)}
                className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => { setSelectedUserId(null); setSelectedDay(null); }}></div>
          <div className="bg-brand-black w-full h-full md:h-[92vh] md:w-[92vw] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 border border-white/10">
            <div className="p-4 sm:p-6 md:p-8 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between bg-brand-dark sticky top-0 z-50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-2.5 sm:p-3 bg-brand-black rounded-xl sm:rounded-2xl text-white/40 hover:text-white transition shadow-sm border border-white/10"><ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-gold text-brand-black rounded-xl sm:rounded-[1.5rem] flex items-center justify-center font-black text-xl sm:text-2xl uppercase shadow-xl ring-4 ring-brand-gold/10 overflow-hidden shrink-0">
                    {selectedUser.photo ? (
                      <img src={getMediaUrl(selectedUser.photo)} alt={selectedUser.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <>{selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}</>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">{selectedUser.firstName} {selectedUser.lastName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-brand-gold text-brand-black text-[7px] sm:text-[8px] font-black px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-sm shrink-0">{selectedUser.role.replace('_', ' ')}</span>
                      <span className="text-white/40 text-[9px] sm:text-[10px] font-bold truncate">● {selectedUser.phone?.startsWith('+') ? selectedUser.phone : '+' + selectedUser.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <button
                    onClick={() => {
                      setIsTimeDropdownOpen(!isTimeDropdownOpen);
                      if (!isTimeDropdownOpen && typeof selectedUser.workingHours === 'string') {
                        const [start, end] = selectedUser.workingHours.split('-');
                        setTempStartTime((start || '').replace(/\s*(AM|PM)/gi, '').trim());
                        setTempEndTime((end || '').replace(/\s*(AM|PM)/gi, '').trim());
                      } else if (!isTimeDropdownOpen) {
                        setTempStartTime('');
                        setTempEndTime('');
                      }
                    }}
                    className="w-full sm:w-auto appearance-none bg-brand-gold/10 text-brand-gold pl-10 pr-10 py-3 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest outline-none focus:border-brand-gold cursor-pointer hover:bg-brand-gold/20 active:scale-[0.98] transition-all border border-white/10 flex items-center gap-2 min-w-[160px] sm:min-w-[180px]"
                  >
                    <span>{(typeof selectedUser.workingHours === 'string' ? selectedUser.workingHours : "Vaqtni tanlang").replace(/\s*(AM|PM)/gi, '')}</span>
                  </button>
                  <Clock className="w-4 h-4 text-brand-gold absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200" style={{ transform: isTimeDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                    <ChevronRight className="w-3 h-3 text-brand-gold rotate-90" />
                  </div>

                  {isTimeDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-full sm:w-72 bg-brand-dark rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-4">
                      <style>{`
                            .time-picker-input::-webkit-calendar-picker-indicator {
                              cursor: pointer;
                              filter: invert(1);
                              opacity: 0.6;
                            }
                          `}</style>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Ish boshlash</label>
                          <input
                            type="time"
                            value={tempStartTime}
                            lang="en-GB"
                            step="60"
                            onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                            onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                            onChange={(e) => setTempStartTime(e.target.value)}
                            className="time-picker-input w-full p-3 bg-brand-black rounded-xl text-sm font-bold text-white border border-white/10 focus:border-brand-gold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Ish tugatish</label>
                          <input
                            type="time"
                            value={tempEndTime}
                            lang="en-GB"
                            step="60"
                            onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                            onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) { } }}
                            onChange={(e) => setTempEndTime(e.target.value)}
                            className="time-picker-input w-full p-3 bg-brand-black rounded-xl text-sm font-bold text-white border border-white/10 focus:border-brand-gold outline-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (tempStartTime && tempEndTime) {
                              handleUpdateUser(selectedUser.id, { workingHours: `${tempStartTime}-${tempEndTime}` });
                              setIsTimeDropdownOpen(false);
                            } else {
                              console.warn('Iltimos, vaqtlarni to\'liq kiriting');
                            }
                          }}
                          className="w-full py-3 gold-gradient text-brand-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition shadow-md shadow-brand-gold/20"
                        >
                          Saqlash
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsSendMessageModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none p-3 bg-brand-gold/10 text-brand-gold rounded-2xl hover:bg-brand-gold hover:text-brand-black transition-all shadow-sm flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-brand-gold/20"
                >
                  <Phone className="w-4 h-4" />
                  Xabar yuborish
                </button>
                <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="hidden sm:block p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"><X className="w-6 h-6" /></button>
              </div>
            </div>

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
                  value={selectedUser.phone?.startsWith('+') ? selectedUser.phone : '+' + selectedUser.phone}
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
                          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
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
                          {activeReferencePoint && (
                            <ReferenceLine x={activeReferencePoint.name} stroke="var(--theme-gold)" strokeWidth={2} strokeDasharray="3 3" />
                          )}
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
                    <div className="p-6 border-b border-white/5 relative flex flex-col md:flex-row items-center justify-between bg-brand-dark gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><Smartphone className="w-5 h-5" /></div>
                        <h3 className="text-lg font-black text-white tracking-tight">
                          {selectedDay ? (chartTimeframe === 'year' ? `${(() => {
                            const d = new Date(selectedDay);
                            const monthName = translations[language].month_names[d.getMonth()];
                            return `${monthName} ${d.getFullYear()}`;
                          })()} ${t(language, 'monthly_sales_title')}` : `${selectedDay} ${t(language, 'daily_sales_title')}`) : (chartTimeframe === 'year' ? `${selectedYear} ${t(language, 'yearly')} sotuvlar ro'yxati` : chartTimeframe === 'month' ? `${chartTitleLabel} ${t(language, 'monthly_sales_title')}` : `${today} ${t(language, 'daily_sales_title')}`)}
                        </h3>
                      </div>

                      <div className="flex flex-wrap justify-center items-center gap-2 w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2">
                        {(() => {
                          const companies = [
                            { name: 'Ucell', color: 'border-[#9b51e0]/20 text-[#9b51e0] bg-[#9b51e0]/10' },
                            { name: 'Uztelecom', color: 'border-[#009ee0]/20 text-[#009ee0] bg-[#009ee0]/10' },
                            { name: 'Mobiuz', color: 'border-[#eb1c24]/20 text-[#eb1c24] bg-[#eb1c24]/10' },
                            { name: 'Beeline', color: 'border-[#fdb913]/20 text-[#fdb913] bg-[#fdb913]/10' }
                          ];

                          return companies.map(c => {
                            const count = userFilteredSales.filter(s => s.company === c.name).reduce((acc, s) => acc + s.count + s.bonus, 0);
                            return (
                              <div key={c.name} className={`px-3 py-1.5 rounded-lg border ${c.color} font-bold text-xs flex items-center gap-2`}>
                                <span className="uppercase text-[10px] opacity-70">{c.name}:</span>
                                <span className="text-sm">{count}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="w-full md:w-auto flex justify-end">
                        {selectedDay && (
                          <div className="flex items-center gap-2 text-[9px] font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-brand-gold/20">
                            <Calendar className="w-3 h-3" /> Tanlangan kun
                          </div>
                        )}
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
                            if (userFilteredSales.length === 0) {
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
                            return paginatedUserSales.map(sale => (
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
                      {userFilteredSales.length > userSalesPerPage && (
                        <div className="flex items-center justify-center gap-3 p-4 border-t border-white/5">
                          <button
                            onClick={() => setUserSalesPage(p => Math.max(1, p - 1))}
                            disabled={userSalesPage === 1}
                            className="p-2 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-[10px] font-black text-white/50">
                            {userSalesPage} / {Math.ceil(userFilteredSales.length / userSalesPerPage)}
                          </span>
                          <button
                            onClick={() => setUserSalesPage(p => Math.min(Math.ceil(userFilteredSales.length / userSalesPerPage), p + 1))}
                            disabled={userSalesPage === Math.ceil(userFilteredSales.length / userSalesPerPage)}
                            className="p-2 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden p-4 space-y-4">
                      {(() => {
                        if (userFilteredSales.length === 0) {
                          return (
                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                <PackageSearch className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-black text-white/20 italic">Bu davrda hech nima sotilmagan</p>
                            </div>
                          );
                        }

                        return (
                          <>
                            {paginatedUserSales.map(sale => (
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
                                    <p className="text-sm font-black text-brand-gold">{sale.count}</p>
                                  </div>
                                  <div className="text-center border-l border-white/5">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Bonus</p>
                                    <p className="text-sm font-black text-white/70">{sale.bonus}</p>
                                  </div>
                                  <div className="text-center border-l border-white/5">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Jami</p>
                                    <p className="text-sm font-black text-brand-gold">{sale.count + sale.bonus}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {userFilteredSales.length > userSalesPerPage && (
                              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/5">
                                <button
                                  onClick={() => setUserSalesPage(p => Math.max(1, p - 1))}
                                  disabled={userSalesPage === 1}
                                  className="p-2 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-[10px] font-black text-white/50">
                                  {userSalesPage} / {Math.ceil(userFilteredSales.length / userSalesPerPage)}
                                </span>
                                <button
                                  onClick={() => setUserSalesPage(p => Math.min(Math.ceil(userFilteredSales.length / userSalesPerPage), p + 1))}
                                  disabled={userSalesPage === Math.ceil(userFilteredSales.length / userSalesPerPage)}
                                  className="p-2 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </>
                        );
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
                        if (userFilteredReports.length === 0) {
                          return (
                            <div className="flex flex-col items-center py-10 text-center gap-4">
                              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                <AlertTriangle className="w-8 h-8" />
                              </div>
                              <p className="text-sm font-black text-white/20 italic">Bu davr uchun hisobotlar yuborilmagan</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-10">
                            {paginatedUserReports.map(dailyReport => (
                              <div key={dailyReport.id} className="space-y-10 border-b border-white/10 pb-10 last:border-0 last:pb-0">
                                <h4 className="text-xl font-black text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-xl inline-block">{dailyReport.date}</h4>
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
                                  <p className="text-white font-bold text-2xl leading-relaxed tracking-tight">
                                    {dailyReport.summary}
                                  </p>
                                </div>
                              </div>
                            ))}
                            
                            {userFilteredReports.length > userReportsPerPage && (
                              <div className="flex items-center justify-center gap-3 pt-4">
                                <button
                                  onClick={() => setUserReportsPage(p => Math.max(1, p - 1))}
                                  disabled={userReportsPage === 1}
                                  className="p-2 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-[10px] font-black text-white/50">
                                  {userReportsPage} / {Math.ceil(userFilteredReports.length / userReportsPerPage)}
                                </span>
                                <button
                                  onClick={() => setUserReportsPage(p => Math.min(Math.ceil(userFilteredReports.length / userReportsPerPage), p + 1))}
                                  disabled={userReportsPage === Math.ceil(userFilteredReports.length / userReportsPerPage)}
                                  className="p-2 border border-white/10 rounded-lg text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            )}
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

                      const startLoc = (dayCi?.location_lat && dayCi?.location_lng)
                        ? { lat: dayCi.location_lat, lng: dayCi.location_lng }
                        : null;

                      const endLoc = (dayReport?.locationLat && dayReport?.locationLng)
                        ? { lat: dayReport.locationLat, lng: dayReport.locationLng }
                        : null;

                      const initials = `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase();
                      return <SingleLocationMap location={startLoc} endLocation={endLoc} initials={initials} isDarkMode={isDarkMode} language={language} />;
                    })()}
                  </div>

                  {/* OPERATOR RATING SECTION - shows after report is submitted */}
                  {(() => {
                    const targetDate = selectedDay || today;
                    const dailyReport = state.reports.find(r => r.userId === selectedUser.id && r.date === targetDate);
                    if (!dailyReport) return null;

                    const existingRating = state.operatorRatings.find(
                      r => r.operatorId === selectedUser.id && r.date === targetDate && r.ratedById === state.currentUser?.id
                    );

                    const displayStars = ratingSelectedStars || existingRating?.stars || 0;

                    return (
                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-white/5 bg-brand-dark">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold">
                              <Star className="w-5 h-5" stroke="currentColor" strokeWidth={1.5} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-white tracking-tight">{t(language, 'rate_operator')}</h3>
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">
                                {targetDate} {t(language, 'rating_for')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Stars */}
                          <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => {
                              const isActive = star <= (ratingStars || displayStars);
                              return (
                                <button
                                  key={star}
                                  onMouseEnter={() => setRatingStars(star)}
                                  onMouseLeave={() => setRatingStars(0)}
                                  onClick={() => {
                                    setRatingSelectedStars(star);
                                    if (!ratingComment && existingRating) {
                                      setRatingComment(existingRating.comment);
                                    }
                                  }}
                                  className={`p-2 rounded-xl transition-all duration-200 transform hover:scale-125 active:scale-95 ${
                                    isActive
                                      ? 'text-brand-gold drop-shadow-[0_0_8px_rgba(218,165,32,0.5)]'
                                      : 'text-white/15 hover:text-white/30'
                                  }`}
                                >
                                  <Star
                                    className="w-10 h-10 transition-all duration-200"
                                    fill={isActive ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                  />
                                </button>
                              );
                            })}
                          </div>

                          {/* Star label */}
                          <div className="text-center">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                              {(ratingStars || displayStars) === 0 && t(language, 'select_star_to_rate')}
                              {(ratingStars || displayStars) === 1 && t(language, 'bad')}
                              {(ratingStars || displayStars) === 2 && t(language, 'unsatisfactory')}
                              {(ratingStars || displayStars) === 3 && t(language, 'average')}
                              {(ratingStars || displayStars) === 4 && t(language, 'good')}
                              {(ratingStars || displayStars) === 5 && t(language, 'excellent')}
                            </span>
                          </div>

                          {/* Comment */}
                          <div>
                            <textarea
                              value={ratingSelectedStars > 0 ? ratingComment : (existingRating?.comment || '')}
                              onChange={e => setRatingComment(e.target.value)}
                              placeholder={t(language, 'rating_comment_placeholder')}
                              rows={3}
                              className="w-full bg-brand-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder:text-white/20 outline-none focus:border-brand-gold/50 transition-all resize-none"
                            />
                          </div>

                          {/* Submit button */}
                          <button
                            onClick={async () => {
                              if ((ratingSelectedStars || displayStars) === 0) return;
                              setIsSubmittingRating(true);
                              try {
                                await operatorRatingService.submitRating({
                                  operator_id: selectedUser.id,
                                  date: targetDate,
                                  stars: ratingSelectedStars || displayStars,
                                  comment: ratingComment || existingRating?.comment || ''
                                });
                                await refreshData();
                                setRatingSelectedStars(0);
                                setRatingComment('');
                                setRatingStars(0);
                              } catch (err) {
                                console.error('Failed to submit rating', err);
                              } finally {
                                setIsSubmittingRating(false);
                              }
                            }}
                            disabled={isSubmittingRating || (ratingSelectedStars === 0 && !existingRating)}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                              (ratingSelectedStars || displayStars) > 0
                                ? 'bg-brand-gold text-brand-black hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/20 active:scale-[0.98]'
                                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                          >
                            {isSubmittingRating ? (
                              <div className="w-5 h-5 border-2 border-brand-black/20 border-t-brand-black rounded-full animate-spin" />
                            ) : (
                              <>
                                <Star className="w-4 h-4" fill={existingRating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} />
                                {existingRating ? t(language, 'update_rating') : t(language, 'submit_rating')}
                              </>
                            )}
                          </button>

                          {/* Existing rating info */}
                          {existingRating && ratingSelectedStars === 0 && (
                            <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-2xl p-4 flex items-center gap-3">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${s <= existingRating.stars ? 'text-brand-gold' : 'text-white/10'}`}
                                    fill={s <= existingRating.stars ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                {t(language, 'previous_rating')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
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
      )}

      {activeTab === 'simcards' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-brand-dark p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 sm:mb-10 gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3"><Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-brand-gold" /> {t(language, 'monthly_plan_sales')}</h2>
                {!showTargetForm && !showOfficeForm && !showTariffForm && (
                  <div className="relative">
                    <div
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="flex items-center gap-3 bg-brand-black pl-3 pr-6 py-2 rounded-2xl border border-white/10 shadow-sm hover:border-brand-gold/30 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-white capitalize leading-none">
                        {(() => {
                          if (!targetMonth) return t(language, 'select_month');
                          const [y, m] = targetMonth.split('-');
                          const monthNames = translations[language].month_names;
                          return `${monthNames[parseInt(m) - 1]} ${y}`;
                        })()}
                      </span>
                    </div>

                    {showMonthPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)}></div>
                        <div className="absolute top-full left-0 mt-4 bg-brand-dark rounded-3xl shadow-2xl border border-white/10 p-6 z-50 w-full sm:w-80 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center justify-between mb-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const [y, m] = (targetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                setTargetMonth(`${parseInt(y) - 1}-${m}`);
                              }}
                              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-lg font-black text-white">
                              {targetMonth.split('-')[0]}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const [y, m] = (targetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                setTargetMonth(`${parseInt(y) + 1}-${m}`);
                              }}
                              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {translations[language].month_names_short.map((mName, i) => {
                              const monthNum = String(i + 1).padStart(2, '0');
                              const currentYear = (targetMonth || new Date().toISOString().slice(0, 7)).split('-')[0];
                              const isSelected = targetMonth === `${currentYear}-${monthNum}`;

                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setTargetMonth(`${currentYear}-${monthNum}`);
                                    setShowMonthPicker(false);
                                  }}
                                  className={`py-3 rounded-xl text-sm font-bold transition-all ${isSelected
                                    ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20 scale-105'
                                    : 'bg-brand-black text-white/30 hover:bg-brand-gold/10 hover:text-brand-gold'
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
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {!showTargetForm && !showOfficeForm && !showTariffForm && (
                  <>
                    <button
                      onClick={() => {
                        const currentTargets = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets || {
                          'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                        };
                        setTargetForm({
                          'Ucell': String(currentTargets['Ucell'] || 0),
                          'Mobiuz': String(currentTargets['Mobiuz'] || 0),
                          'Beeline': String(currentTargets['Beeline'] || 0),
                          'Uztelecom': String(currentTargets['Uztelecom'] || 0)
                        });
                        setShowTargetForm(true);
                      }}
                      className="bg-brand-gold text-brand-black px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold/90 active:scale-95 transition-all shadow-lg shadow-brand-gold/20"
                    >
                      <Plus className="w-4 h-4" /> {t(language, 'enter_plan')}
                    </button>
                    <button
                      onClick={() => {
                        const currentMonthData = state.monthlyTargets?.find(t => t.month === targetMonth);
                        const currentOfficeCounts = currentMonthData?.officeCounts || {
                          'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                        };
                        const currentMobileOfficeCounts = currentMonthData?.mobileOfficeCounts || {
                          'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                        };

                        setOfficeForm({
                          'Ucell': String(currentOfficeCounts['Ucell'] || 0),
                          'Mobiuz': String(currentOfficeCounts['Mobiuz'] || 0),
                          'Beeline': String(currentOfficeCounts['Beeline'] || 0),
                          'Uztelecom': String(currentOfficeCounts['Uztelecom'] || 0)
                        });

                        setMobileOfficeForm({
                          'Ucell': String(currentMobileOfficeCounts['Ucell'] || 0),
                          'Mobiuz': String(currentMobileOfficeCounts['Mobiuz'] || 0),
                          'Beeline': String(currentMobileOfficeCounts['Beeline'] || 0),
                          'Uztelecom': String(currentMobileOfficeCounts['Uztelecom'] || 0)
                        });

                        setShowOfficeForm(true);
                      }}
                      className="bg-brand-black text-brand-gold border border-brand-gold/20 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold/10 active:scale-95 transition-all shadow-sm"
                    >
                      <LayoutGrid className="w-4 h-4" /> {t(language, 'enter_office')}
                    </button>
                    <button
                      onClick={() => setShowTariffForm(true)}
                      className="bg-brand-black text-white border border-white/10 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> {t(language, 'enter_tariff')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {showOfficeForm && (
              <div className="mb-10 p-6 sm:p-8 bg-brand-black rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base sm:text-lg font-black text-white">{targetMonth} uchun ofis va mobil ofis sotuvlarini kiritish</h3>
                  <button onClick={() => setShowOfficeForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                    <div key={company} className="space-y-4 bg-brand-dark p-4 rounded-2xl border border-white/5 shadow-sm">
                      <h4 className="font-black text-white text-center border-b border-white/10 pb-2 mb-2">{company}</h4>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-2">{t(language, 'office')} ({t(language, 'pcs')})</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3 border border-white/10 rounded-xl bg-brand-black text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                          value={officeForm[company as keyof typeof officeForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                              setOfficeForm({ ...officeForm, [company]: val });
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-2">{t(language, 'mobile_office')} ({t(language, 'pcs')})</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3 border border-white/10 rounded-xl bg-brand-black text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                          value={mobileOfficeForm[company as keyof typeof mobileOfficeForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                              setMobileOfficeForm({ ...mobileOfficeForm, [company]: val });
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      const currentTargets = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets || {
                        'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                      };

                      const parsedOfficeForm: Record<string, number> = {};
                      Object.keys(officeForm).forEach(key => {
                        parsedOfficeForm[key] = parseInt(officeForm[key]) || 0;
                      });

                      const parsedMobileOfficeForm: Record<string, number> = {};
                      Object.keys(mobileOfficeForm).forEach(key => {
                        parsedMobileOfficeForm[key] = parseInt(mobileOfficeForm[key]) || 0;
                      });

                      handleSetTarget(targetMonth, currentTargets, parsedOfficeForm, parsedMobileOfficeForm);
                      setShowOfficeForm(false);
                    }}
                    className="w-full sm:flex-1 bg-brand-gold text-brand-black py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={() => setShowOfficeForm(false)}
                    className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {showTargetForm && (
              <div className="mb-10 p-6 sm:p-8 bg-brand-black rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base sm:text-lg font-black text-white">{targetMonth} uchun {t(language, 'enter_plan').toLowerCase()}</h3>
                  <button onClick={() => setShowTargetForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                    <div key={company} className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">{company} (dona)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-dark text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                        value={targetForm[company as keyof typeof targetForm]}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                            setTargetForm({ ...targetForm, [company]: val });
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      const currentMonthData = state.monthlyTargets?.find(t => t.month === targetMonth);
                      const currentOfficeCounts = currentMonthData?.officeCounts || {};
                      const currentMobileOfficeCounts = currentMonthData?.mobileOfficeCounts || {};

                      const parsedTargetForm: Record<string, number> = {};
                      Object.keys(targetForm).forEach(key => {
                        parsedTargetForm[key] = parseInt(targetForm[key]) || 0;
                      });
                      handleSetTarget(targetMonth, parsedTargetForm, currentOfficeCounts, currentMobileOfficeCounts);
                      setShowTargetForm(false);
                    }}
                    className="w-full sm:flex-1 bg-brand-gold text-brand-black py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={() => setShowTargetForm(false)}
                    className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {showTariffForm && (
              <div className="mb-10 p-6 sm:p-8 bg-brand-black rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base sm:text-lg font-black text-white">Tariflar Kiritish</h3>
                  <button onClick={() => setShowTariffForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1 block">Kompaniya</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'tariffCompany' ? null : 'tariffCompany')}
                        className="w-full p-3.5 sm:p-4 pr-10 border border-white/10 rounded-xl sm:rounded-2xl bg-brand-dark text-sm font-bold outline-none focus:border-brand-gold transition text-white text-left flex items-center justify-between"
                      >
                        <span>{newTariff.company}</span>
                        <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'tariffCompany' ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdown === 'tariffCompany' && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                          <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map((c) => (
                              <button
                                type="button"
                                key={c}
                                onClick={() => {
                                  setNewTariff({ ...newTariff, company: c });
                                  setOpenDropdown(null);
                                }}
                                className={`w-full text-left p-3.5 sm:p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newTariff.company === c ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1 block">Tarif Nomi</label>
                    <input
                      type="text"
                      className="w-full p-3.5 sm:p-4 border border-white/10 rounded-xl sm:rounded-2xl bg-brand-dark text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                      placeholder="Masalan: 20GB"
                      value={newTariff.name}
                      onChange={e => setNewTariff({ ...newTariff, name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        if (newTariff.name.trim()) {
                          handleAddTariff(newTariff.company, newTariff.name.trim());
                          setNewTariff({ ...newTariff, name: '' });
                        }
                      }}
                      className="w-full bg-brand-gold text-brand-black p-3.5 sm:p-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Qo'shish
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                    <div key={company} className="bg-brand-dark p-4 rounded-2xl border border-white/5 shadow-sm">
                      <h4 className="font-black text-white text-center border-b border-white/10 pb-2 mb-4">{company}</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {state.tariffs?.[company]?.map((tariff, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-brand-black p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                            <span className="text-xs font-bold text-white/80">{tariff}</span>
                            <button
                              onClick={() => setDeletingTariff({ company, tariff })}
                              className="text-white/20 hover:text-red-500 transition-colors p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(!state.tariffs?.[company] || state.tariffs[company].length === 0) && (
                          <p className="text-[10px] text-white/20 text-center italic py-4">Tariflar yo'q</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deletingTariff && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeletingTariff(null)}></div>
                <div className="bg-brand-dark w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-in zoom-in-95 duration-300 text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                    Tarifni o'chirish
                  </h3>
                  <p className="text-white/60 text-sm mb-8">
                    Haqiqatan ham <strong>{deletingTariff.tariff}</strong> tarifini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setDeletingTariff(null)}
                      className="flex-1 py-4 rounded-2xl font-black text-white/60 uppercase tracking-widest hover:bg-white/5 transition border border-white/10"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={() => {
                        handleRemoveTariff(deletingTariff.company, deletingTariff.tariff);
                        setDeletingTariff(null);
                      }}
                      className="flex-1 py-4 rounded-2xl font-black text-white uppercase tracking-widest bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              </div>
            )}

            {inventoryModalUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-brand-black rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-black text-white min-w-0 flex-1 truncate pr-4">
                      {inventoryModalUser.nickname || (inventoryModalUser.phone && (inventoryModalUser.phone.startsWith('+') ? inventoryModalUser.phone : `+${inventoryModalUser.phone}`))} - {t(language, 'sim_inventory')}
                    </h3>
                    <button onClick={() => setInventoryModalUser(null)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="w-5 h-5 text-white/30" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                    {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                      <div key={company} className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">{company} (mavjud)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3.5 sm:p-4 border border-white/10 rounded-xl sm:rounded-2xl bg-brand-dark text-white text-base sm:text-lg font-bold outline-none focus:border-brand-gold transition"
                          value={inventoryForm[company as keyof typeof inventoryForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                              setInventoryForm({ ...inventoryForm, [company]: val });
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        const parsedInventoryForm: Record<string, number> = {};
                        Object.keys(inventoryForm).forEach(key => {
                          parsedInventoryForm[key] = parseInt(inventoryForm[key]) || 0;
                        });
                        handleUpdateUser(inventoryModalUser.id, { inventory: parsedInventoryForm });
                        setInventoryModalUser(null);
                      }}
                      className="w-full sm:flex-1 bg-brand-gold text-brand-black py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all"
                    >
                      Saqlash
                    </button>
                    <button
                      onClick={() => setInventoryModalUser(null)}
                      className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white/50 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white/10 hover:text-white transition-all"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Ucell', color: 'bg-[#9b51e0]', textColor: 'text-[#9b51e0]' },
                { name: 'Uztelecom', color: 'bg-[#009ee0]', textColor: 'text-[#009ee0]' },
                { name: 'Mobiuz', color: 'bg-[#eb1c24]', textColor: 'text-[#eb1c24]' },
                { name: 'Beeline', color: 'bg-[#fdb913]', textColor: 'text-[#fdb913]' }
              ].map(company => {
                const target = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets?.[company.name] || 0;
                const officeCount = state.monthlyTargets?.find(t => t.month === targetMonth)?.officeCounts?.[company.name] || 0;
                const mobileOfficeCount = state.monthlyTargets?.find(t => t.month === targetMonth)?.mobileOfficeCounts?.[company.name] || 0;
                const sales = state.sales.filter(s => s.company === company.name && s.date.startsWith(targetMonth)).reduce((sum, s) => sum + s.count + s.bonus, 0);
                const rawPercentage = target > 0 ? (sales / target) * 100 : 0;
                const percentage = Math.min(100, rawPercentage);

                return (
                  <div key={company.name} className="p-6 sm:p-8 bg-brand-dark rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-sm hover:border-brand-gold/30 hover:-translate-y-1 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${company.color} rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center text-white keep-white group-hover:rotate-12 transition-transform`}>
                        <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl sm:text-3xl font-black ${company.textColor}`}>{formatLargeNumber(sales)}</p>
                        <p className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest">{t(language, 'sold')}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-white text-base sm:text-lg">{company.name}</h3>
                        <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-lg ${sales >= target && target > 0 ? 'text-green-400 bg-green-400/10' : 'text-brand-gold bg-brand-gold/10'}`}>
                          {sales >= target && target > 0 ? 'Bajarildi' : t(language, 'in_progress')}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest">
                        <span>{formatLargeNumber(sales)} / {formatLargeNumber(target)}</span>
                        <span>{Math.round(rawPercentage)}%</span>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                        <div className="bg-brand-black p-2 rounded-xl text-center border border-white/5">
                          <p className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">{t(language, 'office')}</p>
                          <p className="text-xs sm:text-sm font-black text-white">{formatLargeNumber(officeCount)}</p>
                        </div>
                        <div className="bg-brand-black p-2 rounded-xl text-center border border-white/5">
                          <p className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">{t(language, 'mobile_office')}</p>
                          <p className="text-xs sm:text-sm font-black text-white">{formatLargeNumber(mobileOfficeCount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-brand-dark p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg sm:text-xl font-black text-white">{t(language, 'available_simcards')}</h3>
              <div className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest border border-brand-gold/20 self-start sm:self-auto">
                {t(language, 'total')}: {formatLargeNumber(operators.reduce((acc: number, user: User) => acc + Object.values(user.inventory || {}).reduce((sum: number, count: any) => sum + Number(count), 0), 0))} {t(language, 'pcs')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {operators.slice((simPage - 1) * simPerPage, simPage * simPerPage).map(user => {
                const counts = user.inventory || {
                  'Ucell': 0,
                  'Mobiuz': 0,
                  'Beeline': 0,
                  'Uztelecom': 0
                };

                const totalSims = Object.values(counts).reduce((a: number, b: any) => a + Number(b), 0);

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setInventoryModalUser(user);
                      setInventoryForm({
                        'Ucell': counts['Ucell'] || 0,
                        'Mobiuz': counts['Mobiuz'] || 0,
                        'Beeline': counts['Beeline'] || 0,
                        'Uztelecom': counts['Uztelecom'] || 0
                      });
                    }}
                    className="bg-brand-black p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-sm hover:border-brand-gold/30 transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center font-black text-white overflow-hidden text-lg sm:text-xl shadow-inner shrink-0">
                          {user.photo ? (
                            <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <>{user.firstName?.[0]}{user.lastName?.[0]}</>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg sm:text-2xl font-black text-white leading-none mb-1 group-hover:text-brand-gold transition-colors truncate">{user.nickname || (user.phone && (user.phone.startsWith('+') ? user.phone : `+${user.phone}`))}</h4>
                          <p className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest">{t(language, 'operator')}</p>
                        </div>
                      </div>
                      <div className="text-right bg-brand-gold/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-brand-gold/20 group-hover:bg-brand-gold group-hover:text-brand-black transition-colors shrink-0">
                        <p className="text-xl sm:text-2xl font-black text-brand-gold group-hover:text-brand-black">{formatLargeNumber(totalSims)}</p>
                        <p className="text-[7px] sm:text-[8px] font-black text-brand-gold/70 uppercase tracking-widest group-hover:text-brand-black/70">{t(language, 'total')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {[
                        { name: 'Ucell', color: 'text-[#9b51e0]', bg: 'bg-[#9b51e0]/10', border: 'border-[#9b51e0]/20' },
                        { name: 'Uztelecom', color: 'text-[#009ee0]', bg: 'bg-[#009ee0]/10', border: 'border-[#009ee0]/20' },
                        { name: 'Mobiuz', color: 'text-[#eb1c24]', bg: 'bg-[#eb1c24]/10', border: 'border-[#eb1c24]/20' },
                        { name: 'Beeline', color: 'text-[#fdb913]', bg: 'bg-[#fdb913]/10', border: 'border-[#fdb913]/20' }
                      ].map(provider => (
                        <div key={provider.name} className={`p-4 rounded-2xl ${provider.bg} border ${provider.border}`}>
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-2">{provider.name}</p>
                          <p className={`text-2xl font-black ${provider.color}`}>{formatLargeNumber(counts[provider.name as keyof typeof counts])} <span className="text-[10px] text-white/30 font-bold">dona</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination UI */}
            {operators.length > simPerPage && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setSimPage(p => Math.max(1, p - 1))}
                  disabled={simPage === 1}
                  className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(operators.length / simPerPage) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSimPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border ${
                        simPage === i + 1 
                          ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' 
                          : 'bg-brand-black text-white/30 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSimPage(p => Math.min(Math.ceil(operators.length / simPerPage), p + 1))}
                  disabled={simPage === Math.ceil(operators.length / simPerPage)}
                  className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-in fade-in px-2 sm:px-0">
          {/* Tasdiqlanmaganlar */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-black text-white px-2">Tasdiqlanmaganlar</h3>
            {pendingUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-brand-dark p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 flex flex-col justify-between shadow-sm gap-4 overflow-hidden">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-gold/10 text-brand-gold rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 overflow-hidden border border-white/10">
                        {u.photo ? (
                          <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" />
                        ) : (
                          u.firstName?.[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-black text-white leading-none mb-1 truncate">{u.firstName} {u.lastName}</h4>
                        <p className="text-[10px] sm:text-xs text-white/50 font-mono mt-1 flex items-center gap-2">
                          Parol: {u.password || 'Kiritilmagan'}
                          <button
                            onClick={() => {
                              setPasswordFormUserId(u.id);
                              setNewPassword('');
                              setIsPasswordModalOpen(true);
                            }}
                            className="p-1 hover:bg-white/10 rounded transition"
                          >
                            <Edit className="w-3 h-3 text-brand-gold" />
                          </button>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: t(language, 'confirm_approve'),
                            message: `${u.firstName} ${u.lastName} operator sifatida tizimga kiritiladi. Tasdiqlaysizmi?`,
                            type: 'success',
                            onConfirm: () => handleApproveUser(u.id)
                          });
                        }} 
                        className="flex-1 p-3 sm:p-4 bg-brand-gold text-brand-black rounded-xl sm:rounded-2xl shadow-xl shadow-brand-gold/20 transition hover:bg-brand-gold/90 flex justify-center items-center"
                      >
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: t(language, 'confirm_delete'),
                            message: `${u.firstName} ${u.lastName} so'rovi tizimdan butunlay o'chiriladi. Rad etasizmi?`,
                            type: 'danger',
                            onConfirm: () => {
                              userService.deleteUser(u.id).then(() => refreshData());
                            }
                          });
                        }} 
                        className="p-3 sm:p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl sm:rounded-2xl shadow-xl transition hover:bg-red-500/20 flex justify-center items-center"
                        title={t(language, 'reject')}
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 bg-brand-dark rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 italic text-white/30 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mx-2 sm:mx-0">Yangi so'rovlar mavjud emas</div>
            )}
          </div>

          {/* Tasdiqlanganlar */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-black text-white px-2">Tasdiqlanganlar</h3>
            {approvedUsers.length > 0 ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {approvedUsers.slice((approvalsPage - 1) * approvalsPerPage, approvalsPage * approvalsPerPage).map(u => (
                  <div key={u.id} className="bg-brand-dark p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 flex flex-col shadow-sm gap-4 overflow-hidden">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/5 text-white/50 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 overflow-hidden border border-white/10">
                        {u.photo ? (
                          <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" />
                        ) : (
                          u.firstName?.[0]
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-black text-white leading-none mb-1 truncate">{u.firstName} {u.lastName}</h4>
                        <p className="text-[10px] sm:text-xs text-white/30 font-bold truncate">@{u.nickname || (u.phone && (u.phone.startsWith('+') ? u.phone : `+${u.phone}`))}</p>
                        <div className="text-[10px] sm:text-xs text-white/50 font-mono mt-1 flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg w-fit">
                          <span className="text-white/20 uppercase tracking-tighter mr-1 text-[9px]">Parol:</span> 
                          <span className="text-brand-gold font-bold">
                            {showPasswords[u.id] ? (u.password || '123456') : '••••••'}
                          </span>
                          <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
                            <button
                              onClick={() => setShowPasswords(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                              className="p-1 hover:text-white transition-colors"
                              title={showPasswords[u.id] ? "Yashirish" : "Ko'rsatish"}
                            >
                              {showPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                setPasswordFormUserId(u.id);
                                setNewPassword('');
                                setIsPasswordModalOpen(true);
                              }}
                              className="p-1 hover:text-brand-gold transition-colors"
                              title="Tahrirlash"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination UI for Approved Users */}
              {approvedUsers.length > approvalsPerPage && (
                <div className="mt-8 flex items-center justify-center gap-3 bg-brand-black/20 p-4 rounded-[2rem] border border-white/5">
                  <button
                    onClick={() => setApprovalsPage(p => Math.max(1, p - 1))}
                    disabled={approvalsPage === 1}
                    className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: Math.ceil(approvedUsers.length / approvalsPerPage) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setApprovalsPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border ${
                          approvalsPage === i + 1 
                            ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' 
                            : 'bg-brand-black text-white/30 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setApprovalsPage(p => Math.min(Math.ceil(approvedUsers.length / approvalsPerPage), p + 1))}
                    disabled={approvalsPage === Math.ceil(approvedUsers.length / approvalsPerPage)}
                    className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
            ) : (
              <div className="text-center py-16 sm:py-20 bg-brand-dark rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 italic text-white/30 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mx-2 sm:mx-0">Tasdiqlangan foydalanuvchilar mavjud emas</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-brand-gold/10 text-brand-gold rounded-[2rem] shadow-xl border border-brand-gold/20">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">{t(language, 'settings')}</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Tizimning umumiy sozlamalari</p>
            </div>
          </div>

          <div className="bg-brand-dark p-8 sm:p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-brand-gold/10 transition-all duration-700"></div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Reyting bo'limi ko'rinishi</h3>
                  <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
                    Operatorlar uchun reyting bo'limini yoqish yoki o'chirish. O'chirilganda operatorlarga "{t(language, 'rating_disabled_message')}" yozuvi ko'rinadi.
                  </p>
                </div>
                
                <button
                  onClick={async () => {
                    const newValue = !state.globalSettings?.rating_enabled;
                    await settingsService.updateSettings({ rating_enabled: newValue });
                    await refreshData();
                  }}
                  className={`relative w-24 h-12 rounded-full transition-all duration-500 p-1.5 ${state.globalSettings?.rating_enabled ? 'bg-brand-gold shadow-lg shadow-brand-gold/30' : 'bg-white/5 border border-white/10'}`}
                >
                  <div className={`w-9 h-9 rounded-full transition-all duration-500 flex items-center justify-center shadow-xl ${state.globalSettings?.rating_enabled ? 'translate-x-12 bg-white' : 'translate-x-0 bg-white/10'}`}>
                    {state.globalSettings?.rating_enabled ? (
                      <Check className="w-5 h-5 text-brand-black" />
                    ) : (
                      <X className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                </button>
              </div>

              <div className="pt-10 border-t border-white/5 flex items-center gap-4 text-white/20">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Sozlamalar o'zgartirilishi bilanoq barcha operatorlar uchun real vaqt rejimida amal qiladi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-brand-dark rounded-[2rem] border border-white/10 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-6 sm:p-8 border-b border-white/5"><h2 className="text-lg sm:text-xl font-black text-white">{t(language, 'all_daily_reports')}</h2></div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-brand-black text-white/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-4 sm:px-8 py-4">{t(language, 'employee')}</th>
                  <th className="px-4 sm:px-8 py-4">{t(language, 'date')}</th>
                  <th className="px-4 sm:px-8 py-4">{t(language, 'summary')}</th>
                  <th className="px-4 sm:px-8 py-4 text-center">{t(language, 'time')}</th>
                  <th className="px-4 sm:px-8 py-4 text-right">Baho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.reports
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice((reportsPage - 1) * reportsPerPage, reportsPage * reportsPerPage)
                  .map((rep, idx) => {
                  const u = state.users.find(user => user.id === rep.userId);
                  const rating = state.operatorRatings.find(r => r.operatorId === rep.userId && r.date === rep.date);
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-white/5 transition cursor-pointer group"
                      onClick={() => {
                        setSelectedUserId(rep.userId);
                        setSelectedDay(rep.date);
                        setChartTimeframe('week');
                      }}
                    >
                      <td className="px-4 sm:px-8 py-4 sm:py-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white/30 group-hover:bg-brand-gold group-hover:text-brand-black transition-colors shrink-0">
                            {u?.firstName?.[0]}{u?.lastName?.[0]}
                          </div>
                          <span className="font-bold text-white text-xs sm:text-sm truncate">{u?.firstName} {u?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm text-white/30 font-medium whitespace-nowrap">{rep.date}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm text-white/70 italic leading-relaxed truncate max-w-[150px] sm:max-w-xs">"{rep.summary}"</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                        <span className="text-[8px] sm:text-[10px] font-black text-brand-gold bg-brand-gold/10 px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap">
                          {formatUzTime(rep.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                          {rating ? (
                            <div className="flex gap-0.5" title={rating.comment}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star 
                                  key={s} 
                                  className={`w-3 h-3 ${s <= rating.stars ? 'text-brand-gold' : 'text-white/10'}`} 
                                  fill={s <= rating.stars ? 'currentColor' : 'none'}
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Baholanmagan</span>
                          )}
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/10 group-hover:text-brand-gold transition-colors shrink-0" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden p-4 space-y-4">
            {state.reports
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice((reportsPage - 1) * reportsPerPage, reportsPage * reportsPerPage)
              .map((rep, idx) => {
              const u = state.users.find(user => user.id === rep.userId);
              return (
                <div
                  key={idx}
                  className="bg-brand-black p-5 rounded-2xl border border-white/5 hover:border-brand-gold/30 transition-all cursor-pointer group shadow-sm"
                  onClick={() => {
                    setSelectedUserId(rep.userId);
                    setSelectedDay(rep.date);
                    setChartTimeframe('week');
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-white/30 group-hover:bg-brand-gold group-hover:text-brand-black transition-colors shrink-0">
                        {u?.firstName?.[0]}{u?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{u?.firstName} {u?.lastName}</p>
                        <p className="text-[10px] text-white/30 font-bold">{rep.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[9px] font-black text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-lg">
                        {formatUzTime(rep.timestamp)}
                      </span>
                      {(() => {
                        const rating = state.operatorRatings.find(r => r.operatorId === rep.userId && r.date === rep.date);
                        return rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star 
                                key={s} 
                                className={`w-2.5 h-2.5 ${s <= rating.stars ? 'text-brand-gold' : 'text-white/10'}`} 
                                fill={s <= rating.stars ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-white/70 italic leading-relaxed line-clamp-2">"{rep.summary}"</p>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-[9px] font-bold text-white/20 uppercase tracking-wider group-hover:text-brand-gold transition-colors gap-1">
                    Batafsil <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Reports */}
          {state.reports.length > reportsPerPage && (
            <div className="flex items-center justify-center gap-3 p-6 border-t border-white/5 bg-brand-black/20 rounded-[2.5rem] mt-8">
              <button
                onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                disabled={reportsPage === 1}
                className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(state.reports.length / reportsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReportsPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border ${
                      reportsPage === i + 1 
                        ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' 
                        : 'bg-brand-black text-white/30 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setReportsPage(p => Math.min(Math.ceil(state.reports.length / reportsPerPage), p + 1))}
                disabled={reportsPage === Math.ceil(state.reports.length / reportsPerPage)}
                className="p-3 bg-brand-black border border-white/10 rounded-xl text-white/40 hover:text-white disabled:opacity-30 disabled:hover:text-white/40 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sales_panel' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Savdo <span className="text-brand-gold">Paneli</span></h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Operatorlar uchun foydali havolalarni boshqarish</p>
            </div>
            <button
              onClick={() => {
                setEditingSalesLinkId(null);
                setSalesLinkForm({ name: '', url: '', mobileUrl: '', image: '' });
                setIsSalesLinkModalOpen(true);
              }}
              className="px-6 py-3 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yangi havola
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.salesLinks?.map((link) => (
              <div
                key={link.id}
                className="group relative bg-brand-dark p-8 rounded-[2.5rem] border border-white/10 hover:border-brand-gold/50 transition-all overflow-hidden shadow-xl"
              >
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-white/10">
                      {link.image ? (
                        <img src={link.image} alt={link.name} className="w-full h-full object-cover" />
                      ) : (
                        <Globe className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSalesLinkId(link.id);
                          setSalesLinkForm({ name: link.name, url: link.url, mobileUrl: link.mobileUrl || '', image: link.image || '' });
                          setIsSalesLinkModalOpen(true);
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-brand-gold rounded-xl transition-all border border-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingSalesLinkId(link.id)}
                        className="p-2 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 rounded-xl transition-all border border-white/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{link.name}</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1 truncate">{link.url.replace('https://', '')}</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      Desktop <ExternalLink className="w-3 h-3" />
                    </a>
                    {link.mobileUrl && (
                      <a
                        href={link.mobileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        Mobile <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(!state.salesLinks || state.salesLinks.length === 0) && (
              <div className="col-span-full py-20 text-center bg-brand-black/50 rounded-[3rem] border-2 border-dashed border-white/5">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20">
                  <LayoutGrid className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-white/40 uppercase tracking-tight">Havolalar mavjud emas</h3>
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest mt-2">Yangi havola qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            )}
          </div>

          {deletingSalesLinkId && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setDeletingSalesLinkId(null)}></div>
              <div className="bg-brand-dark w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-in zoom-in-95 duration-300 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                  Havolani o'chirish
                </h3>
                <p className="text-white/60 text-sm mb-8">
                  Haqiqatan ham ushbu havolani o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeletingSalesLinkId(null)}
                    className="flex-1 py-4 rounded-2xl font-black text-white/60 uppercase tracking-widest hover:bg-white/5 transition border border-white/10"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => {
                      handleRemoveSalesLink(deletingSalesLinkId);
                      setDeletingSalesLinkId(null);
                    }}
                    className="flex-1 py-4 rounded-2xl font-black text-white uppercase tracking-widest bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          )}

          {isSalesLinkModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSalesLinkModalOpen(false)}></div>
              <div className="bg-brand-dark w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {editingSalesLinkId ? 'Havolani tahrirlash' : 'Yangi havola'}
                  </h3>
                  <button onClick={() => setIsSalesLinkModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition">
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center mb-2">
                    <label className="relative cursor-pointer group">
                      <div className="w-24 h-24 bg-brand-black rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-brand-gold/50 group-hover:bg-brand-dark">
                        {salesLinkForm.image ? (
                          <>
                            <img src={salesLinkForm.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Globe className="w-8 h-8 text-white/20 mb-2 group-hover:text-brand-gold/50 transition-colors" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest group-hover:text-brand-gold/50 transition-colors">Rasm</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  showNotification("Rasm hajmi 10MB dan oshmasligi kerak!");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => setSalesLinkForm(prev => ({ ...prev, image: reader.result as string }));
                                reader.readAsDataURL(file);
                              }
                        }}
                      />
                    </label>
                  </div>
                  </div>

                  {(() => {
                    const validateUrl = (url: string) => {
                      if (!url) return true;
                      try {
                        const parsed = new URL(url);
                        return (parsed.protocol === 'http:' || parsed.protocol === 'https:');
                      } catch (e) {
                        return false;
                      }
                    };

                    const isUrlValid = validateUrl(salesLinkForm.url);
                    const isFormValid = salesLinkForm.name && salesLinkForm.url && isUrlValid;

                    return (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Nomi</label>
                          <input
                            type="text"
                            value={salesLinkForm.name}
                            onChange={e => setSalesLinkForm({ ...salesLinkForm, name: e.target.value })}
                            placeholder="Masalan: Ucell"
                            className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between ml-4 mr-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">URL</label>
                            {!isUrlValid && salesLinkForm.url && (
                              <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter animate-pulse">Xato URL kiritdingiz!</span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={salesLinkForm.url}
                            onChange={e => setSalesLinkForm({ ...salesLinkForm, url: e.target.value })}
                            placeholder="https://example.com"
                            className={`w-full p-4 rounded-2xl outline-none transition font-bold ${!isUrlValid && salesLinkForm.url ? 'border-2 !border-red-500 text-red-500 bg-red-500/10 focus:!border-red-500 focus:!ring-0' : 'border border-white/10 bg-brand-black focus:bg-brand-dark text-white focus:border-brand-gold'}`}
                          />
                          {!isUrlValid && salesLinkForm.url && (
                             <p className="text-[7px] text-red-500/60 font-medium ml-4 uppercase">Masalan: https://google.com (protokol shart)</p>
                          )}
                        </div>

                        <button
                          disabled={isSalesLinkSubmitting || !isFormValid}
                          onClick={() => {
                            if (editingSalesLinkId) {
                              handleUpdateSalesLink(editingSalesLinkId, salesLinkForm);
                            } else {
                              handleAddSalesLink(salesLinkForm);
                            }
                          }}
                          className={`w-full py-5 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-6 ${(isSalesLinkSubmitting || !isFormValid) ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                        >
                          {isSalesLinkSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin"></div>
                              Saqlanmoqda...
                            </div>
                          ) : (
                            editingSalesLinkId ? 'Saqlash' : 'Qo\'shish'
                          )}
                        </button>
                      </>
                    );
                  })()}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rating' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[1400px] mx-auto py-4 sm:py-8 px-2 sm:px-4">
          {/* Header & Filters */}
          <div className="flex flex-col gap-4 sm:gap-6 border-b border-white/10 pb-6 sm:pb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
              <div className="space-y-1 sm:space-y-2 lg:w-1/3">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Reyting</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Operatorlar <span className="text-brand-gold">Reytingi</span>
                </h2>
              </div>

              {/* Timeframe Filters - Centered on Desktop */}
              <div className="flex flex-col items-center gap-4 w-full lg:w-auto flex-1 relative">
                {/* Desktop Buttons */}
                <div className="hidden xs:flex items-center gap-1 sm:gap-2 bg-brand-black p-1.5 rounded-xl sm:rounded-2xl border border-white/10 w-full sm:w-auto overflow-x-auto sm:overflow-visible custom-scrollbar">
                  {[
                    { id: 'today', label: 'Bugun' },
                    { id: 'week', label: 'Hafta' },
                    { id: 'month', label: 'Oy' },
                    { id: 'custom', label: 'Oraliq' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setRatingTimeframe(t.id as any)}
                      className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-1 sm:flex-none shrink-0 ${ratingTimeframe === t.id ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Mobile Dropdown */}
                <div className="xs:hidden w-full relative">
                  <button
                    onClick={() => setIsRatingTimeframeDropdownOpen(!isRatingTimeframeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-brand-black border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-widest shadow-lg"
                  >
                    <span className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-brand-gold" />
                      {[
                        { id: 'today', label: 'Bugun' },
                        { id: 'week', label: 'Hafta' },
                        { id: 'month', label: 'Oy' },
                        { id: 'custom', label: 'Oraliq' }
                      ].find(t => t.id === ratingTimeframe)?.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isRatingTimeframeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isRatingTimeframeDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setIsRatingTimeframeDropdownOpen(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {[
                          { id: 'today', label: 'Bugun' },
                          { id: 'week', label: 'Hafta' },
                          { id: 'month', label: 'Oy' },
                          { id: 'custom', label: 'Oraliq' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setRatingTimeframe(t.id as any);
                              setIsRatingTimeframeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${ratingTimeframe === t.id ? 'bg-brand-gold text-brand-black' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Secondary Filters (Month/Custom) - Centered below timeframe */}
                <AnimatePresence mode="wait">
                  {ratingTimeframe === 'month' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-white/5 shadow-sm"
                    >
                      <button
                        onClick={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset - 1);
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
                      <span className="text-[10px] font-black text-white/60 px-4 uppercase tracking-widest min-w-[140px] text-center">
                        {(() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset);
                          const monthName = translations[language].month_names[d.getMonth()];
                          return `${monthName} ${d.getFullYear()}`;
                        })()}
                      </span>
                      <button
                        onClick={() => {
                          if (ratingMonthOffset >= 0) return;
                          setRatingMonthOffset(prev => prev + 1);
                        }}
                        className={`p-2 rounded-lg transition-colors ${ratingMonthOffset >= 0 ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-brand-gold hover:bg-white/5'}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {ratingTimeframe === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <input type="date" value={ratingCustomStart} onChange={e => setRatingCustomStart(e.target.value)} className="bg-brand-black border border-white/10 text-white text-[10px] p-2 rounded-xl outline-none focus:border-brand-gold shadow-sm" />
                      <span className="text-white/20 font-bold">-</span>
                      <input type="date" value={ratingCustomEnd} onChange={e => setRatingCustomEnd(e.target.value)} className="bg-brand-black border border-white/10 text-white text-[10px] p-2 rounded-xl outline-none focus:border-brand-gold shadow-sm" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons - Right Aligned on Desktop */}
              <div className="flex items-center gap-3 lg:w-1/3 lg:justify-end">
                {(ratingTimeframe !== 'month' || ratingMonthOffset === 0) && (
                  <button
                    onClick={() => setIsLeagueModalOpen(true)}
                    className="px-4 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white/60 hover:text-brand-gold hover:border-brand-gold/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Saralash
                  </button>
                )}

                <button
                  onClick={() => calculateAchievements && calculateAchievements(true)}
                  className="px-4 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white/60 hover:text-green-500 hover:border-green-500/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                  title="O'tgan oy yutuqlarini qayta hisoblash"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Qayta hisoblash
                </button>
              </div>
            </div>


          </div>

          {(() => {
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
                    // Before any history (and likely before creation), default to bronze
                    historicalLeague = 'bronze';
                  }
                }

                // Filter sales based on timeframe and mode
                const userSales = state.sales.filter(s => {
                  const saleDate = new Date(s.date);
                  // Reset time part to compare dates correctly
                  const sDate = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
                  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                  const inRange = sDate >= start && sDate <= end;

                  if (ratingMode === 'overall') return s.userId === u.id && inRange;
                  return s.userId === u.id && inRange && s.company === ratingMode;
                });

                const totalSales = userSales.reduce((acc, s) => acc + s.count + s.bonus, 0);
                return { ...u, sales: totalSales, historicalLeague };
              })
              .sort((a, b) => b.sales - a.sales);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 items-start">
                {['gold', 'silver', 'bronze'].map((leagueName) => {
                  // Filter users belonging to this league using historical data
                  const groupUsers = operatorRankings.filter(u => {
                    const userLeague = u.historicalLeague;
                    return userLeague === leagueName;
                  });

                  const leagueInfo = leagueName === 'gold'
                    ? { color: 'text-yellow-400', bg: 'bg-yellow-400/10', title: "1 Gold", border: 'border-yellow-400/20' }
                    : leagueName === 'silver'
                      ? { color: 'text-gray-300', bg: 'bg-gray-300/10', title: "2 Silver", border: 'border-gray-300/20' }
                      : { color: 'text-orange-500', bg: 'bg-orange-500/10', title: "3 Bronza", border: 'border-orange-500/20' };

                  return (
                    <div key={leagueName} className={`bg-brand-dark rounded-[1.5rem] sm:rounded-[2rem] border ${leagueInfo.border} shadow-2xl overflow-hidden flex flex-col max-h-[600px] sm:max-h-[800px]`}>
                      <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between ${leagueInfo.bg}`}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${leagueInfo.color}`} />
                          <span className={`text-xs sm:text-sm font-black uppercase tracking-[0.2em] ${leagueInfo.color}`}>{leagueInfo.title}</span>
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">{groupUsers.length} ta operator</span>
                      </div>
                      <div className="divide-y divide-white/5 flex-1 overflow-y-auto custom-scrollbar">
                        {groupUsers.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center text-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Operatorlar yo'q</div>
                        ) : groupUsers.map((u, idx) => {
                          return (
                            <div key={u.id} className={`px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-white/5 transition-colors group`}>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <span className="w-4 sm:w-5 text-center font-bold text-white/20 group-hover:text-brand-gold transition-colors text-xs sm:text-sm">{idx + 1}</span>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-black border border-white/5 flex items-center justify-center font-bold text-white/20 text-[10px] sm:text-xs group-hover:scale-110 group-hover:bg-brand-dark transition-all overflow-hidden shrink-0">
                                  {u.photo ? <img src={getMediaUrl(u.photo)} alt={u.firstName} className="w-full h-full object-cover" /> : <>{u.firstName?.[0]}{u.lastName?.[0]}</>}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm truncate">
                                    <span className="truncate">{u.firstName} {u.lastName}</span>
                                  </p>
                                  <p className="text-[8px] sm:text-[9px] font-medium text-white/40 truncate">{u.department || 'Bo\'limsiz'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right min-w-[40px] sm:min-w-[50px]">
                                  <p className="text-sm sm:text-base font-black text-white">{u.sales}</p>
                                  <p className="text-[7px] sm:text-[8px] font-black text-white/40 uppercase tracking-widest">Sotuv</p>
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
            );
          })()}

          {isLeagueModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300 p-2 sm:p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsLeagueModalOpen(false)}></div>
              <div className="bg-brand-black w-full max-w-5xl rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white/10 max-h-[95vh] sm:max-h-[90vh]">
                <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-brand-dark">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-brand-gold" /> Operatorlarni Saralash
                  </h2>
                  <button onClick={() => setIsLeagueModalOpen(false)} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                </div>

                <div className="p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 custom-scrollbar">
                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-end">
                    <div className="space-y-1.5 sm:space-y-2 relative">
                      <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Liga (Bo'lim)</label>
                      <button
                        onClick={() => {
                          setIsLeagueDropdownOpen(!isLeagueDropdownOpen);
                          setIsOperatorDropdownOpen(false);
                        }}
                        className={`w-full p-3.5 sm:p-4 bg-brand-dark border ${isLeagueDropdownOpen ? 'border-brand-gold ring-1 ring-brand-gold/50' : 'border-white/10'} rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-between transition-all hover:border-white/20`}
                      >
                        <span className="capitalize">{leagueForm.league}</span>
                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-white/30 transition-transform ${isLeagueDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isLeagueDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                          {['gold', 'silver', 'bronze'].map((league) => (
                            <button
                              key={league}
                              onClick={() => {
                                setLeagueForm({ ...leagueForm, league: league as any });
                                setIsLeagueDropdownOpen(false);
                              }}
                              className={`w-full p-3 text-left text-xs sm:text-sm font-bold capitalize transition-colors flex items-center justify-between ${leagueForm.league === league ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                              {league}
                              {leagueForm.league === league && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 relative">
                      <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Operator</label>
                      <button
                        onClick={() => {
                          setIsOperatorDropdownOpen(!isOperatorDropdownOpen);
                          setIsLeagueDropdownOpen(false);
                        }}
                        className={`w-full p-3.5 sm:p-4 bg-brand-dark border ${isOperatorDropdownOpen ? 'border-brand-gold ring-1 ring-brand-gold/50' : 'border-white/10'} rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-between transition-all hover:border-white/20`}
                      >
                        <span className={leagueForm.userId ? 'text-white truncate' : 'text-white/30 truncate'}>
                          {leagueForm.userId
                            ? operators.find(op => op.id === leagueForm.userId)?.firstName + ' ' + operators.find(op => op.id === leagueForm.userId)?.lastName
                            : 'Tanlang...'}
                        </span>
                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-white/30 transition-transform ${isOperatorDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
                      </button>

                      {isOperatorDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                          {operators.filter(op => op.league !== leagueForm.league).map(op => (
                            <button
                              key={op.id}
                              onClick={() => {
                                setLeagueForm(prev => ({ ...prev, userId: op.id }));
                                setIsOperatorDropdownOpen(false);
                              }}
                              className={`w-full p-3 text-left text-xs sm:text-sm font-bold transition-colors flex items-center justify-between ${leagueForm.userId === op.id ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate pr-2">{op.firstName} {op.lastName}</span>
                                {op.league && (
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-md border ${op.league === 'gold' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-500' :
                                    op.league === 'silver' ? 'bg-gray-400/10 border-gray-400/20 text-gray-400' :
                                      'bg-orange-500/10 border-orange-500/20 text-orange-500'
                                    }`}>
                                    {op.league}
                                  </span>
                                )}
                              </div>
                              {leagueForm.userId === op.id && <Check className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />}
                            </button>
                          ))}
                          {operators.filter(op => op.league !== leagueForm.league).length === 0 && (
                            <div className="p-4 text-center text-white/30 text-[10px] sm:text-xs italic">Operatorlar topilmadi</div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (!leagueForm.userId) return;
                        const user = operators.find(u => u.id === leagueForm.userId);
                        if (user) {
                          let history = user.leagueHistory || [];
                          // If no history exists but user has a league, backfill it starting from creation date
                          if (history.length === 0 && user.league) {
                            history = [{ league: user.league, date: user.createdAt }];
                          }
                          const newHistory = [...history, { league: leagueForm.league, date: new Date().toISOString() }];
                          // @ts-ignore
                          handleUpdateUser(leagueForm.userId, { league: leagueForm.league, leagueHistory: newHistory });
                        }
                        setLeagueForm(prev => ({ ...prev, userId: '' }));
                        setIsLeagueDropdownOpen(false);
                        setIsOperatorDropdownOpen(false);
                      }}
                      className="w-full p-3.5 sm:p-4 bg-brand-gold text-brand-black rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all flex items-center justify-center gap-2 sm:col-span-2 md:col-span-1"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Qo'shish
                    </button>
                  </div>

                  {/* Lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-white/5">
                    {['gold', 'silver', 'bronze'].map(league => {
                      const leagueUsers = operators.filter(u => u.league === league);
                      const color = league === 'gold' ? 'text-yellow-400' : league === 'silver' ? 'text-gray-300' : 'text-orange-500';
                      const bg = league === 'gold' ? 'bg-yellow-400/5 border-yellow-400/10' : league === 'silver' ? 'bg-gray-300/5 border-gray-300/10' : 'bg-orange-500/5 border-orange-500/10';

                      return (
                        <div key={league} className={`rounded-xl sm:rounded-2xl border ${bg} overflow-hidden flex flex-col max-h-[400px] sm:max-h-[500px]`}>
                          <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-brand-black/20">
                            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${color}`}>{league}</span>
                            <span className="text-[10px] font-bold text-white/30">{leagueUsers.length} ta</span>
                          </div>
                          <div className="p-2 sm:p-3 space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                            {leagueUsers.length === 0 ? (
                              <div className="text-center py-6 sm:py-8 text-white/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest italic">Bo'sh</div>
                            ) : leagueUsers.map(u => (
                              <div key={u.id} className="p-2 sm:p-3 bg-brand-black rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white/40 shrink-0">
                                    {u.firstName[0]}{u.lastName[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-bold text-white truncate">{u.firstName} {u.lastName}</p>
                                    <p className="text-[8px] sm:text-[9px] text-white/30 truncate">{u.phone && (u.phone.startsWith('+') ? u.phone : `+${u.phone}`)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setLeagueUserToDelete(u);
                                    setIsLeagueDeleteConfirmOpen(true);
                                  }}
                                  className="p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                                  title="O'chirish"
                                >
                                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {isLeagueDeleteConfirmOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLeagueDeleteConfirmOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative z-10 w-full max-w-sm bg-brand-black border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Ligadan o'chirish</h3>
                    <p className="text-white/40 text-xs sm:text-sm font-medium mb-8 leading-relaxed">
                      Rostdan ham <span className="text-white font-bold">{leagueUserToDelete?.firstName} {leagueUserToDelete?.lastName}</span>ni ligadan olib tashlamoqchimisiz?
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => setIsLeagueDeleteConfirmOpen(false)}
                        className="p-3.5 bg-white/5 text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                      >
                        Yo'q
                      </button>
                      <button
                        onClick={async () => {
                          if (leagueUserToDelete) {
                            let history = leagueUserToDelete.leagueHistory || [];
                            if (history.length === 0 && leagueUserToDelete.league) {
                              history = [{ league: leagueUserToDelete.league, date: leagueUserToDelete.createdAt }];
                            }
                            const newHistory = [...history, { league: null as any, date: new Date().toISOString() }];
                            // @ts-ignore
                            await handleUpdateUser(leagueUserToDelete.id, { league: null, leagueHistory: newHistory });
                          }
                          setIsLeagueDeleteConfirmOpen(false);
                          setLeagueUserToDelete(null);
                        }}
                        className="p-3.5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        Ha, o'chirish
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )
      }

      {
        isWorkPointModalOpen && (
          <div className="fixed inset-0 bg-brand-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-brand-dark w-full sm:w-[95vw] h-[100vh] sm:h-[95vh] sm:rounded-[3rem] border-0 sm:border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
              <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-brand-gold/10 to-transparent shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Ish nuqtasini kiritish</h3>
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Operator uchun xaritadan nuqta belgilang</p>
                </div>
                <button
                  onClick={() => {
                    setIsWorkPointModalOpen(false);
                    setWorkPointForm({ userId: '', location: null, radius: 200 });
                  }}
                  className="p-2 sm:p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-8 gap-4 sm:gap-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 shrink-0">
                  <div className="space-y-1.5 sm:space-y-2 relative">
                    <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Operatorni tanlang</label>
                    <button
                      onClick={() => setIsWorkPointOperatorDropdownOpen(!isWorkPointOperatorDropdownOpen)}
                      className={`w-full p-3.5 sm:p-4 bg-brand-black border ${isWorkPointOperatorDropdownOpen ? 'border-brand-gold ring-1 ring-brand-gold/50' : 'border-white/10'} rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-between transition-all hover:border-white/20`}
                    >
                      <span className={workPointForm.userId ? 'text-white truncate' : 'text-white/30 truncate'}>
                        {workPointForm.userId
                          ? operators.find(op => op.id === workPointForm.userId)?.firstName + ' ' + operators.find(op => op.id === workPointForm.userId)?.lastName
                          : 'Operatorni tanlang...'}
                      </span>
                      <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-white/30 transition-transform ${isWorkPointOperatorDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
                    </button>

                    {isWorkPointOperatorDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                        {operators.map(op => (
                          <button
                            key={op.id}
                            onClick={() => {
                              setWorkPointForm({
                                userId: op.id,
                                location: op.workLocation ? { lat: op.workLocation.lat, lng: op.workLocation.lng } : null,
                                radius: op.workRadius || 200,
                                workType: op.workType || 'office'
                              });
                              setIsWorkPointOperatorDropdownOpen(false);
                            }}
                            className={`w-full p-3 sm:p-4 text-left text-xs sm:text-sm font-bold transition-colors flex items-center justify-between ${workPointForm.userId === op.id ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white/40 shrink-0">
                                {op.firstName[0]}{op.lastName[0]}
                              </div>
                              <span className="truncate">{op.firstName} {op.lastName}</span>
                            </div>
                            {workPointForm.userId === op.id && <Check className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Radius (metr)</label>
                    <input
                      type="number"
                      value={workPointForm.radius}
                      onChange={(e) => setWorkPointForm(prev => ({ ...prev, radius: parseInt(e.target.value) || 0 }))}
                      className="w-full p-3.5 sm:p-4 bg-brand-black border border-white/10 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all outline-none"
                      placeholder="Masalan: 200"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Bo'limni tanlang</label>
                    <select
                      value={workPointForm.workType}
                      onChange={(e) => setWorkPointForm(prev => ({ ...prev, workType: e.target.value as 'office' | 'mobile' | 'desk' }))}
                      className="w-full p-3.5 sm:p-4 bg-brand-black border border-white/10 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all outline-none appearance-none"
                    >
                      <option value="office">Ofis</option>
                      <option value="mobile">Mobil ofis</option>
                      <option value="desk">Stolda</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 flex-1 min-h-[300px] sm:min-h-[400px] flex flex-col">
                  <div className="flex-1 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 relative">
                    <MapPicker
                      lat={workPointForm.location?.lat || 0}
                      lng={workPointForm.location?.lng || 0}
                      onChange={(lat, lng) => setWorkPointForm(prev => ({ ...prev, location: { lat, lng } }))}
                      className="absolute inset-0 h-full w-full m-0 rounded-none border-none"
                      workType={workPointForm.workType}
                      radius={workPointForm.radius}
                    />
                  </div>
                  {workPointForm.location && (
                    <p className="text-[8px] sm:text-[10px] font-bold text-brand-gold uppercase tracking-widest mt-1 sm:mt-2">
                      Tanlangan: {workPointForm.location.lat.toFixed(6)}, {workPointForm.location.lng.toFixed(6)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (!workPointForm.userId) return;
                    if (!workPointForm.location) return;
                    if (workPointForm.radius <= 0) return;

                    handleUpdateUser(workPointForm.userId, {
                      workLocation: workPointForm.location,
                      workRadius: workPointForm.radius,
                      workType: workPointForm.workType
                    });

                    setIsWorkPointModalOpen(false);
                    setWorkPointForm({ userId: '', location: null, radius: 200, workType: 'office' });
                    console.log("Ish nuqtasi muvaffaqiyatli saqlandi!");
                  }}
                  className="w-full py-4 sm:py-5 gold-gradient text-brand-black rounded-xl sm:rounded-[1.5rem] text-xs sm:text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition shadow-xl shadow-brand-gold/20 flex items-center justify-center gap-2 shrink-0"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        /* DANGER: Global Overrides for Chart Black Borders */
        .recharts-wrapper, .recharts-surface, .recharts-container {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .recharts-wrapper:focus, .recharts-wrapper:active, .recharts-wrapper * {
          outline: none !important;
          -webkit-tap-highlight-color: transparent;
        }
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line {
          stroke: rgba(255,255,255,0.05) !important;
        }
        .recharts-cartesian-axis-line {
          display: none !important;
        }
        .chart-wrapper svg {
          overflow: visible !important;
        }

        /* MODERN MAP MARKER V2 STYLES */
        .map-marker-v2-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 36px;
          height: 46px;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,0.25));
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .map-marker-v2-container:hover {
          transform: translateY(-4px) scale(1.1);
          z-index: 1000 !important;
        }
        .map-marker-v2-pin {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #D4AF37;
          background: #0A0A0A;
          color: #D4AF37;
          position: relative;
          z-index: 2;
        }
        .map-marker-v2-initials {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .map-marker-v2-arrow {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #D4AF37;
          margin-top: -2px;
          position: relative;
          z-index: 1;
        }
        .late-badge-v2 {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          z-index: 3;
        }
        .marker-pulse-v2::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #D4AF37;
          opacity: 0.4;
          animation: markerPulseV2 2s infinite;
          z-index: 0;
        }
        @keyframes markerPulseV2 {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .marker-late-v2 {
          background: #ef4444 !important;
          border-radius: 50%;
        }

        /* SINGLE MAP TEAR PIN */
        .map-marker-pin-tear {
          width: 40px;
          height: 40px;
          background: #D4AF37;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #0A0A0A;
          box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4);
        }
        .pin-initials {
          transform: rotate(45deg);
          color: #0A0A0A;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: -0.01em;
        }
        .map-custom-tooltip {
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 15px 35px -5px rgba(0,0,0,0.5);
          padding: 0;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-xl"
              onClick={() => setIsPasswordModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-brand-dark w-full max-w-sm rounded-[2rem] border border-white/10 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Parolni yangilash</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Yangi parol kiritish</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Yangi parol..."
                    className="w-full p-4 bg-brand-black border border-white/10 rounded-2xl text-white outline-none focus:border-brand-gold transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      className="flex-1 py-4 bg-brand-gold text-brand-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-xl"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-brand-dark w-full max-w-sm rounded-[2rem] border border-white/10 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center relative overflow-hidden border border-white/10 ${
                    confirmModal.type === 'success' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {confirmModal.type === 'success' ? <CheckCircle className="w-8 h-8" /> : <X className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{confirmModal.title}</h3>
                    <p className="text-sm font-medium text-white/60 mt-2">{confirmModal.message}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all ${
                      confirmModal.type === 'success' 
                        ? 'bg-brand-gold text-brand-black shadow-brand-gold/20 hover:scale-[1.02] active:scale-95' 
                        : 'bg-red-500 text-white shadow-red-500/20 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    Ha
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};


export default ManagerPanel;


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Auth from './components/Auth';
import ManagerPanel from './components/ManagerPanel';
import OperatorPanel from './components/OperatorPanel';
import RulesPanel from './components/RulesPanel';
import RulesView from './components/RulesView';
import { AppState, Role, User, CheckIn, SimSale, DailyReport, Message, MonthlyTarget } from './types';
import { getTodayStr, isDateMatch } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sun, Moon, Globe, Hash, RotateCcw, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { t, Language } from './translations';
import { authService, userService, checkInService, saleService, messageService, ruleService, targetService, reportService, linkService, settingsService, operatorRatingService } from './api';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useWebSocket } from './hooks/useWebSocket';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import flagUz from './assets/flag_uz.png';
import flagRu from './assets/flag_ru.png';
import flagEn from './assets/flag_en.png';

// Events that trigger a background data refresh
const RT_EVENTS = [
  'NEW_MESSAGE', 'NEW_CHECKIN', 'NEW_SALE', 'NEW_REPORT',
  'USER_UPDATED', 'RULE_UPDATED', 'TARGET_UPDATED', 'TARIFF_UPDATED', 'LINK_UPDATED',
  'SETTINGS_UPDATED', 'NEW_RATING',
  'USER_ACTIVITY'
];

const ArrivalChecker: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    checkIns: [],
    sales: [],
    reports: [],
    simInventory: { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 },
    messages: [],
    rules: [],
    monthlyTargets: [],
    tariffs: { 'Ucell': [], 'Mobiuz': [], 'Beeline': [], 'Uztelecom': [] },
    salesLinks: [
      { id: '1', name: 'Ucell', url: 'https://ucell.uz', image: '', createdAt: new Date().toISOString() },
      { id: '2', name: 'Mobiuz', url: 'https://mobi.uz', image: '', createdAt: new Date().toISOString() },
      { id: '3', name: 'Beeline', url: 'https://beeline.uz', image: '', createdAt: new Date().toISOString() },
      { id: '4', name: 'Uztelecom', url: 'https://uztelecom.uz', image: '', createdAt: new Date().toISOString() },
      { id: '5', name: 'Paynet', url: 'https://paynet.uz', image: '', createdAt: new Date().toISOString() },
    ],
    globalSettings: null,
    operatorRatings: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const showNotification = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('paynet_auth_token');
    if (token) {
      try {
        const userRes = await authService.getMe();
        const usersRes = await userService.getUsers();
        const checkInsRes = await checkInService.getCheckIns();
        const salesRes = await saleService.getSales();
        const messagesRes = await messageService.getMessages();
        const rulesRes = await ruleService.getRules();
        const targetsRes = await targetService.getTargets();
        const reportsRes = await reportService.getReports();
        const linksRes = await linkService.getSalesLinks();
        const tariffsRes = await ruleService.getTariffs();
        const settingsRes = await settingsService.getSettings();
        const ratingsRes = await operatorRatingService.getRatings();

        const mappedTariffs = tariffsRes.data.reduce((acc: any, t: any) => {
          if (!acc[t.company]) acc[t.company] = [];
          acc[t.company].push(t.name);
          return acc;
        }, { 'Ucell': [], 'Mobiuz': [], 'Beeline': [], 'Uztelecom': [] });

        setState(prev => ({
          ...prev,
          currentUser: userRes.data,
          users: usersRes.data,
          checkIns: checkInsRes.data,
          sales: salesRes.data,
          messages: messagesRes.data,
          rules: rulesRes.data,
          monthlyTargets: targetsRes.data,
          reports: reportsRes.data,
          salesLinks: Array.isArray(linksRes.data) ? linksRes.data : [],
          tariffs: mappedTariffs,
          globalSettings: settingsRes.data,
          operatorRatings: Array.isArray(ratingsRes.data) ? ratingsRes.data : []
        }));
      } catch (error) {
        console.error("Failed to fetch data", error);
        // Only remove token if it's an auth error (401/403)
        // For now keep it simple
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      await fetchData();
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!state.currentUser && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      } else if (state.currentUser && location.pathname === '/login') {
        navigate('/', { replace: true });
      }
    }
  }, [state.currentUser, location.pathname, isLoading, navigate]);

  // Track path for debugging but don't force reload
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('paynet_app_dark_mode');
    return saved === null ? true : saved === 'true';
  });
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [achievementMonthInput, setAchievementMonthInput] = useState("");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('paynet_app_sidebar_collapsed');
    return saved === 'true';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('paynet_app_language');
    return (saved as Language) || 'uz';
  });

  const [unreadBadges, setUnreadBadges] = useState(() => {
    const saved = localStorage.getItem('unread_badges');
    return saved ? JSON.parse(saved) : { rules: 0, sales_panel: 0, simcards: 0, approvals: 0 };
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Persistence for counts to avoid badge on reload
  const seenCounts = useRef(
    (() => {
      const saved = localStorage.getItem('seen_counts');
      return saved ? JSON.parse(saved) : { rules: -1, salesLinks: -1, approvals: -1, userInventory: -1 };
    })()
  );


  useEffect(() => {
    localStorage.setItem('unread_badges', JSON.stringify(unreadBadges));
    localStorage.setItem('seen_counts', JSON.stringify(seenCounts.current));
  }, [unreadBadges]);

  const getTotalInventoryCount = useCallback(() => {
    if (!state.currentUser?.inventory) return 0;
    return Object.values(state.currentUser.inventory).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  }, [state.currentUser?.inventory]);

  useEffect(() => {
    if (isLoading || !state.currentUser) return;

    let shouldPlaySound = false;
    let hasChanges = false;
    let newBadges = { ...unreadBadges };

    // RULES
    const currentRulesCount = state.rules.length;
    if (seenCounts.current.rules !== -1 && currentRulesCount > seenCounts.current.rules) {
      if (!location.pathname.includes('/rules')) { 
        newBadges.rules = (newBadges.rules || 0) + (currentRulesCount - seenCounts.current.rules); 
        hasChanges = true; 
        shouldPlaySound = true;
        seenCounts.current.rules = currentRulesCount;
      }
    }
    if (location.pathname.includes('/rules')) {
      if (seenCounts.current.rules !== currentRulesCount) { seenCounts.current.rules = currentRulesCount; hasChanges = true; }
      if (newBadges.rules !== 0) { newBadges.rules = 0; hasChanges = true; }
    } else if (seenCounts.current.rules === -1) {
      seenCounts.current.rules = currentRulesCount;
    }

    // SALES LINKS
    const currentSalesLinksCount = state.salesLinks.length;
    if (seenCounts.current.salesLinks !== -1 && currentSalesLinksCount > seenCounts.current.salesLinks) {
      if (!location.pathname.includes('/sales')) { 
        newBadges.sales_panel = (newBadges.sales_panel || 0) + (currentSalesLinksCount - seenCounts.current.salesLinks); 
        hasChanges = true; 
        shouldPlaySound = true;
        seenCounts.current.salesLinks = currentSalesLinksCount;
      }
    }
    if (location.pathname.includes('/sales')) {
      if (seenCounts.current.salesLinks !== currentSalesLinksCount) { seenCounts.current.salesLinks = currentSalesLinksCount; hasChanges = true; }
      if (newBadges.sales_panel !== 0) { newBadges.sales_panel = 0; hasChanges = true; }
    } else if (seenCounts.current.salesLinks === -1) {
      seenCounts.current.salesLinks = currentSalesLinksCount;
    }

    // APPROVALS
    if (state.currentUser.role === Role.MANAGER) {
      const currentPending = state.users.filter(u => !u.isApproved).length;
      if (seenCounts.current.approvals !== -1 && currentPending > seenCounts.current.approvals) {
        if (!location.pathname.includes('/approvals')) { 
          newBadges.approvals = (newBadges.approvals || 0) + (currentPending - seenCounts.current.approvals); 
          hasChanges = true; 
          shouldPlaySound = true;
          // Mark these as "seen" so we don't notify again until count INCREASES further
          seenCounts.current.approvals = currentPending;
        }
      }
      if (location.pathname.includes('/approvals')) {
        if (seenCounts.current.approvals !== currentPending) { seenCounts.current.approvals = currentPending; hasChanges = true; }
        if (newBadges.approvals !== 0) { newBadges.approvals = 0; hasChanges = true; }
      } else if (seenCounts.current.approvals === -1) {
        seenCounts.current.approvals = currentPending;
      }
    }

    // INVENTORY
    const currentInvCount = getTotalInventoryCount();
    if (seenCounts.current.userInventory !== -1 && currentInvCount > seenCounts.current.userInventory) {
      if (!location.pathname.includes('/inventory')) { 
        newBadges.simcards = (newBadges.simcards || 0) + 1; 
        hasChanges = true; 
        shouldPlaySound = true;
        seenCounts.current.userInventory = currentInvCount;
      }
    }
    if (location.pathname.includes('/inventory')) {
      if (seenCounts.current.userInventory !== currentInvCount) { seenCounts.current.userInventory = currentInvCount; hasChanges = true; }
      if (newBadges.simcards !== 0) { newBadges.simcards = 0; hasChanges = true; }
    } else if (seenCounts.current.userInventory === -1) {
      seenCounts.current.userInventory = currentInvCount;
    }


    if (shouldPlaySound) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch((e: any) => console.log('[WS] Audio blocked:', e));
    }

    if (hasChanges) {
      setUnreadBadges(newBadges);
      localStorage.setItem('seen_counts', JSON.stringify(seenCounts.current));
    }
  }, [state.rules.length, state.salesLinks.length, state.users, getTotalInventoryCount, location.pathname, isLoading, state.currentUser, unreadBadges]);


  const unreadMessagesCount = useMemo(() => {
    if (!state.currentUser) return 0;
    return state.messages.filter(m => {
      if (m.isRead || m.senderId === state.currentUser?.id) return false;
      if (state.currentUser?.role === Role.MANAGER) return true;
      // If it's for everyone (null/empty) or specifically for me
      return !m.recipientId || m.recipientId === state.currentUser?.id || m.recipientId === 'all';
    }).length;
  }, [state.messages, state.currentUser]);

  const prevMessagesLength = useRef(state.messages.length);
  useEffect(() => {
    if (state.messages.length > prevMessagesLength.current) {
      const latestMessage = state.messages[state.messages.length - 1];
      if (latestMessage && latestMessage.senderId !== state.currentUser?.id) {
        // Notification sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio blocked:', e));
      }
    }
    prevMessagesLength.current = state.messages.length;
  }, [state.messages, state.currentUser]);

  useEffect(() => {
    localStorage.setItem('paynet_app_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('paynet_app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('paynet_app_dark_mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // localStorage.setItem('paynet_app_state', JSON.stringify(state));
  }, [state]);

  // -------------------------------------------------------
  // Real-time sync via WebSocket (uses the hook)
  // The hook manages connection, reconnect, and cleanup.
  // -------------------------------------------------------
  const handleWsMessage = useCallback((data: any) => {
    if (RT_EVENTS.includes(data.type)) {
      console.log('[WS] Event received, refreshing data in background:', data.type);
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useWebSocket({
    onMessage: handleWsMessage,
    // Only connect when the user is logged in
    disabled: !state.currentUser,
    maxRetries: 10,
    onStatusChange: (s) => console.log('[WS] Status changed:', s),
  });


  // Global logout across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'paynet_auth_token' && !e.newValue) {
        // Token was removed (likely from another tab)
        localStorage.clear();
        setState(prev => ({ ...prev, currentUser: null, messages: [], sales: [], checkIns: [], reports: [] }));
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Automatic Achievement Awarding Logic
  const calculateAchievements = (force = false) => {
    console.log("calculateAchievements called, force:", force);
    if (force) {
      const today = new Date();
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const defaultMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      setAchievementMonthInput(defaultMonth);
      setIsAchievementModalOpen(true);
      return;
    }

    performAchievementCalculation();
  };

  const performAchievementCalculation = (manualMonth?: string) => {
    try {
      const today = new Date();
      let targetMonthStr = "";

      if (manualMonth) {
        targetMonthStr = manualMonth;
      } else {
        // Automatic mode: previous month
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        targetMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      }

      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (targetMonthStr >= currentMonthStr) {
        if (manualMonth) {
          console.warn("Siz faqat yakunlangan oylar uchun yutuqlarni hisoblashingiz mumkin. Joriy oy hali tugamagan.");
        }
        return;
      }

      const processedMonths = state.processedMonthsForAchievements || [];

      // If already processed for target month and not forced, skip
      if (!manualMonth && processedMonths.includes(targetMonthStr)) {
        return;
      }

      // Calculate achievements for target month
      const targetMonthSales = state.sales.filter(s => s.date.startsWith(targetMonthStr));

      // Get the last day of the target month to determine historical league
      const [year, month] = targetMonthStr.split('-').map(Number);
      const lastDayOfTargetMonth = new Date(year, month, 0);
      lastDayOfTargetMonth.setHours(23, 59, 59, 999);

      if (manualMonth) {
        console.log(`Recalculating for ${targetMonthStr}. Found ${targetMonthSales.length} sales.`);
      }

      // Group users by their league at the end of the target month
      const leagueUsers: Record<'gold' | 'silver' | 'bronze', any[]> = {
        gold: [],
        silver: [],
        bronze: []
      };

      state.users.filter(u => u.role !== 'manager').forEach(u => {
        let historicalLeague: 'gold' | 'silver' | 'bronze' = u.league || 'bronze';
        if (u.leagueHistory && u.leagueHistory.length > 0) {
          const sorted = [...u.leagueHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const match = sorted.find(h => new Date(h.date) <= lastDayOfTargetMonth);
          if (match) {
            historicalLeague = match.league;
          } else {
            historicalLeague = 'bronze';
          }
        }
        leagueUsers[historicalLeague].push(u);
      });

      const newAchievements: { userId: string, achievement: any }[] = [];

      // Process each league
      (['gold', 'silver', 'bronze'] as const).forEach(league => {
        const usersInLeague = leagueUsers[league];
        if (usersInLeague.length === 0) return;

        // Calculate total sales for each user in this league for target month
        const userSales = usersInLeague.map(user => {
          const total = targetMonthSales
            .filter(s => s.userId === user.id)
            .reduce((sum, s) => sum + s.count + s.bonus, 0);
          return { user, total };
        });

        // Sort by sales descending
        userSales.sort((a, b) => b.total - a.total);

        // Award top 3
        userSales.slice(0, 3).forEach((item, index) => {
          // Award achievement to top 3 users in each league
          // We award even if total is 0 if there are users in the league, 
          // to satisfy the requirement of having 3 places per league.
          newAchievements.push({
            userId: item.user.id,
            achievement: {
              id: Math.random().toString(36).substr(2, 9),
              type: league, // Use league name as type to ensure correct color (Silver league -> Silver color)
              title: `${targetMonthStr} ${league.charAt(0).toUpperCase() + league.slice(1)} Ligasida ${index + 1}-o'rin`,
              reason: `${targetMonthStr} oyida ${item.total} ta simkarta sotib, ${league} ligasida ${index + 1}-o'rinni egalladi.`,
              date: new Date().toLocaleDateString('uz-UZ')
            }
          });
        });
      });

      if (newAchievements.length > 0) {
        setState(prev => {
          // Avoid adding duplicate achievements if running multiple times
          // We filter out achievements that look identical (same title and date)
          const updatedUsers = prev.users.map(u => {
            const userNewAchievements = newAchievements
              .filter(na => na.userId === u.id)
              .map(na => na.achievement);

            if (userNewAchievements.length > 0) {
              // Filter out duplicates
              const existingTitles = new Set((u.achievements || []).map(a => a.title));
              const uniqueNewAchievements = userNewAchievements.filter(a => !existingTitles.has(a.title));

              if (uniqueNewAchievements.length === 0) return u;

              return {
                ...u,
                achievements: [...(u.achievements || []), ...uniqueNewAchievements]
              };
            }
            return u;
          });

          // Also update current user if they received an achievement
          let updatedCurrentUser = prev.currentUser;
          if (updatedCurrentUser) {
            const u = updatedUsers.find(u => u.id === updatedCurrentUser!.id);
            if (u) {
              updatedCurrentUser = u;
            }
          }

          return {
            ...prev,
            users: updatedUsers,
            currentUser: updatedCurrentUser,
            processedMonthsForAchievements: manualMonth ? processedMonths : [...processedMonths, targetMonthStr]
          };
        });
        if (manualMonth) console.log(`Yutuqlar muvaffaqiyatli hisoblandi! ${newAchievements.length} ta yutuq berildi.`);
      } else {
        // Even if no achievements were awarded (e.g. no sales), mark as processed so we don't keep checking
        if (!manualMonth) {
          setState(prev => ({
            ...prev,
            processedMonthsForAchievements: [...processedMonths, targetMonthStr]
          }));
        } else {
          console.warn(`${targetMonthStr} oyi uchun yetarli savdo ma'lumotlari topilmadi yoki hech kim savdo qilmagan.`);
        }
      }
    } catch (error) {
      console.error("Error calculating achievements:", error);
      if (manualMonth) console.error("Xatolik yuz berdi: " + (error as any).message);
    }
  };

  useEffect(() => {
    // One-time cleanup for workingHours to remove AM/PM
    setState(prev => {
      let hasChanges = false;
      const updatedUsers = prev.users.map(u => {
        if (u.workingHours && /\s*(AM|PM)/i.test(u.workingHours)) {
          hasChanges = true;
          return { ...u, workingHours: u.workingHours.replace(/\s*(AM|PM)/gi, '') };
        }
        return u;
      });

      const updatedCheckIns = prev.checkIns.map(ci => {
        if (ci.workingHours && /\s*(AM|PM)/i.test(ci.workingHours)) {
          hasChanges = true;
          return { ...ci, workingHours: ci.workingHours.replace(/\s*(AM|PM)/gi, '') };
        }
        return ci;
      });

      if (!hasChanges) return prev;

      return {
        ...prev,
        users: updatedUsers,
        checkIns: updatedCheckIns,
        currentUser: prev.currentUser && updatedUsers.find(u => u.id === prev.currentUser!.id) || prev.currentUser
      };
    });
  }, []);

  useEffect(() => {
    calculateAchievements();

    // Cleanup: Remove any achievements wrongly awarded for the current month (e.g. 2026-03)
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    setState(prev => {
      let hasChanges = false;
      const updatedUsers = prev.users.map(u => {
        if (u.achievements && u.achievements.length > 0) {
          const filtered = u.achievements.filter(a => !a.title.startsWith(currentMonthStr));
          if (filtered.length !== u.achievements.length) {
            hasChanges = true;
            return { ...u, achievements: filtered };
          }
        }
        return u;
      });

      if (!hasChanges) return prev;

      let updatedCurrentUser = prev.currentUser;
      if (updatedCurrentUser) {
        const u = updatedUsers.find(u => u.id === updatedCurrentUser!.id);
        if (u) updatedCurrentUser = u;
      }

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser
      };
    });
  }, []); // Run once on mount

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'paynet_app_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(prev => {
            // Only update if the new state is actually different to avoid infinite loops
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
              return parsed;
            }
            return prev;
          });
        } catch (err) {
          console.error('Failed to parse state from storage event', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('paynet_auth_token');
    setState(prev => ({ ...prev, currentUser: null }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        <Auth state={state} setState={setState} language={language} setLanguage={setLanguage} />
      } />
      <Route path="/*" element={
        state.currentUser ? (
          !state.currentUser.isApproved ? (
            <div className="min-h-screen flex items-center justify-center bg-brand-black p-4">
              <div className="bg-brand-dark p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-3xl shadow-xl border border-brand-gold/20">⏳</div>
                <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">{t(language, 'pending_approval')}</h2>
                <p className="text-white/40 mb-8 font-medium leading-relaxed">{t(language, 'account_approval_wait')}</p>
                <button onClick={handleLogout} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/10">{t(language, 'logout')}</button>
              </div>
            </div>
          ) : (
            <div className={`min-h-screen bg-brand-black font-sans text-white flex flex-col lg:flex-row ${isDarkMode ? 'dark' : ''}`}>
              {/* Mobile Header */}
              <header className="lg:hidden h-16 bg-brand-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-black border border-brand-gold/50 rounded-lg flex items-center justify-center text-brand-gold shadow-lg">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-sm font-black tracking-tighter gold-text-gradient leading-none uppercase">{t(language, 'brand_name')}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-white/40 hover:text-brand-gold transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  </button>
                </div>
              </header>

              {/* Mobile Sidebar Overlay */}
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                    />
                    <motion.aside
                      initial={{ x: '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed inset-y-0 left-0 w-72 bg-brand-dark z-[70] flex flex-col lg:hidden border-r border-white/10"
                    >
                      <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-black border border-brand-gold/50 rounded-xl flex items-center justify-center text-brand-gold shadow-xl">
                            <Crown className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <h1 className="text-lg font-black tracking-tighter gold-text-gradient leading-none uppercase">{t(language, 'brand_name')}</h1>
                          </div>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/20 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-xl border border-white/10">
                          <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="flex-1 p-2 flex justify-center text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5"
                          >
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          </button>
                          <div className="w-px h-4 bg-white/10"></div>
                          <div className="relative group flex-1">
                            <button className="w-full flex justify-center items-center gap-1.5 p-2 text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5">
                              <img src={language === 'uz' ? flagUz : language === 'ru' ? flagRu : flagEn} alt={language} className="w-3.5 h-3.5 rounded-full object-cover" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{t(language, language === 'uz' ? 'uzbek' : language === 'ru' ? 'russian' : 'english')}</span>
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-48 bg-brand-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                              <button onClick={() => { setLanguage('uz'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${language === 'uz' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                                <img src={flagUz} alt="UZ" className="w-5 h-5 rounded-full object-cover" />
                                {t(language, 'uzbek')}
                              </button>
                              <button onClick={() => { setLanguage('ru'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 flex items-center gap-3 ${language === 'ru' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                                <img src={flagRu} alt="RU" className="w-5 h-5 rounded-full object-cover" />
                                {t(language, 'russian')}
                              </button>
                              <button onClick={() => { setLanguage('en'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 flex items-center gap-3 ${language === 'en' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                                <img src={flagEn} alt="EN" className="w-5 h-5 rounded-full object-cover" />
                                {t(language, 'english')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                        {state.currentUser.role === Role.MANAGER ? (
                          [
                            { id: 'overview', path: '/manager/overview', label: t(language, 'overview'), icon: '📊' },
                            { id: 'users', path: '/manager/users', label: t(language, 'employees'), icon: '👥' },
                            { id: 'monitoring', path: '/manager/monitoring', label: t(language, 'monitoring'), icon: '📈' },
                            { id: 'rating', path: '/manager/rating', label: t(language, 'rating'), icon: '🏆' },
                            { id: 'reports', path: '/manager/reports', label: t(language, 'reports'), icon: '📝' },
                            { id: 'simcards', path: '/manager/inventory', label: t(language, 'inventory_plan'), icon: '📱', count: unreadBadges.simcards > 0 ? unreadBadges.simcards : undefined },
                            { id: 'messages', path: '/manager/messages', label: t(language, 'messages'), icon: '💬', count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
                            { id: 'sales_panel', path: '/manager/sales', label: 'Savdo paneli', icon: '💼', count: unreadBadges.sales_panel > 0 ? unreadBadges.sales_panel : undefined },
                            { id: 'rules', path: '/manager/rules', label: t(language, 'rules'), icon: '📋', count: unreadBadges.rules > 0 ? unreadBadges.rules : undefined },
                            { id: 'approvals', path: '/manager/approvals', label: t(language, 'approvals'), icon: '✅', count: unreadBadges.approvals > 0 ? unreadBadges.approvals : undefined }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                navigate(tab.path);
                                setIsMobileMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-full relative flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${(location.pathname === tab.path)
                                ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{tab.icon}</span>
                                <span>{tab.label}</span>
                              </div>
                              {tab.count ? (
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
                              ) : null}
                            </button>
                          ))
                        ) : (
                          [
                            { id: 'checkin', path: '/operator/home', label: t(language, 'home'), icon: '🏠' },
                            { id: 'simcards', path: '/operator/inventory', label: t(language, 'inventory'), icon: '📱', count: unreadBadges.simcards > 0 ? unreadBadges.simcards : undefined },
                            { id: 'monitoring', path: '/operator/monitoring', label: t(language, 'monitoring'), icon: '📈' },
                            { id: 'rating', path: '/operator/rating', label: t(language, 'rating'), icon: '🏆' },
                            { id: 'messages', path: '/operator/messages', label: t(language, 'messages'), icon: '💬' },
                            { id: 'rules', path: '/operator/rules', label: t(language, 'rules'), icon: '📋', count: unreadBadges.rules > 0 ? unreadBadges.rules : undefined },
                            { id: 'sales_panel', path: '/operator/sales', label: 'Savdo paneli', icon: '💼', count: unreadBadges.sales_panel > 0 ? unreadBadges.sales_panel : undefined },
                            { id: 'profile', path: '/operator/profile', label: t(language, 'profile'), icon: '👤' }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                navigate(tab.path);
                                setIsMobileMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-full relative flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${(location.pathname === tab.path)
                                ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{tab.icon}</span>
                                <span>{tab.label}</span>
                              </div>
                              {tab.count ? (
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
                              ) : null}
                            </button>
                          ))
                        )}
                      </div>

                      <div className="p-4 border-t border-white/10">
                        <button
                          onClick={() => setIsLogoutModalOpen(true)}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-red-500/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                          {t(language, 'logout')}
                        </button>
                      </div>
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>

              {/* Desktop Sidebar */}
              <aside className={`hidden lg:flex ${isSidebarCollapsed ? 'w-20' : 'w-72'} h-screen sticky top-0 flex-col bg-brand-black/80 backdrop-blur-md border-r border-white/10 theme-blue-box z-30 shrink-0 transition-all duration-300 relative`}>
                {/* Collapse Toggle Button */}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="absolute -right-3 top-20 w-6 h-6 bg-brand-gold text-brand-black rounded-full flex items-center justify-center shadow-lg z-50 hover:scale-110 active:scale-95 transition-all border border-brand-black/20"
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                <div className={`p-6 border-b border-white/10 ${isSidebarCollapsed ? 'flex justify-center px-2' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-brand-gold rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                      <div className={`relative ${isSidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'} bg-brand-black border border-brand-gold/50 rounded-xl flex flex-col items-center justify-center text-brand-gold font-black shadow-2xl overflow-hidden transition-all`}>
                        <Crown className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-6 h-6'} mb-0.5`} />
                        {!isSidebarCollapsed && (
                          <div className="flex gap-0.5 mt-0.5">
                            <div className="w-1.5 h-1 bg-brand-gold/40 rounded-full"></div>
                            <div className="w-1.5 h-1 bg-brand-gold/40 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="flex flex-col animate-in fade-in duration-500">
                        <h1 className="text-xl font-black tracking-tighter gold-text-gradient leading-none uppercase">{t(language, 'brand_name')}</h1>
                        <h1 className="text-xs font-bold tracking-[0.2em] text-white/60 leading-none uppercase mt-1">{t(language, 'brand_subtitle')}</h1>
                      </div>
                    )}
                  </div>
                </div>

                {!isSidebarCollapsed && (
                  <div className="p-4 border-b border-white/10 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-xl border border-white/10">

                      <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="flex-1 p-2 flex justify-center text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5"
                        title={isDarkMode ? t(language, 'day_mode') : t(language, 'night_mode')}
                      >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </button>
                      <div className="w-px h-4 bg-white/10"></div>
                      <div className="relative group flex-1">
                        <button className="w-full flex justify-center items-center gap-1.5 p-2 text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5">
                          <img src={language === 'uz' ? flagUz : language === 'ru' ? flagRu : flagEn} alt={language} className="w-3.5 h-3.5 rounded-full object-cover" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t(language, language === 'uz' ? 'uzbek' : language === 'ru' ? 'russian' : 'english')}</span>
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-brand-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                          <button onClick={() => setLanguage('uz')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${language === 'uz' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                            <img src={flagUz} alt="UZ" className="w-5 h-5 rounded-full object-cover" />
                            {t(language, 'uzbek')}
                          </button>
                          <button onClick={() => setLanguage('ru')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 flex items-center gap-3 ${language === 'ru' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                            <img src={flagRu} alt="RU" className="w-5 h-5 rounded-full object-cover" />
                            {t(language, 'russian')}
                          </button>
                          <button onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 flex items-center gap-3 ${language === 'en' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                            <img src={flagEn} alt="EN" className="w-5 h-5 rounded-full object-cover" />
                            {t(language, 'english')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar ${isSidebarCollapsed ? 'px-2' : ''}`}>
                  {state.currentUser.role === Role.MANAGER ? (
                    [
                      { id: 'overview', path: '/manager/overview', label: t(language, 'overview'), icon: '📊' },
                      { id: 'users', path: '/manager/users', label: t(language, 'employees'), icon: '👥' },
                      { id: 'monitoring', path: '/manager/monitoring', label: t(language, 'monitoring'), icon: '📈' },
                      { id: 'rating', path: '/manager/rating', label: t(language, 'rating'), icon: '🏆' },
                      { id: 'reports', path: '/manager/reports', label: t(language, 'reports'), icon: '📝' },
                      { id: 'simcards', path: '/manager/inventory', label: t(language, 'inventory_plan'), icon: '📱', count: unreadBadges.simcards > 0 ? unreadBadges.simcards : undefined },
                      { id: 'messages', path: '/manager/messages', label: t(language, 'messages'), icon: '💬', count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
                      { id: 'sales_panel', path: '/manager/sales', label: 'Savdo paneli', icon: '💼', count: unreadBadges.sales_panel > 0 ? unreadBadges.sales_panel : undefined },
                      { id: 'rules', path: '/manager/rules', label: t(language, 'rules'), icon: '📋', count: unreadBadges.rules > 0 ? unreadBadges.rules : undefined },
                      { id: 'approvals', path: '/manager/approvals', label: t(language, 'approvals'), icon: '✅', count: unreadBadges.approvals > 0 ? unreadBadges.approvals : undefined },
                      { id: 'settings', path: '/manager/settings', label: t(language, 'settings'), icon: '⚙️' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigate(tab.path);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full relative flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${(location.pathname === tab.path)
                          ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                          }`}
                        title={isSidebarCollapsed ? tab.label : ''}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">{tab.icon}</span>
                          {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 truncate">{tab.label}</span>}
                        </div>
                        {!isSidebarCollapsed && tab.count ? (
                          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
                        ) : null}
                        {isSidebarCollapsed && tab.count ? (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-brand-black"></div>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    [
                      { id: 'checkin', path: '/operator/home', label: t(language, 'home'), icon: '🏠' },
                      { id: 'simcards', path: '/operator/inventory', label: t(language, 'inventory'), icon: '📱', count: unreadBadges.simcards > 0 ? unreadBadges.simcards : undefined },
                      { id: 'monitoring', path: '/operator/monitoring', label: t(language, 'monitoring'), icon: '📈' },
                      { id: 'rating', path: '/operator/rating', label: t(language, 'rating'), icon: '🏆' },
                      { id: 'messages', path: '/operator/messages', label: t(language, 'messages'), icon: '💬' },
                      { id: 'rules', path: '/operator/rules', label: t(language, 'rules'), icon: '📋', count: unreadBadges.rules > 0 ? unreadBadges.rules : undefined },
                      { id: 'sales_panel', path: '/operator/sales', label: 'Savdo paneli', icon: '💼', count: unreadBadges.sales_panel > 0 ? unreadBadges.sales_panel : undefined },
                      { id: 'profile', path: '/operator/profile', label: t(language, 'profile'), icon: '👤' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigate(tab.path);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full relative flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${(location.pathname === tab.path)
                          ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                          }`}
                        title={isSidebarCollapsed ? tab.label : ''}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">{tab.icon}</span>
                          {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 truncate">{tab.label}</span>}
                        </div>
                        {!isSidebarCollapsed && tab.count ? (
                          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
                        ) : null}
                        {isSidebarCollapsed && tab.count ? (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-brand-black"></div>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>

                <div className={`p-4 border-t border-white/10 ${isSidebarCollapsed ? 'px-2' : ''}`}>
                  <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-4' : 'justify-between'} bg-white/5 p-3 rounded-2xl border border-white/10`}>
                    <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col' : 'gap-3'}`}>
                      <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-black text-sm shrink-0">
                        {state.currentUser.firstName[0]}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="animate-in fade-in duration-300 overflow-hidden">
                          <p className="text-xs font-black text-white tracking-tight truncate">{state.currentUser.firstName} {state.currentUser.lastName}</p>
                          <p className="text-[9px] text-brand-gold font-black uppercase tracking-widest truncate">{state.currentUser.role.replace('_', ' ')}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIsLogoutModalOpen(true)}
                      className={`p-2 text-white/40 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 ${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`}
                      title={t(language, 'logout')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    </button>
                  </div>
                </div>
              </aside>

              <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
                {(() => {
                  const managerProps = {
                    state,
                    isDarkMode,
                    refreshData: fetchData,
                    language,
                    calculateAchievements,
                    approveUser: (userId: string) => setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, isApproved: true } : u) })),
                    updateUser: (userId: string, updates: any) => setState(prev => {
                      let newCheckIns = prev.checkIns;
                      if (updates.workingHours) {
                        const user = prev.users.find(u => u.id === userId);
                        if (user) {
                          const today = getTodayStr();
                          newCheckIns = prev.checkIns.map(ci => {
                            if (ci.userId === userId) {
                              const isToday = ci.date === today || isDateMatch(ci.timestamp, today);
                              if (isToday) return { ...ci, workingHours: updates.workingHours };
                              else if (!ci.workingHours && user.workingHours) return { ...ci, workingHours: user.workingHours };
                            }
                            return ci;
                          });
                        }
                      }
                      return { ...prev, users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u), checkIns: newCheckIns };
                    }),
                    updateCheckIn: (userId: string, date: string, updates: any) => setState(prev => ({ ...prev, checkIns: prev.checkIns.map(c => c.userId === userId && isDateMatch(c.timestamp, date) ? { ...c, ...updates } : c) })),
                    updateReport: (userId: string, date: string, updates: any) => setState(prev => ({ ...prev, reports: prev.reports.map(r => r.userId === userId && r.date === date ? { ...r, ...updates } : r) })),
                    addMessage: (text: string, recipientId: string) => setState(prev => ({ ...prev, messages: [...prev.messages, { id: Date.now().toString(), senderId: state.currentUser!.id, senderName: 'MENEJER', recipientId, text, timestamp: new Date().toISOString(), isRead: false }] })),
                    markMessageAsRead: (msgId: string) => setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === msgId ? { ...m, isRead: true } : m) })),
                    setActiveTab: (t: string) => navigate(t === 'overview' ? '/' : `/${t}`),
                    addSimInventory: (company: string, count: number) => setState(prev => ({ ...prev, simInventory: { ...prev.simInventory, [company]: (prev.simInventory[company] || 0) + count } })),
                    setMonthlyTarget: (month: string, targets: any, officeCounts: any, mobileOfficeCounts: any) => setState(prev => {
                      const existing = prev.monthlyTargets.find(t => t.month === month);
                      if (existing) return { ...prev, monthlyTargets: prev.monthlyTargets.map(t => t.month === month ? { ...t, targets, officeCounts, mobileOfficeCounts } : t) };
                      return { ...prev, monthlyTargets: [...prev.monthlyTargets, { month, targets, officeCounts, mobileOfficeCounts }] };
                    }),
                    addTariff: (company: string, tariff: string) => setState(prev => {
                      const currentTariffs = prev.tariffs?.[company] || [];
                      if (!currentTariffs.includes(tariff)) return { ...prev, tariffs: { ...prev.tariffs, [company]: [...currentTariffs, tariff] } };
                      return prev;
                    }),
                    removeTariff: (company: string, tariff: string) => setState(prev => ({ ...prev, tariffs: { ...prev.tariffs, [company]: (prev.tariffs?.[company] || []).filter(t => t !== tariff) } })),
                    addSalesLink: (link: any) => setState(prev => ({ ...prev, salesLinks: [...prev.salesLinks, { ...link, id: Date.now().toString(), createdAt: new Date().toISOString() }] })),
                    removeSalesLink: (linkId: string) => setState(prev => ({ ...prev, salesLinks: prev.salesLinks.filter(l => l.id !== linkId) })),
                    updateSalesLink: (linkId: string, updates: any) => setState(prev => ({ ...prev, salesLinks: prev.salesLinks.map(l => l.id === linkId ? { ...l, ...updates } : l) })),
                    showNotification
                  };

                  const operatorProps = {
                    user: state.currentUser!,
                    state,
                    addCheckIn: (checkIn: any) => setState(prev => ({ ...prev, checkIns: [...prev.checkIns, checkIn] })),
                    updateCheckIn: (userId: string, date: string, updates: any) => setState(prev => ({ ...prev, checkIns: prev.checkIns.map(c => c.userId === userId && c.timestamp.startsWith(date) ? { ...c, ...updates } : c) })),
                    updateReport: (userId: string, date: string, updates: any) => setState(prev => ({ ...prev, reports: prev.reports.map(r => r.userId === userId && r.date === date ? { ...r, ...updates } : r) })),
                    updateUser: (userId: string, updates: any) => setState(prev => {
                      let newCheckIns = prev.checkIns;
                      if (updates.workingHours) {
                        const user = prev.users.find(u => u.id === userId);
                        if (user) {
                          const today = getTodayStr();
                          newCheckIns = prev.checkIns.map(ci => {
                            if (ci.userId === userId) {
                              const isToday = ci.date === today || isDateMatch(ci.timestamp, today);
                              if (isToday) return { ...ci, workingHours: updates.workingHours };
                              else if (!ci.workingHours && user.workingHours) return { ...ci, workingHours: user.workingHours };
                            }
                            return ci;
                          });
                        }
                      }
                      return { ...prev, users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u), checkIns: newCheckIns };
                    }),
                    addSale: (sale: any) => setState(prev => {
                      const user = prev.users.find(u => u.id === sale.userId);
                      if (user && user.inventory) {
                        const newInventory = { ...user.inventory };
                        if (newInventory[sale.company] >= (sale.count + sale.bonus)) {
                          newInventory[sale.company] -= (sale.count + sale.bonus);
                          const updatedUsers = prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u);
                          return { ...prev, users: updatedUsers, currentUser: prev.currentUser && prev.currentUser.id === user.id ? { ...prev.currentUser, inventory: newInventory } : prev.currentUser, sales: [...prev.sales, sale] };
                        }
                      }
                      return prev;
                    }),
                    removeSale: (saleId: string) => setState(prev => {
                      const sale = prev.sales.find(s => s.id === saleId);
                      if (sale) {
                        const user = prev.users.find(u => u.id === sale.userId);
                        let updatedUsers = prev.users;
                        let updatedCurrentUser = prev.currentUser;
                        if (user && user.inventory) {
                          const newInventory = { ...user.inventory };
                          newInventory[sale.company] = (newInventory[sale.company] || 0) + (sale.count + sale.bonus);
                          updatedUsers = prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u);
                          if (prev.currentUser && prev.currentUser.id === user.id) updatedCurrentUser = { ...prev.currentUser, inventory: newInventory };
                        }
                        return { ...prev, users: updatedUsers, currentUser: updatedCurrentUser, sales: prev.sales.filter(s => s.id !== saleId) };
                      }
                      return prev;
                    }),
                    updateSale: (saleId: string, updates: any) => setState(prev => {
                      const oldSale = prev.sales.find(s => s.id === saleId);
                      if (oldSale) {
                        const user = prev.users.find(u => u.id === oldSale.userId);
                        if (user && user.inventory) {
                          const newInventory = { ...user.inventory };
                          newInventory[oldSale.company] = (newInventory[oldSale.company] || 0) + (oldSale.count + oldSale.bonus);
                          const newCount = updates.count !== undefined ? updates.count : oldSale.count;
                          const newBonus = updates.bonus !== undefined ? updates.bonus : oldSale.bonus;
                          const newCompany = updates.company || oldSale.company;
                          if (newInventory[newCompany] >= (newCount + newBonus)) {
                            newInventory[newCompany] -= (newCount + newBonus);
                            return { ...prev, users: prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u), sales: prev.sales.map(s => s.id === saleId ? { ...s, ...updates } : s) };
                          }
                        }
                      }
                      return prev;
                    }),
                    addReport: (report: any) => setState(prev => ({ ...prev, reports: [...prev.reports, report] })),
                    addSimInventory: (company: string, count: number) => setState(prev => {
                      const user = prev.users.find(u => u.id === state.currentUser!.id);
                      if (user) {
                        const newInventory = { ...(user.inventory || {}) };
                        newInventory[company] = (newInventory[company] || 0) + count;
                        return { ...prev, users: prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u) };
                      }
                      return prev;
                    }),
                    addMessage: (text: string) => setState(prev => ({ ...prev, messages: [...prev.messages, { id: Date.now().toString(), senderId: state.currentUser!.id, senderName: `${state.currentUser!.firstName} ${state.currentUser!.lastName}`, recipientId: 'manager', text, timestamp: new Date().toISOString(), isRead: false }] })),
                    markMessageAsRead: (msgId: string) => setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === msgId ? { ...m, isRead: true } : m) })),
                    refreshData: fetchData,
                    isDarkMode,
                    language,
                    showNotification
                  };

                  return (
                    <Routes>
                      {state.currentUser!.role === Role.MANAGER ? (
                        <>
                          <Route path="/" element={<Navigate to="/manager/overview" replace />} />
                          <Route path="/manager/overview" element={<ManagerPanel {...managerProps} activeTab="overview" />} />
                          <Route path="/manager/users" element={<ManagerPanel {...managerProps} activeTab="users" />} />
                          <Route path="/manager/monitoring" element={<ManagerPanel {...managerProps} activeTab="monitoring" />} />
                          <Route path="/manager/rating" element={<ManagerPanel {...managerProps} activeTab="rating" />} />
                          <Route path="/manager/reports" element={<ManagerPanel {...managerProps} activeTab="reports" />} />
                          <Route path="/manager/inventory" element={<ManagerPanel {...managerProps} activeTab="simcards" />} />
                          <Route path="/manager/messages" element={<ManagerPanel {...managerProps} activeTab="messages" />} />
                          <Route path="/manager/sales" element={<ManagerPanel {...managerProps} activeTab="sales_panel" />} />
                          <Route path="/manager/rules" element={<><ManagerPanel {...managerProps} activeTab="rules" /><RulesPanel state={state} setState={setState} language={language} showNotification={showNotification} /></>} />
                          <Route path="/manager/approvals" element={<ManagerPanel {...managerProps} activeTab="approvals" />} />
                          <Route path="/manager/settings" element={<ManagerPanel {...managerProps} activeTab="settings" />} />
                        </>
                      ) : (
                        <>
                          <Route path="/" element={<Navigate to="/operator/home" replace />} />
                          <Route path="/operator/home" element={<OperatorPanel {...operatorProps} activeTab="checkin" />} />
                          <Route path="/operator/inventory" element={<OperatorPanel {...operatorProps} activeTab="simcards" />} />
                          <Route path="/operator/monitoring" element={<OperatorPanel {...operatorProps} activeTab="monitoring" />} />
                          <Route path="/operator/rating" element={<OperatorPanel {...operatorProps} activeTab="rating" />} />
                          <Route path="/operator/messages" element={<OperatorPanel {...operatorProps} activeTab="messages" />} />
                          <Route path="/operator/rules" element={<RulesView state={state} language={language} />} />
                          <Route path="/operator/sales" element={<OperatorPanel {...operatorProps} activeTab="sales_panel" />} />
                          <Route path="/operator/profile" element={<OperatorPanel {...operatorProps} activeTab="profile" />} />
                        </>
                      )}
                    </Routes>
                  );
                })()}
              </main>

              <AnimatePresence>
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -20, x: '-50%' }}
                    className={`fixed top-4 left-1/2 z-[200] px-6 py-4 rounded-2xl border font-bold text-sm tracking-wide shadow-2xl flex items-center gap-3 backdrop-blur-xl ${notification.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
                  >
                    {notification.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    {notification.message}
                  </motion.div>
                )}


                {isAchievementModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-brand-dark w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
                    >
                      <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                              <RotateCcw className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-white uppercase tracking-tight">Qayta hisoblash</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Yutuqlarni qayta tekshirish</p>
                            </div>
                          </div>
                          <button onClick={() => setIsAchievementModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-white">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <p className="text-sm text-white/60 leading-relaxed">
                            Qaysi oy uchun yutuqlarni hisoblamoqchisiz? Format: YYYY-MM (masalan: 2026-02)
                          </p>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="YYYY-MM"
                              value={achievementMonthInput}
                              onChange={(e) => setAchievementMonthInput(e.target.value)}
                              className="w-full bg-brand-black border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-brand-gold outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setIsAchievementModalOpen(false)}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/10"
                          >
                            Bekor qilish
                          </button>
                          <button
                            onClick={() => {
                              if (!/^\d{4}-\d{2}$/.test(achievementMonthInput)) {
                                console.warn("Noto'g'ri format! YYYY-MM ko'rinishida kiriting.");
                                return;
                              }
                              performAchievementCalculation(achievementMonthInput);
                              setIsAchievementModalOpen(false);
                            }}
                            className="flex-1 py-4 bg-green-500 text-brand-black font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95"
                          >
                            Hisoblash
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Logout Confirmation Modal */}
                {isLogoutModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-brand-dark p-8 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-sm w-full text-center"
                    >
                      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{t(language, 'logout')}</h3>
                      <p className="text-white/40 text-sm font-medium mb-8 leading-relaxed">
                        {t(language, 'logout_confirm')}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsLogoutModalOpen(false)}
                          className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/10"
                        >
                          Yo'q
                        </button>
                        <button
                          onClick={() => {
                            setIsLogoutModalOpen(false);
                            handleLogout();
                          }}
                          className="flex-1 py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95"
                        >
                          Ha
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

export default ArrivalChecker;

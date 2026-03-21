
import React, { useState, useRef } from 'react';
import { Role, AppState, User } from '../types';
import { Phone, Lock, User as UserIcon, Crown, ChevronDown, Globe, Eye, EyeOff, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { t, Language } from '../translations';
import { authService } from '../api';

import flagUz from '../assets/flag_uz.png';
import flagRu from '../assets/flag_ru.png';
import flagEn from '../assets/flag_en.png';

interface AuthProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Auth: React.FC<AuthProps> = ({ state, setState, language, setLanguage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<'role' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '+998',
    password: '',
    role: Role.OPERATOR
  });
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const formatPhoneNumber = (value: string) => {
    if (!value) return '+998';
    let phoneNumber = value.replace(/[^\d]/g, '');
    if (!phoneNumber.startsWith('998')) {
        phoneNumber = '998' + phoneNumber;
    }
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength <= 3) return `+${phoneNumber}`;
    if (phoneNumberLength <= 5) return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    if (phoneNumberLength <= 8) return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5)}`;
    if (phoneNumberLength <= 10) return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8)}`;
    return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8, 10)} ${phoneNumber.slice(10, 12)}`;
  };

  const nameRegex = /^[A-ZА-ЯЁ][a-zа-яёA-ZА-ЯЁ\s'-]*$/;

  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    let firstErrorMsg = '';

    if (isLogin) {
      if (!authForm.nickname || authForm.nickname.length < 6) {
        errors.nickname = true;
        firstErrorMsg = firstErrorMsg || t(language, 'login_min_length');
      }
      if (!authForm.password || authForm.password.length < 6) {
        errors.password = true;
        firstErrorMsg = firstErrorMsg || "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
      }
    } else {
      if (!authForm.firstName?.trim() || !nameRegex.test(authForm.firstName.trim())) {
        errors.firstName = true;
        firstErrorMsg = firstErrorMsg || t(language, 'name_format_error');
      }
      if (!authForm.lastName?.trim() || !nameRegex.test(authForm.lastName.trim())) {
        errors.lastName = true;
        firstErrorMsg = firstErrorMsg || t(language, 'surname_format_error');
      }
      if (!authForm.nickname || authForm.nickname.length < 6) {
        errors.nickname = true;
        firstErrorMsg = firstErrorMsg || t(language, 'login_min_length');
      }
      if (!authForm.password || authForm.password.length < 6) {
        errors.password = true;
        firstErrorMsg = firstErrorMsg || "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
      }
      if (authForm.phone.replace(/[^\d]/g, '').length !== 12) {
        errors.phone = true;
        firstErrorMsg = firstErrorMsg || t(language, 'phone_format_error');
      }
    }

    setFieldErrors(errors);
    if (firstErrorMsg) setError(firstErrorMsg);
    return Object.keys(errors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError('');
    setIsSuccess(false);

    try {
      if (isLogin) {
        const loginRes = await authService.login({
          username: authForm.nickname, // This can be nickname or phone, backend handles it
          password: authForm.password
        });
        localStorage.setItem('paynet_auth_token', loginRes.data.access);
        const userRes = await authService.getMe();
        setState(prev => ({ ...prev, currentUser: userRes.data }));
      } else {
        const signupRes = await authService.register({
          phone: authForm.phone.replace(/[^\d]/g, ''),
          nickname: authForm.nickname,
          password: authForm.password,
          first_name: authForm.firstName,
          last_name: authForm.lastName,
          role: authForm.role
        });
        setError(t(language, 'signup_success'));
        setIsSuccess(true);
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth error", err);
      const serverErr = err.response?.data;
      let displayError = t(language, isLogin ? 'login_failed' : 'auth_error');

      if (serverErr) {
        if (typeof serverErr === 'string') {
          displayError = serverErr;
        } else {
          // Identify first field error from backend response (e.g., username, phone)
          const fields = Object.keys(serverErr);
          if (fields.length > 0) {
            const firstField = fields[0];
            const firstVal = serverErr[firstField];
            const rawMsg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
            
            if (rawMsg && rawMsg !== 'undefined' && rawMsg !== '[object Object]') {
               const lowerMsg = rawMsg.toLowerCase();
               if (lowerMsg.includes('phone') && (lowerMsg.includes('exists') || lowerMsg.includes('raqam'))) {
                 displayError = t(language, 'phone_exists_error');
               } else if (lowerMsg.includes('already exists') || lowerMsg.includes('already taken') || lowerMsg.includes('band')) {
                 displayError = t(language, 'nickname_exists_error');
               } else {
                 displayError = rawMsg;
               }
            } else if (serverErr.detail) {
               displayError = serverErr.detail;
            }
          }
        }
      }
      setError(displayError);
      setIsSuccess(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) nextField.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-dark/40 backdrop-blur-md border border-white/10 rounded-xl text-white/60 hover:text-brand-gold transition-all">
            <img src={language === 'uz' ? flagUz : language === 'ru' ? flagRu : flagEn} alt={language} className="w-3.5 h-3.5 rounded-full object-cover" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t(language, language === 'uz' ? 'uzbek' : language === 'ru' ? 'russian' : 'english')}</span>
          </button>
          <div className="absolute right-0 top-full mt-2 w-32 bg-brand-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button type="button" onClick={() => setLanguage('uz')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${language === 'uz' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <img src={flagUz} alt="UZ" className="w-4 h-4 rounded-full object-cover" />
              {t(language, 'uzbek')}
            </button>
            <button type="button" onClick={() => setLanguage('ru')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 flex items-center gap-3 ${language === 'ru' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <img src={flagRu} alt="RU" className="w-4 h-4 rounded-full object-cover" />
              {t(language, 'russian')}
            </button>
            <button type="button" onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 flex items-center gap-3 ${language === 'en' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <img src={flagEn} alt="EN" className="w-4 h-4 rounded-full object-cover" />
              {t(language, 'english')}
            </button>
          </div>
        </div>
      </div>

      <div className={`theme-blue-box bg-brand-dark/40 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-md relative z-10 transition-all duration-300 ${fieldErrors.password && !isLogin ? 'animate-shake' : ''}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-black border-2 border-brand-gold/30 rounded-3xl mb-4 shadow-2xl shadow-brand-gold/10">
            <Crown className="w-10 h-10 text-brand-gold" />
          </div>
          <h1 className="text-4xl font-black gold-text-gradient mb-1 uppercase tracking-tighter">{t(language, 'brand_name')}</h1>
          <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{t(language, 'brand_subtitle')}</p>
          <div className="h-px w-12 bg-brand-gold/30 mx-auto"></div>
          <p className="text-white/40 text-xs font-medium mt-4">{isLogin ? t(language, 'login_title') : t(language, 'signup_title')}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {error && (
            <div className={`${isSuccess ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} p-4 rounded-2xl text-xs font-bold border flex items-center gap-3`}>
              {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    required
                    className={`peer w-full px-5 py-4 bg-white/5 border rounded-2xl text-sm font-bold text-white placeholder-transparent focus:outline-none transition-all ${fieldErrors.firstName ? 'border-red-500' : 'border-white/10 focus:border-brand-gold'}`}
                    value={authForm.firstName}
                    placeholder={t(language, 'first_name')}
                    onKeyDown={(e) => handleKeyDown(e, 'lastName')}
                    onChange={e => {
                        const val = e.target.value;
                        const formatted = val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : '';
                        setAuthForm({ ...authForm, firstName: formatted });
                    }}
                  />
                  <label className="absolute left-5 -top-2.5 bg-brand-dark/80 px-1 text-[10px] font-black text-white/40 uppercase tracking-widest transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-brand-gold">{t(language, 'first_name')}</label>
                </div>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    required
                    className={`peer w-full px-5 py-4 bg-white/5 border rounded-2xl text-sm font-bold text-white placeholder-transparent focus:outline-none transition-all ${fieldErrors.lastName ? 'border-red-500' : 'border-white/10 focus:border-brand-gold'}`}
                    value={authForm.lastName}
                    placeholder={t(language, 'last_name')}
                    onKeyDown={(e) => handleKeyDown(e, 'nickname')}
                    onChange={e => {
                        const val = e.target.value;
                        const formatted = val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : '';
                        setAuthForm({ ...authForm, lastName: formatted });
                    }}
                  />
                  <label className="absolute left-5 -top-2.5 bg-brand-dark/80 px-1 text-[10px] font-black text-white/40 uppercase tracking-widest transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-brand-gold">{t(language, 'last_name')}</label>
                </div>
              </div>
            )}

            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold w-5 h-5 transition-colors" />
              <input
                id="nickname"
                type="text"
                placeholder={isLogin ? t(language, 'login_nickname_label') : t(language, 'nickname')}
                required
                className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:outline-none transition-all ${fieldErrors.nickname ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-brand-gold'}`}
                value={authForm.nickname}
                onKeyDown={(e) => handleKeyDown(e, isLogin ? 'password' : 'phone')}
                onChange={e => setAuthForm({ ...authForm, nickname: e.target.value })}
              />
            </div>

            {!isLogin && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Smartphone className="text-white/20 group-focus-within:text-brand-gold w-5 h-5" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  placeholder={t(language, 'phone_number')}
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:outline-none transition-all ${fieldErrors.phone ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-brand-gold'}`}
                  value={authForm.phone}
                  onKeyDown={(e) => handleKeyDown(e, 'password')}
                  onChange={e => setAuthForm({ ...authForm, phone: formatPhoneNumber(e.target.value) })}
                />
                <label className="absolute left-10 -top-2.5 bg-brand-dark/80 px-1 text-[10px] font-black text-white/40 uppercase tracking-widest">{t(language, 'phone_number')}</label>
              </div>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold w-5 h-5 transition-colors" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t(language, 'password')}
                required
                className={`w-full pl-12 pr-12 py-4 bg-white/5 border rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:outline-none transition-all ${((!isLogin && authForm.password.length > 0 && authForm.password.length < 6) || fieldErrors.password) ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-brand-gold'}`}
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div />
          </div>

          <button
            type="submit"
            disabled={!isLogin && authForm.password.length > 0 && authForm.password.length < 6}
            className={`w-full py-5 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all mt-4 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${!isLogin && authForm.password.length > 0 && authForm.password.length < 6 ? '' : 'hover:scale-[1.02] active:scale-95 shadow-brand-gold/20'}`}
          >
            {isLogin ? t(language, 'login_button') : t(language, 'signup_button')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setIsSuccess(false);
              setFieldErrors({});
              setAuthForm({
                firstName: '',
                lastName: '',
                nickname: '',
                phone: '+998',
                password: '',
                role: Role.OPERATOR
              });
            }}
            className="text-white/40 hover:text-brand-gold text-xs font-bold transition-colors uppercase tracking-widest"
          >
            {isLogin ? t(language, 'no_account') : t(language, 'have_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

import React from 'react';
import { Language, UserRole, FamilyProfile } from '../types';
import { translations } from '../data/translations';
import { 
  Globe, 
  PhoneCall, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  Wifi, 
  WifiOff,
  ChevronDown,
  Settings,
  LogOut
} from 'lucide-react';
import { clearAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeProfile: FamilyProfile | null;
  onOpenProfilePicker: () => void;
  onOpenAccountSettings?: () => void;
  lowBandwidthMode: boolean;
  onToggleLowBandwidth: () => void;
  onTriggerEmergency: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  currentRole,
  onRoleChange,
  activeProfile,
  onOpenProfilePicker,
  onOpenAccountSettings,
  lowBandwidthMode,
  onToggleLowBandwidth,
  onTriggerEmergency
}) => {
  const t = translations[currentLanguage];
  const navigate = useNavigate();

  const handleSignOut = () => {
    clearAuth();
    navigate('/signin');
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-surface-container-high shadow-xs">
      {/* Top Telemedicine Status Bar */}
      <div className="bg-primary-container text-on-primary px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-sm text-primary-fixed">campaign</span>
          <span className="hidden sm:inline font-medium text-[11px]">
            National Telemedicine Mission • Ayushman Bharat Digital Health (ABDM)
          </span>
          <span className="hidden sm:inline text-primary-fixed/40">|</span>
          <button
            onClick={onToggleLowBandwidth}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
              lowBandwidthMode 
                ? 'bg-secondary-fixed text-on-secondary-fixed' 
                : 'bg-primary-fixed text-on-primary-fixed'
            }`}
          >
            {lowBandwidthMode ? <WifiOff className="w-3 h-3 text-secondary" /> : <Wifi className="w-3 h-3 text-primary" />}
            <span>{lowBandwidthMode ? '48kbps Ultra-Lite (Active)' : 'Adaptive Bandwidth'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerEmergency}
            className="flex items-center gap-1 px-3 py-0.5 bg-error text-on-error font-bold rounded-full text-[11px] shadow-xs hover:bg-on-error-container transition-colors animate-pulse"
          >
            <PhoneCall className="w-3 h-3" />
            <span>108 EMERGENCY</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xl shadow-sm">
            🩺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-primary text-base sm:text-lg leading-tight tracking-tight">
                RuralCare Connect
              </h1>
              <span className="text-[10px] bg-primary-fixed text-on-primary-fixed font-bold px-1.5 py-0.5 rounded">
                ग्रामीण सेवा
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant hidden sm:block">
              AI-Assisted Rural Telemedicine &amp; Triage
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="appearance-none bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl pl-7 pr-7 py-2 cursor-pointer border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
              title="Change Language anytime (FR-1.2)"
            >
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="en">English</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-on-surface-variant absolute left-2 top-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Active Household Profile Pill */}
          {currentRole === 'PATIENT' && activeProfile && (
            <button
              onClick={onOpenProfilePicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-fixed/30 hover:bg-primary-fixed/50 border border-primary/20 text-primary text-xs font-bold transition"
              title="Switch household profile (FR-1.9)"
            >
              <span className="text-base">{activeProfile.avatar}</span>
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{activeProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-primary" />
            </button>
          )}

          {/* Account Settings */}
          {onOpenAccountSettings && (
            <button
              onClick={onOpenAccountSettings}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-surface-container-high transition"
              title="Account, Consent & Privacy Settings (FR-1.3, FR-1.5, FR-1.9)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Role Switcher Pill (Patient & Doctor) */}
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-xl border border-surface-container-high">
            <button
              onClick={() => {
                onRoleChange('PATIENT');
                if (window.location.pathname.startsWith('/doctor')) {
                  navigate('/patient');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentRole === 'PATIENT'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.patientRole}</span>
            </button>

            <button
              onClick={() => {
                onRoleChange('DOCTOR');
                if (!window.location.pathname.startsWith('/doctor')) {
                  navigate('/doctor');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentRole === 'DOCTOR'
                  ? 'bg-tertiary text-on-tertiary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{t.doctorRole}</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/30 border border-surface-container-high transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

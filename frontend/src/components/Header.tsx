import React from 'react';
import { Language, UserRole, FamilyProfile } from '../types';
import { translations } from '../data/translations';
import { 
  HeartPulse, 
  Globe, 
  PhoneCall, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  Wifi, 
  WifiOff,
  ChevronDown,
  Settings,
  ShieldCheck
} from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Emergency & Low-Bandwidth Alert Bar */}
      <div className="bg-slate-900 text-slate-100 px-3 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLowBandwidth}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              lowBandwidthMode 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle 2G/3G low-data mode"
          >
            {lowBandwidthMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{lowBandwidthMode ? '2G/3G Low Data: ON (150kbps)' : 'Normal Data'}</span>
          </button>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-300">RuralCare Connect • PRD Compliant</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerEmergency}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded animate-pulse"
          >
            <PhoneCall className="w-3 h-3" />
            <span>108 EMERGENCY</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                {t.appTitle}
              </h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                FR-1 Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2">
          {/* FR-1.2: Language Switcher (Change anytime) */}
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl pl-7 pr-7 py-2 cursor-pointer border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Change Language anytime (FR-1.2)"
            >
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="en">English</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* FR-1.4 & FR-1.9: Active Household Profile Pill */}
          {currentRole === 'PATIENT' && activeProfile && (
            <button
              onClick={onOpenProfilePicker}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold transition"
              title="Switch household profile (FR-1.9)"
            >
              <span className="text-base">{activeProfile.avatar}</span>
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{activeProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-emerald-700" />
            </button>
          )}

          {/* FR-1.3, FR-1.5: Account & Privacy Settings Button */}
          {onOpenAccountSettings && (
            <button
              onClick={onOpenAccountSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="Account, Consent & Privacy Settings (FR-1.3, FR-1.5, FR-1.9)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => onRoleChange('PATIENT')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentRole === 'PATIENT'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.patientRole}</span>
            </button>

            <button
              onClick={() => onRoleChange('DOCTOR')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentRole === 'DOCTOR'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.doctorRole}</span>
            </button>

            <button
              onClick={() => onRoleChange('ADMIN')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentRole === 'ADMIN'
                  ? 'bg-white text-purple-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.adminRole}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Language, 
  FamilyProfile, 
  ClinicalTriageResult, 
  Doctor, 
  CallBandwidthMode 
} from '../types';
import { translations } from '../data/translations';
import { 
  Users, 
  Clock, 
  Video, 
  Wifi, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Tag, 
  CheckCircle,
  Stethoscope,
  PhoneCall
} from 'lucide-react';

interface ConsultationQueueProps {
  currentLanguage: Language;
  activeProfile: FamilyProfile;
  triageSummary: ClinicalTriageResult | null;
  assignedDoctor: Doctor;
  bandwidthMode: CallBandwidthMode;
  onBandwidthChange: (mode: CallBandwidthMode) => void;
  onJoinCall: () => void;
}

export const ConsultationQueue: React.FC<ConsultationQueueProps> = ({
  currentLanguage,
  activeProfile,
  triageSummary,
  assignedDoctor,
  bandwidthMode,
  onBandwidthChange,
  onJoinCall
}) => {
  const t = translations[currentLanguage];

  const [queuePosition, setQueuePosition] = useState(2);
  const [estimatedWaitMins, setEstimatedWaitMins] = useState(4);
  const [promoCode, setPromoCode] = useState('');
  const [isSponsored, setIsSponsored] = useState(true);
  const [sponsorName, setSponsorName] = useState('National Rural Health Mission (Free)');

  // Simulate queue countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setEstimatedWaitMins((prev) => (prev > 1 ? prev - 1 : 1));
      setQueuePosition((prev) => (prev > 1 ? prev - 1 : 1));
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === 'AYUSHMAN' || promoCode.toUpperCase() === 'NGO-FREE') {
      setIsSponsored(true);
      setSponsorName('Govt Ayushman Sponsored');
    } else {
      alert('Voucher applied: Sponsored Consult Granted!');
      setIsSponsored(true);
      setSponsorName('Gramin Health Partner Fund');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Waiting Room Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-600 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded">
              {t.queueTitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">{t.youAreInQueue}</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Patient: <span className="font-bold">{activeProfile.name}</span> ({activeProfile.age} Yrs, {activeProfile.relation})
            </p>
          </div>

          <div className="text-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
            <div className="text-2xl sm:text-3xl font-black">{queuePosition}</div>
            <div className="text-[10px] uppercase font-bold text-emerald-100">{t.queuePosition}</div>
          </div>
        </div>

        {/* Live Wait Time & Status */}
        <div className="mt-6 pt-4 border-t border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-200" />
            <span>Estimated time to doctor: <strong>~{estimatedWaitMins} minutes</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-800/60 px-3 py-1 rounded-full text-[11px] border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Doctor is concluding previous consult</span>
          </div>
        </div>
      </div>

      {/* Assigned Doctor Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          {t.yourDoctor}
        </h3>
        <div className="flex items-center gap-4">
          <img
            src={assignedDoctor.avatar}
            alt={assignedDoctor.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-base">Dr. {assignedDoctor.name}</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Verified NMC Doctor
              </span>
            </div>
            <p className="text-xs text-slate-600">{assignedDoctor.specialization} • {assignedDoctor.experienceYears} Years Exp</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Reg No: <span className="font-mono font-medium text-slate-700">{assignedDoctor.registrationNumber}</span> ({assignedDoctor.councilName})
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">
              Languages: {assignedDoctor.languages.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Bandwidth Mode Settings (PRD FR-4.2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">{t.bandwidthModeLabel}</h3>
          </div>
          <span className="text-[11px] text-slate-500">Optimized for weak rural network</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onBandwidthChange('ADAPTIVE')}
            className={`p-3 rounded-xl border-2 text-left text-xs transition ${
              bandwidthMode === 'ADAPTIVE'
                ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span>{t.modeAdaptive}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-1">Auto-adjusts for 4G/WiFi</p>
          </button>

          <button
            type="button"
            onClick={() => onBandwidthChange('LOW_RES_VIDEO')}
            className={`p-3 rounded-xl border-2 text-left text-xs transition ${
              bandwidthMode === 'LOW_RES_VIDEO'
                ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span>{t.modeLowRes}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-1">Lightweight video on 3G</p>
          </button>

          <button
            type="button"
            onClick={() => onBandwidthChange('AUDIO_ONLY')}
            className={`p-3 rounded-xl border-2 text-left text-xs transition ${
              bandwidthMode === 'AUDIO_ONLY'
                ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span>{t.modeAudioOnly}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-1">Works reliably on 2G</p>
          </button>
        </div>
      </div>

      {/* Payment / Sponsored Voucher (PRD 6.1) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900">Consultation Fee & Sponsorship</h4>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {isSponsored ? 'FREE / SPONSORED' : '₹50 (UPI)'}
          </span>
        </div>

        {isSponsored ? (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Consultation 100% sponsored by <strong>{sponsorName}</strong>. No charge to patient.</span>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter Partner / NGO / Ayushman Code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg flex-1"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700"
            >
              Apply Voucher
            </button>
          </form>
        )}
      </div>

      {/* Join Call Action */}
      <div className="pt-2">
        <button
          onClick={onJoinCall}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition text-base flex items-center justify-center gap-3 active:scale-98"
        >
          <Video className="w-6 h-6 animate-pulse" />
          <span>Enter Video Consultation Room Now</span>
        </button>
        <p className="text-[11px] text-slate-500 text-center mt-2">
          {t.rejoinGraceBanner}
        </p>
      </div>
    </div>
  );
};

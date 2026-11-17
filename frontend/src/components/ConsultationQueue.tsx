import React, { useState, useEffect } from 'react';
import { 
  Language, 
  FamilyProfile, 
  ClinicalTriageResult, 
  Doctor, 
  CallBandwidthMode 
} from '../types';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';
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
  PhoneCall,
  Volume2,
  AlertCircle
} from 'lucide-react';

interface ConsultationQueueProps {
  currentLanguage: Language;
  activeProfile: FamilyProfile;
  triageSummary: ClinicalTriageResult | null;
  assignedDoctor: Doctor;
  bandwidthMode: CallBandwidthMode;
  onBandwidthChange: (mode: CallBandwidthMode) => void;
  onJoinCall: () => void;
  consultationId?: string;
}

export const ConsultationQueue: React.FC<ConsultationQueueProps> = ({
  currentLanguage,
  activeProfile,
  triageSummary,
  assignedDoctor,
  bandwidthMode,
  onBandwidthChange,
  onJoinCall,
  consultationId
}) => {
  const t = translations[currentLanguage];

  const [queuePosition, setQueuePosition] = useState(1);
  const [estimatedWaitMins, setEstimatedWaitMins] = useState(2);
  const [promoCode, setPromoCode] = useState('');
  const [isSponsored, setIsSponsored] = useState(true);
  const [sponsorName, setSponsorName] = useState('National Rural Health Mission (Free)');
  const [isDoctorReady, setIsDoctorReady] = useState(false);
  const [lastAnnouncedStatus, setLastAnnouncedStatus] = useState('');

  // Speech helper for rural accessibility
  const speakStatus = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = currentLanguage === 'gu' ? 'gu-IN' : currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  // Poll backend for real live queue status
  useEffect(() => {
    let active = true;

    const checkQueue = async () => {
      try {
        if (consultationId) {
          const res = await ApiService.getQueueStatus(consultationId);
          if (active && res && res.success && res.consultation) {
            const consult = res.consultation;
            if (consult.queuePosition !== undefined) {
              setQueuePosition(consult.queuePosition);
            }
            if (consult.estimatedWaitMinutes !== undefined) {
              setEstimatedWaitMins(consult.estimatedWaitMinutes);
            }
            if (consult.status === 'IN_CALL') {
              setIsDoctorReady(true);
            }
          }
        } else {
          // Fallback poll global queue
          const res = await ApiService.getQueue();
          if (active && res && res.success && Array.isArray(res.queue)) {
            const idx = res.queue.findIndex((c: any) => c.patientPhoneNumber === activeProfile.id || c.id === consultationId);
            if (idx !== -1) {
              setQueuePosition(idx + 1);
              setEstimatedWaitMins(idx * 3);
            }
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [consultationId, activeProfile.id]);

  // Audio alert when doctor is ready
  useEffect(() => {
    if (isDoctorReady && lastAnnouncedStatus !== 'READY') {
      setLastAnnouncedStatus('READY');
      const phrase = currentLanguage === 'gu'
        ? 'ડોક્ટર રમેશ પટેલ તમારી સાથે જોડાઈ ગયા છે. કૃપા કરીને વિડીયો રૂમમાં પ્રવેશ કરો.'
        : currentLanguage === 'hi'
        ? 'डॉक्टर रमेश पटेल आपसे जुड़ चुके हैं। कृपया वीडियो परामर्श कक्ष में प्रवेश करें।'
        : 'Doctor Ramesh Patel is ready for your consultation. Please enter the video room now.';
      speakStatus(phrase);
    }
  }, [isDoctorReady, currentLanguage]);

  const handleHearStatus = () => {
    const phrase = currentLanguage === 'gu'
      ? `તમારી કતાર સ્થિતિ નંબર ${queuePosition} છે. અંદાજિત સમય ${estimatedWaitMins} મિનિટ છે.`
      : currentLanguage === 'hi'
      ? `आपकी कतार संख्या ${queuePosition} है। डॉक्टर से मिलने का अनुमानित समय ${estimatedWaitMins} मिनट है।`
      : `You are at position ${queuePosition} in the queue. Estimated wait time is ${estimatedWaitMins} minutes.`;
    speakStatus(phrase);
  };

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
      {/* Doctor Ready Banner */}
      {isDoctorReady && (
        <div className="p-4 bg-emerald-700 text-white rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩺</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {currentLanguage === 'hi' 
                  ? 'डॉक्टर रमेश पटेल आपसे जुड़ चुके हैं!' 
                  : currentLanguage === 'gu'
                  ? 'ડોક્ટર રમેશ પટેલ તમારી સાથે જોડાઈ ગયા છે!'
                  : 'Doctor is ready in the consult room!'}
              </h3>
              <p className="text-xs text-emerald-100">
                {currentLanguage === 'hi' ? 'कृपया तुरंत वीडियो कक्ष में प्रवेश करें।' : 'Click the button below to join consultation.'}
              </p>
            </div>
          </div>
          <button
            onClick={onJoinCall}
            className="px-4 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl shadow-md hover:bg-emerald-50 active:scale-95 transition"
          >
            {currentLanguage === 'hi' ? 'अभी जुड़ें' : 'Join Now'}
          </button>
        </div>
      )}

      {/* Waiting Room Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded">
                {t.queueTitle}
              </span>
              <button
                type="button"
                onClick={handleHearStatus}
                className="text-[11px] font-bold bg-white/25 hover:bg-white/40 text-white px-2 py-0.5 rounded flex items-center gap-1 transition"
                title="Speak status aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Status / स्थिति सुनें</span>
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-2">{t.youAreInQueue}</h2>
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

          <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-full text-[11px] border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isDoctorReady ? 'Doctor Ready • Calling You' : 'Active Clinical Queue • Connected'}</span>
          </div>
        </div>
      </div>

      {/* Assigned Doctor Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          {t.yourDoctor}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl border border-emerald-200 shrink-0">
              👨🏽‍⚕️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900">{assignedDoctor.name}</h4>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> NMC Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{assignedDoctor.specialization}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reg: {assignedDoctor.registrationNumber} • {assignedDoctor.experienceYears} Years Exp
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <div className="font-semibold text-slate-800">Spoken Languages:</div>
            <div className="text-slate-600 text-[11px] mt-0.5">{assignedDoctor.languages.join(', ')}</div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">★ 4.9 Rating (1,420+ Consultations)</div>
          </div>
        </div>
      </div>

      {/* Triage Summary Mini Drawer (FR-4.4) */}
      {triageSummary && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              AI Intake Summary Pre-Populated for Doctor
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              triageSummary.triageLevel === 'EMERGENCY' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {triageSummary.triageLevel}
            </span>
          </div>
          <p className="text-slate-600">
            <strong>Chief Complaint:</strong> {triageSummary.primaryComplaint || 'General Evaluation'}
          </p>
          {triageSummary.approvedInterimAdvice && triageSummary.approvedInterimAdvice.length > 0 && (
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <strong>Interim Advice:</strong> {triageSummary.approvedInterimAdvice[0]}
            </div>
          )}
        </div>
      )}

      {/* Adaptive Bandwidth Selector (FR-4.2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900">Network Bandwidth Mode / नेटवर्क सेटिंग</h4>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            FR-4.2 Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Payment / Sponsored Voucher */}
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

      {/* Join Call Action - Doctor Controlled Admission */}
      <div className="pt-2">
        <button
          onClick={onJoinCall}
          disabled={!isDoctorReady}
          className={`w-full py-4 font-bold rounded-2xl shadow-lg transition text-base flex items-center justify-center gap-3 ${
            isDoctorReady
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse active:scale-98 shadow-emerald-600/30 cursor-pointer'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
          }`}
        >
          <Video className="w-6 h-6" />
          <span>
            {isDoctorReady
              ? '✅ Doctor Has Admitted You — Enter Video Room (प्रवेश करें)'
              : '⏳ Waiting for Doctor to Admit You... (डॉक्टर के बुलाने की प्रतीक्षा करें)'}
          </span>
        </button>
        <p className="text-[11px] text-slate-500 text-center mt-2">
          {isDoctorReady
            ? 'Dr. Ramesh Patel is in the consultation room waiting for you.'
            : 'Only the doctor can start the meeting. Please keep this screen open.'}
        </p>
      </div>
    </div>
  );
};

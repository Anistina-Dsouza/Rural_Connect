import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { NEARBY_RURAL_FACILITIES } from '../data/clinicalLibrary';
import { 
  PhoneCall, 
  AlertOctagon, 
  MapPin, 
  Navigation, 
  Clock, 
  Building2, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

interface EmergencyScreenProps {
  currentLanguage: Language;
  redFlags: string[];
  onBackToNormal: () => void;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({
  currentLanguage,
  redFlags,
  onBackToNormal
}) => {
  const t = translations[currentLanguage];

  const handleCall108 = () => {
    window.location.href = 'tel:108';
  };

  const handleCall112 = () => {
    window.location.href = 'tel:112';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* High Alert Banner */}
      <div className="bg-red-600 text-white rounded-2xl p-6 shadow-xl border-2 border-red-700 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertOctagon className="w-9 h-9 text-white" />
          </div>
          <div>
            <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              HIGH PRIORITY TRIAGE ESCALATION
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {t.triageEmergencyTitle}
            </h2>
            <p className="text-sm text-red-100 mt-1 leading-relaxed">
              {t.triageEmergencyDesc}
            </p>
          </div>
        </div>

        {/* Immediate Call Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleCall108}
            className="w-full py-4 bg-white hover:bg-slate-100 text-red-700 font-black rounded-xl text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition"
          >
            <PhoneCall className="w-6 h-6 text-red-600 animate-bounce" />
            <span>{t.callAmbulance108}</span>
          </button>

          <button
            onClick={handleCall112}
            className="w-full py-4 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 border border-red-500 shadow-md active:scale-95 transition"
          >
            <PhoneCall className="w-5 h-5" />
            <span>{t.callEmergency112}</span>
          </button>
        </div>
      </div>

      {/* Detected Red Flags Summary */}
      {redFlags.length > 0 && (
        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2 text-red-700">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            Clinical Red-Flag Trigger(s) Identified:
          </h3>
          <ul className="space-y-1 text-xs text-slate-700 pl-2">
            {redFlags.map((flag, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span className="font-semibold">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nearby Rural Emergency Facilities Locator (PRD FR-3.2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">{t.nearbyClinics}</h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            GPS: Taluka Center Cluster
          </span>
        </div>

        <div className="space-y-3">
          {NEARBY_RURAL_FACILITIES.map((facility, idx) => (
            <div
              key={idx}
              className="border border-slate-200 hover:border-emerald-300 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{facility.name}</h4>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {facility.distance}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{facility.type}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Ambulance ETA: {facility.ambulanceTime}
                  </span>
                  <span>•</span>
                  <span>{facility.beds}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${facility.phone.split(' ')[0]}`}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Hospital</span>
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(facility.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBackToNormal}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Chat & Assessment</span>
        </button>
      </div>
    </div>
  );
};

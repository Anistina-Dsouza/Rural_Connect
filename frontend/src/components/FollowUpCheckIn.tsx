import React, { useState } from 'react';
import { Language, FamilyProfile, Prescription } from '../types';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';
import { speakText } from '../utils/speech';
import { 
  HeartHandshake, 
  Smile, 
  Meh, 
  Frown, 
  Volume2, 
  PhoneCall, 
  Video, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  Stethoscope
} from 'lucide-react';

interface FollowUpCheckInProps {
  currentLanguage: Language;
  activeProfile: FamilyProfile;
  prescription: Prescription;
  onConsultDoctorReview: () => void;
  onEmergencyTriggered: (redFlags: string[]) => void;
  onClose: () => void;
}

export const FollowUpCheckIn: React.FC<FollowUpCheckInProps> = ({
  currentLanguage,
  activeProfile,
  prescription,
  onConsultDoctorReview,
  onEmergencyTriggered,
  onClose
}) => {
  const t = translations[currentLanguage];

  type OutcomeStatus = 'IMPROVED' | 'SAME' | 'WORSENED' | null;
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeStatus>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);

  const handleReadAloud = (textToSpeak: string) => {
    speakText(textToSpeak, currentLanguage);
  };

  const handleSelectOutcome = async (outcome: 'IMPROVED' | 'SAME' | 'WORSENED') => {
    setSelectedOutcome(outcome);
    setIsSubmitting(true);

    try {
      await ApiService.submitFollowUpCheckIn({
        prescriptionId: prescription.id,
        patientPhone: prescription.patientPhone || '9876543210',
        profileId: activeProfile.id,
        patientName: activeProfile.name,
        status: outcome,
        feedbackNotes: additionalNotes
      });
      setSubmissionCompleted(true);
    } catch (err) {
      console.warn('Follow-up check-in note:', err);
      setSubmissionCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Card: Active Prescription Context */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Prescription Follow-up (FR-6.5)
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                {prescription.diagnosis}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Patient: <strong className="text-slate-900">{prescription.patientName}</strong> ({activeProfile.age} Yrs)
          </div>
          <div>
            Doctor: <strong className="text-slate-900">Dr. {prescription.doctorName}</strong>
          </div>
          <div>
            Issued: <span className="font-medium text-slate-700">{prescription.doctorSignatureDate}</span>
          </div>
        </div>
      </div>

      {/* Main Check-In Inquiry */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t.howAreYouFeeling}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select one of the three options below to record your current health recovery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleReadAloud(t.howAreYouFeeling)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition flex-shrink-0"
            title="Read Question Aloud"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Large Touch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option 1: Much Better */}
          <button
            type="button"
            onClick={() => handleSelectOutcome('IMPROVED')}
            className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 ${
              selectedOutcome === 'IMPROVED'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-md'
                : 'border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-white text-slate-700'
            }`}
          >
            <span className="text-4xl">😊</span>
            <div className="font-bold text-xs leading-snug">
              {t.feelingMuchBetter}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Improving
            </span>
          </button>

          {/* Option 2: About the Same */}
          <button
            type="button"
            onClick={() => handleSelectOutcome('SAME')}
            className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 ${
              selectedOutcome === 'SAME'
                ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-md'
                : 'border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-white text-slate-700'
            }`}
          >
            <span className="text-4xl">😐</span>
            <div className="font-bold text-xs leading-snug">
              {t.feelingAboutSame}
            </div>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
              Same
            </span>
          </button>

          {/* Option 3: Worse */}
          <button
            type="button"
            onClick={() => handleSelectOutcome('WORSENED')}
            className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 ${
              selectedOutcome === 'WORSENED'
                ? 'border-red-600 bg-red-50 text-red-950 font-bold shadow-md'
                : 'border-slate-200 hover:border-red-300 bg-slate-50/50 hover:bg-white text-slate-700'
            }`}
          >
            <span className="text-4xl">😟</span>
            <div className="font-bold text-xs leading-snug">
              {t.feelingWorse}
            </div>
            <span className="text-[10px] text-red-700 font-semibold bg-red-100/70 px-2 py-0.5 rounded-full">
              Needs Review
            </span>
          </button>
        </div>

        {/* Additional Feedback Notes Input */}
        <div>
          <input
            type="text"
            placeholder="Add any specific comment or remaining symptom (optional)..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl p-3 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Dynamic Resolution & Next Steps */}
        {selectedOutcome === 'IMPROVED' && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs space-y-3">
            <div className="flex items-start gap-2.5 text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Recovery Progress Acknowledged</h4>
                <p className="mt-1 leading-relaxed text-slate-700">
                  {t.followUpGuidanceBetter}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}

        {(selectedOutcome === 'SAME' || selectedOutcome === 'WORSENED') && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs space-y-4">
            <div className="flex items-start gap-2.5 text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Clinical Re-Consultation Recommended</h4>
                <p className="mt-1 leading-relaxed text-slate-700">
                  {t.followUpGuidanceWorse}
                </p>
              </div>
            </div>

            {/* Quick Action Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onConsultDoctorReview}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>{t.connectDoctorReview}</span>
              </button>

              <button
                type="button"
                onClick={() => onEmergencyTriggered(['Worsening symptoms post-consultation requiring urgent emergency care'])}
                className="p-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{t.callAmbulance108}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};


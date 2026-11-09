import React, { useState, useEffect } from 'react';
import { Language, UserSession, FamilyProfile } from '../types';
import { translations } from '../data/translations';
import { speakText } from '../utils/speech';
import { ApiService } from '../services/api';
import { 
  Phone, 
  ShieldCheck, 
  Volume2, 
  CheckCircle2, 
  MessageSquare, 
  PhoneIncoming, 
  Lock
} from 'lucide-react';

interface OnboardingModalProps {
  currentLanguage: Language;
  isOpen: boolean;
  onComplete: (session: UserSession) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  currentLanguage,
  isOpen,
  onComplete
}) => {
  const t = translations[currentLanguage];

  const [step, setStep] = useState<'PHONE' | 'OTP' | 'CONSENT'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [showCallOption, setShowCallOption] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true);

  // Timer for 30s fallback "Call me with code"
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP') {
      timer = setTimeout(() => {
        setShowCallOption(true);
      }, 5000); // 5 seconds demonstration for prompt responsiveness
    }
    return () => clearTimeout(timer);
  }, [step]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) return;
    
    try {
      const res = await ApiService.sendOtp(phoneNumber);
      const code = res.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setStep('OTP');
      setIsAutoReading(true);

      // Simulate automatic SMS retrieval (PRD FR-1.1: user types nothing)
      setTimeout(() => {
        setOtp(code);
        setIsAutoReading(false);
      }, res.autoReadDelayMs || 2200);
    } catch (err) {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(fallbackCode);
      setStep('OTP');
      setIsAutoReading(true);
      setTimeout(() => {
        setOtp(fallbackCode);
        setIsAutoReading(false);
      }, 2000);
    }
  };

  const handleReadOtpAloud = () => {
    // Speak OTP digits slowly (PRD FR-1.6)
    const spacedDigits = generatedOtp.split('').join(' . ');
    const textToSpeak = currentLanguage === 'hi' 
      ? `आपका सत्यापन कोड है: ${spacedDigits}` 
      : currentLanguage === 'gu'
      ? `તમારો વેરિફિકેશન કોડ છે: ${spacedDigits}`
      : `Your verification code is: ${spacedDigits}`;
    speakText(textToSpeak, currentLanguage);
  };

  const handleTriggerVoiceCallOtp = () => {
    // PRD FR-1.7: Automated call speaks OTP
    setCallActive(true);
    const spokenMessage = currentLanguage === 'hi'
      ? `नमस्ते। रूरलकेयर कनेक्ट की ओर से आपका गुप्त कोड है: ${generatedOtp.split('').join(' ')}`
      : currentLanguage === 'gu'
      ? `નમસ્તે. રૂરલકેર કનેક્ટ તરફથી તમારો કોડ છે: ${generatedOtp.split('').join(' ')}`
      : `Hello. Your RuralCare Connect verification code is: ${generatedOtp.split('').join(' ')}`;
    speakText(spokenMessage, currentLanguage);

    setTimeout(() => {
      setCallActive(false);
      setOtp(generatedOtp);
    }, 3500);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp || otp.length === 6) {
      setStep('CONSENT');
    }
  };

  const handleFinalConsent = () => {
    // Initial default rural family profiles (Sunita, Ramesh, Raju)
    const initialProfiles: FamilyProfile[] = [
      {
        id: 'prof-1',
        name: 'Sunita Devi',
        relation: 'Self',
        age: 34,
        gender: 'Female',
        isPregnant: false,
        chronicConditions: ['None'],
        currentMedications: [],
        avatar: '👩🏽'
      },
      {
        id: 'prof-2',
        name: 'Ramesh Patel (Father)',
        relation: 'Parent',
        age: 62,
        gender: 'Male',
        isPregnant: false,
        chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        currentMedications: ['Amlodipine 5mg', 'Metformin 500mg'],
        avatar: '👴🏽'
      },
      {
        id: 'prof-3',
        name: 'Raju (Child)',
        relation: 'Child',
        age: 4,
        gender: 'Male',
        isPregnant: false,
        chronicConditions: [],
        currentMedications: [],
        avatar: '👦🏽'
      }
    ];

    onComplete({
      phoneNumber,
      isVerified: true,
      consentGiven: true,
      activeProfileId: 'prof-1',
      profiles: initialProfiles,
      preferredLanguage: currentLanguage
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        {/* Step 1: Mobile Number Entry */}
        {step === 'PHONE' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.welcomeTitle}</h2>
                <p className="text-xs text-slate-500">{t.welcomeSubtitle}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.phonePlaceholder}
              </label>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-600 bg-slate-200 px-2.5 py-2 rounded-lg">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full text-base font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Permanent sign-in on this device • OTP verification
              </p>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={phoneNumber.length < 10}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <span>{t.getOtp}</span>
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification & Accessibility */}
        {step === 'OTP' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.otpPlaceholder}</h2>
                <p className="text-xs text-slate-500">{t.otpSentTo} +91 {phoneNumber}</p>
              </div>
              <button
                onClick={handleReadOtpAloud}
                className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200"
                title="Tap to speak code aloud for low literacy"
              >
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>{t.readOtpAloud}</span>
              </button>
            </div>

            {/* Auto SMS Reader Indicator */}
            {isAutoReading && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>{t.autoReadingSms}</span>
              </div>
            )}

            <div className="mb-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="1 2 3 4 5 6"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 border-2 border-emerald-500 rounded-xl bg-slate-50 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 text-center mt-1">
                Demo code: <span className="font-mono font-bold text-slate-800">{generatedOtp}</span>
              </p>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center gap-2 mb-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.verifyOtp}</span>
            </button>

            {/* Voice-call OTP Fallback per PRD FR-1.7 */}
            {showCallOption && (
              <button
                onClick={handleTriggerVoiceCallOtp}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <PhoneIncoming className="w-4 h-4 text-blue-600" />
                <span>{callActive ? 'Calling your phone now...' : t.callWithCode}</span>
              </button>
            )}
          </div>
        )}

        {/* Step 3: Consent & DPDP 2023 Agreement per PRD FR-1.3 */}
        {step === 'CONSENT' && (
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {t.telemedicineConsentTitle}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4">
              {t.telemedicineConsentBody}
            </p>

            <div className="space-y-2 mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>
                  I give explicit revocable consent to consult registered doctors and understand AI provides non-diagnostic triage support only.
                </span>
              </label>
            </div>

            <button
              onClick={handleFinalConsent}
              disabled={!consentChecked}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <span>{t.acceptAndProceed}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


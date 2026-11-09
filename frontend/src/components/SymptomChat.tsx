import React, { useState, useEffect, useRef } from 'react';
import { 
  Language, 
  FamilyProfile, 
  SymptomMessage, 
  ClinicalTriageResult 
} from '../types';
import { translations } from '../data/translations';
import { detectRedFlags, evaluateClinicalTriage } from '../utils/aiTriageEngine';
import { speakText, VoiceRecognition } from '../utils/speech';
import { ApiService } from '../services/api';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  ShieldAlert, 
  AlertTriangle, 
  Stethoscope, 
  Clock, 
  ArrowRight,
  Info,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SymptomChatProps {
  currentLanguage: Language;
  activeProfile: FamilyProfile;
  onTriageComplete: (result: ClinicalTriageResult) => void;
  onEmergencyTriggered: (redFlags: string[]) => void;
  onDirectDoctorRequest: () => void;
}

export const SymptomChat: React.FC<SymptomChatProps> = ({
  currentLanguage,
  activeProfile,
  onTriageComplete,
  onEmergencyTriggered,
  onDirectDoctorRequest
}) => {
  const t = translations[currentLanguage];

  // Chat stage tracking
  const [messages, setMessages] = useState<SymptomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatStep, setChatStep] = useState<number>(0);
  const [userComplaint, setUserComplaint] = useState('');
  const [reportedDuration, setReportedDuration] = useState('');
  const [reportedSeverity, setReportedSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [triageResult, setTriageResult] = useState<ClinicalTriageResult | null>(null);

  const voiceRecognitionRef = useRef<VoiceRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initial welcome message per language
  useEffect(() => {
    const greetingText = currentLanguage === 'hi'
      ? `नमस्ते ${activeProfile.name} जी। आप कैसा महसूस कर रहे हैं? अपनी समस्या बताएं या माइक बटन दबाकर बोलें।`
      : currentLanguage === 'gu'
      ? `નમસ્તે ${activeProfile.name}જી. આપને શું તકલીફ થાય છે? લખીને અથવા માઇક બટન દબાવીને કહો.`
      : `Hello ${activeProfile.name}. How are you feeling today? Please describe your symptoms or tap the microphone to speak.`;

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: currentLanguage === 'hi' 
          ? ['बुखार और बदन दर्द', 'गले में खराश और खांसी', 'दस्त और उल्टी', 'सीने में भारीपन (Emergency)']
          : currentLanguage === 'gu'
          ? ['તાવ અને અંગ દુખાવો', 'ખાંસી અને ગળામાં દુખાવો', 'ઝાડા અને ઉલટી', 'છાતીમાં દુખાવો (Emergency)']
          : ['Fever & Body Ache', 'Cough & Sore Throat', 'Loose Motions / Vomiting', 'Chest Discomfort']
      }
    ]);
  }, [currentLanguage, activeProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle Speech-to-text
  const toggleVoiceInput = () => {
    if (isListening) {
      voiceRecognitionRef.current?.stop();
      setIsListening(false);
    } else {
      voiceRecognitionRef.current = new VoiceRecognition(
        currentLanguage,
        (text: string) => {
          setInputText(text);
          setIsListening(false);
        },
        (err: any) => {
          console.warn('Voice recognition error:', err);
          setIsListening(false);
        }
      );
      const started = voiceRecognitionRef.current.start();
      if (started) {
        setIsListening(true);
      } else {
        alert('Microphone speech recognition is not supported in this browser. Please type your message.');
      }
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Add user message
    const userMsg: SymptomMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    // 1. Red Flag Detection Check (PRD FR-2.6: Bypasses further questions immediately)
    const redFlags = detectRedFlags(query);
    if (redFlags.length > 0) {
      setTimeout(() => {
        setIsProcessing(false);
        const emergencyMsg: SymptomMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: currentLanguage === 'hi'
            ? `⚠️ गंभीर खतरे के संकेत मिले हैं (${redFlags[0]})! हम आपको तुरंत आपातकालीन सहायता पृष्ठ पर ले जा रहे हैं।`
            : currentLanguage === 'gu'
            ? `⚠️ ગંભીર કટોકટીના સંકેતો મળ્યા છે (${redFlags[0]})! અમે આપને તાત્કાલિક ઇમરજન્સી હેલ્પલાઇન સાથે જોડી રહ્યા છીએ.`
            : `⚠️ CRITICAL RED FLAG DETECTED (${redFlags[0]})! Redirecting immediately to Emergency 108 protocol.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          triageOutcome: 'EMERGENCY'
        };
        setMessages((prev) => [...prev, emergencyMsg]);
        onEmergencyTriggered(redFlags);
      }, 700);
      return;
    }

    // 2. Multi-turn clinical follow-up flow (PRD FR-2.2)
    setTimeout(() => {
      setIsProcessing(false);

      if (chatStep === 0) {
        // Asked initial complaint -> now ask duration
        setUserComplaint(query);
        setChatStep(1);

        const durationPrompt = currentLanguage === 'hi'
          ? `यह समस्या आपको कितने समय से है?`
          : currentLanguage === 'gu'
          ? `આ તકલીફ કેટલા દિવસથી છે?`
          : `How long have you been experiencing these symptoms?`;

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: durationPrompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: currentLanguage === 'hi'
              ? ['आज से ही शुरू हुआ', '2-3 दिन से', '1 हफ्ते से अधिक समय से']
              : currentLanguage === 'gu'
              ? ['આજથી જ શરૂ થયું', '2-3 દિવસથી', '1 અઠવાડિયા કરતાં વધુ']
              : ['Started Today (< 24 hrs)', '2 to 3 days', 'More than a week']
          }
        ]);
      } else if (chatStep === 1) {
        // Asked duration -> now ask severity
        setReportedDuration(query);
        setChatStep(2);

        const severityPrompt = currentLanguage === 'hi'
          ? `यह दर्द या परेशानी कितनी तीव्र है?`
          : currentLanguage === 'gu'
          ? `તકલીફ કેટલી વધારે કે ઓછી છે?`
          : `How severe is the discomfort?`;

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: severityPrompt,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: currentLanguage === 'hi'
              ? ['हल्की (Mild)', 'मध्यम (Moderate)', 'बहुत तेज / असहनीय (Severe)']
              : currentLanguage === 'gu'
              ? ['હળવી (Mild)', 'મધ્યમ (Moderate)', 'ખૂબ વધારે (Severe)']
              : ['Mild (Tolerable)', 'Moderate (Troublesome)', 'Severe (Intense)']
          }
        ]);
      } else if (chatStep === 2) {
        // Extracted severity -> Evaluate Final Triage with Backend Clinical Engine
        let calculatedSeverity: 'Mild' | 'Moderate' | 'Severe' = 'Moderate';
        const qLower = query.toLowerCase();
        if (qLower.includes('mild') || qLower.includes('हल्की') || qLower.includes('હળવી')) {
          calculatedSeverity = 'Mild';
        } else if (qLower.includes('severe') || qLower.includes('तेज') || qLower.includes('વધારે') || qLower.includes('असहनीय')) {
          calculatedSeverity = 'Severe';
        }
        setReportedSeverity(calculatedSeverity);
        setChatStep(3);

        ApiService.assessTriage(
          userComplaint,
          reportedDuration || '2-3 days',
          calculatedSeverity,
          activeProfile,
          currentLanguage
        ).then((res) => {
          const evaluated = res.triageResult;
          setTriageResult(evaluated);
          onTriageComplete(evaluated);

          let outcomeText = '';
          if (evaluated.triageLevel === 'EMERGENCY') {
            outcomeText = currentLanguage === 'hi'
              ? `🚨 यह एक आपातकालीन स्थिति लग रही है। कृपया तुरंत 108 एम्बुलेंस बुलाएं या नजदीकी अस्पताल जाएं।`
              : currentLanguage === 'gu'
              ? `🚨 આ કટોકટી જેવી સ્થિતિ જણાય છે. તાત્કાલિક 108 એમ્બ્યુલન્સ બોલાવો અથવા દવાખાને જાઓ.`
              : `🚨 This is flagged as an EMERGENCY. Immediate in-person medical evaluation is required.`;
          } else if (evaluated.triageLevel === 'CONSULT_SOON') {
            outcomeText = currentLanguage === 'hi'
              ? `📋 आपके लक्षणों की जांच डॉक्टर द्वारा वीडियो कॉल पर होनी चाहिए। आप अभी डॉक्टर की कतार में जुड़ सकते हैं।`
              : currentLanguage === 'gu'
              ? `📋 તમારા લક્ષણો માટે ડૉક્ટર સાથે વાત કરવી જરૂરી છે. તમે વિડિઓ કૉલ માટે કતારમાં જોડાઈ શકો છો.`
              : `📋 Doctor Consultation Recommended. Please join the live queue to consult an online physician.`;
          } else {
            outcomeText = currentLanguage === 'hi'
              ? `🌿 आपके लक्षण हल्के प्रतीत हो रहे हैं। नीचे डॉक्टर द्वारा स्वीकृत सुरक्षित घरेलू देखभाल के उपाय दिए गए हैं।`
              : currentLanguage === 'gu'
              ? `🌿 લક્ષણો હાલ હળવા જણાય છે. નીચે માન્ય ઘરેલું ઉપાયો આપેલા છે.`
              : `🌿 Safe Self-Care & Interim Guidance. Follow the clinician-approved supportive measures below.`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: outcomeText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              triageOutcome: evaluated.triageLevel
            }
          ]);
        }).catch(() => {
          const evaluated = evaluateClinicalTriage(
            userComplaint,
            reportedDuration || '2-3 days',
            calculatedSeverity,
            activeProfile,
            currentLanguage
          );
          setTriageResult(evaluated);
          onTriageComplete(evaluated);
        });
      }
    }, 700);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Disclaimer Top Banner (FR-2.5) */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="font-medium text-[11px] leading-tight">
            {t.chatDisclaimer}
          </span>
        </div>
        <button
          onClick={onDirectDoctorRequest}
          className="flex-shrink-0 ml-2 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 hover:border-blue-400 px-2.5 py-1 rounded-md transition shadow-xs flex items-center gap-1"
        >
          <Stethoscope className="w-3 h-3 text-blue-600" />
          <span>{t.skipToDoctor}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-sm text-sm ${
                  isAi
                    ? msg.triageOutcome === 'EMERGENCY'
                      ? 'bg-red-50 border-2 border-red-500 text-red-950 font-medium'
                      : msg.triageOutcome === 'CONSULT_SOON'
                      ? 'bg-amber-50 border-2 border-amber-500 text-amber-950 font-medium'
                      : 'bg-white border border-slate-200 text-slate-800'
                    : 'bg-emerald-600 text-white rounded-br-none'
                }`}
              >
                {/* AI Badge & Audio Speaker */}
                {isAi && (
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                    <span className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      RuralCare Clinical AI
                    </span>
                    <button
                      onClick={() => speakText(msg.text, currentLanguage)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition"
                      title={t.readAloud}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                <div className={`text-[10px] mt-1.5 ${isAi ? 'text-slate-400' : 'text-emerald-100'} text-right`}>
                  {msg.timestamp}
                </div>
              </div>

              {/* Quick reply buttons (Ideal for low-literacy users) */}
              {isAi && msg.quickReplies && (
                <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                  {msg.quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qr)}
                      className="bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 text-xs font-medium py-1.5 px-3 rounded-full border border-slate-200 hover:border-emerald-300 shadow-xs transition flex items-center gap-1.5"
                    >
                      <span>{qr}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-white rounded-xl border border-slate-200 w-fit animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-100" />
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-200" />
            <span>Analyzing clinical safety guardrails...</span>
          </div>
        )}

        {/* Triage Decision Card Banner */}
        {triageResult && (
          <div className="mt-4 p-4 rounded-xl border-2 shadow-md bg-white">
            {triageResult.triageLevel === 'EMERGENCY' ? (
              <div className="border-l-4 border-red-600 pl-3">
                <h3 className="font-bold text-red-700 text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  {t.triageEmergencyTitle}
                </h3>
                <p className="text-xs text-slate-700 mt-1">{t.triageEmergencyDesc}</p>
                <button
                  onClick={() => onEmergencyTriggered(triageResult.matchedRedFlags)}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm"
                >
                  <span>{t.callAmbulance108}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : triageResult.triageLevel === 'CONSULT_SOON' ? (
              <div className="border-l-4 border-amber-600 pl-3">
                <h3 className="font-bold text-amber-800 text-base flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-amber-600" />
                  {t.triageConsultSoonTitle}
                </h3>
                <p className="text-xs text-slate-700 mt-1">{t.triageConsultSoonDesc}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={onDirectDoctorRequest}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm"
                  >
                    <span>{t.joinDoctorQueue}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {t.estimatedWait}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-l-4 border-emerald-600 pl-3">
                <h3 className="font-bold text-emerald-800 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  {t.triageSelfCareTitle}
                </h3>
                <p className="text-xs text-slate-700 mt-1">{t.triageSelfCareDesc}</p>

                {/* Approved Home Care Measures List */}
                <div className="mt-3 space-y-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                    {t.approvedHomeMeasures}:
                  </h4>
                  {triageResult.approvedInterimAdvice.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 italic">
                    If symptoms do not improve within 48 hours, seek clinical care.
                  </p>
                  <button
                    onClick={onDirectDoctorRequest}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    {t.consultDoctorAnyway}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input controls with Voice Tap */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl border flex items-center justify-center transition shadow-xs ${
              isListening
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={isListening ? t.stopSpeaking : t.tapToSpeak}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? t.listening : t.askSymptomPlaceholder}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs disabled:opacity-40 disabled:hover:bg-emerald-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};


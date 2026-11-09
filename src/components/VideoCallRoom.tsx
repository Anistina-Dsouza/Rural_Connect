import React, { useState, useEffect, useRef } from 'react';
import { 
  Language, 
  Doctor, 
  FamilyProfile, 
  ClinicalTriageResult, 
  CallBandwidthMode 
} from '../types';
import { translations } from '../data/translations';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  FileText, 
  Send,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface VideoCallRoomProps {
  currentLanguage: Language;
  activeProfile: FamilyProfile;
  assignedDoctor: Doctor;
  triageSummary: ClinicalTriageResult | null;
  bandwidthMode: CallBandwidthMode;
  onEndCall: () => void;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  currentLanguage,
  activeProfile,
  assignedDoctor,
  triageSummary,
  bandwidthMode: initialBandwidthMode,
  onEndCall
}) => {
  const t = translations[currentLanguage];

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(initialBandwidthMode !== 'AUDIO_ONLY');
  const [bandwidthMode, setBandwidthMode] = useState<CallBandwidthMode>(initialBandwidthMode);
  const [callDuration, setCallDuration] = useState(0);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: `Dr. ${assignedDoctor.name}`,
      text: 'Namaste! I am reviewing your AI triage summary. How are you feeling right now?',
      time: '12:01'
    }
  ]);
  const [inCallInput, setInCallInput] = useState('');
  const [networkQuality, setNetworkQuality] = useState<'GOOD' | 'FAIR' | 'POOR'>('GOOD');
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inCallInput.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: activeProfile.name,
        text: inCallInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInCallInput('');
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
      {/* Call Top Status Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-white border-b border-slate-800 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono font-bold text-sm">{formatTimer(callDuration)}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-semibold text-slate-300">
            Consulting with Dr. {assignedDoctor.name} ({assignedDoctor.specialization})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Low Bandwidth Mode Indicator (PRD FR-4.2) */}
          <button
            onClick={() => {
              const nextMode: CallBandwidthMode = bandwidthMode === 'ADAPTIVE' ? 'AUDIO_ONLY' : 'ADAPTIVE';
              setBandwidthMode(nextMode);
              if (nextMode === 'AUDIO_ONLY') setIsVideoOn(false);
              else setIsVideoOn(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              bandwidthMode === 'AUDIO_ONLY'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {bandwidthMode === 'AUDIO_ONLY' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{bandwidthMode === 'AUDIO_ONLY' ? 'Audio-Only (150kbps)' : 'Video Mode'}</span>
          </button>

          {/* AI Intake Summary Toggle */}
          <button
            onClick={() => setShowSummaryDrawer(!showSummaryDrawer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI Summary</span>
          </button>
        </div>
      </div>

      {/* Main Video Consultation Stage */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Doctor Video Area (Main) */}
        <div className="flex-1 relative bg-slate-900 flex items-center justify-center p-4">
          {isVideoOn && bandwidthMode !== 'AUDIO_ONLY' ? (
            <div className="relative w-full h-full max-h-[500px] rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700">
              <img
                src={assignedDoctor.avatar}
                alt={assignedDoctor.name}
                className="w-full h-full object-cover object-top opacity-90 filter brightness-95"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Dr. {assignedDoctor.name} (Live Video)</span>
              </div>
            </div>
          ) : (
            // Audio-Only Low-Bandwidth Display (PRD FR-4.2)
            <div className="text-center p-6 space-y-3">
              <div className="w-24 h-24 rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 text-3xl font-bold animate-pulse">
                🩺
              </div>
              <h3 className="text-white font-bold text-lg">Dr. {assignedDoctor.name}</h3>
              <p className="text-xs text-amber-300 bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded-full inline-block">
                Audio-Only Mode Active (Optimized for 2G/3G low data)
              </p>
            </div>
          )}

          {/* Self Preview PIP (Bottom Right) */}
          <div className="absolute bottom-4 right-4 w-28 sm:w-36 h-36 sm:h-48 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-600 shadow-xl flex items-center justify-center text-white text-center p-2 z-10">
            {isVideoOn ? (
              <div className="w-full h-full bg-slate-700 flex flex-col items-center justify-center">
                <span className="text-3xl">{activeProfile.avatar}</span>
                <span className="text-[10px] text-slate-300 font-semibold mt-1 truncate px-1">
                  {activeProfile.name}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <VideoOff className="w-6 h-6 text-slate-500 mb-1" />
                <span className="text-[10px] text-slate-400">Camera Off</span>
              </div>
            )}
          </div>
        </div>

        {/* Side In-Call Chat Fallback (PRD FR-4.7) */}
        {showInCallChat && (
          <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-1/2 md:h-full z-20">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-white text-xs font-bold">
              <span>{t.inCallChat}</span>
              <button onClick={() => setShowInCallChat(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                    <span>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendInCallMessage} className="p-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type if audio is breaking..."
                value={inCallInput}
                onChange={(e) => setInCallInput(e.target.value)}
                className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              />
              <button type="submit" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* AI Intake Summary Drawer (PRD FR-4.4) */}
        {showSummaryDrawer && triageSummary && (
          <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-slate-900/95 backdrop-blur-md border-l border-slate-700 p-4 text-white overflow-y-auto z-30 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                AI Triage Clinical Summary
              </h4>
              <button onClick={() => setShowSummaryDrawer(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Chief Complaint:</span>
                <p className="font-semibold text-slate-100">{triageSummary.doctorCaseSummary.chiefComplaint}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timeline & Duration:</span>
                <p className="font-semibold text-slate-100">{triageSummary.doctorCaseSummary.timeline}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Details:</span>
                <p className="text-slate-200">{triageSummary.doctorCaseSummary.vitalsNotes}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Red-Flag Scan:</span>
                <p className="text-emerald-300 font-mono text-[11px]">{triageSummary.doctorCaseSummary.redFlagCheck}</p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">AI Recommendation:</span>
                <p className="text-amber-300 font-medium">{triageSummary.doctorCaseSummary.recommendedAction}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls Toolbar (Bottom) */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-center gap-4 border-t border-slate-800 z-20">
        {/* Mic Toggle */}
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-3.5 rounded-full text-white transition ${
            isMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`p-3.5 rounded-full text-white transition ${
            isVideoOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* In-Call Text Chat Toggle (PRD FR-4.7) */}
        <button
          onClick={() => setShowInCallChat(!showInCallChat)}
          className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition relative"
          title="In-call chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-sm">{t.endConsultation}</span>
        </button>
      </div>
    </div>
  );
};

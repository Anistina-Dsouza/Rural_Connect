import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Language, 
  UserRole, 
  UserSession, 
  FamilyProfile, 
  ClinicalTriageResult, 
  Doctor, 
  CallBandwidthMode, 
  Prescription 
} from '../types';
import { ApiService } from '../services/api';
import { Header } from '../components/Header';
import { OnboardingModal } from '../components/OnboardingModal';
import { ProfilePicker } from '../components/ProfilePicker';
import { AccountSettingsModal } from '../components/AccountSettingsModal';
import { SymptomChat } from '../components/SymptomChat';
import { EmergencyScreen } from '../components/EmergencyScreen';
import { ConsultationQueue } from '../components/ConsultationQueue';
import { VideoCallRoom } from '../components/VideoCallRoom';
import { PrescriptionViewer } from '../components/PrescriptionViewer';
import { PrescriptionVerifier } from '../components/PrescriptionVerifier';
import { FollowUpCheckIn } from '../components/FollowUpCheckIn';

export default function PatientDashboard() {
  const navigate = useNavigate();
  // App Global State (FR-1.2: Language selected at first launch, can change anytime)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('hi');
  const [currentRole, setCurrentRole] = useState<UserRole>('PATIENT');
  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(false);
  const [bandwidthMode, setBandwidthMode] = useState<CallBandwidthMode>('ADAPTIVE');

  // Section 7.1 Modals: Onboarding (FR-1.1-1.3, 1.6-1.7), Profile Picker (FR-1.4, 1.9), Account Settings (FR-1.3, 1.5, 1.8, 1.9)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  // User Session State (FR-1.1, FR-1.3, FR-1.4, FR-1.8)
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const savedPhone = localStorage.getItem('ruralcare_session_phone') || '9876543210';
    const isVerified = localStorage.getItem('ruralcare_session_verified') === 'true';
    const consentGiven = localStorage.getItem('ruralcare_session_consent') === 'true';
    const savedLang = (localStorage.getItem('ruralcare_session_lang') as Language) || 'hi';
    const savedProfileId = localStorage.getItem('ruralcare_session_profile') || 'prof-1';
    return {
      phoneNumber: savedPhone,
      isVerified,
      consentGiven,
      activeProfileId: savedProfileId,
      preferredLanguage: savedLang,
      profiles: []
    };
  });

  // Current Patient Active Profile
  const activeProfile = userSession.profiles.find(p => p.id === userSession.activeProfileId) || userSession.profiles[0] || {
    id: 'prof-1',
    name: 'सुनीता देवी (Sunita Devi)',
    relation: 'Self',
    age: 34,
    gender: 'Female',
    avatar: '👩🏽'
  };

  // Licensed Doctor from Database
  const [assignedDoctor, setAssignedDoctor] = useState<Doctor>({
    id: 'doc-1',
    name: 'रमेश पटेल (Dr. Ramesh Patel)',
    specialization: 'General Physician & Telehealth Specialist',
    registrationNumber: 'NMC/MCI-2018-84729',
    councilName: 'Gujarat Medical Council / NMC India',
    experienceYears: 14,
    languages: ['Hindi', 'Gujarati', 'English'],
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    rating: 4.9
  });

  // Navigation State for patient flow
  type PatientScreen = 'CHAT' | 'EMERGENCY' | 'QUEUE' | 'VIDEO_CALL' | 'PRESCRIPTION' | 'VERIFY' | 'FOLLOW_UP';
  const [patientScreen, setPatientScreen] = useState<PatientScreen>('CHAT');
  const [triageSummary, setTriageSummary] = useState<ClinicalTriageResult | null>(null);
  const [emergencyRedFlags, setEmergencyRedFlags] = useState<string[]>([]);
  const [currentConsultationId, setCurrentConsultationId] = useState<string>('CONS-DEFAULT');

  // Active Prescription State
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // FR-1.8 & FR-1.9: Permanent Device Sign-in Check on App Mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('ruralcare_session_phone') || userSession.phoneNumber;
    const isVerified = localStorage.getItem('ruralcare_session_verified');
    const consentGiven = localStorage.getItem('ruralcare_session_consent') === 'true';
    const savedLang = localStorage.getItem('ruralcare_session_lang') as Language;
    if (savedLang) setCurrentLanguage(savedLang);

    if (!savedPhone && !isVerified) {
      setIsOnboardingOpen(true);
    }

    // 1. Fetch user & profiles from MongoDB
    ApiService.getMe()
      .then(res => {
        if (res && res.user) {
          const userPhone = res.user.phoneNumber || savedPhone;
          const profiles = res.profiles || [];
          const activeId = localStorage.getItem('ruralcare_session_profile') || res.user.activeProfileId || profiles[0]?.id || 'prof-1';
          setUserSession(prev => ({
            ...prev,
            phoneNumber: userPhone,
            isVerified: true,
            consentGiven: res.user.consentGiven ?? consentGiven,
            profiles: profiles.length > 0 ? profiles : prev.profiles,
            activeProfileId: activeId
          }));
        }
      })
      .catch(() => {});

    ApiService.getProfiles(savedPhone)
      .then(data => {
        if (data && data.profiles && data.profiles.length > 0) {
          const savedProfileId = localStorage.getItem('ruralcare_session_profile');
          setUserSession(prev => ({
            ...prev,
            phoneNumber: savedPhone,
            isVerified: true,
            profiles: data.profiles,
            activeProfileId: savedProfileId || data.activeProfileId || data.profiles[0].id
          }));
        }
      })
      .catch(err => console.log('Profile loading note:', err));

    // 2. Fetch doctors from MongoDB
    ApiService.getDoctors()
      .then(res => {
        if (res && res.success && res.doctors && res.doctors.length > 0) {
          const activeDoc = res.doctors.find(d => d.isAvailable) || res.doctors[0];
          setAssignedDoctor(activeDoc);
        }
      })
      .catch(err => console.log('Doctor loading note:', err));

    // 3. Fetch latest prescription from MongoDB
    ApiService.getAllPrescriptions(savedPhone)
      .then(res => {
        if (res && res.success && res.prescriptions && res.prescriptions.length > 0) {
          setCurrentPrescription(res.prescriptions[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch latest dynamic prescription on switching to PRESCRIPTION tab
  useEffect(() => {
    if (patientScreen === 'PRESCRIPTION' || patientScreen === 'FOLLOW_UP') {
      setPrescriptionLoading(true);
      ApiService.getAllPrescriptions(userSession.phoneNumber)
        .then(res => {
          if (res && res.success && res.prescriptions && res.prescriptions.length > 0) {
            setCurrentPrescription(res.prescriptions[0]);
          }
        })
        .catch(e => console.warn('Prescriptions fetch note:', e))
        .finally(() => setPrescriptionLoading(false));
    }
  }, [patientScreen, userSession.phoneNumber]);

  // Auto-poll for prescription every 10s when on PRESCRIPTION screen
  useEffect(() => {
    if (patientScreen !== 'PRESCRIPTION') return;
    const interval = setInterval(async () => {
      try {
        const res = await ApiService.getAllPrescriptions(userSession.phoneNumber);
        if (res?.success && res.prescriptions?.length > 0) {
          setCurrentPrescription(res.prescriptions[0]);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [patientScreen, userSession.phoneNumber]);

  // Handlers for FR-1
  const handleToggleLowBandwidth = () => {
    const next = !lowBandwidthMode;
    setLowBandwidthMode(next);
    setBandwidthMode(next ? 'AUDIO_ONLY' : 'ADAPTIVE');
  };

  const handleSelectProfile = async (profileId: string) => {
    setUserSession(prev => ({ ...prev, activeProfileId: profileId }));
    try { await ApiService.switchProfile(userSession.phoneNumber, profileId); } catch (e) { console.warn('Profile switch API note:', e); }
  };

  const handleAddProfile = async (newProfile: FamilyProfile) => {
    try {
      const res = await ApiService.addProfile(userSession.phoneNumber, newProfile);
      if (res && res.profiles) {
        setUserSession(prev => ({ ...prev, profiles: res.profiles, activeProfileId: res.profile.id }));
        return;
      }
    } catch (e) { console.warn('Add profile backend note:', e); }
    setUserSession(prev => ({ ...prev, profiles: [...prev.profiles, newProfile], activeProfileId: newProfile.id }));
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      const res = await ApiService.deleteProfile(profileId, userSession.phoneNumber);
      if (res && res.profiles) {
        setUserSession(prev => ({ ...prev, profiles: res.profiles, activeProfileId: res.profiles[0]?.id || '' }));
        return;
      }
    } catch (e) {
      setUserSession(prev => {
        const filtered = prev.profiles.filter(p => p.id !== profileId);
        return { ...prev, profiles: filtered, activeProfileId: filtered[0]?.id || '' };
      });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('ruralcare_session_phone');
    localStorage.removeItem('ruralcare_session_verified');
    localStorage.removeItem('ruralcare_session_consent');
    setIsAccountSettingsOpen(false);
    setIsOnboardingOpen(true);
  };

  const handleAccountDeleted = () => {
    setIsAccountSettingsOpen(false);
    setUserSession({
      phoneNumber: '',
      isVerified: false,
      consentGiven: false,
      activeProfileId: '',
      preferredLanguage: 'hi',
      profiles: []
    });
    setIsOnboardingOpen(true);
  };

  const handleEmergencyTriggered = (redFlags: string[]) => { 
    setEmergencyRedFlags(redFlags); 
    setPatientScreen('EMERGENCY'); 
  };

  const handleTriageComplete = (result: ClinicalTriageResult) => { 
    setTriageSummary(result); 
    if (result.triageLevel === 'EMERGENCY') setEmergencyRedFlags(result.matchedRedFlags); 
  };

  const handleJoinQueue = async () => {
    try {
      const res = await ApiService.joinQueue(userSession.phoneNumber, activeProfile, triageSummary, bandwidthMode);
      if (res && res.consultation) {
        setCurrentConsultationId(res.consultation.id);
        if (res.consultation.doctor) {
          setAssignedDoctor(res.consultation.doctor);
        }
      }
    } catch (e) { console.warn('Queue API join note:', e); }
    setPatientScreen('QUEUE');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Global Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        currentRole={currentRole}
        onRoleChange={role => { 
          if (role === 'DOCTOR') {
            navigate('/doctor');
            return;
          }
          setCurrentRole('PATIENT'); 
          if (patientScreen === 'VERIFY') setPatientScreen('CHAT'); 
        }}
        activeProfile={activeProfile}
        onOpenProfilePicker={() => setIsProfilePickerOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        lowBandwidthMode={lowBandwidthMode}
        onToggleLowBandwidth={handleToggleLowBandwidth}
        onTriggerEmergency={() => { setEmergencyRedFlags(['Manual 108 Emergency Dial triggered']); setPatientScreen('EMERGENCY'); }}
      />

      <main className="flex-1 p-3 sm:p-6">
        <div>
          <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between border-b border-slate-200 pb-2 px-1">
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600">
              <button onClick={() => setPatientScreen('CHAT')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'CHAT' ? 'bg-primary text-white shadow-xs' : 'hover:bg-slate-200'}`}>1. Symptom AI Triage</button>
              <button onClick={() => setPatientScreen('QUEUE')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'QUEUE' ? 'bg-primary text-white shadow-xs' : 'hover:bg-slate-200'}`}>2. Waiting Queue</button>
              <button onClick={() => setPatientScreen('VIDEO_CALL')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'VIDEO_CALL' ? 'bg-primary text-white shadow-xs' : 'hover:bg-slate-200'}`}>3. Video Consult</button>
              <button onClick={() => setPatientScreen('PRESCRIPTION')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'PRESCRIPTION' ? 'bg-primary text-white shadow-xs' : 'hover:bg-slate-200'}`}>4. e-Prescription</button>
              <button onClick={() => setPatientScreen('FOLLOW_UP')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'FOLLOW_UP' ? 'bg-primary text-white shadow-xs' : 'hover:bg-slate-200'}`}>5. Follow-Up (FR-6)</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsProfilePickerOpen(true)} className="text-xs text-primary bg-primary-fixed/30 hover:bg-primary-fixed/50 font-bold px-2.5 py-1 rounded-lg border border-primary/20">Family Profiles (FR-1.4)</button>
              <button onClick={() => setIsAccountSettingsOpen(true)} className="text-xs text-slate-600 hover:text-slate-900 underline font-medium">Privacy &amp; Consent</button>
            </div>
          </div>

          {/* Subscreens */}
          {patientScreen === 'CHAT' && (
            <SymptomChat
              currentLanguage={currentLanguage}
              activeProfile={activeProfile}
              onTriageComplete={handleTriageComplete}
              onEmergencyTriggered={handleEmergencyTriggered}
              onDirectDoctorRequest={handleJoinQueue}
            />
          )}
          {patientScreen === 'EMERGENCY' && (
            <EmergencyScreen
              currentLanguage={currentLanguage}
              redFlags={emergencyRedFlags}
              onBackToNormal={() => setPatientScreen('CHAT')}
            />
          )}
          {patientScreen === 'QUEUE' && (
            <ConsultationQueue
              currentLanguage={currentLanguage}
              activeProfile={activeProfile}
              triageSummary={triageSummary}
              assignedDoctor={assignedDoctor}
              bandwidthMode={bandwidthMode}
              onBandwidthChange={setBandwidthMode}
              onJoinCall={() => setPatientScreen('VIDEO_CALL')}
              consultationId={currentConsultationId}
            />
          )}
          {patientScreen === 'VIDEO_CALL' && (
            <VideoCallRoom
              currentLanguage={currentLanguage}
              activeProfile={activeProfile}
              assignedDoctor={assignedDoctor}
              triageSummary={triageSummary}
              bandwidthMode={bandwidthMode}
              consultationId={currentConsultationId}
              onEndCall={() => { ApiService.endConsultation(currentConsultationId); setPatientScreen('PRESCRIPTION'); }}
            />
          )}
          {patientScreen === 'PRESCRIPTION' && currentPrescription && (
            <PrescriptionViewer
              currentLanguage={currentLanguage}
              prescription={currentPrescription}
              onVerifyPrescription={id => setPatientScreen('VERIFY')}
            />
          )}
          {patientScreen === 'PRESCRIPTION' && !currentPrescription && (
            <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-3xl border-2 border-slate-200 shadow-sm text-center">
              {prescriptionLoading ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center animate-pulse">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg mb-1">Checking for Prescription...</h3>
                  <p className="text-slate-500 text-sm">Connecting to the registry</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center">
                    <span className="text-4xl">📋</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-xl mb-2">No Prescription Yet</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Your doctor will issue a digital prescription after the consultation.<br />
                    It will appear here automatically once issued.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={async () => {
                        setPrescriptionLoading(true);
                        try {
                          const res = await ApiService.getAllPrescriptions(userSession.phoneNumber);
                          if (res?.success && res.prescriptions?.length > 0) {
                            setCurrentPrescription(res.prescriptions[0]);
                          }
                        } catch {}
                        setPrescriptionLoading(false);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <span>🔄</span>
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setPatientScreen('QUEUE')}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                    >
                      Back to Queue
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-5">Auto-refreshes every 10 seconds • Connected to live registry</p>
                </>
              )}
            </div>
          )}
          {patientScreen === 'VERIFY' && currentPrescription && (
            <PrescriptionVerifier
              currentLanguage={currentLanguage}
              initialId={currentPrescription.id}
              onBack={() => setPatientScreen('PRESCRIPTION')}
            />
          )}
          {patientScreen === 'FOLLOW_UP' && currentPrescription && (
            <FollowUpCheckIn
              currentLanguage={currentLanguage}
              activeProfile={activeProfile}
              prescription={currentPrescription}
              onConsultDoctorReview={() => setPatientScreen('QUEUE')}
              onEmergencyTriggered={(flags) => handleEmergencyTriggered(flags)}
              onClose={() => setPatientScreen('PRESCRIPTION')}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <OnboardingModal
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        isOpen={isOnboardingOpen}
        onComplete={(newSession) => {
          setUserSession(newSession);
          setIsOnboardingOpen(false);
          setIsProfilePickerOpen(true);
        }}
      />

      <ProfilePicker
        currentLanguage={currentLanguage}
        isOpen={isProfilePickerOpen}
        onClose={() => setIsProfilePickerOpen(false)}
        profiles={userSession.profiles}
        activeProfileId={userSession.activeProfileId}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
      />

      <AccountSettingsModal
        currentLanguage={currentLanguage}
        userSession={userSession}
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        onConsentToggled={(newConsent) => {
          setUserSession((prev) => ({ ...prev, consentGiven: newConsent }));
        }}
        onSignOut={handleSignOut}
        onAccountDeleted={handleAccountDeleted}
      />
    </div>
  );
}

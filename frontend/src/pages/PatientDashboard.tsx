import React, { useState, useEffect } from 'react';
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
import { DoctorConsole } from '../components/DoctorConsole';
import { PrescriptionViewer } from '../components/PrescriptionViewer';
import { AdminDashboard } from '../components/AdminDashboard';
import { PrescriptionVerifier } from '../components/PrescriptionVerifier';

export default function PatientDashboard() {
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
  const [userSession, setUserSession] = useState<UserSession>({
    phoneNumber: '9876543210',
    isVerified: true,
    consentGiven: true,
    activeProfileId: 'prof-1',
    preferredLanguage: 'hi',
    profiles: []
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

  // Licensed Doctor (static placeholder for demo)
  const assignedDoctor: Doctor = {
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
  };

  // Navigation State for patient flow
  type PatientScreen = 'CHAT' | 'EMERGENCY' | 'QUEUE' | 'VIDEO_CALL' | 'PRESCRIPTION' | 'VERIFY';
  const [patientScreen, setPatientScreen] = useState<PatientScreen>('CHAT');
  const [triageSummary, setTriageSummary] = useState<ClinicalTriageResult | null>(null);
  const [emergencyRedFlags, setEmergencyRedFlags] = useState<string[]>([]);
  const [currentConsultationId, setCurrentConsultationId] = useState<string>('CONS-DEFAULT');

  // Active Prescription State
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>({
    id: 'RC-2026-98124',
    consultationId: 'CONS-90182',
    patientName: activeProfile.name,
    patientAge: activeProfile.age,
    patientGender: activeProfile.gender,
    patientPhone: userSession.phoneNumber,
    doctorName: assignedDoctor.name,
    doctorRegNo: assignedDoctor.registrationNumber,
    doctorCouncil: assignedDoctor.councilName,
    doctorSignatureDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    diagnosis: 'Acute Upper Respiratory Tract Infection (Mild Viral URI)',
    symptoms: ['Mild fever', 'Dry cough', 'Throat irritation'],
    medicines: [
      {
        id: 'm1',
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: '1-0-1 (Morning & Night)',
        timing: 'After Food',
        durationDays: 3,
        instructionEn: 'Take 1 tablet after food only if fever or body pain is present.',
        instructionHi: 'बुखार या शरीर दर्द होने पर ही भोजन के बाद 1 गोली लें।',
        instructionGu: 'તાવ અથવા અંગ દુખાવા વખતે જ જમ્યા પછી 1 ગોળી લેવી.'
      }
    ],
    generalAdvice: 'Drink plenty of warm water and observe adequate rest.',
    followUpDays: 3,
    verificationQrData: 'https://ruralcare.gov.in/verify/RC-2026-98124',
    isOfflineAvailable: true,
    createdAt: new Date().toISOString()
  });

  // FR-1.8 & FR-1.9: Permanent Device Sign-in Check on App Mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('ruralcare_session_phone');
    const isVerified = localStorage.getItem('ruralcare_session_verified');
    const consentGiven = localStorage.getItem('ruralcare_session_consent') === 'true';
    const savedLang = localStorage.getItem('ruralcare_session_lang') as Language;
    if (savedLang) setCurrentLanguage(savedLang);

    if (!savedPhone && !isVerified) {
      setIsOnboardingOpen(true);
    }

    ApiService.getProfiles(savedPhone || userSession.phoneNumber)
      .then(data => {
        if (data && data.profiles && data.profiles.length > 0) {
          const savedProfileId = localStorage.getItem('ruralcare_session_profile');
          setUserSession(prev => ({
            ...prev,
            phoneNumber: savedPhone || prev.phoneNumber,
            isVerified: true,
            consentGiven,
            profiles: data.profiles,
            activeProfileId: savedProfileId || data.activeProfileId || data.profiles[0].id
          }));
        }
      })
      .catch(err => console.log('Profile loading note:', err));
  }, []);

  // Fetch latest dynamic prescription on switching to PRESCRIPTION tab
  useEffect(() => {
    if (patientScreen === 'PRESCRIPTION') {
      ApiService.getAllPrescriptions(userSession.phoneNumber)
        .then(res => {
          if (res && res.success && res.prescriptions && res.prescriptions.length > 0) {
            setCurrentPrescription(res.prescriptions[0]);
          }
        })
        .catch(e => console.warn('Prescriptions fetch note:', e));
    }
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

  const handleEmergencyTriggered = (redFlags: string[]) => { setEmergencyRedFlags(redFlags); setPatientScreen('EMERGENCY'); };
  const handleTriageComplete = (result: ClinicalTriageResult) => { setTriageSummary(result); if (result.triageLevel === 'EMERGENCY') setEmergencyRedFlags(result.matchedRedFlags); };
  const handleJoinQueue = async () => {
    try {
      const res = await ApiService.joinQueue(userSession.phoneNumber, activeProfile, triageSummary, bandwidthMode);
      if (res && res.consultation) setCurrentConsultationId(res.consultation.id);
    } catch (e) { console.warn('Queue API join note:', e); }
    setPatientScreen('QUEUE');
  };
  const handleIssuePrescription = async (prescription: Prescription) => {
    try {
      const res = await ApiService.createPrescription(prescription);
      if (res && res.prescription) setCurrentPrescription(res.prescription); else setCurrentPrescription(prescription);
    } catch { setCurrentPrescription(prescription); }
    setCurrentRole('PATIENT');
    setPatientScreen('PRESCRIPTION');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Global Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        currentRole={currentRole}
        onRoleChange={role => { setCurrentRole(role); if (role === 'PATIENT' && patientScreen === 'VERIFY') setPatientScreen('CHAT'); }}
        activeProfile={activeProfile}
        onOpenProfilePicker={() => setIsProfilePickerOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        lowBandwidthMode={lowBandwidthMode}
        onToggleLowBandwidth={handleToggleLowBandwidth}
        onTriggerEmergency={() => { setEmergencyRedFlags(['Manual 108 Emergency Dial triggered']); setPatientScreen('EMERGENCY'); }}
      />

      <main className="flex-1 p-3 sm:p-6">
        {currentRole === 'PATIENT' && (
          <div>
            <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between border-b border-slate-200 pb-2 px-1">
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600">
                <button onClick={() => setPatientScreen('CHAT')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'CHAT' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'}`}>1. Symptom AI Triage</button>
                <button onClick={() => setPatientScreen('QUEUE')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'QUEUE' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'}`}>2. Waiting Queue</button>
                <button onClick={() => setPatientScreen('VIDEO_CALL')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'VIDEO_CALL' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'}`}>3. Video Consult</button>
                <button onClick={() => setPatientScreen('PRESCRIPTION')} className={`px-3 py-1.5 rounded-xl transition ${patientScreen === 'PRESCRIPTION' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'}`}>4. e-Prescription</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsProfilePickerOpen(true)} className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">Family Profiles (FR-1.4)</button>
                <button onClick={() => setIsAccountSettingsOpen(true)} className="text-xs text-slate-600 hover:text-slate-900 underline font-medium">Privacy & Consent (FR-1.3, 1.5)</button>
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
              />
            )}
            {patientScreen === 'VIDEO_CALL' && (
              <VideoCallRoom
                currentLanguage={currentLanguage}
                activeProfile={activeProfile}
                assignedDoctor={assignedDoctor}
                triageSummary={triageSummary}
                bandwidthMode={bandwidthMode}
                onEndCall={() => { ApiService.endConsultation(currentConsultationId); setPatientScreen('PRESCRIPTION'); }}
              />
            )}
            {patientScreen === 'PRESCRIPTION' && (
              <PrescriptionViewer
                currentLanguage={currentLanguage}
                prescription={currentPrescription}
                onVerifyPrescription={id => setPatientScreen('VERIFY')}
              />
            )}
            {patientScreen === 'VERIFY' && (
              <PrescriptionVerifier
                currentLanguage={currentLanguage}
                initialId={currentPrescription.id}
                onBack={() => setPatientScreen('PRESCRIPTION')}
              />
            )}
          </div>
        )}
        {/* Doctor console would be a separate dashboard, not rendered here */}
      </main>

      {/* Modals */}
      <OnboardingModal
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        isOpen={isOnboardingOpen}
        onComplete={newSession => { setUserSession(newSession); setIsOnboardingOpen(false); setIsProfilePickerOpen(true); }}
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
        onConsentToggled={newConsent => setUserSession(prev => ({ ...prev, consentGiven: newConsent }))}
        onSignOut={handleSignOut}
        onAccountDeleted={handleAccountDeleted}
      />
    </div>
  );
}


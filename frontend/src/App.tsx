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
} from './types';
import { ApiService } from './services/api';
import { Header } from './components/Header';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfilePicker } from './components/ProfilePicker';
import { SymptomChat } from './components/SymptomChat';
import { EmergencyScreen } from './components/EmergencyScreen';
import { ConsultationQueue } from './components/ConsultationQueue';
import { VideoCallRoom } from './components/VideoCallRoom';
import { DoctorConsole } from './components/DoctorConsole';
import { PrescriptionViewer } from './components/PrescriptionViewer';
import { AdminDashboard } from './components/AdminDashboard';
import { PrescriptionVerifier } from './components/PrescriptionVerifier';

export const App: React.FC = () => {
  // App Global State
  const [currentLanguage, setCurrentLanguage] = useState<Language>('hi');
  const [currentRole, setCurrentRole] = useState<UserRole>('PATIENT');
  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(false);
  const [bandwidthMode, setBandwidthMode] = useState<CallBandwidthMode>('ADAPTIVE');
  
  // Onboarding & Profiles
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [userSession, setUserSession] = useState<UserSession>({
    phoneNumber: '9876543210',
    isVerified: true,
    consentGiven: true,
    activeProfileId: 'prof-1',
    preferredLanguage: 'hi',
    profiles: []
  });

  // Current Patient Active Profile
  const activeProfile = userSession.profiles.find((p) => p.id === userSession.activeProfileId) || userSession.profiles[0] || {
    id: 'prof-1',
    name: 'सुनीता देवी (Sunita Devi)',
    relation: 'Self',
    age: 34,
    gender: 'Female',
    avatar: '👩🏽'
  };

  // Assigned Doctor
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

  // Navigation State
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

  // Fetch initial profiles from Backend API on mount
  useEffect(() => {
    ApiService.getProfiles(userSession.phoneNumber)
      .then((data) => {
        if (data && data.profiles && data.profiles.length > 0) {
          setUserSession((prev) => ({
            ...prev,
            profiles: data.profiles,
            activeProfileId: data.activeProfileId || data.profiles[0].id
          }));
        }
      })
      .catch((err) => console.log('Using default profiles while connecting:', err));

    // Fetch initial prescription from backend
    ApiService.getPrescription('RC-2026-98124')
      .then((res) => {
        if (res && res.prescription) {
          setCurrentPrescription(res.prescription);
        }
      })
      .catch(() => {});
  }, [userSession.phoneNumber]);

  // Handlers
  const handleToggleLowBandwidth = () => {
    const nextState = !lowBandwidthMode;
    setLowBandwidthMode(nextState);
    setBandwidthMode(nextState ? 'AUDIO_ONLY' : 'ADAPTIVE');
  };

  const handleSelectProfile = async (profileId: string) => {
    setUserSession((prev) => ({ ...prev, activeProfileId: profileId }));
    try {
      await ApiService.switchProfile(userSession.phoneNumber, profileId);
    } catch (err) {
      console.warn('Profile switch API note:', err);
    }
  };

  const handleAddProfile = async (newProfile: FamilyProfile) => {
    try {
      const res = await ApiService.addProfile(userSession.phoneNumber, newProfile);
      if (res && res.profiles) {
        setUserSession((prev) => ({
          ...prev,
          profiles: res.profiles,
          activeProfileId: res.profile.id
        }));
        return;
      }
    } catch (err) {
      console.warn('Add profile backend note:', err);
    }

    setUserSession((prev) => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
      activeProfileId: newProfile.id
    }));
  };

  const handleEmergencyTriggered = (redFlags: string[]) => {
    setEmergencyRedFlags(redFlags);
    setPatientScreen('EMERGENCY');
  };

  const handleTriageComplete = (result: ClinicalTriageResult) => {
    setTriageSummary(result);
    if (result.triageLevel === 'EMERGENCY') {
      setEmergencyRedFlags(result.matchedRedFlags);
    }
  };

  const handleJoinQueue = async () => {
    try {
      const res = await ApiService.joinQueue(
        userSession.phoneNumber,
        activeProfile,
        triageSummary,
        bandwidthMode
      );
      if (res && res.consultation) {
        setCurrentConsultationId(res.consultation.id);
      }
    } catch (err) {
      console.warn('Queue API join note:', err);
    }
    setPatientScreen('QUEUE');
  };

  const handleIssuePrescription = async (prescription: Prescription) => {
    try {
      const res = await ApiService.createPrescription(prescription);
      if (res && res.prescription) {
        setCurrentPrescription(res.prescription);
      } else {
        setCurrentPrescription(prescription);
      }
    } catch (err) {
      setCurrentPrescription(prescription);
    }
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
        onRoleChange={(role) => {
          setCurrentRole(role);
          if (role === 'PATIENT' && patientScreen === 'VERIFY') {
            setPatientScreen('CHAT');
          }
        }}
        activeProfile={activeProfile}
        onOpenProfilePicker={() => setIsProfilePickerOpen(true)}
        lowBandwidthMode={lowBandwidthMode}
        onToggleLowBandwidth={handleToggleLowBandwidth}
        onTriggerEmergency={() => {
          setEmergencyRedFlags(['Manual 108 Emergency Dial triggered']);
          setPatientScreen('EMERGENCY');
        }}
      />

      {/* Main Body View */}
      <main className="flex-1 p-3 sm:p-6">
        {/* Patient Role Views */}
        {currentRole === 'PATIENT' && (
          <div>
            {/* Quick Flow Subtabs */}
            <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between border-b border-slate-200 pb-2 px-1">
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600">
                <button
                  onClick={() => setPatientScreen('CHAT')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    patientScreen === 'CHAT' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'
                  }`}
                >
                  1. Symptom AI Triage
                </button>
                <button
                  onClick={() => setPatientScreen('QUEUE')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    patientScreen === 'QUEUE' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'
                  }`}
                >
                  2. Waiting Queue
                </button>
                <button
                  onClick={() => setPatientScreen('VIDEO_CALL')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    patientScreen === 'VIDEO_CALL' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'
                  }`}
                >
                  3. Video Consult
                </button>
                <button
                  onClick={() => setPatientScreen('PRESCRIPTION')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    patientScreen === 'PRESCRIPTION' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-200'
                  }`}
                >
                  4. e-Prescription
                </button>
              </div>

              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium hidden sm:inline"
              >
                Re-test OTP & Consent
              </button>
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
                onEndCall={() => {
                  ApiService.endConsultation(currentConsultationId);
                  setPatientScreen('PRESCRIPTION');
                }}
              />
            )}

            {patientScreen === 'PRESCRIPTION' && (
              <PrescriptionViewer
                currentLanguage={currentLanguage}
                prescription={currentPrescription}
                onVerifyPrescription={(id) => setPatientScreen('VERIFY')}
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

        {/* Doctor Console */}
        {currentRole === 'DOCTOR' && (
          <DoctorConsole
            currentLanguage={currentLanguage}
            doctor={assignedDoctor}
            activePatient={activeProfile}
            triageSummary={triageSummary}
            onIssuePrescription={handleIssuePrescription}
            onIssueReferral={(referralNote) => {
              alert(`Referral Note Issued: ${referralNote}`);
              setCurrentRole('PATIENT');
              setPatientScreen('PRESCRIPTION');
            }}
          />
        )}

        {/* Admin Governance */}
        {currentRole === 'ADMIN' && (
          <AdminDashboard currentLanguage={currentLanguage} />
        )}
      </main>

      {/* Onboarding / OTP Modal */}
      <OnboardingModal
        currentLanguage={currentLanguage}
        isOpen={isOnboardingOpen}
        onComplete={(newSession) => {
          setUserSession(newSession);
          setIsOnboardingOpen(false);
        }}
      />

      {/* Profile Picker Modal */}
      <ProfilePicker
        currentLanguage={currentLanguage}
        isOpen={isProfilePickerOpen}
        onClose={() => setIsProfilePickerOpen(false)}
        profiles={userSession.profiles}
        activeProfileId={userSession.activeProfileId}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
      />
    </div>
  );
};

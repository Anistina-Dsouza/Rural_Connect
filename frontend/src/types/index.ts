export type Language = 'en' | 'hi' | 'gu';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type TriageLevel = 'EMERGENCY' | 'CONSULT_SOON' | 'SELF_CARE';

export interface FamilyProfile {
  id: string;
  name: string;
  relation: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Other';
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  isPregnant?: boolean;
  chronicConditions?: string[];
  currentMedications?: string[];
  avatar: string;
}

export interface UserSession {
  phoneNumber: string;
  isVerified: boolean;
  consentGiven: boolean;
  activeProfileId: string;
  profiles: FamilyProfile[];
  preferredLanguage: Language;
}

export interface SymptomMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  isAudio?: boolean;
  audioDurationSec?: number;
  triageOutcome?: TriageLevel;
  quickReplies?: string[];
}

export interface ClinicalTriageResult {
  triageLevel: TriageLevel;
  confidenceScore: number;
  matchedRedFlags: string[];
  primaryComplaint: string;
  structuredDetails: {
    duration: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
    age: number;
    gender: string;
    pregnancy: boolean;
    chronicConditions: string[];
    medications: string[];
  };
  approvedInterimAdvice: string[];
  doctorCaseSummary: {
    chiefComplaint: string;
    timeline: string;
    vitalsNotes: string;
    redFlagCheck: string;
    recommendedAction: string;
  };
  disclaimer: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  registrationNumber: string; // e.g., MCI/NMC-2018-84729
  councilName: string; // e.g., Medical Council of India / Gujarat Medical Council
  experienceYears: number;
  languages: string[];
  isAvailable: boolean;
  avatar: string;
  rating: number;
  activeConsultationId?: string;
}

export type ConsultationStatus = 
  | 'QUEUED'
  | 'CONNECTING'
  | 'IN_CALL'
  | 'COMPLETED'
  | 'MISSED'
  | 'REFERRED_IN_PERSON';

export type CallBandwidthMode = 'ADAPTIVE' | 'LOW_RES_VIDEO' | 'AUDIO_ONLY';

export interface ConsultationSession {
  id: string;
  caseId: string;
  patientPhoneNumber: string;
  patientProfile: FamilyProfile;
  doctor: Doctor;
  status: ConsultationStatus;
  triageSummary: ClinicalTriageResult;
  queuePosition: number;
  estimatedWaitMinutes: number;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  bandwidthMode: CallBandwidthMode;
  audioOnlyFallback: boolean;
  rejoinGracePeriodSeconds: number;
  referralNote?: string;
  prescriptionId?: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage: string; // e.g. 500mg
  frequency: string; // e.g. 1-0-1 (Morning & Night)
  timing: 'Before Food' | 'After Food' | 'With Food' | 'Anytime';
  durationDays: number;
  instructionEn: string;
  instructionHi: string;
  instructionGu: string;
}

export interface Prescription {
  id: string; // e.g. RC-2026-98124
  consultationId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorName: string;
  doctorRegNo: string;
  doctorCouncil: string;
  doctorSignatureDate: string;
  diagnosis: string;
  symptoms: string[];
  medicines: PrescriptionMedicine[];
  generalAdvice: string;
  followUpDays?: number;
  referralDetails?: string;
  verificationQrData: string;
  isOfflineAvailable: boolean;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  patientPhone: string;
  profileName: string;
  initialComplaint: string;
  aiTriageLevel: TriageLevel;
  doctorFinalDisposition?: TriageLevel;
  isConcordant?: boolean;
  redFlagsDetected: string[];
  reviewedByClinician: boolean;
  clinicalNotes?: string;
}


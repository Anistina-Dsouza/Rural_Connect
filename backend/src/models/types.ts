export type Language = 'en' | 'hi' | 'gu';
export type TriageLevel = 'EMERGENCY' | 'CONSULT_SOON' | 'SELF_CARE';
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ASHA' | 'ADMIN';

export interface IFamilyProfile {
  id: string;
  userId?: string;
  name: string;
  relation: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Other';
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  isPregnant?: boolean;
  chronicConditions?: string[];
  currentMedications?: string[];
  avatar: string;
}

export interface IUser {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  isVerified: boolean;
  consentGiven: boolean;
  activeProfileId?: string;
  preferredLanguage: Language;
  createdAt: string;

  doctorDetails?: {
    registrationNumber: string;
    councilName: string;
    specialization: string;
    experienceYears: number;
    isNmcVerified: boolean;
    verificationDate?: string;
  };

  ashaDetails?: {
    workerId: string;
    sector: string;
    villagePHC: string;
    householdCount: number;
  };
}

export interface IDoctor {
  id: string;
  userId?: string;
  name: string;
  specialization: string;
  registrationNumber: string;
  councilName: string;
  experienceYears: number;
  languages: string[];
  isAvailable: boolean;
  avatar: string;
  rating: number;
  phoneNumber?: string;
  phone?: string;
}

export interface IPrescriptionMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: 'Before Food' | 'After Food' | 'With Food' | 'Anytime';
  durationDays: number;
  instructionEn: string;
  instructionHi: string;
  instructionGu: string;
}

export interface IPrescription {
  id: string;
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
  medicines: IPrescriptionMedicine[];
  generalAdvice: string;
  followUpDays?: number;
  referralDetails?: string;
  verificationQrData: string;
  isOfflineAvailable: boolean;
  createdAt: string;
}

export interface IConsultation {
  id: string;
  patientPhoneNumber: string;
  patientProfile: IFamilyProfile;
  doctor: IDoctor;
  status: 'QUEUED' | 'IN_CALL' | 'COMPLETED' | 'CANCELLED' | 'REFERRED_IN_PERSON';
  triageSummary: any;
  queuePosition: number;
  estimatedWaitMinutes: number;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  bandwidthMode: string;
  chatMessages: { sender: string; text: string; time: string }[];
  prescriptionId?: string;
  referralNote?: string;
  zoomMeeting?: {
    meetingId: string;
    joinUrl: string;
    startUrl?: string;
    password?: string;
    topic?: string;
  };
}

export interface IAuditLog {
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

export interface IFacility {
  id: string;
  name: string;
  distance: string;
  type: string;
  beds: string;
  phone: string;
  ambulanceTime: string;
}

export interface IVitalsRecord {
  id: string;
  patientPhone: string;
  profileId: string;
  patientName: string;
  systolicBp: number;
  diastolicBp: number;
  spO2: number;
  pulseRate: number;
  temperatureF: number;
  bloodSugarMgDl?: number;
  recordedByAshaId: string;
  recordedByAshaName: string;
  notes?: string;
  timestamp: string;
}

export interface IFollowUpCheckIn {
  id: string;
  prescriptionId: string;
  patientPhone: string;
  profileId: string;
  patientName: string;
  status: 'IMPROVED' | 'SAME' | 'WORSENED';
  feedbackNotes?: string;
  escalatedToDoctor: boolean;
  timestamp: string;
}

export interface IReferralNote {
  id: string;
  consultationId: string;
  patientName: string;
  patientPhone: string;
  referringDoctor: string;
  doctorRegNo: string;
  targetFacility: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  clinicalReason: string;
  investigationsRequested: string[];
  issuedAt: string;
}

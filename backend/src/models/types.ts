export type Language = 'en' | 'hi' | 'gu';
export type TriageLevel = 'EMERGENCY' | 'CONSULT_SOON' | 'SELF_CARE';

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
  phoneNumber: string;
  isVerified: boolean;
  consentGiven: boolean;
  activeProfileId: string;
  preferredLanguage: Language;
}

export interface IDoctor {
  id: string;
  name: string;
  specialization: string;
  registrationNumber: string;
  councilName: string;
  experienceYears: number;
  languages: string[];
  isAvailable: boolean;
  avatar: string;
  rating: number;
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
  status: 'QUEUED' | 'IN_CALL' | 'COMPLETED' | 'CANCELLED';
  triageSummary: any;
  queuePosition: number;
  estimatedWaitMinutes: number;
  scheduledAt: string;
  bandwidthMode: string;
  chatMessages: { sender: string; text: string; time: string }[];
  prescriptionId?: string;
  referralNote?: string;
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

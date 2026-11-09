import { ClinicalTriageResult, FamilyProfile, Language, Prescription, Doctor, AuditRecord } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Safe request wrapper that falls back gracefully if backend is offline
async function apiRequest<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API Client] Error on ${endpoint}, returning fallback:`, err);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

export const ApiService = {
  // Auth & Consent
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; otp?: string; message: string }> {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }, {
      success: true,
      otp: '782910',
      message: 'Demo fallback OTP'
    });
  },

  async verifyOtp(phoneNumber: string, otp: string) {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  },

  async recordConsent(phoneNumber: string, consentGiven: boolean) {
    return apiRequest('/auth/consent', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, consentGiven }),
    });
  },

  // Family Profiles
  async getProfiles(phoneNumber: string = '9876543210'): Promise<{ success: boolean; profiles: FamilyProfile[]; activeProfileId: string }> {
    return apiRequest(`/profiles?phoneNumber=${phoneNumber}`, {
      method: 'GET'
    });
  },

  async addProfile(phoneNumber: string, profile: Partial<FamilyProfile>): Promise<{ success: boolean; profile: FamilyProfile; profiles: FamilyProfile[] }> {
    return apiRequest('/profiles/add', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, ...profile }),
    });
  },

  async switchProfile(phoneNumber: string, profileId: string): Promise<{ success: boolean; activeProfileId: string }> {
    return apiRequest('/profiles/switch', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, profileId }),
    });
  },

  // AI Triage Assessment
  async assessTriage(
    complaint: string,
    duration: string,
    severity: 'Mild' | 'Moderate' | 'Severe',
    profile: FamilyProfile,
    language: Language = 'hi',
    phoneNumber: string = '9876543210'
  ): Promise<{ success: boolean; triageResult: ClinicalTriageResult }> {
    return apiRequest('/triage/assess', {
      method: 'POST',
      body: JSON.stringify({ complaint, duration, severity, profile, language, phoneNumber }),
    });
  },

  // Virtual Queue & Consultations
  async joinQueue(
    patientPhoneNumber: string,
    patientProfile: FamilyProfile,
    triageSummary: ClinicalTriageResult | null,
    bandwidthMode: string = 'ADAPTIVE'
  ) {
    return apiRequest('/queue/join', {
      method: 'POST',
      body: JSON.stringify({ patientPhoneNumber, patientProfile, triageSummary, bandwidthMode }),
    });
  },

  async getQueueStatus(consultationId: string) {
    return apiRequest(`/queue/${consultationId}`, {
      method: 'GET',
    });
  },

  async sendInCallMessage(consultationId: string, sender: string, text: string) {
    return apiRequest(`/consultations/${consultationId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ sender, text }),
    });
  },

  async endConsultation(consultationId: string) {
    return apiRequest(`/consultations/${consultationId}/end`, {
      method: 'POST',
    });
  },

  // Prescriptions & Verification
  async createPrescription(prescriptionData: Partial<Prescription>): Promise<{ success: boolean; prescription: Prescription; error?: string; message?: string }> {
    return apiRequest('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  },

  async getPrescription(id: string): Promise<{ success: boolean; prescription: Prescription }> {
    return apiRequest(`/prescriptions/${id}`, {
      method: 'GET',
    });
  },

  async verifyPrescription(id: string) {
    return apiRequest(`/prescriptions/verify/${id}`, {
      method: 'GET',
    });
  },

  // Admin Clinical Governance
  async getClinicalMetrics() {
    return apiRequest('/admin/metrics', {
      method: 'GET',
    });
  },

  async getAuditLogs(): Promise<{ success: boolean; auditLogs: AuditRecord[] }> {
    return apiRequest('/admin/audit', {
      method: 'GET',
    });
  },

  // Facilities
  async getNearbyFacilities() {
    return apiRequest('/facilities', {
      method: 'GET',
    });
  }
};

import { ClinicalTriageResult, FamilyProfile, Language, Prescription, Doctor, AuditRecord } from '../types';
import { getAuthToken } from './auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5020/api';

async function apiRequest<T = any>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const token = getAuthToken();
    const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API Client] Endpoint ${endpoint} fallback notice:`, err);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

export const ApiService = {
  // ========================================================
  // SECTION 7.1: ACCOUNT AND CONSENT (FR-1.1 to FR-1.9)
  // ========================================================

  // FR-1.1: Mobile Number Registration & SMS OTP
  async sendOtp(phoneNumber: string, language: Language = 'hi'): Promise<{ success: boolean; autoReadOtp?: string; message: string; smsTimeoutSeconds?: number }> {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, language }),
    }, {
      success: true,
      autoReadOtp: Math.floor(100000 + Math.random() * 900000).toString(),
      message: 'Demo fallback OTP',
      smsTimeoutSeconds: 30
    });
  },

  // FR-1.1 & FR-1.8: Verify OTP & Establish Permanent Device Session
  async verifyOtp(phoneNumber: string, otp: string, deviceId: string = 'device_current', role?: 'PATIENT' | 'DOCTOR'): Promise<{ success: boolean; token?: string; message?: string }> {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp, deviceId, role }),
    }, {
      success: true,
      token: '',
      message: 'Demo fallback verify'
    });
  },


  // FR-1.7: "Call me with the code" Automated Voice Call OTP
  async voiceCallOtp(phoneNumber: string, language: Language = 'hi'): Promise<{ success: boolean; spokenCode: string; message: string }> {
    return apiRequest('/auth/voice-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, language }),
    }, {
      success: true,
      spokenCode: '849201',
      message: 'Demo voice call OTP initiated'
    });
  },

  // FR-1.3: Explicit, Revocable Telemedicine & DPDP Consent
  async recordConsent(phoneNumber: string, consentGiven: boolean, language: Language = 'hi') {
    return apiRequest('/auth/consent', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, consentGiven, language }),
    });
  },

  // FR-1.5: Data Export Request
  async exportUserData(phoneNumber: string = '9876543210') {
    return apiRequest(`/auth/export-data?phoneNumber=${phoneNumber}`, {
      method: 'GET',
    });
  },

  // FR-1.5: Permanent Account Deletion
  async deleteUserAccount(phoneNumber: string) {
    return apiRequest('/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  },

  // FR-1.9: Screen Lock / PIN Security Toggle on Shared Phone
  async updateLockSettings(phoneNumber: string, isLockedBehindPin: boolean) {
    return apiRequest('/auth/lock-settings', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, isLockedBehindPin }),
    });
  },

  // FR-1.4 & FR-1.9: Dependent Family Profiles
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

  async deleteProfile(profileId: string, phoneNumber: string = '9876543210'): Promise<{ success: boolean; profiles: FamilyProfile[] }> {
    return apiRequest(`/profiles/${profileId}`, {
      method: 'DELETE',
      body: JSON.stringify({ phoneNumber }),
    });
  },

  async switchProfile(phoneNumber: string, profileId: string): Promise<{ success: boolean; activeProfileId: string }> {
    return apiRequest('/profiles/switch', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, profileId }),
    });
  },

  // ========================================================
  // CLINICAL & TELEMEDICINE SERVICES
  // ========================================================

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

  async joinQueue(
    patientPhoneNumber: string,
    patientProfile: FamilyProfile,
    triageSummary: ClinicalTriageResult | null,
    bandwidthMode: string = 'ADAPTIVE'
  ): Promise<{ success: boolean; consultation?: any; queuePosition?: number; estimatedWaitMinutes?: number; message?: string }> {
    return apiRequest('/queue/join', {
      method: 'POST',
      body: JSON.stringify({ patientPhoneNumber, patientProfile, triageSummary, bandwidthMode }),
    });
  },

  async getQueue(): Promise<{ success: boolean; queue: any[]; totalWaiting: number }> {
    return apiRequest('/queue', {
      method: 'GET',
    });
  },

  async updateConsultationStatus(consultationId: string, status: string): Promise<{ success: boolean; consultation: any }> {
    return apiRequest(`/consultations/${consultationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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

  async createPrescription(prescriptionData: Partial<Prescription>): Promise<{ success: boolean; prescription: Prescription; error?: string; message?: string }> {
    return apiRequest('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  },

  async getAllPrescriptions(phoneNumber?: string): Promise<{ success: boolean; prescriptions: Prescription[] }> {
    const url = phoneNumber ? `/prescriptions?phoneNumber=${phoneNumber}` : '/prescriptions';
    return apiRequest(url, {
      method: 'GET',
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

  async getDoctors(): Promise<{ success: boolean; doctors: Doctor[] }> {
    return apiRequest('/admin/doctors', {
      method: 'GET',
    });
  },

  async getMe(): Promise<{ success: boolean; user?: any; profiles?: FamilyProfile[] }> {
    return apiRequest('/auth/me', {
      method: 'GET',
    }, { success: false });
  },

  async updateDoctorAvailability(doctorId: string, isAvailable: boolean): Promise<{ success: boolean }> {
    return apiRequest(`/doctors/${doctorId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }, { success: true });
  },

  async getZoomMeeting(consultationId: string): Promise<{ success: boolean; zoomMeeting: any }> {
    return apiRequest(`/consultations/${consultationId}/zoom`, {
      method: 'GET',
    });
  },

  async getNearbyFacilities() {
    return apiRequest('/facilities', {
      method: 'GET',
    });
  },

  // ========================================================
  // RECONNECT & REFERRAL SERVICES (FR-4.3 & FR-4.5)
  // ========================================================
  async reconnectConsultation(consultationId: string) {
    return apiRequest(`/consultations/${consultationId}/reconnect`, {
      method: 'POST',
    });
  },

  async updateBandwidthMode(consultationId: string, bandwidthMode: string) {
    return apiRequest(`/consultations/${consultationId}/bandwidth`, {
      method: 'POST',
      body: JSON.stringify({ bandwidthMode }),
    });
  },

  async createReferralNote(referralData: any) {
    return apiRequest(`/consultations/${referralData.consultationId || 'CONS-REF'}/referral`, {
      method: 'POST',
      body: JSON.stringify(referralData),
    });
  },

  async getReferralNote(id: string) {
    return apiRequest(`/consultations/referrals/${id}`, {
      method: 'GET',
    });
  },

  async getPrescriptionsByPhone(phone: string) {
    return apiRequest(`/prescriptions/phone/${phone}`, {
      method: 'GET',
    });
  },

  // ========================================================
  // ASHA & FOLLOW-UP SERVICES (FR-6)
  // ========================================================
  async getAshaHouseholds() {
    return apiRequest('/asha/households', {
      method: 'GET',
    });
  },

  async recordVitals(vitalsData: any) {
    return apiRequest('/asha/vitals', {
      method: 'POST',
      body: JSON.stringify(vitalsData),
    });
  },

  async getPatientVitals(phone: string) {
    return apiRequest(`/asha/vitals/${phone}`, {
      method: 'GET',
    });
  },

  async syncOfflineVitals(batch: any[]) {
    return apiRequest('/asha/sync', {
      method: 'POST',
      body: JSON.stringify({ batch }),
    });
  },

  async submitFollowUpCheckIn(followUpData: {
    prescriptionId: string;
    patientPhone: string;
    profileId?: string;
    patientName?: string;
    status: 'IMPROVED' | 'SAME' | 'WORSENED';
    feedbackNotes?: string;
  }) {
    return apiRequest('/follow-up/check-in', {
      method: 'POST',
      body: JSON.stringify(followUpData),
    });
  },

  async getFollowUpHistory(prescriptionId: string) {
    return apiRequest(`/follow-up/${prescriptionId}`, {
      method: 'GET',
    });
  }
};

import { Router } from 'express';
import { 
  sendOtp, 
  voiceCallOtp, 
  verifyOtp, 
  updateConsent, 
  exportUserData, 
  deleteUserAccount, 
  updateLockSettings, 
  getMe 
} from '../controllers/authController.js';
import { 
  getProfiles, 
  addProfile, 
  updateProfile, 
  deleteProfile, 
  switchActiveProfile 
} from '../controllers/profileController.js';
import { assessTriage } from '../controllers/triageController.js';
import { 
  joinQueue, 
  getQueueStatus, 
  getAllQueue,
  updateConsultationStatus,
  sendInCallChatMessage, 
  endConsultation,
  reconnectConsultation,
  updateBandwidthMode,
  createReferralNote,
  getReferralNote,
  getZoomMeeting
} from '../controllers/consultationController.js';
import { 
  createPrescription, 
  getAllPrescriptions,
  getPrescriptionById, 
  verifyPrescription,
  getPrescriptionsByPhone
} from '../controllers/prescriptionController.js';
import { getClinicalMetrics, getAuditLogs, getDoctors, updateDoctorAvailability } from '../controllers/adminController.js';
import { getNearbyFacilities } from '../controllers/facilityController.js';
import { 
  getAshaHouseholds, 
  recordPatientVitals, 
  getPatientVitals, 
  syncOfflineVitals 
} from '../controllers/ashaController.js';
import { 
  submitFollowUpCheckIn, 
  getFollowUpHistory 
} from '../controllers/followUpController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// ========================================================
// SECTION 7.1: ACCOUNT AND CONSENT (FR-1.1 to FR-1.9)
// ========================================================

// FR-1.1: Mobile number registration and SMS OTP dispatch
router.post('/auth/send-otp', sendOtp);

// FR-1.1 & FR-1.8: Verify OTP, establish permanent device session
router.post('/auth/verify-otp', verifyOtp);

// FR-1.7: Automated voice call OTP ("Call me with the code")
router.post('/auth/voice-otp', voiceCallOtp);

// FR-1.3: Explicit, revocable consent for teleconsultation & data processing
router.post('/auth/consent', updateConsent);

// FR-1.5: Data export request
router.get('/auth/export-data', exportUserData);
router.post('/auth/export-data', exportUserData);

// FR-1.5: Account deletion request
router.delete('/auth/delete-account', deleteUserAccount);
router.post('/auth/delete-account', deleteUserAccount);

// FR-1.9: Screen lock / PIN protection toggle on shared household devices
router.post('/auth/lock-settings', updateLockSettings);

// FR-1.8: Current permanent session verification
router.get('/auth/me', authenticateToken, getMe);

// FR-1.4: Multi-profile dependent management (children, elders)
router.get('/profiles', getProfiles);
router.post('/profiles/add', addProfile);
router.put('/profiles/:id', updateProfile);
router.delete('/profiles/:id', deleteProfile);

// FR-1.9: Profile picker selection on shared phone
router.post('/profiles/switch', switchActiveProfile);

// ========================================================
// SECTION 7.2: CLINICAL AI TRIAGE (FR-2.1 to FR-2.9)
// ========================================================
router.post('/triage/assess', assessTriage);

// ========================================================
// SECTION 7.3: EMERGENCY RED-FLAG FLOW & FACILITIES (FR-3)
// ========================================================
router.get('/facilities', getNearbyFacilities);

// ========================================================
// SECTION 7.4: VIRTUAL QUEUE & CONSULTATIONS (FR-4)
// ========================================================
router.get('/queue', getAllQueue);
router.post('/queue/join', joinQueue);
router.get('/queue/:id', getQueueStatus);
router.patch('/consultations/:id/status', updateConsultationStatus);
router.post('/consultations/:id/reconnect', reconnectConsultation);
router.post('/consultations/:id/bandwidth', updateBandwidthMode);
router.post('/consultations/:id/chat', sendInCallChatMessage);
router.post('/consultations/:id/referral', createReferralNote);
router.get('/consultations/referrals/:id', getReferralNote);
router.post('/consultations/:id/end', endConsultation);
router.get('/consultations/:id/zoom', getZoomMeeting);

// ========================================================
// SECTION 7.5: PRESCRIPTIONS & DRUG SAFETY (FR-5)
// ========================================================
router.get('/prescriptions', getAllPrescriptions);
router.post('/prescriptions', createPrescription);
router.get('/prescriptions/phone/:phone', getPrescriptionsByPhone);
router.get('/prescriptions/:id', getPrescriptionById);
router.get('/prescriptions/verify/:id', verifyPrescription);

// ========================================================
// SECTION 7.6: ASHA ASSISTED MODE & FOLLOW-UP (FR-6)
// ========================================================
router.get('/asha/households', getAshaHouseholds);
router.post('/asha/vitals', recordPatientVitals);
router.get('/asha/vitals/:phone', getPatientVitals);
router.post('/asha/sync', syncOfflineVitals);

router.post('/follow-up/check-in', submitFollowUpCheckIn);
router.get('/follow-up/:prescriptionId', getFollowUpHistory);

// ========================================================
// SECTION 7.7: ADMIN & CLINICAL GOVERNANCE (FR-7)
// ========================================================
router.get('/admin/metrics', getClinicalMetrics);
router.get('/admin/audit', getAuditLogs);
router.get('/admin/doctors', getDoctors);
router.patch('/doctors/:id/availability', updateDoctorAvailability);

export default router;

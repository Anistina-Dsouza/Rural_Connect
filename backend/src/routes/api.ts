import { Router } from 'express';
import { sendOtp, verifyOtp, recordConsent } from '../controllers/authController.js';
import { getProfiles, addProfile, switchActiveProfile } from '../controllers/profileController.js';
import { assessTriage } from '../controllers/triageController.js';
import { joinQueue, getQueueStatus, sendInCallChatMessage, endConsultation } from '../controllers/consultationController.js';
import { createPrescription, getPrescriptionById, verifyPrescription } from '../controllers/prescriptionController.js';
import { getClinicalMetrics, getAuditLogs, getDoctors } from '../controllers/adminController.js';
import { getNearbyFacilities } from '../controllers/facilityController.js';

const router = Router();

// Auth & Consent
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/consent', recordConsent);

// Family Profiles
router.get('/profiles', getProfiles);
router.post('/profiles/add', addProfile);
router.post('/profiles/switch', switchActiveProfile);

// AI Triage Assessment
router.post('/triage/assess', assessTriage);

// Queue & Consultations
router.post('/queue/join', joinQueue);
router.get('/queue/:id', getQueueStatus);
router.post('/consultations/:id/chat', sendInCallChatMessage);
router.post('/consultations/:id/end', endConsultation);

// Prescriptions & Verification
router.post('/prescriptions', createPrescription);
router.get('/prescriptions/:id', getPrescriptionById);
router.get('/prescriptions/verify/:id', verifyPrescription);

// Admin & Clinical Governance
router.get('/admin/metrics', getClinicalMetrics);
router.get('/admin/audit', getAuditLogs);
router.get('/admin/doctors', getDoctors);

// Facilities
router.get('/facilities', getNearbyFacilities);

export default router;

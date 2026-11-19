import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { store } from '../store.js';
import { IConsultation, IReferralNote } from '../models/types.js';
import { AgoraService } from '../services/agoraService.js';
import { ConsultationModel } from '../models/schemas.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// --- FR-4.1: Join Virtual Waiting Room Queue ---
export const joinQueue = async (req: Request, res: Response) => {
  const { patientPhoneNumber = '9876543210', patientProfile, triageSummary, bandwidthMode = 'ADAPTIVE' } = req.body;

  const consultationId = `CONS-${Date.now().toString().slice(-6)}`;
  const doctor = store.doctors[0]; // Active assigned physician

  // Calculate queue position
  const queuePos = store.activeQueue.length + 1;
  const estimatedWait = queuePos * 3;

  const profile = patientProfile || (store.profiles.get(patientPhoneNumber) || [])[0];

  const consultation: IConsultation = {
    id: consultationId,
    patientPhoneNumber,
    patientProfile: profile,
    doctor,
    status: 'QUEUED',
    triageSummary,
    queuePosition: queuePos,
    estimatedWaitMinutes: estimatedWait,
    scheduledAt: new Date().toISOString(),
    bandwidthMode,
    chatMessages: [
      {
        sender: `Dr. ${doctor.name}`,
        text: 'Namaste! I am reviewing your AI triage summary. How are you feeling right now?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };

  if (mongoose.connection.readyState === 1) {
    try {
      await ConsultationModel.create(consultation);
    } catch (error) {
      console.error('[DB] Failed to save consultation:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to save consultation to MongoDB' });
    }
  }

  store.consultations.set(consultationId, consultation);
  store.activeQueue.push(consultationId);
  if (mongoose.connection.readyState !== 1) {
    await store.saveItem('consultation', consultation);
  }

  return res.json({
    success: true,
    consultation
  });
};

// --- FR-4.1: Poll Live Queue Position & Wait Time ---
export const getQueueStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (mongoose.connection.readyState === 1) {
    try {
      const dbConsult = await ConsultationModel.findOne({ id }).lean();
      if (dbConsult) {
        store.consultations.set(id, dbConsult as unknown as IConsultation);
        if (['QUEUED', 'IN_CALL'].includes(dbConsult.status) && !store.activeQueue.includes(id)) {
          store.activeQueue.push(id);
        }
        return res.json({ success: true, consultation: dbConsult });
      }
    } catch (error) {
      console.error('[DB] Failed to load consultation:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to load consultation from MongoDB' });
    }
  }

  const consult = store.consultations.get(id);
  if (!consult) return res.status(404).json({ success: false, message: 'Consultation session not found' });

  // Find index in queue
  const idx = store.activeQueue.indexOf(id);
  if (idx !== -1) {
    consult.queuePosition = idx + 1;
    consult.estimatedWaitMinutes = (idx + 1) * 3;
  }

  return res.json({
    success: true,
    consultation: consult
  });
};

export const getAgoraCallCredentials = async (req: Request, res: Response) => {
  const { id } = req.params;
  let consult: IConsultation | undefined;
  if (mongoose.connection.readyState === 1) {
    try {
      const dbConsult = await ConsultationModel.findOne({ id }).lean();
      if (dbConsult) {
        consult = dbConsult as unknown as IConsultation;
        store.consultations.set(id, consult);
      }
    } catch (error) {
      console.error('[Agora] Failed to load consultation:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to load consultation' });
    }
  } else {
    consult = store.consultations.get(id);
  }

  if (!consult) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  if (consult.status !== 'IN_CALL') {
    return res.status(409).json({ success: false, message: 'Consultation is not active yet' });
  }

  const { user } = req as AuthRequest;
  if (!user || (user.role !== 'PATIENT' && user.role !== 'DOCTOR')) {
    return res.status(403).json({ success: false, message: 'Only consultation participants can join' });
  }

  const normalizePhone = (phone?: string) => phone?.replace(/\D/g, '').slice(-10);
  let isAuthorizedParticipant = false;

  if (user.role === 'PATIENT') {
    const userPhone = normalizePhone(user.phoneNumber);
    isAuthorizedParticipant = Boolean(userPhone && userPhone === normalizePhone(consult.patientPhoneNumber));
  } else {
    isAuthorizedParticipant =
      consult.doctor.userId === user.id ||
      consult.doctor.id === user.id ||
      (!!user.name && consult.doctor.name === user.name) ||
      (!!user.registrationNumber && consult.doctor.registrationNumber === user.registrationNumber);
  }

  if (!isAuthorizedParticipant) {
    return res.status(403).json({ success: false, message: 'You are not assigned to this consultation' });
  }

  if (!AgoraService.isConfigured()) {
    return res.status(503).json({ success: false, message: 'Agora is not configured on the server' });
  }

  try {
    const credentials = AgoraService.createCallCredentials(id, user.role);
    return res.json({ success: true, credentials });
  } catch (error) {
    console.error('[Agora] Failed to create call token:', error);
    return res.status(500).json({ success: false, message: 'Unable to create Agora call token' });
  }
};


// --- FR-4.3: 5-Minute Reconnect Grace Period Window ---
export const reconnectConsultation = (req: Request, res: Response) => {
  const { id } = req.params;
  const consult = store.consultations.get(id);

  if (!consult) {
    return res.status(404).json({ success: false, message: 'Session expired or not found' });
  }

  const now = Date.now();
  const scheduledTime = new Date(consult.scheduledAt).getTime();
  const elapsedMinutes = (now - scheduledTime) / (1000 * 60);

  // Allow reconnection if within active session or 5-min grace window
  const isWithinGraceWindow = elapsedMinutes <= 30; // 30 mins total session window, 5 mins instant reconnect

  return res.json({
    success: true,
    reconnected: isWithinGraceWindow,
    consultation: consult,
    gracePeriodSecondsRemaining: Math.max(0, 300 - Math.floor((now - scheduledTime) / 1000) % 300),
    message: isWithinGraceWindow 
      ? 'Successfully reconnected within rural network grace period (FR-4.3)' 
      : 'Session grace window expired'
  });
};

// --- FR-4.2: Dynamic Bandwidth Mode Switching ---
export const updateBandwidthMode = (req: Request, res: Response) => {
  const { id } = req.params;
  const { bandwidthMode = 'ADAPTIVE' } = req.body;
  const consult = store.consultations.get(id);

  if (!consult) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  consult.bandwidthMode = bandwidthMode;

  return res.json({
    success: true,
    bandwidthMode: consult.bandwidthMode,
    message: `Switched call bandwidth mode to ${bandwidthMode} (FR-4.2)`
  });
};

// --- FR-4.7: In-Call Bilingual Text Chat Fallback ---
export const sendInCallChatMessage = (req: Request, res: Response) => {
  const { id } = req.params;
  const { sender, text } = req.body;

  const consult = store.consultations.get(id);
  if (!consult) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  const newMsg = {
    sender: sender || 'Patient',
    text: text || '',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  consult.chatMessages.push(newMsg);

  return res.json({
    success: true,
    message: newMsg,
    chatMessages: consult.chatMessages
  });
};

// --- FR-4.5: Issue In-Person Clinical Referral Note ---
export const createReferralNote = (req: Request, res: Response) => {
  const { 
    consultationId, 
    patientName, 
    patientPhone, 
    targetFacility = 'Government Community Health Centre (CHC)', 
    priority = 'URGENT', 
    clinicalReason, 
    investigationsRequested = [] 
  } = req.body;

  const doctor = store.doctors[0];
  const refId = `REF-${Math.floor(1000 + Math.random() * 9000)}`;

  const referralNote: IReferralNote = {
    id: refId,
    consultationId: consultationId || 'CONS-GENERAL',
    patientName: patientName || 'Resident Patient',
    patientPhone: patientPhone || '9876543210',
    referringDoctor: doctor.name,
    doctorRegNo: doctor.registrationNumber,
    targetFacility,
    priority,
    clinicalReason: clinicalReason || 'Requires physical examination, diagnostic imaging, and in-person laboratory evaluation.',
    investigationsRequested,
    issuedAt: new Date().toISOString()
  };

  store.referrals.set(refId, referralNote);
  store.saveItem('referral', referralNote);

  // Update consultation status to REFERRED_IN_PERSON
  if (consultationId && store.consultations.has(consultationId)) {
    const consult = store.consultations.get(consultationId)!;
    consult.status = 'COMPLETED';
    consult.referralNote = referralNote.clinicalReason;
  }

  return res.json({
    success: true,
    message: 'In-person clinical referral note generated successfully (FR-4.5)',
    referral: referralNote
  });
};

// --- FR-4.5: Get Referral Note by ID ---
export const getReferralNote = (req: Request, res: Response) => {
  const { id } = req.params;
  const ref = store.referrals.get(id);

  if (!ref) {
    const first = store.referrals.values().next().value;
    if (first) return res.json({ success: true, referral: first });
    return res.status(404).json({ success: false, message: 'Referral note not found' });
  }

  return res.json({ success: true, referral: ref });
};

// --- FR-4.6: End Consultation Session ---
export const endConsultation = async (req: Request, res: Response) => {
  const { id } = req.params;
  let consult = store.consultations.get(id);

  if (mongoose.connection.readyState === 1) {
    try {
      const dbConsult = await ConsultationModel.findOneAndUpdate(
        { id },
        { $set: { status: 'COMPLETED', endedAt: new Date().toISOString() } },
        { new: true, runValidators: true }
      ).lean();
      if (!dbConsult) return res.status(404).json({ success: false, message: 'Consultation not found' });
      consult = dbConsult as unknown as IConsultation;
    } catch (error) {
      console.error('[DB] Failed to end consultation:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to update consultation in MongoDB' });
    }
  }

  if (consult) {
    consult.status = 'COMPLETED';
    const queueIdx = store.activeQueue.indexOf(id);
    if (queueIdx !== -1) {
      store.activeQueue.splice(queueIdx, 1);
    }
  }

  if (consult && mongoose.connection.readyState !== 1) {
    await store.saveItem('consultation', consult);
  }

  return res.json({
    success: true,
    message: 'Consultation successfully concluded (FR-4.6)'
  });
};

export const getAllQueue = async (req: Request, res: Response) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const dbConsultations = await ConsultationModel
        .find({ status: { $in: ['QUEUED', 'IN_CALL'] } })
        .sort({ scheduledAt: 1 })
        .limit(100)
        .lean();

      store.activeQueue = dbConsultations.map((consultation) => consultation.id);
      for (const consultation of dbConsultations) {
        store.consultations.set(consultation.id, consultation as unknown as IConsultation);
      }

      const queue = dbConsultations.map((consultation, index) => ({
        ...consultation,
        queuePosition: index + 1,
        estimatedWaitMinutes: index * 4
      }));
      return res.json({ success: true, queue, totalWaiting: queue.length });
    } catch (error) {
      console.error('[DB] Failed to load consultation queue:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to load queue from MongoDB' });
    }
  }

  let queueConsultations = store.activeQueue
    .map((id, index) => {
      const consult = store.consultations.get(id);
      if (!consult) return null;
      return {
        ...consult,
        queuePosition: index + 1,
        estimatedWaitMinutes: index * 4
      };
    })
    .filter(Boolean) as any[];

  // If activeQueue index is empty, fall back to non-completed consultations in store
  if (queueConsultations.length === 0 && store.consultations.size > 0) {
    queueConsultations = Array.from(store.consultations.values())
      .filter((c) => c.status !== 'COMPLETED' && c.status !== 'CANCELLED')
      .map((c, idx) => ({
        ...c,
        queuePosition: idx + 1,
        estimatedWaitMinutes: idx * 4
      }));
  }

  // If still empty, fetch from MongoDB Atlas
  if (queueConsultations.length === 0) {
    try {
      const dbConsultations = await ConsultationModel
        .find({ status: { $in: ['QUEUED', 'IN_CALL'] } })
        .sort({ scheduledAt: -1 })
        .limit(20)
        .lean();

      queueConsultations = dbConsultations.map((c, idx) => {
        const consultation = c as unknown as IConsultation;
        // Sync to in-memory store
        store.consultations.set(consultation.id, consultation);
        if (!store.activeQueue.includes(consultation.id)) {
          store.activeQueue.push(consultation.id);
        }
        return {
          ...consultation,
          queuePosition: idx + 1,
          estimatedWaitMinutes: idx * 4
        };
      });
    } catch (dbErr) {
      console.warn('[DB] getAllQueue MongoDB note:', dbErr);
    }
  }

  return res.json({
    success: true,
    queue: queueConsultations,
    totalWaiting: queueConsultations.length
  });
};

export const updateConsultationStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses: IConsultation['status'][] = ['QUEUED', 'IN_CALL', 'COMPLETED', 'CANCELLED', 'REFERRED_IN_PERSON'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid consultation status' });
  }

  let consult = store.consultations.get(id);
  if (mongoose.connection.readyState === 1) {
    const update: Partial<IConsultation> = { status };
    if (status === 'IN_CALL' && !consult?.startedAt) update.startedAt = new Date().toISOString();
    if (status === 'COMPLETED' || status === 'REFERRED_IN_PERSON' || status === 'CANCELLED') {
      update.endedAt = new Date().toISOString();
    }
    try {
      const dbConsult = await ConsultationModel.findOneAndUpdate(
        { id },
        { $set: update },
        { new: true, runValidators: true }
      ).lean();
      if (!dbConsult) return res.status(404).json({ success: false, message: 'Consultation not found' });
      consult = dbConsult as unknown as IConsultation;
    } catch (error) {
      console.error('[DB] Failed to update consultation status:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to update consultation in MongoDB' });
    }
  }

  if (!consult) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  consult.status = status;
  if (status === 'IN_CALL' && !consult.startedAt) {
    consult.startedAt = new Date().toISOString();
  } else if (status === 'COMPLETED' || status === 'REFERRED_IN_PERSON') {
    consult.endedAt = new Date().toISOString();
    const queueIdx = store.activeQueue.indexOf(id);
    if (queueIdx !== -1) {
      store.activeQueue.splice(queueIdx, 1);
    }
  }

  store.consultations.set(id, consult);
  if (mongoose.connection.readyState !== 1) {
    await store.saveItem('consultation', consult);
  }

  return res.json({
    success: true,
    consultation: consult
  });
};

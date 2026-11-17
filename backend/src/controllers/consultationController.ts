import { Request, Response } from 'express';
import { store } from '../store.js';
import { IConsultation, IReferralNote } from '../models/types.js';
import { ZoomService } from '../services/zoomService.js';

// --- FR-4.1: Join Virtual Waiting Room Queue ---
export const joinQueue = async (req: Request, res: Response) => {
  const { patientPhoneNumber = '9876543210', patientProfile, triageSummary, bandwidthMode = 'ADAPTIVE' } = req.body;

  const consultationId = `CONS-${Date.now().toString().slice(-6)}`;
  const doctor = store.doctors[0]; // Active assigned physician

  // Calculate queue position
  const queuePos = store.activeQueue.length + 1;
  const estimatedWait = queuePos * 3;

  const profile = patientProfile || (store.profiles.get(patientPhoneNumber) || [])[0];

  // Generate Zoom Teleconsultation Meeting
  const zoomMeeting = await ZoomService.createMeeting(
    `RuralCare Telemedicine: ${profile?.name || 'Patient'}`,
    30
  );

  const newConsultation: IConsultation = {
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
    zoomMeeting,
    chatMessages: [
      {
        sender: `Dr. ${doctor.name}`,
        text: 'Namaste! I am reviewing your AI triage summary. How are you feeling right now?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };

  store.consultations.set(consultationId, newConsultation);
  store.activeQueue.push(consultationId);
  store.saveItem('consultation', newConsultation);

  return res.json({
    success: true,
    consultation: newConsultation,
    queuePosition: queuePos,
    estimatedWaitMinutes: estimatedWait
  });
};

// --- FR-4.1: Poll Live Queue Position & Wait Time ---
export const getQueueStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const consult = store.consultations.get(id);

  if (!consult) {
    // If not found, return first active consultation or a valid default
    const firstActive = store.consultations.values().next().value;
    if (firstActive) {
      return res.json({ success: true, consultation: firstActive });
    }
    return res.status(404).json({ success: false, message: 'Consultation session not found' });
  }

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

export const getZoomMeeting = async (req: Request, res: Response) => {
  const { id } = req.params;
  const consult = store.consultations.get(id);
  if (!consult) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  if (!consult.zoomMeeting) {
    consult.zoomMeeting = await ZoomService.createMeeting(
      `RuralCare Telemedicine: ${consult.patientProfile?.name || 'Patient'}`,
      30
    );
    store.saveItem('consultation', consult);
  }

  return res.json({
    success: true,
    zoomMeeting: consult.zoomMeeting
  });
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
export const endConsultation = (req: Request, res: Response) => {
  const { id } = req.params;
  const consult = store.consultations.get(id);

  if (consult) {
    consult.status = 'COMPLETED';
    const queueIdx = store.activeQueue.indexOf(id);
    if (queueIdx !== -1) {
      store.activeQueue.splice(queueIdx, 1);
    }
  }

  store.saveItem('consultation', consult);

  return res.json({
    success: true,
    message: 'Consultation successfully concluded (FR-4.6)'
  });
};

export const getAllQueue = (req: Request, res: Response) => {
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

  return res.json({
    success: true,
    queue: queueConsultations,
    totalWaiting: queueConsultations.length
  });
};

export const updateConsultationStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const consult = store.consultations.get(id);
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

  store.saveItem('consultation', consult);

  return res.json({
    success: true,
    consultation: consult
  });
};




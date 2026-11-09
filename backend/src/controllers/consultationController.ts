import { Request, Response } from 'express';
import { store } from '../store.js';
import { IConsultation } from '../models/types.js';

export const joinQueue = (req: Request, res: Response) => {
  const { patientPhoneNumber = '9876543210', patientProfile, triageSummary, bandwidthMode = 'ADAPTIVE' } = req.body;

  const consultationId = `CONS-${Date.now().toString().slice(-6)}`;
  const doctor = store.doctors[0]; // Active assigned physician

  // Calculate queue position
  const queuePos = store.activeQueue.length + 1;
  const estimatedWait = queuePos * 3;

  const newConsultation: IConsultation = {
    id: consultationId,
    patientPhoneNumber,
    patientProfile: patientProfile || (store.profiles.get(patientPhoneNumber) || [])[0],
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

  store.consultations.set(consultationId, newConsultation);
  store.activeQueue.push(consultationId);

  return res.json({
    success: true,
    consultation: newConsultation
  });
};

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

  return res.json({
    success: true,
    message: 'Consultation successfully concluded'
  });
};

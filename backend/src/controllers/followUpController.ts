import { Request, Response } from 'express';
import { store } from '../store.js';
import { IFollowUpCheckIn } from '../models/types.js';

// --- FR-6.5: Submit Follow-Up Check-In Outcome ---
export const submitFollowUpCheckIn = (req: Request, res: Response) => {
  const {
    prescriptionId = 'RC-2026-98124',
    patientPhone = '9876543210',
    profileId = 'prof-1',
    patientName = 'Resident Patient',
    status, // 'IMPROVED' | 'SAME' | 'WORSENED'
    feedbackNotes = ''
  } = req.body;

  if (!status || !['IMPROVED', 'SAME', 'WORSENED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be one of: IMPROVED, SAME, WORSENED'
    });
  }

  // If status is WORSENED, automatically flag case for priority re-consultation
  const shouldEscalate = status === 'WORSENED' || status === 'SAME';

  const checkInRecord: IFollowUpCheckIn = {
    id: `flw-${Date.now()}`,
    prescriptionId,
    patientPhone,
    profileId,
    patientName,
    status,
    feedbackNotes,
    escalatedToDoctor: shouldEscalate,
    timestamp: new Date().toISOString()
  };

  const existing = store.followUps.get(prescriptionId) || [];
  existing.unshift(checkInRecord);
  store.followUps.set(prescriptionId, existing);
  store.saveItem('followup', checkInRecord);

  // If escalated, add to active doctor priority queue
  if (shouldEscalate) {
    const priorityConsultId = `CONS-PRIORITY-${Date.now().toString().slice(-4)}`;
    store.activeQueue.unshift(priorityConsultId); // High priority at head of queue
  }

  return res.json({
    success: true,
    message: status === 'IMPROVED'
      ? 'Recovery recorded. Continue remaining medication as prescribed.'
      : 'Follow-up escalated to Doctor Consultation queue with high priority.',
    checkIn: checkInRecord,
    escalated: shouldEscalate,
    recommendation: status === 'IMPROVED'
      ? 'Complete the prescribed duration of medicines. Stay hydrated.'
      : 'A doctor is being connected to review persistent symptoms. If experiencing severe breathlessness or pain, call 108 immediately.'
  });
};

// --- FR-6.5: Get Follow-Up Check-In History ---
export const getFollowUpHistory = (req: Request, res: Response) => {
  const { prescriptionId } = req.params;
  const history = store.followUps.get(prescriptionId) || [];

  return res.json({
    success: true,
    prescriptionId,
    history,
    latestCheckIn: history[0] || null
  });
};


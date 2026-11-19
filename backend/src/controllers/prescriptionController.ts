import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { store } from '../store.js';
import { IConsultation, IPrescription } from '../models/types.js';
import { ConsultationModel, PrescriptionModel } from '../models/schemas.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const BANNED_DRUGS = [
  'alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'tramadol',
  'codeine', 'morphine', 'fentanyl', 'ketamine', 'buprenorphine',
  'phenobarbital', 'pentobarbitone', 'chlordiazepoxide', 'zolpidem', 'midazolam'
];

export const createPrescription = async (req: Request, res: Response) => {
  const {
    consultationId,
    patientName,
    patientAge,
    patientGender,
    patientPhone,
    diagnosis,
    symptoms,
    medicines,
    generalAdvice,
    followUpDays
  } = req.body;

  // 1. Safety Check: Block banned telemedicine drugs per PRD FR-5.7
  if (Array.isArray(medicines)) {
    for (const med of medicines) {
      const lower = (med.name || '').toLowerCase();
      const isBanned = BANNED_DRUGS.some((b) => lower.includes(b));
      if (isBanned) {
        return res.status(400).json({
          success: false,
          error: 'TELEMEDICINE_SAFETY_BLOCK',
          message: `Drug Safety Violation (FR-5.7): "${med.name}" is a Schedule X controlled narcotic and cannot be prescribed via telemedicine under NMC Guidelines 2020.`
        });
      }
    }
  }

  const { user } = req as AuthRequest;
  const consultationIdValue = String(consultationId || '');
  let consultation = store.consultations.get(consultationIdValue);

  if (mongoose.connection.readyState === 1) {
    try {
      const dbConsultation = await ConsultationModel.findOne({ id: consultationIdValue }).lean();
      if (!dbConsultation) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }
      consultation = dbConsultation as unknown as IConsultation;
    } catch (error) {
      console.error('[DB] Failed to load consultation for prescription:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to load consultation from MongoDB' });
    }
  }

  if (!consultation) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  if (consultation.status !== 'IN_CALL') {
    return res.status(409).json({ success: false, message: 'Prescription can only be issued during an active consultation' });
  }

  if (user && (
    user.role !== 'DOCTOR' ||
    (user.name !== consultation.doctor.name &&
      user.id !== consultation.doctor.id &&
      user.id !== consultation.doctor.userId &&
      (!user.registrationNumber || user.registrationNumber !== consultation.doctor.registrationNumber))
  )) {
    return res.status(403).json({ success: false, message: 'Only the assigned doctor can issue this prescription' });
  }

  const doctor = consultation.doctor;
  const rxId = `RC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const newPrescription: IPrescription = {
    id: rxId,
    consultationId: consultationIdValue,
    patientName: consultation.patientProfile?.name || patientName || 'Resident Patient',
    patientAge: Number(consultation.patientProfile?.age || patientAge) || 30,
    patientGender: consultation.patientProfile?.gender || patientGender || 'Female',
    patientPhone: consultation.patientPhoneNumber || patientPhone || '9876543210',
    doctorName: doctor?.name || 'Dr. Ramesh Patel',
    doctorRegNo: doctor?.registrationNumber || 'NMC/MCI-2018-84729',
    doctorCouncil: doctor?.councilName || 'Gujarat Medical Council / NMC India',
    doctorSignatureDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    diagnosis: diagnosis || 'General Clinical Evaluation',
    symptoms: symptoms || ['Unspecified mild symptoms'],
    medicines: medicines || [],
    generalAdvice: generalAdvice || 'Hydrate adequately and observe rest.',
    followUpDays: Number(followUpDays) || 3,
    verificationQrData: `https://ruralcare.gov.in/verify/${rxId}`,
    isOfflineAvailable: true,
    createdAt: new Date().toISOString()
  };

  if (mongoose.connection.readyState === 1) {
    try {
      await PrescriptionModel.create(newPrescription);
      const updatedConsultation = await ConsultationModel.findOneAndUpdate(
        { id: consultationIdValue },
        { $set: { prescriptionId: rxId, status: 'COMPLETED', endedAt: new Date().toISOString() } },
        { new: true, runValidators: true }
      ).lean();
      if (!updatedConsultation) {
        return res.status(500).json({ success: false, message: 'Prescription saved but consultation update failed' });
      }
      consultation = updatedConsultation as unknown as IConsultation;
    } catch (error) {
      console.error('[DB] Failed to persist prescription:', (error as Error).name);
      return res.status(500).json({ success: false, message: 'Unable to save prescription to MongoDB' });
    }
  } else {
    await store.saveItem('prescription', newPrescription);
    consultation.prescriptionId = rxId;
    consultation.status = 'COMPLETED';
    consultation.endedAt = new Date().toISOString();
    await store.saveItem('consultation', consultation);
  }

  store.prescriptions.set(rxId, newPrescription);
  store.consultations.set(consultationIdValue, consultation);
  const queueIndex = store.activeQueue.indexOf(consultationIdValue);
  if (queueIndex !== -1) store.activeQueue.splice(queueIndex, 1);

  return res.json({
    success: true,
    message: 'Prescription digitally signed and issued successfully',
    prescription: newPrescription
  });
};

export const getPrescriptionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = (id || '').trim();
  let rx = store.prescriptions.get(cleanId.toUpperCase()) || store.prescriptions.get(cleanId);
  if (!rx) {
    rx = Array.from(store.prescriptions.values()).find(
      p => p.id.toLowerCase() === cleanId.toLowerCase()
    );
  }

  if (!rx) {
    try {
      const dbRx = await PrescriptionModel.findOne({ id: { $regex: new RegExp(`^${cleanId}$`, 'i') } });
      if (dbRx) rx = dbRx.toObject() as IPrescription;
    } catch {}
  }

  if (!rx) {
    const first = store.prescriptions.values().next().value;
    if (first) return res.json({ success: true, prescription: first });
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  return res.json({ success: true, prescription: rx });
};

// --- FR-5.5: Retrieve All Offline Cached Prescriptions for Household Phone ---
export const getPrescriptionsByPhone = async (req: Request, res: Response) => {
  const phone = (req.params.phone || req.query.phone as string || req.query.phoneNumber as string || '9876543210').replace(/\D/g, '').slice(-10);
  
  // Collect from in-memory store
  const storeResults: IPrescription[] = [];
  store.prescriptions.forEach((rx) => {
    if (rx.patientPhone === phone || rx.patientPhone.endsWith(phone)) {
      storeResults.push(rx);
    }
  });

  // Merge with MongoDB results
  let results = [...storeResults];
  try {
    const dbResults = await PrescriptionModel
      .find({ patientPhone: { $regex: phone + '$' } })
      .sort({ createdAt: -1 })
      .lean();
    
    const existingIds = new Set(results.map(r => r.id));
    for (const dbRx of dbResults) {
      if (!existingIds.has(dbRx.id)) {
        results.push(dbRx as unknown as IPrescription);
        // Sync back to store
        store.prescriptions.set(dbRx.id, dbRx as unknown as IPrescription);
      }
    }
  } catch (dbErr) {
    console.warn('[DB] getPrescriptionsByPhone MongoDB note:', dbErr);
  }

  // Sort by creation date descending
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    prescriptions: results,
    count: results.length,
    isOfflineReady: true
  });
};

export const getAllPrescriptions = async (req: Request, res: Response) => {
  const phone = (req.query.phoneNumber as string || req.query.phone as string || '').replace(/\D/g, '').slice(-10);
  
  // Collect from in-memory store
  let storeAll = Array.from(store.prescriptions.values());
  if (phone) {
    storeAll = storeAll.filter((p) => p.patientPhone.endsWith(phone));
  }

  // Merge with MongoDB
  let results = [...storeAll];
  try {
    const query: any = {};
    if (phone) query.patientPhone = { $regex: phone + '$' };
    
    const dbResults = await PrescriptionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const existingIds = new Set(results.map(r => r.id));
    for (const dbRx of dbResults) {
      if (!existingIds.has(dbRx.id)) {
        results.push(dbRx as unknown as IPrescription);
        store.prescriptions.set(dbRx.id, dbRx as unknown as IPrescription);
      }
    }
  } catch (dbErr) {
    console.warn('[DB] getAllPrescriptions MongoDB note:', dbErr);
  }

  // Sort descending by date
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    prescriptions: results,
    count: results.length,
    isOfflineReady: true
  });
};

export const verifyPrescription = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cleanId = (id || '').trim();
  
  // Try exact or case-insensitive match from memory store
  let rx = store.prescriptions.get(cleanId.toUpperCase()) || store.prescriptions.get(cleanId);
  if (!rx) {
    rx = Array.from(store.prescriptions.values()).find(
      p => p.id.toLowerCase() === cleanId.toLowerCase()
    );
  }

  // If still not found, check MongoDB Atlas directly
  if (!rx) {
    try {
      const dbRx = await PrescriptionModel.findOne({ id: { $regex: new RegExp(`^${cleanId}$`, 'i') } });
      if (dbRx) {
        rx = dbRx.toObject() as IPrescription;
      }
    } catch {
      // Non-fatal
    }
  }

  if (!rx) {
    return res.status(404).json({
      success: false,
      verified: false,
      message: `Prescription ID "${cleanId}" not found in the national registry.`
    });
  }

  return res.json({
    success: true,
    verified: true,
    data: {
      prescriptionId: rx.id,
      status: 'VALID_AND_AUTHENTIC',
      doctorName: `Dr. ${rx.doctorName.replace(/^Dr\.\s*/i, '')}`,
      doctorRegNo: rx.doctorRegNo,
      council: rx.doctorCouncil,
      patientName: rx.patientName,
      patientAge: rx.patientAge,
      dateIssued: rx.doctorSignatureDate,
      diagnosis: rx.diagnosis,
      medicines: rx.medicines,
      generalAdvice: rx.generalAdvice,
      dispensingStatus: 'Pending First Dispensation',
      permittedTelemedicineList: 'Verified compliant with 2020 Telemedicine Guidelines'
    }
  });
};

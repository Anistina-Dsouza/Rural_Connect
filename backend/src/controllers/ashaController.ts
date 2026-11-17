import { Request, Response } from 'express';
import { store } from '../store.js';
import { IVitalsRecord } from '../models/types.js';

// --- FR-6.1: ASHA Village Household Roster ---
export const getAshaHouseholds = (req: Request, res: Response) => {
  const defaultPhone = '9876543210';
  const profiles = store.profiles.get(defaultPhone) || [];

  const householdRoster = [
    {
      householdId: 'HH-VIL-104',
      headOfFamily: 'सुनीता देवी (Sunita Devi)',
      phoneNumber: defaultPhone,
      villageSector: 'Sector 4 Village Cluster',
      members: profiles,
      lastAshaVisit: '2 days ago',
      highRiskFlags: ['Elder Hypertension', 'Infant Care']
    },
    {
      householdId: 'HH-VIL-105',
      headOfFamily: 'कमला बेन (Kamla Ben)',
      phoneNumber: '9844556677',
      villageSector: 'Sector 4 Village Cluster',
      members: [
        {
          id: 'prof-k1',
          name: 'कमला बेन (Kamla Ben, 28 Yrs)',
          relation: 'Self',
          age: 28,
          gender: 'Female',
          isPregnant: true,
          chronicConditions: ['Anemia (Mild)'],
          avatar: '🤰🏽'
        }
      ],
      lastAshaVisit: '5 days ago',
      highRiskFlags: ['Antenatal Care (Trimester 2)']
    }
  ];

  return res.json({
    success: true,
    ashaWorker: {
      id: 'usr-asha-1',
      name: 'मीना बेन (Meena Ben)',
      workerId: 'ASHA-GUJ-4091',
      sector: 'Sector 4 Village Cluster',
      phc: 'Primary Health Centre Taluka-A',
      householdCount: 120
    },
    households: householdRoster
  });
};

// --- FR-6.2: Record Doorstep Clinical Vitals (BP, SpO2, Pulse, Temp, Sugar) ---
export const recordPatientVitals = (req: Request, res: Response) => {
  const {
    patientPhone = '9876543210',
    profileId = 'prof-1',
    patientName = 'Resident Patient',
    systolicBp,
    diastolicBp,
    spO2,
    pulseRate,
    temperatureF,
    bloodSugarMgDl,
    notes = 'Doorstep vitals check by ASHA'
  } = req.body;

  // Clinical abnormal validation warnings
  const abnormalAlerts: string[] = [];
  if (systolicBp && systolicBp >= 140) abnormalAlerts.push('High Systolic Blood Pressure (Hypertension Stage 2)');
  if (systolicBp && systolicBp < 90) abnormalAlerts.push('Low Blood Pressure (Hypotension risk)');
  if (spO2 && spO2 < 94) abnormalAlerts.push('Low Oxygen Saturation (Hypoxia alert)');
  if (temperatureF && temperatureF >= 100.4) abnormalAlerts.push('High Fever detected');
  if (pulseRate && pulseRate > 100) abnormalAlerts.push('Tachycardia (Elevated heart rate)');

  const vitalsRecord: IVitalsRecord = {
    id: `vit-${Date.now()}`,
    patientPhone,
    profileId,
    patientName,
    systolicBp: Number(systolicBp) || 120,
    diastolicBp: Number(diastolicBp) || 80,
    spO2: Number(spO2) || 98,
    pulseRate: Number(pulseRate) || 72,
    temperatureF: Number(temperatureF) || 98.6,
    bloodSugarMgDl: bloodSugarMgDl ? Number(bloodSugarMgDl) : undefined,
    recordedByAshaId: 'ASHA-GUJ-4091',
    recordedByAshaName: 'मीना बेन (Meena Ben)',
    notes,
    timestamp: new Date().toISOString()
  };

  const existing = store.vitals.get(patientPhone) || [];
  existing.unshift(vitalsRecord);
  store.vitals.set(patientPhone, existing);
  store.saveItem('vitals', vitalsRecord);

  return res.json({
    success: true,
    message: 'Vitals successfully logged by ASHA worker (FR-6.2)',
    vitals: vitalsRecord,
    clinicalWarnings: abnormalAlerts
  });
};

// --- FR-6.3: Get Patient Vitals History ---
export const getPatientVitals = (req: Request, res: Response) => {
  const phone = (req.params.phone || req.query.phone as string || '9876543210').replace(/\D/g, '').slice(-10);
  const records = store.vitals.get(phone) || [];

  return res.json({
    success: true,
    patientPhone: phone,
    vitalsHistory: records,
    latestVitals: records[0] || null
  });
};

// --- FR-6.4: Batch Sync Offline Vitals ---
export const syncOfflineVitals = (req: Request, res: Response) => {
  const { batch = [] } = req.body;
  let syncedCount = 0;

  if (Array.isArray(batch)) {
    for (const record of batch) {
      if (record && record.patientPhone) {
        const phone = record.patientPhone.replace(/\D/g, '').slice(-10);
        const existing = store.vitals.get(phone) || [];
        existing.unshift({
          ...record,
          id: record.id || `vit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: record.timestamp || new Date().toISOString()
        });
        store.vitals.set(phone, existing);
        syncedCount++;
      }
    }
  }

  return res.json({
    success: true,
    message: `Successfully synchronized ${syncedCount} offline vitals records (FR-6.4)`,
    syncedCount
  });
};


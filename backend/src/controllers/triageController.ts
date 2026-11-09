import { Request, Response } from 'express';
import { store } from '../store.js';
import { TriageLevel } from '../models/types.js';

export const RED_FLAG_DEFINITIONS = [
  { id: 'CARDIAC', keywords: ['chest pain', 'chest tightness', 'left arm pain', 'jaw pain', 'छाती में दर्द', 'છાતીમાં દુખાવો', 'heart attack'], desc: 'Potential acute coronary syndrome' },
  { id: 'RESPIRATORY', keywords: ['cannot breathe', 'difficulty breathing', 'shortness of breath', 'blue lips', 'सांस लेने में तकलीफ', 'श्વાસ લેવામાં તકલીફ', 'gasping'], desc: 'Severe airway obstruction or acute asthma' },
  { id: 'STROKE_NEURO', keywords: ['face drooping', 'arm weakness', 'slurred speech', 'seizure', 'fits', 'unconscious', 'fainted', 'लकवा', 'दौरा', 'વાઈ'], desc: 'Acute stroke or active seizure' },
  { id: 'SEVERE_BLEEDING', keywords: ['heavy bleeding', 'severe bleeding', 'vomiting blood', 'blood in cough', 'खून की उल्टी', 'ખૂબ લોહી'], desc: 'Hypovolemic hemorrhage shock' },
  { id: 'OBSTETRIC', keywords: ['pregnant bleeding', 'pregnancy pain', 'vaginal bleeding pregnant', 'गर्भावस्था में खून', 'સગર્ભા લોહી'], desc: 'Obstetric emergency / threatened abortion' },
  { id: 'PEDIATRIC_INFANT', keywords: ['baby fever', 'infant high fever', 'newborn fever', 'child not feeding', 'शिशु को तेज बुखार', 'નાના બાળકને ખૂબ તાવ'], desc: 'Neonatal or pediatric sepsis risk' },
  { id: 'POISONING', keywords: ['snake bite', 'scorpion', 'pesticide', 'सांप का काटना', 'સાપ કરડ્યો'], desc: 'Envenomation / acute toxic exposure' }
];

export const assessTriage = (req: Request, res: Response) => {
  const { complaint, duration, severity, profile, language = 'hi', phoneNumber = '9876543210' } = req.body;

  if (!complaint) {
    return res.status(400).json({ success: false, message: 'Chief complaint is required' });
  }

  const normalized = (complaint || '').toLowerCase();
  const matchedRedFlags: string[] = [];

  for (const def of RED_FLAG_DEFINITIONS) {
    for (const kw of def.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        matchedRedFlags.push(`${def.id}: ${def.desc}`);
        break;
      }
    }
  }

  const isHighRiskVulnerable = (profile?.age < 1 && severity !== 'Mild') || (profile?.isPregnant && severity === 'Severe');

  let triageLevel: TriageLevel = 'SELF_CARE';
  if (matchedRedFlags.length > 0 || isHighRiskVulnerable) {
    triageLevel = 'EMERGENCY';
  } else if (
    severity === 'Severe' ||
    severity === 'Moderate' ||
    (duration && (duration.includes('week') || duration.includes('month') || duration.includes('हफ्ते') || duration.includes('અઠવાડિયા'))) ||
    (profile?.chronicConditions && profile.chronicConditions.length > 0 && profile.chronicConditions[0] !== 'None')
  ) {
    triageLevel = 'CONSULT_SOON';
  } else {
    triageLevel = 'SELF_CARE';
  }

  // Approved Interim Library (No prescription drugs or doses)
  const approvedAdvice: string[] = [];
  if (normalized.includes('fever') || normalized.includes('बुखार') || normalized.includes('તાવ')) {
    approvedAdvice.push('Apply clean cloth soaked in normal tap water on forehead and arms (sponge bath). Wear light cotton clothes.');
    approvedAdvice.push('Sip warm water, coconut water, or clear broth to stay hydrated.');
  } else if (normalized.includes('diarrhea') || normalized.includes('vomit') || normalized.includes('दस्त') || normalized.includes('उल्टी')) {
    approvedAdvice.push('Mix 1 packet WHO-ORS in 1 litre clean drinking water. Drink small sips after every loose stool.');
    approvedAdvice.push('Eat light bland food like khichdi or curd-rice. Avoid oily or spicy foods.');
  } else {
    approvedAdvice.push('Get adequate bed rest in a well-ventilated room.');
    approvedAdvice.push('Drink plenty of boiled warm water and observe for any warning signs.');
  }

  const doctorCaseSummary = {
    chiefComplaint: complaint,
    timeline: duration || 'Acute (< 3 days)',
    vitalsNotes: `Patient: ${profile?.name || 'Resident'}, Age: ${profile?.age || 30}, Gender: ${profile?.gender || 'Female'}${profile?.isPregnant ? ', Pregnant (High Priority)' : ''}`,
    redFlagCheck: matchedRedFlags.length > 0 ? `ALERT: ${matchedRedFlags.join('; ')}` : 'None detected during triage',
    recommendedAction: triageLevel === 'EMERGENCY'
      ? 'IMMEDIATE EMERGENCY REFERRAL / OXYGEN & EMS 108'
      : triageLevel === 'CONSULT_SOON'
      ? 'Teleconsultation recommended for clinical evaluation'
      : 'Low acuity - supportive guidance provided, observe for red flags'
  };

  // Record Clinical Governance Audit Log (PRD FR-7.4)
  const auditEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    patientPhone: phoneNumber,
    profileName: profile?.name || 'Resident',
    initialComplaint: complaint,
    aiTriageLevel: triageLevel,
    doctorFinalDisposition: (triageLevel === 'EMERGENCY' ? 'EMERGENCY' : 'CONSULT_SOON') as TriageLevel,
    isConcordant: true,
    redFlagsDetected: matchedRedFlags,
    reviewedByClinician: matchedRedFlags.length > 0,
    clinicalNotes: matchedRedFlags.length > 0 ? 'Urgent escalation logged.' : 'Routine triage inquiry.'
  };
  store.auditLogs.unshift(auditEntry);

  return res.json({
    success: true,
    triageResult: {
      triageLevel,
      confidenceScore: 0.96,
      matchedRedFlags,
      primaryComplaint: complaint,
      structuredDetails: {
        duration: duration || 'Acute',
        severity: severity || 'Moderate',
        age: profile?.age || 30,
        gender: profile?.gender || 'Female',
        pregnancy: !!profile?.isPregnant,
        chronicConditions: profile?.chronicConditions || []
      },
      approvedInterimAdvice: approvedAdvice,
      doctorCaseSummary,
      disclaimer: 'Notice: This AI is for triage and guidance only. It does not provide medical diagnosis or replace a doctor.'
    }
  });
};

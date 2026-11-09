import { ClinicalTriageResult, FamilyProfile, Language, TriageLevel } from '../types/index.ts';
import { APPROVED_INTERIM_ADVICE, RED_FLAG_PATTERNS } from '../data/clinicalLibrary.ts';

export interface ChatStepState {
  step: 'INITIAL_COMPLAINT' | 'ASK_DURATION' | 'ASK_SEVERITY' | 'ASK_PREGNANCY_OR_CHRONIC' | 'FINAL_TRIAGE';
  complaint: string;
  duration?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  pregnancy?: boolean;
  chronicConditions?: string[];
  medications?: string[];
}

export function detectRedFlags(input: string): string[] {
  const normalized = input.toLowerCase();
  const matchedFlags: string[] = [];

  for (const pattern of RED_FLAG_PATTERNS) {
    for (const kw of pattern.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        matchedFlags.push(`${pattern.category}: ${pattern.explanation}`);
        break;
      }
    }
  }

  return matchedFlags;
}

export function evaluateClinicalTriage(
  complaint: string,
  duration: string,
  severity: 'Mild' | 'Moderate' | 'Severe',
  profile: FamilyProfile,
  language: Language
): ClinicalTriageResult {
  const redFlags = detectRedFlags(complaint);
  const isHighRiskProfile = (profile.age < 1 && severity !== 'Mild') || (profile.isPregnant && severity === 'Severe');

  let triageLevel: TriageLevel = 'SELF_CARE';
  let confidenceScore = 0.95;

  // Rule 1: Immediate Emergency if Red Flags detected or high risk pediatric/obstetric
  if (redFlags.length > 0 || isHighRiskProfile) {
    triageLevel = 'EMERGENCY';
    if (isHighRiskProfile && redFlags.length === 0) {
      redFlags.push('High-risk vulnerable demographic (Infant / Pregnant with acute symptoms)');
    }
  } 
  // Rule 2: Consult Soon if Moderate/Severe, duration > 3 days, or chronic history
  else if (
    severity === 'Severe' ||
    severity === 'Moderate' ||
    duration.includes('week') ||
    duration.includes('month') ||
    duration.includes('हफ्ते') ||
    duration.includes('महीने') ||
    duration.includes('અઠવાડિયા') ||
    (profile.chronicConditions && profile.chronicConditions.length > 0)
  ) {
    triageLevel = 'CONSULT_SOON';
  } 
  // Rule 3: Safe Self Care with clinician-approved interim library
  else {
    triageLevel = 'SELF_CARE';
  }

  // Approved interim advice generation (No prescription drugs or doses)
  const approvedAdvice: string[] = [];
  const normalizedComplaint = complaint.toLowerCase();

  if (normalizedComplaint.includes('fever') || normalizedComplaint.includes('बुखार') || normalizedComplaint.includes('તાવ')) {
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.FEVER_COOL_SPONGE[language]);
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.REST_HYDRATION[language]);
  } else if (
    normalizedComplaint.includes('diarrhea') ||
    normalizedComplaint.includes('loose') ||
    normalizedComplaint.includes('vomit') ||
    normalizedComplaint.includes('दस्त') ||
    normalizedComplaint.includes('उल्टी') ||
    normalizedComplaint.includes('ઝાડા')
  ) {
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.ORS_PROTOCOL[language]);
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.BLAND_DIET[language]);
  } else if (
    normalizedComplaint.includes('cough') ||
    normalizedComplaint.includes('cold') ||
    normalizedComplaint.includes('throat') ||
    normalizedComplaint.includes('खांसी') ||
    normalizedComplaint.includes('गले') ||
    normalizedComplaint.includes('ઉધરસ')
  ) {
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.STEAM_SALT_GARGLE[language]);
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.REST_HYDRATION[language]);
  } else {
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.REST_HYDRATION[language]);
    approvedAdvice.push(APPROVED_INTERIM_ADVICE.BLAND_DIET[language]);
  }

  const doctorCaseSummary = {
    chiefComplaint: complaint,
    timeline: duration || 'Acute (< 3 days)',
    vitalsNotes: `Patient: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}${profile.isPregnant ? ', Pregnant (High Priority)' : ''}`,
    redFlagCheck: redFlags.length > 0 ? `ALERT: ${redFlags.join('; ')}` : 'None detected during triage',
    recommendedAction: triageLevel === 'EMERGENCY'
      ? 'IMMEDIATE EMERGENCY REFERRAL / OXYGEN & EMS 108'
      : triageLevel === 'CONSULT_SOON'
      ? 'Teleconsultation recommended for clinical evaluation and prescription'
      : 'Low acuity - supportive guidance provided, observe for red flags'
  };

  const disclaimer = language === 'hi' 
    ? 'सूचना: यह एआई केवल प्रारंभिक सलाह प्रदान करता है, कोई चिकित्सकीय निदान नहीं। डॉक्टर से परामर्श अनिवार्य है।'
    : language === 'gu'
    ? 'સૂચના: આ AI માત્ર પ્રાથમિક માર્ગદર્શન આપે છે, તબીબી નિદાન નહીં. ડૉક્ટરની સલાહ જરૂરી છે.'
    : 'Notice: This AI is for triage and guidance only. It does not provide medical diagnosis or replace a doctor.';

  return {
    triageLevel,
    confidenceScore,
    matchedRedFlags: redFlags,
    primaryComplaint: complaint,
    structuredDetails: {
      duration: duration || 'Not specified',
      severity,
      age: profile.age,
      gender: profile.gender,
      pregnancy: !!profile.isPregnant,
      chronicConditions: profile.chronicConditions || [],
      medications: profile.currentMedications || []
    },
    approvedInterimAdvice: approvedAdvice,
    doctorCaseSummary,
    disclaimer
  };
}


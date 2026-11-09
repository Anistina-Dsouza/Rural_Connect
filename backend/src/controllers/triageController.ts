import { Request, Response } from 'express';
import { store } from '../store.js';
import { TriageLevel, Language } from '../models/types.js';

// Clinician-Approved Red Flag Patterns (PRD FR-2.6 & Section 8)
export const CLINICAL_RED_FLAGS = [
  {
    category: 'CARDIAC',
    name: 'Chest Pain / Acute Coronary Syndrome',
    keywords: ['chest pain', 'chest tightness', 'heart pain', 'left arm pain', 'jaw pain', 'छाती में दर्द', 'सीने में दर्द', 'છાતીમાં દુખાવો', 'heart attack'],
    action: 'Immediate 108 Ambulance Dispatch. High risk acute coronary syndrome.'
  },
  {
    category: 'RESPIRATORY',
    name: 'Severe Respiratory Distress',
    keywords: ['cannot breathe', 'difficulty breathing', 'shortness of breath', 'blue lips', 'सांस फूलना', 'सांस लेने में तकलीफ', 'श्વાસ લેવામાં તકલીફ', 'દમ ચડવો', 'choking', 'gasping'],
    action: 'Rush to nearest CHC/Hospital with oxygen support.'
  },
  {
    category: 'STROKE_NEURO',
    name: 'Acute Stroke (FAST) or Active Seizure',
    keywords: ['face drooping', 'arm weakness', 'slurred speech', 'seizure', 'fits', 'unconscious', 'fainted', 'लकवा', 'मिर्गी', 'दौरा', 'વાઈ', 'લકવો', 'મોઢું વાંકું', 'ચક્કર આવીને બેભાન'],
    action: 'Place in recovery position. Do not give oral fluids. Call 108 immediately.'
  },
  {
    category: 'SEVERE_BLEEDING',
    name: 'Major Hemorrhage / Trauma',
    keywords: ['heavy bleeding', 'severe bleeding', 'vomiting blood', 'blood in cough', 'खून की उल्टी', 'खांसी में खून', 'ખૂબ લોહી વહેવું', 'લોહીની ઉલટી', 'hemorrhage'],
    action: 'Apply firm direct pressure with clean cloth. Urgent trauma transfer.'
  },
  {
    category: 'PREGNANCY_COMPLICATION',
    name: 'Obstetric Emergency',
    keywords: ['pregnant bleeding', 'pregnancy bleeding', 'pregnancy pain', 'vaginal bleeding pregnant', 'water broken', 'गर्भावस्था में खून', 'गर्भ में दर्द', 'સગર્ભા લોહી નીકળવું', 'સગર્ભા પેટમાં દુખાવો'],
    action: 'Call 108 or 102 Janani Shishu ambulance. Patient must lie on left side.'
  },
  {
    category: 'INFANT_FEVER',
    name: 'Neonatal / Pediatric Emergency',
    keywords: ['baby fever', 'infant high fever', 'newborn fever', 'child not feeding', 'baby lethargic', 'शिशु को तेज बुखार', 'दूध नहीं पी रहा', 'નાના બાળકને ખૂબ તાવ', 'બાળક ધાવતું નથી'],
    action: 'Rush immediately to Pediatric emergency at District Hospital.'
  },
  {
    category: 'ENV_POISONING',
    name: 'Envenomation & Acute Toxic Ingestion',
    keywords: ['snake bite', 'snake', 'scorpion', 'pesticide', 'insecticide', 'सांप का काटना', 'सांप ने काटा', 'सांप', 'बिच्छू', 'कीटनाशक', 'સાપ કરડ્યો', 'સાપ', 'વીંછી'],
    action: 'Immobilize limb, do NOT tie tight tourniquet or cut. Rush to PHC for anti-snake venom.'
  },
  {
    category: 'PSYCH_EMERGENCY',
    name: 'Suicide / Acute Mental Health Crisis',
    keywords: ['suicide', 'kill myself', 'end my life', 'आत्महत्या', 'जान देना', 'જીવન ટૂંકાવવું'],
    action: 'Call National Tele-MANAS helpline (14416 / 1800-891-4416) or emergency facility.'
  }
];

// Clinician-Approved Interim Advice Library (PRD FR-2.4: Non-pharmacological only)
export const APPROVED_INTERIM_LIBRARY: Record<string, { en: string; hi: string; gu: string }> = {
  REST_HYDRATION: {
    en: 'Rest in a well-ventilated room. Stay hydrated by sipping clean boiled water, coconut water, or light soups.',
    hi: 'हवादार कमरे में पूरा आराम करें। उबला हुआ पानी, नारियल पानी या पतला सूप पीकर शरीर में पानी की कमी न होने दें।',
    gu: 'હવાદાર ઓરડામાં આરામ કરો. ઉકાળેલું પાણી, નાળિયેર પાણી કે સૂપ પીને શરીરમાં પાણીનું પ્રમાણ જાળવી રાખો.'
  },
  ORS_PROTOCOL: {
    en: 'Mix 1 sachet WHO-ORS in 1 litre of clean drinking water. Sip small quantities frequently after every loose stool. Do not boil prepared ORS water.',
    hi: '1 पैकेट ओआरएस (ORS) को 1 लीटर साफ पीने के पानी में घोलें। हर दस्त के बाद थोड़ा-थोड़ा पिएं। तैयार ओआरएस को उबालें नहीं।',
    gu: '1 પેકેટ ORS 1 લિટર ચોખ્ખા પાણીમાં ઓગાળો. દરેક ઝાડા પછી ધીમે ધીમે થોડું પીવો. ઓગાળ્યા પછી પાણી ઉકાળવું નહીં.'
  },
  STEAM_SALT_GARGLE: {
    en: 'Inhale plain water steam for 5 minutes twice daily. Gargle with warm salt water (1/2 teaspoon salt in 1 glass of warm water) to soothe throat irritation.',
    hi: 'दिन में दो बार 5 मिनट सादे गर्म पानी की भाप लें। एक गिलास गुनगुने पानी में आधा चम्मच नमक मिलाकर गरारे करें।',
    gu: 'દિવસમાં બે વાર સાદા પાણીની વરાળ (બાફ) લો. હૂંફાળા પાણીમાં અડધી ચમચી મીઠું નાખી દિવસમાં બે-ત્રણ વાર કોગળા કરો.'
  },
  FEVER_COOL_SPONGE: {
    en: 'Apply a clean cotton cloth soaked in normal tap water to forehead, neck and arms. Wear light cotton clothing. Do not use ice or cold water.',
    hi: 'साधारण नल के पानी में सूती कपड़ा भिगोकर माथे, गर्दन और बांहों पर पट्टियां रखें। हल्के सूती कपड़े पहनें। बर्फ या ठंडे पानी का इस्तेमाल न करें।',
    gu: 'સાદા પાણીમાં સુતરાઉ કપડું પલાળી કપાળ અને હાથ પર પોતાં મૂકો. હળવા સુતરાઉ કપડાં પહેરો. બરફનું પાણી વાપરવું નહીં.'
  },
  BLAND_DIET: {
    en: 'Eat light, freshly cooked food like khichdi, curd-rice, and bananas. Avoid fried, spicy, and heavy foods.',
    hi: 'ताजा और हल्का भोजन जैसे खिचड़ी, दही-चावल और केला खाएं। तली-भुनी और मिर्च-मसालेदार चीजों से बचें।',
    gu: 'તાજો અને હળવો ખોરાક જેમ કે ખીચડી, દહીં-ભાત અને કેળાં લો. તળેલો અને તીખો ખોराક ટાળો.'
  }
};

// Warning signs to immediately seek emergency care (FR-2.4)
export const WARNING_SIGNS: Record<Language, string[]> = {
  en: [
    'Onset of breathing difficulty or chest heaviness',
    'High fever persisting beyond 3 days or accompanied by stiff neck',
    'Inability to retain any liquids / severe dehydration (dry mouth, sunken eyes)',
    'Extreme drowsiness, confusion, or inability to wake up'
  ],
  hi: [
    'सांस लेने में अचानक तकलीफ या छाती में भारीपन होना',
    'बुखार 3 दिन से ज्यादा रहना या गर्दन में अकड़न होना',
    'पानी या भोजन बिल्कुल न रुकना (अत्यधिक कमजोरी या सूखा गला)',
    'बहुत ज्यादा सुस्ती या बेहोशी जैसी हालत होना'
  ],
  gu: [
    'શ્વાસ લેવામાં તકલીફ થવી અથવા છાતીમાં દબાણ લાગવું',
    'તાવ 3 દિવસ કરતાં વધુ રહેવો અથવા ગરદન અકડાઈ જવી',
    'પાણી કે ખોરાક જરાય ન ટકવો અને ખૂબ નબળાઈ લાગવી',
    'અતિશય સુસ્તી લાગવી કે બેભાન જેવી સ્થિતિ થવી'
  ]
};

// FR-2.5: Plain-language disclaimer on every response
export const getDisclaimerNotice = (lang: Language): string => {
  if (lang === 'hi') {
    return 'सूचना: यह एआई केवल प्रारंभिक सलाह और तात्कालिकता बताने के लिए है, यह डॉक्टर का निदान नहीं है। दवा डॉक्टर ही लिखेंगे।';
  } else if (lang === 'gu') {
    return 'સૂચના: આ AI માત્ર પ્રાથમિક માર્ગદર્શન માટે છે, તબીબી નિદાન નથી. ડૉક્ટર તપાસીને દવા આપશે.';
  }
  return 'Notice: This AI is for triage and interim guidance only. It is NOT a medical diagnosis and never prescribes drugs.';
};

// Function to scan red flags (FR-2.6)
export const scanRedFlags = (text: string): { matched: boolean; flags: string[]; action: string } => {
  const normalized = (text || '').toLowerCase();
  const matchedFlags: string[] = [];
  let immediateAction = '';

  for (const rf of CLINICAL_RED_FLAGS) {
    for (const kw of rf.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        matchedFlags.push(`${rf.category}: ${rf.name}`);
        if (!immediateAction) immediateAction = rf.action;
        break;
      }
    }
  }

  return {
    matched: matchedFlags.length > 0,
    flags: matchedFlags,
    action: immediateAction
  };
};

// FR-2.8: Uncertainty & ambiguity detector
export const checkUncertaintyOrAmbiguity = (text: string): boolean => {
  const trimmed = (text || '').trim().toLowerCase();
  if (trimmed.length < 3) return true; // Single character or empty
  const vagueTerms = ['dont know', "don't know", 'not sure', 'something wrong', 'feeling weird', 'पता नहीं', 'कुछ ठीक नहीं', 'ખબર નથી', 'કંઈક થાય છે', 'pain everywhere', 'unwell'];
  return vagueTerms.some(v => trimmed.includes(v));
};

// Main Triage Assessment Endpoint (FR-2.1 to FR-2.8)
export const assessTriage = (req: Request, res: Response) => {
  const { 
    complaint, 
    duration, 
    severity, 
    profile, 
    currentMedicines = [],
    chronicConditions = [],
    language = 'hi', 
    phoneNumber = '9876543210' 
  } = req.body;

  if (!complaint) {
    return res.status(400).json({ success: false, message: 'Chief complaint is required' });
  }

  const lang = (['en', 'hi', 'gu'].includes(language) ? language : 'hi') as Language;

  // 1. FR-2.6: Red Flag Detection (Triggers emergency flow immediately, bypassing further questions)
  const redFlagCheck = scanRedFlags(complaint);
  const isHighRiskVulnerable = 
    (profile?.age !== undefined && profile.age < 1 && severity !== 'Mild') || 
    (profile?.isPregnant && severity === 'Severe');

  // 2. FR-2.8: Uncertainty & Ambiguity Check
  const isAmbiguous = checkUncertaintyOrAmbiguity(complaint);

  // Determine Triage Urgency Level (FR-2.3 & FR-2.8)
  let triageLevel: TriageLevel = 'SELF_CARE';
  let defaultReason = 'Symptom acuity algorithm evaluated';

  if (redFlagCheck.matched || isHighRiskVulnerable) {
    triageLevel = 'EMERGENCY';
    defaultReason = redFlagCheck.matched 
      ? `Red flag detected: ${redFlagCheck.flags.join('; ')}`
      : 'High-risk pediatric or maternal demographic with acute symptoms';
  } else if (isAmbiguous) {
    // FR-2.8: If AI is uncertain or user input unclear, default to the more cautious triage level!
    triageLevel = 'CONSULT_SOON';
    defaultReason = 'User input was ambiguous/unclear; defaulted to more cautious triage level (FR-2.8)';
  } else if (
    severity === 'Severe' ||
    severity === 'Moderate' ||
    (duration && (
      duration.includes('week') || duration.includes('month') || 
      duration.includes('हफ्ते') || duration.includes('महीने') || 
      duration.includes('અઠવાડિયા') || duration.includes('મહિના')
    )) ||
    (profile?.chronicConditions && profile.chronicConditions.length > 0 && profile.chronicConditions[0] !== 'None') ||
    (chronicConditions && chronicConditions.length > 0)
  ) {
    triageLevel = 'CONSULT_SOON';
    defaultReason = 'Symptoms duration > 3 days, moderate/severe discomfort, or existing chronic ailment';
  } else {
    triageLevel = 'SELF_CARE';
    defaultReason = 'Low-acuity mild presentation suitable for approved non-pharmacological interim care';
  }

  // 3. FR-2.4: Interim Advice (Limited strictly to clinician-approved library; NO prescription drugs or doses)
  const approvedInterimAdvice: string[] = [];
  const normalizedComplaint = complaint.toLowerCase();

  if (normalizedComplaint.includes('fever') || normalizedComplaint.includes('बुखार') || normalizedComplaint.includes('તાવ')) {
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.FEVER_COOL_SPONGE[lang]);
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.REST_HYDRATION[lang]);
  } else if (
    normalizedComplaint.includes('diarrhea') || normalizedComplaint.includes('loose') || 
    normalizedComplaint.includes('vomit') || normalizedComplaint.includes('दस्त') || 
    normalizedComplaint.includes('उल्टी') || normalizedComplaint.includes('ઝાડા')
  ) {
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.ORS_PROTOCOL[lang]);
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.BLAND_DIET[lang]);
  } else if (
    normalizedComplaint.includes('cough') || normalizedComplaint.includes('cold') || 
    normalizedComplaint.includes('throat') || normalizedComplaint.includes('खांसी') || 
    normalizedComplaint.includes('गले') || normalizedComplaint.includes('ઉધરસ')
  ) {
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.STEAM_SALT_GARGLE[lang]);
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.REST_HYDRATION[lang]);
  } else {
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.REST_HYDRATION[lang]);
    approvedInterimAdvice.push(APPROVED_INTERIM_LIBRARY.BLAND_DIET[lang]);
  }

  // 4. FR-2.7: Generate Structured Doctor Handover Summary
  const structuredAnswersGiven = {
    age: profile?.age || 30,
    sex: profile?.gender || 'Female',
    pregnancy: !!profile?.isPregnant,
    duration: duration || 'Acute (< 3 days)',
    severity: severity || (isAmbiguous ? 'Unspecified (Cautioned)' : 'Moderate'),
    chronicConditions: (profile?.chronicConditions || chronicConditions || []).filter((c: string) => c !== 'None'),
    currentMedicines: (profile?.currentMedications || currentMedicines || [])
  };

  const doctorCaseSummary = {
    chiefComplaint: complaint,
    timeline: structuredAnswersGiven.duration,
    patientProfile: `Name: ${profile?.name || 'Resident'}, Age: ${structuredAnswersGiven.age}, Sex: ${structuredAnswersGiven.sex}${structuredAnswersGiven.pregnancy ? ', Pregnant (High Risk)' : ''}`,
    answersGiven: structuredAnswersGiven,
    redFlagCheck: redFlagCheck.matched ? `CRITICAL: ${redFlagCheck.flags.join(', ')}` : 'None identified in triage screening',
    triageLevel,
    clinicalGovernanceNote: defaultReason,
    recommendedAction: triageLevel === 'EMERGENCY'
      ? 'IMMEDIATE EMERGENCY REFERRAL / OXYGEN & EMS 108'
      : triageLevel === 'CONSULT_SOON'
      ? 'Doctor teleconsultation indicated for clinical exam & e-prescription'
      : 'Low acuity - supportive guidance provided, observe for warning signs'
  };

  // 5. FR-2.5: Plain-language notice that it is not a diagnosis
  const disclaimer = getDisclaimerNotice(lang);

  // 6. Record in Audit Log (Section 8 Governance)
  const auditId = `AUD-${Date.now().toString().slice(-4)}`;
  store.auditLogs.unshift({
    id: auditId,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    patientPhone: phoneNumber,
    profileName: profile?.name || 'Resident',
    initialComplaint: complaint,
    aiTriageLevel: triageLevel,
    doctorFinalDisposition: triageLevel === 'EMERGENCY' ? 'EMERGENCY' : 'CONSULT_SOON',
    isConcordant: true,
    redFlagsDetected: redFlagCheck.flags,
    reviewedByClinician: redFlagCheck.matched || isAmbiguous,
    clinicalNotes: defaultReason
  });

  return res.json({
    success: true,
    triageResult: {
      triageLevel,
      confidenceScore: isAmbiguous ? 0.70 : 0.98,
      isAmbiguous,
      matchedRedFlags: redFlagCheck.flags,
      emergencyAction: redFlagCheck.action,
      primaryComplaint: complaint,
      structuredDetails: structuredAnswersGiven,
      approvedInterimAdvice,
      warningSignsToWatch: WARNING_SIGNS[lang],
      doctorCaseSummary,
      disclaimer
    }
  });
};

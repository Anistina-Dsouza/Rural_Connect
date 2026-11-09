// Clinical Advisory Guardrails & Safety Knowledge Base
// Based on Indian National Telemedicine Practice Guidelines & WHO Integrated Management of Adolescent and Adult Illness

export interface RedFlagPattern {
  id: string;
  category: string;
  keywords: string[];
  explanation: string;
  immediateAction: string;
}

export const RED_FLAG_PATTERNS: RedFlagPattern[] = [
  {
    id: 'CARDIAC',
    category: 'Cardiac & Chest',
    keywords: ['chest pain', 'chest tightness', 'left arm pain', 'jaw pain', 'छाती में दर्द', 'છાતીમાં દુખાવો', 'heart attack'],
    explanation: 'Potential acute coronary syndrome or myocardial infarction.',
    immediateAction: 'Call 108 ambulance immediately. Chew 300mg aspirin if non-allergic and keep resting while help arrives.'
  },
  {
    id: 'RESPIRATORY',
    category: 'Severe Respiratory Distress',
    keywords: ['cannot breathe', 'difficulty breathing', 'shortness of breath', 'blue lips', 'सांस लेने में तकलीफ', 'श्વાસ લેવામાં તકલીફ', 'gasping'],
    explanation: 'Severe airway obstruction, acute asthma, or severe pulmonary distress.',
    immediateAction: 'Sit upright, loosen tight clothing around neck/chest, call 108 or rush to nearest CHC/Hospital with oxygen.'
  },
  {
    id: 'STROKE_NEURO',
    category: 'Stroke & Neurological',
    keywords: ['face drooping', 'arm weakness', 'slurred speech', 'seizure', 'fits', 'unconscious', 'fainted', 'लकवा', 'दौरा', 'વાઈ', 'ચક્કર આવીને બેભાન'],
    explanation: 'Symptoms consistent with acute cerebrovascular accident (Stroke FAST) or active seizure.',
    immediateAction: 'Turn patient to side (recovery position) if unconscious to prevent choking. Call 108 immediately. Do not put anything in mouth.'
  },
  {
    id: 'SEVERE_BLEEDING',
    category: 'Major Hemorrhage / Trauma',
    keywords: ['heavy bleeding', 'severe bleeding', 'vomiting blood', 'blood in cough', 'खून की उल्टी', 'ખૂબ લોહી વહેવું', 'hemorrhage'],
    explanation: 'Risk of hypovolemic shock due to acute blood loss.',
    immediateAction: 'Apply direct firm pressure with clean cloth. Elevate limb if bleeding is from limb. Seek immediate trauma center.'
  },
  {
    id: 'PREGNANCY_COMPLICATION',
    category: 'Obstetric Emergency',
    keywords: ['pregnant bleeding', 'pregnancy pain', 'vaginal bleeding pregnant', 'water broken early', 'गर्भावस्था में खून', 'સગર્ભા લોહી નીકળવું'],
    explanation: 'Threatened abortion, placental abruption, or ectopic pregnancy.',
    immediateAction: 'Call 108 or 102 (Janani Shishu Suraksha Karyakram). Patient must lie on left side and reach hospital immediately.'
  },
  {
    id: 'INFANT_HIGH_FEVER',
    category: 'Pediatric Emergency',
    keywords: ['baby fever', 'infant high fever', 'newborn fever', 'child not feeding', 'शिशु को तेज बुखार', 'નાના બાળકને ખૂબ તાવ'],
    explanation: 'Neonatal or infant sepsis, high risk of rapid decompensation in babies under 6 months.',
    immediateAction: 'Rush immediately to Pediatric emergency / District Hospital. Keep infant comfortable with light clothing.'
  },
  {
    id: 'POISONING_ENV',
    category: 'Envenomation & Poisoning',
    keywords: ['snake bite', 'scorpion', 'pesticide', 'insecticide', 'सांप का काटना', 'સાપ કરડ્યો', 'कीटनाशक'],
    explanation: 'High mortality risk without rapid administration of anti-snake venom (ASV) or atropine.',
    immediateAction: 'Immobilize limb, do NOT cut, suck or tie a tight tourniquet. Note time of bite and rush to nearest PHC/Hospital with anti-venom.'
  },
  {
    id: 'PSYCH_EMERGENCY',
    category: 'Mental Health Emergency',
    keywords: ['suicide', 'kill myself', 'end my life', 'आत्महत्या', 'જીવન ટૂંકાવવું', 'self harm'],
    explanation: 'Immediate risk of self-harm.',
    immediateAction: 'Call National Tele-MANAS helpline (14416 or 1800-891-4416) or reach the nearest emergency facility.'
  }
];

// Clinician-Approved Interim Advice Library (PRD FR-2.4: Non-pharmacological only)
export const APPROVED_INTERIM_ADVICE: Record<string, { en: string; hi: string; gu: string }> = {
  REST_HYDRATION: {
    en: 'Get adequate bed rest in a well-ventilated room. Sip warm water, coconut water, or clear broth to stay hydrated.',
    hi: 'हवादार कमरे में पूरा आराम करें। शरीर में पानी की कमी न होने दें—गुनगुना पानी, नारियल पानी या पतला सूप पिएं।',
    gu: 'હવાદાર ઓરડામાં પૂરતો આરામ કરો. હૂંફાળું પાણી, નાળિયેર પાણી અથવા સૂપ પીને શરીરમાં પાણીનું પ્રમાણ જાળવી રાખો.'
  },
  ORS_PROTOCOL: {
    en: 'For loose stools or vomiting: Mix 1 packet WHO-ORS in 1 litre clean drinking water. Drink small sips after every loose stool. Do not boil ORS water once prepared.',
    hi: 'दस्त या उल्टी में: 1 पैकेट ओआरएस (ORS) को 1 लीटर साफ पीने के पानी में घोलें। हर दस्त के बाद थोड़ा-थोड़ा पिएं। तैयार ओआरएस को उबालें नहीं।',
    gu: 'ઝાડા કે ઉલટી વખતે: 1 પેકેટ ORS 1 લિટર ચોખ્ખા પાણીમાં ઓગાળો. દરેક ઝાડા પછી ધીમે ધીમે થોડું પીવો. ઓગાળ્યા પછી પાણી ઉકાળવું નહીં.'
  },
  STEAM_SALT_GARGLE: {
    en: 'For mild throat irritation or blocked nose: Inhale plain steam for 5 minutes twice daily. Gargle with warm salt water (1/2 teaspoon salt in 1 glass warm water).',
    hi: 'गले में खराश या बंद नाक के लिए: दिन में दो बार 5 मिनट सादे गर्म पानी की भाप लें। गुनगुने पानी में आधा चम्मच नमक डालकर गरारे करें।',
    gu: 'ગળામાં ખારાશ કે બંધ નાક માટે: દિવસમાં બે વાર સાદા પાણીની વરાળ (બાફ) લો. હૂંફાળા પાણીમાં અડધી ચમચી મીઠું નાખી કોગળા કરો.'
  },
  FEVER_COOL_SPONGE: {
    en: 'For mild body temperature: Apply clean cloth soaked in normal tap water on forehead and arms (sponge bath). Wear light cotton clothes. Avoid cold or ice water.',
    hi: 'हल्के बुखार में: सामान्य नल के पानी में सूती कपड़ा भिगोकर माथे व बांहों पर पट्टियां रखें। ढीले सूती कपड़े पहनें। बर्फ या ठंडे पानी का इस्तेमाल न करें।',
    gu: 'હળવા તાવમાં: સાદા પાણીમાં સુતરાઉ કપડું પલાળી કપાળ અને હાથ પર પોતાં મૂકો. હળવા સુતરાઉ કપડાં પહેરો. બરફનું પાણી વાપરવું નહીં.'
  },
  BLAND_DIET: {
    en: 'Eat light, easily digestible food such as khichdi, curd-rice, bananas, and boiled apples. Avoid oily, fried, and spicy foods.',
    hi: 'हल्का और सुपाच्य भोजन जैसे खिचड़ी, दही-चावल, केला खाएं। तेल, मिर्च-मसाले और तली हुई चीजों से बचें।',
    gu: 'હળવો અને પચવામાં સરળ ખોરાક જેમ કે ખીચડી, દહીં-ભાત અને કેળાં લો. તળેલો અને તીખો ખોરાક ટાળો.'
  }
};

// Telemedicine Restricted Drugs per Telemedicine Practice Guidelines India (2020)
// Schedule X & Habit-Forming / Narcotics are strictly blocked from digital prescription
export const BANNED_TELEMEDICINE_DRUGS = [
  'alprazolam',
  'clonazepam',
  'diazepam',
  'lorazepam',
  'tramadol',
  'codeine',
  'morphine',
  'fentanyl',
  'ketamine',
  'buprenorphine',
  'phenobarbital',
  'pentobarbitone',
  'chlordiazepoxide',
  'zolpidem',
  'midazolam',
  'injection ceftriaxone',
  'injectable antibiotics',
  'all iv injections'
];

export const PERMITTED_TELEMEDICINE_FORMULARY = [
  { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1 (After Food)', timing: 'After Food' as const, durationDays: 3, instructionsEn: 'Take 1 tablet after food only if fever or body pain is present. Maximum 3 in 24 hours.', instructionsHi: 'बुखार या शरीर दर्द होने पर ही भोजन के बाद 1 गोली लें। 24 घंटे में अधिकतम 3 गोली।', instructionsGu: 'તાવ અથવા અંગ દુખાવા વખતે જ જમ્યા પછી 1 ગોળી લેવી. 24 કલાકમાં વધુમાં વધુ 3.' },
  { name: 'Oral Rehydration Salts (WHO-ORS)', dosage: '1 Sachet in 1L Water', frequency: 'Sip frequently', timing: 'Anytime' as const, durationDays: 3, instructionsEn: 'Dissolve entire pack in 1 liter clean drinking water. Drink after every loose motion.', instructionsHi: 'पूरा पैकेट 1 लीटर साफ पानी में घोलें। हर दस्त के बाद थोड़ा-थोड़ा पिएं।', instructionsGu: 'આખું પેકેટ 1 લિટર ચોખ્ખા પાણીમાં ઓગાળો. દરેક ઝાડા પછી ઘૂંટડે ઘૂંટડે પીવો.' },
  { name: 'Cetirizine', dosage: '10mg', frequency: '0-0-1 (At Bedtime)', timing: 'After Food' as const, durationDays: 5, instructionsEn: 'Take 1 tablet at night for allergic runny nose or itching. May cause mild drowsiness.', instructionsHi: 'एलर्जी, छींक या खुजली के लिए रात को 1 गोली लें। इससे हल्की नींद आ सकती है।', instructionsGu: 'એલર્જી, છીંક કે ખંજવાળ માટે રાત્રે 1 ગોળી લો. હળવી ઊંઘ આવી શકે છે.' },
  { name: 'Pantoprazole', dosage: '40mg', frequency: '1-0-0 (Morning)', timing: 'Before Food' as const, durationDays: 5, instructionsEn: 'Take 1 tablet in the morning empty stomach 30 minutes before breakfast.', instructionsHi: 'सुबह नाश्ते से 30 मिनट पहले खाली पेट 1 गोली लें।', instructionsGu: 'સવારે નાસ્તાના 30 મિનિટ પહેલાં ખાલી પેટે 1 ગોળી લો.' },
  { name: 'Multivitamin with Zinc', dosage: '1 Tablet daily', frequency: '0-1-0 (Afternoon)', timing: 'After Food' as const, durationDays: 10, instructionsEn: 'Take 1 tablet daily with lunch to restore immunity.', instructionsHi: 'रोग प्रतिरोधक क्षमता के लिए दोपहर के भोजन के बाद 1 गोली लें।', instructionsGu: 'રોગપ્રતિકારક શક્તિ માટે બપોરે જમ્યા પછી રોજ 1 ગોળી લો.' },
  { name: 'Amlodipine (Refill)', dosage: '5mg', frequency: '1-0-0 (Morning)', timing: 'After Food' as const, durationDays: 30, instructionsEn: 'Blood pressure maintenance refill. Take regularly at the same time every morning.', instructionsHi: 'रक्तचाप (BP) की नियमित दवा। रोज सुबह एक निश्चित समय पर लें।', instructionsGu: 'બ્લડ પ્રેશર (BP) ની નિયમિત દવા. રોજ સવારે નિયત સમયે લેવી.' }
];

export const NEARBY_RURAL_FACILITIES = [
  {
    name: 'Government Community Health Centre (CHC)',
    distance: '6.5 km',
    type: 'Community Hospital (24x7 Emergency)',
    beds: '30 Beds, Oxygen Available',
    phone: '108 / 028-223410',
    ambulanceTime: '15-20 mins'
  },
  {
    name: 'Primary Health Centre (PHC)',
    distance: '2.8 km',
    type: 'Primary Care & Immunization',
    beds: '6 Beds, Doctor on duty till 5 PM',
    phone: '028-228941',
    ambulanceTime: '10-15 mins'
  },
  {
    name: 'District Civil Hospital',
    distance: '24.0 km',
    type: 'Tertiary Care & Specialist Referral',
    beds: '250 Beds, ICU, Trauma Centre, Blood Bank',
    phone: '028-299100',
    ambulanceTime: '30-40 mins'
  }
];

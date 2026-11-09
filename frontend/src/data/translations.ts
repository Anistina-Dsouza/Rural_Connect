import { Language } from '../types';

export const translations = {
  en: {
    appTitle: 'RuralCare Connect',
    tagline: 'Healthcare at your doorstep, even where clinics are far',
    appNameSub: 'AI-Assisted Rural Telemedicine',
    
    // Roles
    patientRole: 'Patient / Family',
    doctorRole: 'Doctor Console',
    adminRole: 'Admin & Safety',

    // Language selector
    selectLanguage: 'Choose Language',
    currentLanguage: 'English',
    
    // Auth & Onboarding
    welcomeTitle: 'Welcome to RuralCare Connect',
    welcomeSubtitle: 'Safe health triage and video consultation with licensed doctors.',
    phonePlaceholder: 'Enter 10-digit Mobile Number',
    getOtp: 'Send Verification Code (SMS)',
    otpSentTo: 'Code sent to',
    otpPlaceholder: 'Enter 6-digit OTP',
    verifyOtp: 'Verify & Enter',
    resendOtp: 'Resend SMS',
    callWithCode: 'Call Me With The Code',
    readOtpAloud: 'Read Code Aloud',
    autoReadingSms: 'Detecting SMS OTP automatically...',
    telemedicineConsentTitle: 'Telemedicine & Privacy Consent',
    telemedicineConsentBody: 'I understand that AI gives triage guidance only and does NOT make medical diagnoses. In an emergency, I must seek in-person hospital care. My health data is stored securely per Indian Digital Data Protection standards.',
    acceptAndProceed: 'I Agree & Continue',
    switchProfile: 'Who needs care today?',
    addNewProfile: '+ Add Family Member',
    
    // Symptom Chat
    chatHeader: 'Symptom Triage Assistant',
    chatDisclaimer: 'Notice: This AI provides safe guidance and triage urgency. It is NOT a doctor and does not prescribe medicine.',
    askSymptomPlaceholder: 'Describe what you are feeling (or tap mic)...',
    tapToSpeak: 'Tap to Speak',
    listening: 'Listening... please speak now',
    stopSpeaking: 'Done speaking',
    readAloud: 'Listen to this response',
    skipToDoctor: 'Skip AI & Consult Doctor Directly',
    
    // Triage Outcomes
    triageEmergencyTitle: 'EMERGENCY: Immediate Hospital Care Needed',
    triageEmergencyDesc: 'Based on the red-flag symptoms reported, you must visit the nearest hospital or call an ambulance immediately. Do not delay.',
    callAmbulance108: 'Call 108 Ambulance Now',
    callEmergency112: 'Call 112 Helpline',
    nearbyClinics: 'Nearby Emergency Facilities',
    
    triageConsultSoonTitle: 'DOCTOR CONSULTATION RECOMMENDED',
    triageConsultSoonDesc: 'Your symptoms require clinical examination by a licensed medical practitioner. Join our virtual queue to consult a doctor via video or audio.',
    joinDoctorQueue: 'Join Doctor Consultation Queue',
    estimatedWait: 'Estimated Wait: ~5-10 mins',
    
    triageSelfCareTitle: 'SAFE SELF-CARE & INTERIM ADVICE',
    triageSelfCareDesc: 'Symptoms appear mild at this stage. Follow these clinician-approved home care measures. If symptoms worsen, consult a doctor immediately.',
    approvedHomeMeasures: 'Clinician-Approved Home Care Measures',
    warningSignsToWatch: 'Warning Signs (Seek doctor immediately if you notice these):',
    consultDoctorAnyway: 'Talk to a Doctor Anyway',

    // Video Consultation & Queue
    queueTitle: 'Virtual Waiting Room',
    youAreInQueue: 'You are in line to see a doctor',
    queuePosition: 'Position in Queue',
    yourDoctor: 'Assigned Doctor',
    callStartingSoon: 'Connecting you to the doctor...',
    rejoinGraceBanner: 'Connection lost? You can rejoin immediately within 5 minutes without losing your slot.',
    bandwidthModeLabel: 'Bandwidth Mode',
    modeAdaptive: 'Adaptive Video',
    modeLowRes: 'Low-Bandwidth (150kbps)',
    modeAudioOnly: 'Audio-Only Mode (2G friendly)',
    inCallChat: 'In-Call Message Fallback',
    cameraToggle: 'Camera',
    micToggle: 'Microphone',
    endConsultation: 'End Consultation',
    
    // Prescription
    prescriptionTitle: 'Doctor e-Prescription',
    prescriptionSubtitle: 'Officially signed & verifiable teleconsultation prescription',
    downloadPdf: 'Download Prescription PDF',
    shareWhatsapp: 'Share via WhatsApp',
    verifyQrCode: 'Scan QR to Verify Authenticity',
    scheduleHeading: 'Medication Schedule & Instructions',
    doctorRegBadge: 'Registered Medical Practitioner (NMC)',
    offlineAvailable: 'Saved for offline use on this phone',
    
    // Doctor Console
    doctorDashboard: 'Doctor Clinical Workspace',
    patientQueue: 'Live Patient Queue',
    aiIntakeSummary: 'AI Triage & Patient Case Summary',
    patientHistory: 'Past Consultations & Conditions',
    createPrescription: 'Write Prescription',
    restrictedDrugAlert: 'SAFETY BLOCK: Schedule X / Controlled narcotics cannot be prescribed via telemedicine under India Telemedicine Guidelines 2020.',
    issueReferral: 'Refer to In-Person Hospital',
    signAndIssue: 'Sign Digitally & Issue e-Prescription',

    // Admin & Clinical Governance
    adminTitle: 'Clinical Governance & Safety Audit',
    totalConsults: 'Total Consultations',
    emergencyRecallRate: 'Emergency Detection Recall',
    aiConcordanceRate: 'Doctor-AI Triage Agreement',
    redFlagAuditLog: 'Red-Flag Triage Audit Log',
    safetyRules: 'Clinician Safety Rules & Guardrails'
  },

  hi: {
    appTitle: 'रूरलकेयर कनेक्ट (RuralCare)',
    tagline: 'गाँव-गाँव तक डॉक्टर की सलाह, बिना लम्बे सफर के',
    appNameSub: 'एआई-सहायता प्राप्त ग्रामीण टेलीमेडिसिन',

    // Roles
    patientRole: 'मरीज़ / परिवार',
    doctorRole: 'डॉक्टर कंसोल',
    adminRole: 'प्रशासन व सुरक्षा',

    // Language selector
    selectLanguage: 'भाषा चुनें',
    currentLanguage: 'हिन्दी',
    
    // Auth & Onboarding
    welcomeTitle: 'रूरलकेयर कनेक्ट में आपका स्वागत है',
    welcomeSubtitle: 'लक्षणों की सुरक्षित जाँच और योग्य डॉक्टरों से वीडियो परामर्श।',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर दर्ज करें',
    getOtp: 'ओटीपी (OTP) कोड भेजें',
    otpSentTo: 'कोड इस नंबर पर भेजा गया:',
    otpPlaceholder: '6 अंकों का ओटीपी दर्ज करें',
    verifyOtp: 'सत्यापित करें और आगे बढ़ें',
    resendOtp: 'दोबारा एसएमएस भेजें',
    callWithCode: 'मुझे फोन करके कोड बताएं (कॉल करें)',
    readOtpAloud: 'कोड बोलकर सुनाएं',
    autoReadingSms: 'एसएमएस से कोड खुद पढ़ा जा रहा है...',
    telemedicineConsentTitle: 'टेलीमेडिसिन एवं गोपनीयता सहमति',
    telemedicineConsentBody: 'मैं समझता/समझती हूँ कि यह एआई केवल प्रारंभिक सलाह और तात्कालिकता बताने के लिए है, यह बीमारी का पक्का निदान नहीं करता। आपातकाल में तुरंत अस्पताल जाना अनिवार्य है। मेरा स्वास्थ्य डेटा पूर्णतः सुरक्षित रखा जाएगा।',
    acceptAndProceed: 'मैं सहमत हूँ और आगे बढ़ें',
    switchProfile: 'आज किसे डॉक्टर से सलाह लेनी है?',
    addNewProfile: '+ परिवार के सदस्य को जोड़ें',

    // Symptom Chat
    chatHeader: 'लक्षण जाँच सहायक (AI)',
    chatDisclaimer: 'सूचना: यह एआई केवल तात्कालिकता समझने में मदद करता है। यह कोई डॉक्टर नहीं है और दवा नहीं लिखता।',
    askSymptomPlaceholder: 'अपनी परेशानी लिखें या माइक दबाकर बोलें...',
    tapToSpeak: 'बोलने के लिए माइक दबाएं',
    listening: 'सुन रहे हैं... कृपया बोलें',
    stopSpeaking: 'बोलना समाप्त हुआ',
    readAloud: 'आवाज़ में सुनें',
    skipToDoctor: 'सीधे डॉक्टर से बात करें',

    // Triage Outcomes
    triageEmergencyTitle: 'आपातकालीन स्थिति (Emergency): तुरंत अस्पताल जाएँ',
    triageEmergencyDesc: 'आपके द्वारा बताए गए लक्षणों के अनुसार तुरंत नजदीकी अस्पताल जाना या एम्बुलेंस बुलाना आवश्यक है। बिल्कुल भी देरी न करें।',
    callAmbulance108: 'तुरंत 108 एम्बुलेंस को कॉल करें',
    callEmergency112: '112 आपातकालीन सेवा',
    nearbyClinics: 'नजदीकी सरकारी स्वास्थ्य केंद्र व अस्पताल',

    triageConsultSoonTitle: 'डॉक्टर से परामर्श की सलाह दी जाती है',
    triageConsultSoonDesc: 'आपके लक्षणों की जांच डॉक्टर द्वारा वीडियो या ऑडियो कॉल पर होनी चाहिए। कतार में शामिल होकर डॉक्टर से परामर्श लें।',
    joinDoctorQueue: 'डॉक्टर से बात करने के लिए कतार में जुड़ें',
    estimatedWait: 'अनुमानित समय: ~5-10 मिनट',

    triageSelfCareTitle: 'सुरक्षित घरेलू देखभाल और सलाह',
    triageSelfCareDesc: 'वर्तमान में लक्षण सामान्य लग रहे हैं। डॉक्टर-अनुमोदित इन उपायों का पालन करें। यदि समस्या बढ़े तो तुरंत डॉक्टर से संपर्क करें।',
    approvedHomeMeasures: 'डॉक्टर द्वारा स्वीकृत घरेलू देखभाल के उपाय',
    warningSignsToWatch: 'खतरे के संकेत (इनमें से कुछ भी दिखे तो तुरंत डॉक्टर को दिखाएं):',
    consultDoctorAnyway: 'फिर भी डॉक्टर से बात करनी है',

    // Video Consultation & Queue
    queueTitle: 'डिजिटल प्रतीक्षालय (Waiting Room)',
    youAreInQueue: 'आप डॉक्टर से मिलने की कतार में हैं',
    queuePosition: 'कतार में आपका नंबर',
    yourDoctor: 'नियुक्त डॉक्टर',
    callStartingSoon: 'डॉक्टर से संपर्क स्थापित हो रहा है...',
    rejoinGraceBanner: 'नेटवर्क कमजोर होने पर भी 5 मिनट के भीतर बिना कतार खोए दोबारा जुड़ सकते हैं।',
    bandwidthModeLabel: 'नेटवर्क मोड',
    modeAdaptive: 'अनुकूलित वीडियो (Adaptive)',
    modeLowRes: 'कम इंटरनेट वीडियो (150kbps)',
    modeAudioOnly: 'केवल ऑडियो मोड (2G नेटवर्क के लिए)',
    inCallChat: 'कॉल के दौरान संदेश (चैट)',
    cameraToggle: 'कैमरा',
    micToggle: 'माइक',
    endConsultation: 'परामर्श समाप्त करें',

    // Prescription
    prescriptionTitle: 'डॉक्टर का डिजिटल पर्चा (e-Prescription)',
    prescriptionSubtitle: 'प्रमाणित एवं डिजिटल हस्ताक्षरित पर्चा',
    downloadPdf: 'पर्चे का PDF डाउनलोड करें',
    shareWhatsapp: 'व्हाट्सएप (WhatsApp) पर भेजें',
    verifyQrCode: 'क्यूआर कोड से पर्चा सत्यापित करें',
    scheduleHeading: 'दवाइयां और लेने का सही समय',
    doctorRegBadge: 'पंजीकृत चिकित्सक (NMC प्रमाणित)',
    offlineAvailable: 'यह पर्चा बिना इंटरनेट भी फोन में उपलब्ध रहेगा',

    // Doctor Console
    doctorDashboard: 'डॉक्टर क्लिनिकल कंसोल',
    patientQueue: 'मरीजों की प्रतीक्षा सूची',
    aiIntakeSummary: 'एआई सारांश व केस रिपोर्ट',
    patientHistory: 'पिछला इतिहास व पुरानी दवाइयां',
    createPrescription: 'डिजिटल पर्चा बनाएं',
    restrictedDrugAlert: 'सुरक्षा नियम: टेलीमेडिसिन दिशा-निर्देश 2020 के तहत नशीली या प्रतिबंधित दवाएं ऑनलाइन नहीं लिखी जा सकतीं।',
    issueReferral: 'अस्पताल में व्यक्तिगत जांच हेतु रेफर करें',
    signAndIssue: 'डिजिटल हस्ताक्षर करें और पर्चा जारी करें',

    // Admin
    adminTitle: 'क्लिनिकल गवर्नेंस एवं सुरक्षा ऑडिट',
    totalConsults: 'कुल परामर्श',
    emergencyRecallRate: 'आपातकाल पहचान दर',
    aiConcordanceRate: 'डॉक्टर-एआई सहमति दर',
    redFlagAuditLog: 'रेड-फ्लैग केस ऑडिट लॉग',
    safetyRules: 'क्लिनिकल सुरक्षा नियम और दिशानिर्देश'
  },

  gu: {
    appTitle: 'રૂરલકેર કનેક્ટ (RuralCare)',
    tagline: 'ઘર આંગણે ડૉક્ટરની સલાહ, દૂરના દવાખાને ગયા વિના',
    appNameSub: 'AI-સંચાલિત ગ્રામીણ ટેલિમેડિસિન સેવા',

    // Roles
    patientRole: 'દર્દી / પરિવાર',
    doctorRole: 'ડૉક્ટર કન્સોલ',
    adminRole: 'વહીવટ અને સુરક્ષા',

    // Language selector
    selectLanguage: 'ભાષા પસંદ કરો',
    currentLanguage: 'ગુજરાતી',

    // Auth & Onboarding
    welcomeTitle: 'રૂરલકેર કનેક્ટમાં આપનું સ્વાગત છે',
    welcomeSubtitle: 'લક્ષણોની સલામત તપાસ અને માન્ય ડૉક્ટર સાથે વિડિયો સલાહ.',
    phonePlaceholder: '10 અંકનો મોબાઈલ નંબર દાખલ કરો',
    getOtp: 'OTP કોડ મોકલો (SMS)',
    otpSentTo: 'કોડ આ નંબર પર મોકલ્યો છે:',
    otpPlaceholder: '6 અંકનો OTP દાખલ કરો',
    verifyOtp: 'ચકાસો અને આગળ વધો',
    resendOtp: 'ફરીથી SMS મોકલો',
    callWithCode: 'મને ફોન કરીને કોડ કહો (કૉલ કરો)',
    readOtpAloud: 'કોડ બોલીને સંભળાવો',
    autoReadingSms: 'SMS માંથી કોડ આપમેળે વંચાઈ રહ્યો છે...',
    telemedicineConsentTitle: 'ટેલિમેડિસિન અને ગોપનીયતા સંમતિ',
    telemedicineConsentBody: 'હું સમજું છું કે AI ફક્ત પ્રારંભિક સલાહ આપે છે અને રોગનું અંતિમ નિદાન કરતું નથી. કટોકટીમાં તાત્કાલિક હોસ્પિટલ જવું અનિવાર્ય છે. મારી સ્વાસ્થ્ય માહિતી સુરક્ષિત રહેશે.',
    acceptAndProceed: 'હું સંમત છું અને આગળ વધો',
    switchProfile: 'આજે કોને ડૉક્ટરની સલાહ લેવી છે?',
    addNewProfile: '+ પરિવારના સભ્યને ઉમેરો',

    // Symptom Chat
    chatHeader: 'લક્ષણ તપાસ સહાયક (AI)',
    chatDisclaimer: 'સૂચના: આ AI માત્ર પ્રાથમિક માર્ગદર્શન આપે છે. તે ડૉક્ટર નથી અને દવા લખી આપતું નથી.',
    askSymptomPlaceholder: 'તમારી તકલીફ લખો અથવા માઇક દબાવીને બોલો...',
    tapToSpeak: 'બોલવા માટે માઇક દબાવો',
    listening: 'સાંભળી રહ્યા છીએ... કૃપા કરીને બોલો',
    stopSpeaking: 'બોલવાનું પૂરું થયું',
    readAloud: 'અવાજમાં સાંભળો',
    skipToDoctor: 'સીધા ડૉક્ટર સાથે વાત કરો',

    // Triage Outcomes
    triageEmergencyTitle: 'કટોકટી (Emergency): તાત્કાલિક હોસ્પિટલ જાઓ',
    triageEmergencyDesc: 'ગંભીર લક્ષણોને કારણે તમારે તાત્કાલિક નજીકની હોસ્પિટલમાં જવું અથવા એમ્બ્યુલન્સ બોલાવવી જરૂરી છે.',
    callAmbulance108: 'તરત 108 એમ્બ્યુલન્સને કૉલ કરો',
    callEmergency112: '112 હેલ્પલાઇન',
    nearbyClinics: 'નજીકના સરકારી આરોગ્ય કેન્દ્રો અને હોસ્પિટલ',

    triageConsultSoonTitle: 'ડૉક્ટરની સલાહ લેવાની ભલામણ છે',
    triageConsultSoonDesc: 'તમારા લક્ષણો માટે લાયસન્સ ધરાવતા ડૉક્ટરની તપાસ જરૂરી છે. વિડિયો અથવા ઑડિયો કૉલ માટે કતારમાં જોડાઓ.',
    joinDoctorQueue: 'ડૉક્ટર સાથે વાત કરવા કતારમાં જોડાઓ',
    estimatedWait: 'અંદાજિત સમય: ~5-10 મિનિટ',

    triageSelfCareTitle: 'સલામત ઘરેલું સારસંભાળ અને માર્ગદર્શન',
    triageSelfCareDesc: 'હાલ લક્ષણો સામાન્ય જણાય છે. ડૉક્ટર દ્વારા માન્ય આ ઘરેલું ઉપાયો અનુસરો. જો તકલીફ વધે તો તાત્કાલિક ડૉક્ટરનો સંપર્ક કરો.',
    approvedHomeMeasures: 'ડૉક્ટર દ્વારા માન્ય ઘરેલું ઉપાયો',
    warningSignsToWatch: 'ચેતવણીના સંકેતો (આ જણાય તો તરત જ ડૉક્ટર પાસે જાઓ):',
    consultDoctorAnyway: 'તો પણ ડૉક્ટર સાથે વાત કરવી છે',

    // Video Consultation & Queue
    queueTitle: 'ડિજિટલ પ્રતીક્ષાલય (Waiting Room)',
    youAreInQueue: 'તમે ડૉક્ટરની પ્રતીક્ષા કતારમાં છો',
    queuePosition: 'કતારમાં તમારો નંબર',
    yourDoctor: 'સોંપાયેલા ડૉક્ટર',
    callStartingSoon: 'ડૉક્ટર સાથે જોડાણ થઈ રહ્યું છે...',
    rejoinGraceBanner: 'નેટવર્ક કપાઈ જાય તો પણ 5 મિનિટમાં કતાર ગુમાવ્યા વિના ફરી જોડાઈ શકો છો.',
    bandwidthModeLabel: 'નેટવર્ક મોડ',
    modeAdaptive: 'અનુકૂળ વિડિઓ (Adaptive)',
    modeLowRes: 'ઓછા નેટવર્ક વાળો વિડિઓ (150kbps)',
    modeAudioOnly: 'માત્ર ઑડિયો મોડ (2G નેટવર્ક માટે)',
    inCallChat: 'કૉલમાં મેસેજ ચેટ',
    cameraToggle: 'કેમેરો',
    micToggle: 'માઇક',
    endConsultation: 'પરામર્શ પૂર્ણ કરો',

    // Prescription
    prescriptionTitle: 'ડૉક્ટરનું ડિજિટલ પ્રિસ્ક્રિપ્શન',
    prescriptionSubtitle: 'અધિકૃત અને ડિજિટલ સહી વાળો કાગળ',
    downloadPdf: 'પ્રિસ્ક્રિપ્શન PDF ડાઉનલોડ કરો',
    shareWhatsapp: 'WhatsApp પર મોકલો',
    verifyQrCode: 'QR કોડ સ્કેન કરી ચકાસો',
    scheduleHeading: 'દવાઓ અને લેવાનો સાચો સમય',
    doctorRegBadge: 'માન્ય તબીબ (NMC રજિસ્ટર્ડ)',
    offlineAvailable: 'આ પ્રિસ્ક્રિપ્શન નેટ વિના પણ ફોનમાં ઉપલબ્ધ રહેશે',

    // Doctor Console
    doctorDashboard: 'ડૉક્ટર ક્લિનિકલ કન્સોલ',
    patientQueue: 'દર્દીઓની પ્રતીક્ષા યાદી',
    aiIntakeSummary: 'AI કેસ રિપોર્ટ અને સારાંશ',
    patientHistory: 'જૂનો ઇતિહાસ અને દવાઓ',
    createPrescription: 'નવું પ્રિસ્ક્રિપ્શન બનાવો',
    restrictedDrugAlert: 'સુરક્ષા નિયમ: ટેલિમેડિસિન નિયમો 2020 હેઠળ નશીલી અથવા પ્રતિબંધિત દવાઓ ઑનલાઇન લખી શકાતી નથી.',
    issueReferral: 'હોસ્પિટલમાં રૂબરૂ તપાસ માટે રેફર કરો',
    signAndIssue: 'ડિજિટલ સહી કરો અને પત્ર આપો',

    // Admin
    adminTitle: 'ક્લિનિકલ ગવર્નન્સ અને સેફ્ટી ઑડિટ',
    totalConsults: 'કુલ પરામર્શ',
    emergencyRecallRate: 'કટોકટી ઓળખ દર',
    aiConcordanceRate: 'ડૉક્ટર-AI સંમતિ દર',
    redFlagAuditLog: 'રેડ-ફ્લેગ ઑડિટ લૉગ',
    safetyRules: 'ક્લિનિકલ સુરક્ષા નિયમો'
  }
};


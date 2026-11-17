import { 
  IUser, 
  IFamilyProfile, 
  IDoctor, 
  IConsultation, 
  IPrescription, 
  IAuditLog, 
  IFacility 
} from './models/types.js';

class DataStore {
  public users: Map<string, IUser> = new Map(); // Keyed by ID or Phone or Email
  public profiles: Map<string, IFamilyProfile[]> = new Map(); // Keyed by Phone
  public doctors: IDoctor[] = [];
  public consultations: Map<string, IConsultation> = new Map();
  public prescriptions: Map<string, IPrescription> = new Map();
  public auditLogs: IAuditLog[] = [];
  public facilities: IFacility[] = [];
  public activeQueue: string[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultPatientPhone = '9876543210';
    
    // 1. Patient User (Sunita Devi)
    const patientUser: IUser = {
      id: 'usr-patient-1',
      name: 'सुनीता देवी (Sunita Devi)',
      phoneNumber: defaultPatientPhone,
      role: 'PATIENT',
      isVerified: true,
      consentGiven: true,
      activeProfileId: 'prof-1',
      preferredLanguage: 'hi',
      createdAt: new Date().toISOString()
    };
    this.users.set(defaultPatientPhone, patientUser);
    this.users.set('usr-patient-1', patientUser);

    // Patient Family Profiles
    this.profiles.set(defaultPatientPhone, [
      {
        id: 'prof-1',
        userId: defaultPatientPhone,
        name: 'सुनीता देवी (Sunita Devi)',
        relation: 'Self',
        age: 34,
        gender: 'Female',
        isPregnant: false,
        chronicConditions: ['None'],
        currentMedications: [],
        avatar: '👩🏽'
      },
      {
        id: 'prof-2',
        userId: defaultPatientPhone,
        name: 'रमेश पटेल (Ramesh Patel, Elder)',
        relation: 'Parent',
        age: 62,
        gender: 'Male',
        isPregnant: false,
        chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        currentMedications: ['Amlodipine 5mg', 'Metformin 500mg'],
        avatar: '👴🏽'
      },
      {
        id: 'prof-3',
        userId: defaultPatientPhone,
        name: 'राजू (Raju, Child)',
        relation: 'Child',
        age: 4,
        gender: 'Male',
        isPregnant: false,
        chronicConditions: [],
        currentMedications: [],
        avatar: '👦🏽'
      }
    ]);

    // 2. Doctor User (Dr. Ramesh Patel, MD - NMC Verified)
    const doctorUser: IUser = {
      id: 'usr-doc-1',
      name: 'Dr. Ramesh Patel',
      email: 'doctor@ruralcare.gov.in',
      phoneNumber: '9822334455',
      passwordHash: 'doctor123',
      role: 'DOCTOR',
      isVerified: true,
      consentGiven: true,
      preferredLanguage: 'en',
      doctorDetails: {
        registrationNumber: 'NMC/MCI-2018-84729',
        councilName: 'Gujarat Medical Council / NMC India',
        specialization: 'General Physician & Telehealth Specialist',
        experienceYears: 14,
        isNmcVerified: true,
        verificationDate: '2024-01-15'
      },
      createdAt: new Date().toISOString()
    };
    this.users.set('doctor@ruralcare.gov.in', doctorUser);
    this.users.set('NMC/MCI-2018-84729', doctorUser);
    this.users.set('usr-doc-1', doctorUser);

    // 3. ASHA Community Health Worker User (Meena Ben)
    const ashaUser: IUser = {
      id: 'usr-asha-1',
      name: 'मीना बेन (Meena Ben, ASHA Worker)',
      phoneNumber: '9811223344',
      passwordHash: 'asha123',
      role: 'ASHA',
      isVerified: true,
      consentGiven: true,
      preferredLanguage: 'gu',
      ashaDetails: {
        workerId: 'ASHA-GUJ-4091',
        sector: 'Sector 4 Village Cluster',
        villagePHC: 'Primary Health Centre Taluka-A',
        householdCount: 120
      },
      createdAt: new Date().toISOString()
    };
    this.users.set('9811223344', ashaUser);
    this.users.set('ASHA-GUJ-4091', ashaUser);
    this.users.set('usr-asha-1', ashaUser);

    // 4. Clinical Governance & Admin Board User
    const adminUser: IUser = {
      id: 'usr-admin-1',
      name: 'Clinical Governance Officer',
      email: 'admin@ruralcare.gov.in',
      phoneNumber: '9800112233',
      passwordHash: 'admin123',
      role: 'ADMIN',
      isVerified: true,
      consentGiven: true,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString()
    };
    this.users.set('admin@ruralcare.gov.in', adminUser);
    this.users.set('usr-admin-1', adminUser);

    // 5. Licensed Doctors Pool
    this.doctors = [
      {
        id: 'doc-1',
        name: 'रमेश पटेल (Dr. Ramesh Patel)',
        specialization: 'General Physician & Telehealth Specialist',
        registrationNumber: 'NMC/MCI-2018-84729',
        councilName: 'Gujarat Medical Council / NMC India',
        experienceYears: 14,
        languages: ['Hindi', 'Gujarati', 'English'],
        isAvailable: true,
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
        rating: 4.9
      },
      {
        id: 'doc-2',
        name: 'प्रिया शर्मा (Dr. Priya Sharma)',
        specialization: 'Family Medicine & Pediatrician',
        registrationNumber: 'NMC/MCI-2020-59218',
        councilName: 'Delhi Medical Council / NMC India',
        experienceYears: 8,
        languages: ['Hindi', 'English'],
        isAvailable: true,
        avatar: 'https://images.unsplash.com/photo-1594824813583-4712399e69e4?w=300&auto=format&fit=crop&q=80',
        rating: 4.8
      }
    ];

    // 6. Default Seed Prescription
    const seedRxId = 'RC-2026-98124';
    this.prescriptions.set(seedRxId, {
      id: seedRxId,
      consultationId: 'CONS-90182',
      patientName: 'सुनीता देवी (Sunita Devi)',
      patientAge: 34,
      patientGender: 'Female',
      patientPhone: defaultPatientPhone,
      doctorName: this.doctors[0].name,
      doctorRegNo: this.doctors[0].registrationNumber,
      doctorCouncil: this.doctors[0].councilName,
      doctorSignatureDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      diagnosis: 'Acute Upper Respiratory Tract Infection (Mild Viral URI)',
      symptoms: ['Mild fever', 'Dry cough', 'Throat irritation'],
      medicines: [
        {
          id: 'm1',
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: '1-0-1 (Morning & Night)',
          timing: 'After Food',
          durationDays: 3,
          instructionEn: 'Take 1 tablet after food only if fever or body pain is present.',
          instructionHi: 'बुखार या शरीर दर्द होने पर ही भोजन के बाद 1 गोली लें।',
          instructionGu: 'તાવ અથવા અંગ દુખાવા વખતે જ જમ્યા પછી 1 ગોળી લેવી.'
        },
        {
          id: 'm2',
          name: 'Cetirizine',
          dosage: '10mg',
          frequency: '0-0-1 (Bedtime)',
          timing: 'After Food',
          durationDays: 3,
          instructionEn: 'Take 1 tablet at night for throat irritation and runny nose.',
          instructionHi: 'गले की खराश के लिए रात को 1 गोली लें।',
          instructionGu: 'ગળાની ખારાશ માટે રાત્રે 1 ગોળી લેવી.'
        }
      ],
      generalAdvice: 'Drink plenty of warm water, gargle with warm salt water twice daily, and get adequate rest.',
      followUpDays: 3,
      verificationQrData: `https://ruralcare.gov.in/verify/${seedRxId}`,
      isOfflineAvailable: true,
      createdAt: new Date().toISOString()
    });

    // 7. Clinical Governance Audit Records
    this.auditLogs = [
      {
        id: 'AUD-891',
        timestamp: '2026-11-09 11:42',
        patientPhone: defaultPatientPhone,
        profileName: 'Sunita Devi',
        initialComplaint: 'Chest tightness radiating to left shoulder',
        aiTriageLevel: 'EMERGENCY',
        doctorFinalDisposition: 'EMERGENCY',
        isConcordant: true,
        redFlagsDetected: ['Cardiac & Chest: Potential acute coronary syndrome'],
        reviewedByClinician: true,
        clinicalNotes: 'Correct emergency escalation. Ambulance 108 dispatched.'
      },
      {
        id: 'AUD-890',
        timestamp: '2026-11-09 11:15',
        patientPhone: defaultPatientPhone,
        profileName: 'Ramesh Patel',
        initialComplaint: 'High BP medicine refill and mild evening headache for 4 days',
        aiTriageLevel: 'CONSULT_SOON',
        doctorFinalDisposition: 'CONSULT_SOON',
        isConcordant: true,
        redFlagsDetected: [],
        reviewedByClinician: true,
        clinicalNotes: 'Amlodipine refill issued successfully.'
      }
    ];

    // 8. Nearby Facilities
    this.facilities = [
      {
        id: 'fac-1',
        name: 'Government Community Health Centre (CHC)',
        distance: '6.5 km',
        type: 'Community Hospital (24x7 Emergency)',
        beds: '30 Beds, Oxygen Available',
        phone: '108 / 028-223410',
        ambulanceTime: '15-20 mins'
      },
      {
        id: 'fac-2',
        name: 'Primary Health Centre (PHC)',
        distance: '2.8 km',
        type: 'Primary Care & Immunization',
        beds: '6 Beds, Doctor on duty till 5 PM',
        phone: '028-228941',
        ambulanceTime: '10-15 mins'
      },
      {
        id: 'fac-3',
        name: 'District Civil Hospital',
        distance: '24.0 km',
        type: 'Tertiary Care & Specialist Referral',
        beds: '250 Beds, ICU, Trauma Centre, Blood Bank',
        phone: '028-299100',
        ambulanceTime: '30-40 mins'
      }
    ];

    // 9. Initial Seed Consultations & Active Queue for Doctor Console
    const consult1: IConsultation = {
      id: 'CONS-AMAN-8',
      patientPhoneNumber: '9823041189',
      patientProfile: {
        id: 'prof-aman',
        userId: '9823041189',
        name: 'Aman',
        relation: 'Child',
        age: 8,
        gender: 'Male',
        chronicConditions: ['None'],
        currentMedications: [],
        avatar: '👦🏽'
      },
      doctor: this.doctors[0],
      status: 'IN_CALL',
      triageSummary: {
        triageLevel: 'CONSULT_SOON',
        confidenceScore: 0.96,
        matchedRedFlags: [],
        primaryComplaint: 'Fever & Vomiting (2 days)',
        structuredDetails: {
          duration: '48 Hours',
          severity: 'Moderate',
          age: 8,
          gender: 'Male',
          pregnancy: false,
          chronicConditions: [],
          medications: []
        },
        approvedInterimAdvice: [
          'Give Oral Rehydration Salts (ORS) in sips post loose stools.',
          'Offer light rice gruel (kanji) and mashed bananas.',
          'Maintain 6-hour interval between paracetamol doses.'
        ],
        doctorCaseSummary: {
          chiefComplaint: 'Acute vomiting and elevated temperature for 48 hours in pediatric patient.',
          timeline: 'Started Tuesday night, 3 episodes emesis.',
          vitalsNotes: 'Temp: 102.1 °F, Capillary refill <2s, alert and tears present.',
          redFlagCheck: 'No seizure, chest indrawing absent, drinking fluids.',
          recommendedAction: 'Prescribe WHO ORS, Paracetamol oral suspension, Zinc gluconate. Monitor for 24h.'
        },
        disclaimer: 'Ayushman Bharat AI Clinical Decision Support protocol validated.'
      },
      queuePosition: 1,
      estimatedWaitMinutes: 0,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      bandwidthMode: '48KBPS_LITE',
      chatMessages: [
        {
          sender: 'Dr. Anita Patel',
          text: 'Namaste Sunita ji, I see Aman has high temperature. Has he passed urine today?',
          time: '06:38 PM'
        },
        {
          sender: 'Sunita Devi (Mother)',
          text: 'Yes doctor sahiba, he passed urine 2 hours ago. But he vomited after drinking water.',
          time: '06:40 PM'
        }
      ]
    };

    const consult2: IConsultation = {
      id: 'CONS-RAMESH-62',
      patientPhoneNumber: '9876543210',
      patientProfile: {
        id: 'prof-2',
        userId: '9876543210',
        name: 'Ramesh Patel',
        relation: 'Parent',
        age: 62,
        gender: 'Male',
        chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        currentMedications: ['Amlodipine 5mg', 'Metformin 500mg'],
        avatar: '👴🏽'
      },
      doctor: this.doctors[0],
      status: 'QUEUED',
      triageSummary: {
        triageLevel: 'CONSULT_SOON',
        confidenceScore: 0.94,
        matchedRedFlags: [],
        primaryComplaint: 'Hypertension Review & Medication Refill',
        structuredDetails: {
          duration: '4 Days',
          severity: 'Mild',
          age: 62,
          gender: 'Male',
          pregnancy: false,
          chronicConditions: ['Hypertension'],
          medications: ['Amlodipine 5mg']
        },
        approvedInterimAdvice: [
          'Continue low-sodium dietary regimen.',
          'Log morning and evening blood pressure numbers.'
        ],
        doctorCaseSummary: {
          chiefComplaint: 'Routine hypertension evaluation, BP log check and 30-day refill.',
          timeline: 'Chronic stable condition.',
          vitalsNotes: 'Last measured BP at Sub-Centre: 142/88 mmHg, Pulse 74 bpm.',
          redFlagCheck: 'No chest pain, no dizziness, no shortness of breath.',
          recommendedAction: 'Renew Amlodipine 5mg OD for 30 days.'
        },
        disclaimer: 'Ayushman Bharat AI Clinical Decision Support protocol validated.'
      },
      queuePosition: 2,
      estimatedWaitMinutes: 4,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      bandwidthMode: 'ADAPTIVE',
      chatMessages: []
    };

    const consult3: IConsultation = {
      id: 'CONS-RADHA-29',
      patientPhoneNumber: '9811223344',
      patientProfile: {
        id: 'prof-radha',
        userId: '9811223344',
        name: 'Radha',
        relation: 'Self',
        age: 29,
        gender: 'Female',
        isPregnant: true,
        chronicConditions: ['None'],
        currentMedications: ['Iron & Folic Acid'],
        avatar: '👩🏽'
      },
      doctor: this.doctors[0],
      status: 'QUEUED',
      triageSummary: {
        triageLevel: 'CONSULT_SOON',
        confidenceScore: 0.92,
        matchedRedFlags: [],
        primaryComplaint: 'Antenatal Trimester 2 Routine Assessment',
        structuredDetails: {
          duration: 'Routine Check',
          severity: 'Mild',
          age: 29,
          gender: 'Female',
          pregnancy: true,
          chronicConditions: [],
          medications: ['IFA tablet']
        },
        approvedInterimAdvice: [
          'Take Iron-Folic acid tablet post meals daily.',
          'Hydrate well and monitor fetal kicks.'
        ],
        doctorCaseSummary: {
          chiefComplaint: 'Trimester 2 routine ANC checkup with ASHA Meena Ben.',
          timeline: 'Gestational age 24 weeks.',
          vitalsNotes: 'Weight 52kg, BP 118/76 mmHg, Hemoglobin 11.2 g/dL.',
          redFlagCheck: 'No bleeding, no severe edema, no visual disturbances.',
          recommendedAction: 'Verify tetanus toxoid dose and calcium supplementation.'
        },
        disclaimer: 'Ayushman Bharat AI Clinical Decision Support protocol validated.'
      },
      queuePosition: 3,
      estimatedWaitMinutes: 8,
      scheduledAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      bandwidthMode: 'ADAPTIVE',
      chatMessages: []
    };

    this.consultations.set(consult1.id, consult1);
    this.consultations.set(consult2.id, consult2);
    this.consultations.set(consult3.id, consult3);

    this.activeQueue = [consult1.id, consult2.id, consult3.id];
  }
}

export const store = new DataStore();

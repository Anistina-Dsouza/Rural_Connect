import { 
  IUser, 
  IFamilyProfile, 
  IDoctor, 
  IConsultation, 
  IPrescription, 
  IAuditLog, 
  IFacility 
} from './models/types.js';

// In-Memory Repository with Default Rural Pilot Seed Data
class DataStore {
  public users: Map<string, IUser> = new Map();
  public profiles: Map<string, IFamilyProfile[]> = new Map();
  public doctors: IDoctor[] = [];
  public consultations: Map<string, IConsultation> = new Map();
  public prescriptions: Map<string, IPrescription> = new Map();
  public auditLogs: IAuditLog[] = [];
  public facilities: IFacility[] = [];
  public activeQueue: string[] = []; // Consultation IDs in order

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultPhone = '9876543210';
    
    // 1. Default User Session
    this.users.set(defaultPhone, {
      phoneNumber: defaultPhone,
      isVerified: true,
      consentGiven: true,
      activeProfileId: 'prof-1',
      preferredLanguage: 'hi'
    });

    // 2. Default Family Profiles (Sunita, Ramesh, Child Raju)
    this.profiles.set(defaultPhone, [
      {
        id: 'prof-1',
        userId: defaultPhone,
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
        userId: defaultPhone,
        name: 'रमेश पटेल (Ramesh Patel)',
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
        userId: defaultPhone,
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

    // 3. Licensed Doctors (Verified against Medical Council)
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

    // 4. Default Seed Prescription
    const seedRxId = 'RC-2026-98124';
    this.prescriptions.set(seedRxId, {
      id: seedRxId,
      consultationId: 'CONS-90182',
      patientName: 'सुनीता देवी (Sunita Devi)',
      patientAge: 34,
      patientGender: 'Female',
      patientPhone: defaultPhone,
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

    // 5. Audit Log Records (PRD FR-7.4)
    this.auditLogs = [
      {
        id: 'AUD-891',
        timestamp: '2026-11-09 11:42',
        patientPhone: defaultPhone,
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
        patientPhone: defaultPhone,
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

    // 6. Nearby Rural Emergency Facilities (PRD FR-3.2)
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
  }
}

export const store = new DataStore();

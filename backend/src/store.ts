import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { 
  IUser, 
  IFamilyProfile, 
  IDoctor, 
  IConsultation, 
  IPrescription, 
  IAuditLog, 
  IFacility,
  IVitalsRecord,
  IFollowUpCheckIn,
  IReferralNote
} from './models/types.js';
import {
  UserModel,
  FamilyProfileModel,
  DoctorModel,
  ConsultationModel,
  PrescriptionModel,
  VitalsModel,
  FollowUpModel,
  ReferralNoteModel,
  AuditLogModel,
  FacilityModel
} from './models/schemas.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DataStore {
  public users: Map<string, IUser> = new Map(); // Keyed by ID or Phone or Email
  public profiles: Map<string, IFamilyProfile[]> = new Map(); // Keyed by Phone
  public doctors: IDoctor[] = [];
  public consultations: Map<string, IConsultation> = new Map();
  public prescriptions: Map<string, IPrescription> = new Map();
  public auditLogs: IAuditLog[] = [];
  public facilities: IFacility[] = [];
  public activeQueue: string[] = [];
  public vitals: Map<string, IVitalsRecord[]> = new Map(); // Keyed by patient phone
  public followUps: Map<string, IFollowUpCheckIn[]> = new Map(); // Keyed by prescriptionId
  public referrals: Map<string, IReferralNote> = new Map(); // Keyed by referral ID

  private isSaving: boolean = false;
  private saveTimeout: any = null;

  constructor() {
    this.seedInitialData();
    this.loadFromDisk();
  }

  // --- Disk Persistence Helpers ---
  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.users) {
          Object.entries(data.users).forEach(([k, v]) => this.users.set(k, v as IUser));
        }
        if (data.profiles) {
          Object.entries(data.profiles).forEach(([k, v]) => this.profiles.set(k, v as IFamilyProfile[]));
        }
        if (Array.isArray(data.doctors) && data.doctors.length > 0) {
          this.doctors = data.doctors;
        }
        if (data.consultations) {
          Object.entries(data.consultations).forEach(([k, v]) => this.consultations.set(k, v as IConsultation));
        }
        if (data.prescriptions) {
          Object.entries(data.prescriptions).forEach(([k, v]) => this.prescriptions.set(k, v as IPrescription));
        }
        if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
          this.auditLogs = data.auditLogs;
        }
        if (Array.isArray(data.facilities) && data.facilities.length > 0) {
          this.facilities = data.facilities;
        }
        if (Array.isArray(data.activeQueue) && data.activeQueue.length > 0) {
          this.activeQueue = data.activeQueue;
        }
        if (data.vitals) {
          Object.entries(data.vitals).forEach(([k, v]) => this.vitals.set(k, v as IVitalsRecord[]));
        }
        if (data.followUps) {
          Object.entries(data.followUps).forEach(([k, v]) => this.followUps.set(k, v as IFollowUpCheckIn[]));
        }
        if (data.referrals) {
          Object.entries(data.referrals).forEach(([k, v]) => this.referrals.set(k, v as IReferralNote));
        }
      }
    } catch (err) {
      console.warn('[Database] Local disk database load notice:', (err as Error).message);
    }
  }

  public scheduleDiskSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistToDisk();
    }, 500);
  }

  public persistToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = {
        users: Object.fromEntries(this.users),
        profiles: Object.fromEntries(this.profiles),
        doctors: this.doctors,
        consultations: Object.fromEntries(this.consultations),
        prescriptions: Object.fromEntries(this.prescriptions),
        auditLogs: this.auditLogs,
        facilities: this.facilities,
        activeQueue: this.activeQueue,
        vitals: Object.fromEntries(this.vitals),
        followUps: Object.fromEntries(this.followUps),
        referrals: Object.fromEntries(this.referrals),
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Database] Disk save notice:', (err as Error).message);
    }
  }

  // --- MongoDB Synchronizer ---
  public async initMongoSync() {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    try {
      console.log('[Database] Synchronizing data store with MongoDB collections...');

      // 1. Sync Users
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        const uniqueUsers = Array.from(new Set(this.users.values()));
        for (const u of uniqueUsers) {
          await UserModel.findOneAndUpdate({ id: u.id }, u, { upsert: true, new: true });
        }
        console.log(`[Database] Seeded ${uniqueUsers.length} users into MongoDB.`);
      } else {
        const mongoUsers = await UserModel.find();
        for (const u of mongoUsers) {
          this.users.set(u.id, u.toObject());
          if (u.phoneNumber) this.users.set(u.phoneNumber, u.toObject());
          if (u.email) this.users.set(u.email, u.toObject());
        }
      }

      // 2. Sync Profiles
      const profileCount = await FamilyProfileModel.countDocuments();
      if (profileCount === 0) {
        for (const [phone, profiles] of this.profiles.entries()) {
          for (const p of profiles) {
            await FamilyProfileModel.findOneAndUpdate({ id: p.id }, { ...p, userId: phone }, { upsert: true, new: true });
          }
        }
      } else {
        const mongoProfiles = await FamilyProfileModel.find();
        for (const p of mongoProfiles) {
          const uid = p.userId ?? p.id;
          const list = this.profiles.get(uid) || [];
          if (!list.some(existing => existing.id === p.id)) {
            list.push(p.toObject());
            this.profiles.set(uid, list);
          }
        }
      }

      // 3. Sync Doctors
      const docCount = await DoctorModel.countDocuments();
      if (docCount === 0) {
        for (const d of this.doctors) {
          await DoctorModel.findOneAndUpdate({ id: d.id }, d, { upsert: true, new: true });
        }
      } else {
        const mongoDocs = await DoctorModel.find();
        if (mongoDocs.length > 0) {
          this.doctors = mongoDocs.map(d => d.toObject());
        }
      }

      // 4. Sync Consultations
      const consultCount = await ConsultationModel.countDocuments();
      if (consultCount === 0) {
        for (const c of this.consultations.values()) {
          await ConsultationModel.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true });
        }
      } else {
        const mongoConsults = await ConsultationModel.find();
        for (const c of mongoConsults) {
          this.consultations.set(c.id, c.toObject());
          if (['QUEUED', 'IN_CALL'].includes(c.status) && !this.activeQueue.includes(c.id)) {
            this.activeQueue.push(c.id);
          }
        }
      }

      // 5. Sync Prescriptions
      const rxCount = await PrescriptionModel.countDocuments();
      if (rxCount === 0) {
        for (const rx of this.prescriptions.values()) {
          await PrescriptionModel.findOneAndUpdate({ id: rx.id }, rx, { upsert: true, new: true });
        }
      } else {
        const mongoRxs = await PrescriptionModel.find();
        for (const rx of mongoRxs) {
          this.prescriptions.set(rx.id, rx.toObject());
        }
      }

      // 6. Sync Vitals
      const vitalsCount = await VitalsModel.countDocuments();
      if (vitalsCount === 0) {
        for (const [phone, vList] of this.vitals.entries()) {
          for (const v of vList) {
            await VitalsModel.findOneAndUpdate({ id: v.id }, { ...v, patientPhone: phone }, { upsert: true, new: true });
          }
        }
      } else {
        const mongoVitals = await VitalsModel.find();
        for (const v of mongoVitals) {
          const list = this.vitals.get(v.patientPhone) || [];
          if (!list.some(existing => existing.id === v.id)) {
            list.push(v.toObject());
            this.vitals.set(v.patientPhone, list);
          }
        }
      }

      // 7. Sync FollowUps
      const followUpCount = await FollowUpModel.countDocuments();
      if (followUpCount === 0) {
        for (const [rxId, fList] of this.followUps.entries()) {
          for (const f of fList) {
            await FollowUpModel.findOneAndUpdate({ id: f.id }, { ...f, prescriptionId: rxId }, { upsert: true, new: true });
          }
        }
      } else {
        const mongoFollowUps = await FollowUpModel.find();
        for (const f of mongoFollowUps) {
          const list = this.followUps.get(f.prescriptionId) || [];
          if (!list.some(existing => existing.id === f.id)) {
            list.push(f.toObject());
            this.followUps.set(f.prescriptionId, list);
          }
        }
      }

      // 8. Sync Referrals
      const refCount = await ReferralNoteModel.countDocuments();
      if (refCount === 0) {
        for (const r of this.referrals.values()) {
          await ReferralNoteModel.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
        }
      } else {
        const mongoRefs = await ReferralNoteModel.find();
        for (const r of mongoRefs) {
          this.referrals.set(r.id, r.toObject());
        }
      }

      // 9. Sync Audit Logs
      const auditCount = await AuditLogModel.countDocuments();
      if (auditCount === 0) {
        for (const a of this.auditLogs) {
          await AuditLogModel.findOneAndUpdate({ id: a.id }, a, { upsert: true, new: true });
        }
      } else {
        const mongoAudits = await AuditLogModel.find();
        if (mongoAudits.length > 0) {
          this.auditLogs = mongoAudits.map(a => a.toObject());
        }
      }

      // 10. Sync Facilities
      const facCount = await FacilityModel.countDocuments();
      if (facCount === 0) {
        for (const f of this.facilities) {
          await FacilityModel.findOneAndUpdate({ id: f.id }, f, { upsert: true, new: true });
        }
      } else {
        const mongoFacs = await FacilityModel.find();
        if (mongoFacs.length > 0) {
          this.facilities = mongoFacs.map(f => f.toObject());
        }
      }

      console.log('[Database] MongoDB data sync completed successfully.');
    } catch (err) {
      console.warn('[Database] MongoDB sync notice:', (err as Error).message);
    }
  }

  // Helper to persist changes asynchronously
  public async saveItem(entity: 'user' | 'profile' | 'consultation' | 'prescription' | 'vitals' | 'followup' | 'referral', data: any) {
    this.scheduleDiskSave();

    if (mongoose.connection.readyState !== 1) return;

    try {
      switch (entity) {
        case 'user':
          await UserModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
        case 'profile':
          await FamilyProfileModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
        case 'consultation':
          await ConsultationModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
        case 'prescription':
          await PrescriptionModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
        case 'vitals':
          await VitalsModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
        case 'followup':
          await FollowUpModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
        case 'referral':
          await ReferralNoteModel.findOneAndUpdate({ id: data.id }, data, { upsert: true });
          break;
      }
    } catch (e) {
      // Non-fatal, disk has saved it
    }
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

    // 9. Initial Seed ASHA Vitals Records (FR-6)
    this.vitals.set(defaultPatientPhone, [
      {
        id: 'vit-101',
        patientPhone: defaultPatientPhone,
        profileId: 'prof-1',
        patientName: 'सुनीता देवी (Sunita Devi)',
        systolicBp: 118,
        diastolicBp: 78,
        spO2: 98,
        pulseRate: 74,
        temperatureF: 98.6,
        bloodSugarMgDl: 104,
        recordedByAshaId: 'ASHA-GUJ-4091',
        recordedByAshaName: 'मीना बेन (Meena Ben)',
        notes: 'Routine doorstep wellness check. All vitals normal.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'vit-102',
        patientPhone: defaultPatientPhone,
        profileId: 'prof-2',
        patientName: 'रमेश पटेल (Ramesh Patel)',
        systolicBp: 138,
        diastolicBp: 86,
        spO2: 96,
        pulseRate: 78,
        temperatureF: 98.4,
        bloodSugarMgDl: 142,
        recordedByAshaId: 'ASHA-GUJ-4091',
        recordedByAshaName: 'मीना बेन (Meena Ben)',
        notes: 'Elder chronic monitoring. Blood pressure slightly elevated, taking Amlodipine regularly.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ]);

    // 10. Initial Seed Follow-up Check-in (FR-6)
    this.followUps.set(seedRxId, [
      {
        id: 'flw-001',
        prescriptionId: seedRxId,
        patientPhone: defaultPatientPhone,
        profileId: 'prof-1',
        patientName: 'सुनीता देवी (Sunita Devi)',
        status: 'IMPROVED',
        feedbackNotes: 'Fever subsided after 2 days of Paracetamol. Throat irritation much better.',
        escalatedToDoctor: false,
        timestamp: new Date().toISOString()
      }
    ]);

    // 11. Initial Seed Clinical In-Person Referral Note (FR-4.5)
    this.referrals.set('REF-7891', {
      id: 'REF-7891',
      consultationId: 'CONS-90182',
      patientName: 'रमेश पटेल (Ramesh Patel)',
      patientPhone: defaultPatientPhone,
      referringDoctor: this.doctors[0].name,
      doctorRegNo: this.doctors[0].registrationNumber,
      targetFacility: 'Government Community Health Centre (CHC)',
      priority: 'URGENT',
      clinicalReason: 'Persistent elevated BP (160/100) unresponsive to routine dosage. Requires in-person ECG and serum creatinine evaluation.',
      investigationsRequested: ['12-Lead ECG', 'Serum Creatinine', 'Fasting Blood Sugar'],
      issuedAt: new Date().toISOString()
    });

    // 12. Initial Seed Consultations & Active Queue for Doctor Console
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

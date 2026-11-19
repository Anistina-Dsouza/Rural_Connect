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

function stripMeta(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  delete clone._id;
  delete clone.__v;
  return clone;
}

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
          await UserModel.findOneAndUpdate({ id: u.id }, stripMeta(u), { upsert: true, new: true });
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
            await FamilyProfileModel.findOneAndUpdate({ id: p.id }, stripMeta({ ...p, userId: phone }), { upsert: true, new: true });
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
          await DoctorModel.findOneAndUpdate({ id: d.id }, stripMeta(d), { upsert: true, new: true });
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
          await ConsultationModel.findOneAndUpdate({ id: c.id }, stripMeta(c), { upsert: true, new: true });
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
          await PrescriptionModel.findOneAndUpdate({ id: rx.id }, stripMeta(rx), { upsert: true, new: true });
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
            await VitalsModel.findOneAndUpdate({ id: v.id }, stripMeta({ ...v, patientPhone: phone }), { upsert: true, new: true });
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
            await FollowUpModel.findOneAndUpdate({ id: f.id }, stripMeta({ ...f, prescriptionId: rxId }), { upsert: true, new: true });
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
          await ReferralNoteModel.findOneAndUpdate({ id: r.id }, stripMeta(r), { upsert: true, new: true });
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
          await AuditLogModel.findOneAndUpdate({ id: a.id }, stripMeta(a), { upsert: true, new: true });
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
          await FacilityModel.findOneAndUpdate({ id: f.id }, stripMeta(f), { upsert: true, new: true });
        }
      } else {
        const mongoFacs = await FacilityModel.find();
        if (mongoFacs.length > 0) {
          this.facilities = mongoFacs.map(f => f.toObject());
        }
      }

      console.log('[Database] MongoDB data sync completed successfully.');
    } catch (err) {
      console.error('[Database] MongoDB sync failed:', (err as Error).name);
      throw err;
    }
  }

  // Helper to persist changes asynchronously
  public async saveItem(entity: 'user' | 'profile' | 'consultation' | 'prescription' | 'vitals' | 'followup' | 'referral' | 'audit', data: any) {
    this.scheduleDiskSave();

    if (mongoose.connection.readyState !== 1) return;

    try {
      const cleanData = stripMeta(data);
      switch (entity) {
        case 'user':
          await UserModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'profile':
          await FamilyProfileModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'consultation':
          await ConsultationModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'prescription':
          await PrescriptionModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'vitals':
          await VitalsModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'followup':
          await FollowUpModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'referral':
          await ReferralNoteModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
          break;
        case 'audit':
          await AuditLogModel.findOneAndUpdate({ id: data.id }, cleanData, { upsert: true });
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
        name: 'Dr. Ramesh Patel',
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
        name: 'Dr. Anita Patel',
        specialization: 'Internal Medicine & Rural Outreach',
        registrationNumber: 'NMC/MCI-2019-48921',
        councilName: 'Gujarat Medical Council / NMC India',
        experienceYears: 11,
        languages: ['Hindi', 'English'],
        isAvailable: true,
        avatar: 'https://images.unsplash.com/photo-1594824813583-4712399e69e4?w=300&auto=format&fit=crop&q=80',
        rating: 4.9
      },
      {
        id: 'doc-3',
        name: 'Dr. Priya Sharma',
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

    // Prescriptions start empty - dynamically populated when doctors sign prescriptions
    this.prescriptions = new Map();

    // 6. Clinical Governance Audit Records (System audit trail)
    this.auditLogs = [];

    // 7. Nearby Facilities (Primary Health Centres and Community Health Centres)
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

    // Vitals, Follow-ups, and Referrals start empty - filled by active patient interactions
    this.vitals = new Map();
    this.followUps = new Map();
    this.referrals = new Map();

    // Consultations and queue start empty - populated when patients join the queue
    this.consultations = new Map();
    this.activeQueue = [];
  }
}

export const store = new DataStore();

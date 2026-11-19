import mongoose, { Schema, Document } from 'mongoose';
import {
  IUser,
  IFamilyProfile,
  IDoctor,
  IConsultation,
  IPrescription,
  IVitalsRecord,
  IFollowUpCheckIn,
  IReferralNote,
  IAuditLog,
  IFacility
} from './types.js';

// ─── 1. User ────────────────────────────────────────────────────────────────
export interface IUserDoc extends Omit<IUser, 'id'>, Document { id: string; }

export const UserSchema = new Schema<IUserDoc>({
  id:                { type: String, required: true, unique: true, index: true },
  name:              { type: String, required: true },
  phoneNumber:       { type: String, required: true, index: true },
  email:             { type: String },
  passwordHash:      { type: String },
  role:              { type: String, enum: ['PATIENT', 'DOCTOR', 'ASHA', 'ADMIN'], default: 'PATIENT' },
  isVerified:        { type: Boolean, default: false },
  consentGiven:      { type: Boolean, default: false },
  activeProfileId:   { type: String },
  preferredLanguage: { type: String, enum: ['en', 'hi', 'gu'], default: 'hi' },
  createdAt:         { type: String, default: () => new Date().toISOString() },
  doctorDetails: {
    registrationNumber: { type: String },
    councilName:        { type: String },
    specialization:     { type: String },
    experienceYears:    { type: Number },
    isNmcVerified:      { type: Boolean },
    verificationDate:   { type: String }
  },
  ashaDetails: {
    workerId:       { type: String },
    sector:         { type: String },
    villagePHC:     { type: String },
    householdCount: { type: Number }
  }
}, { timestamps: true });

// ─── 2. Family Profile ───────────────────────────────────────────────────────
export interface IFamilyProfileDoc extends Omit<IFamilyProfile, 'id'>, Document { id: string; }

export const FamilyProfileSchema = new Schema<IFamilyProfileDoc>({
  id:                 { type: String, required: true, unique: true, index: true },
  userId:             { type: String, index: true },
  name:               { type: String, required: true },
  relation:           { type: String, required: true },
  age:                { type: Number, required: true },
  gender:             { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  avatar:             { type: String, default: '👤' },
  isPregnant:         { type: Boolean, default: false },
  chronicConditions:  { type: [String], default: [] },
  currentMedications: { type: [String], default: [] }
}, { timestamps: true });

// ─── 3. Doctor ────────────────────────────────────────────────────────────────
export interface IDoctorDoc extends Omit<IDoctor, 'id'>, Document { id: string; }

export const DoctorSchema = new Schema<IDoctorDoc>({
  id:                 { type: String, required: true, unique: true, index: true },
  userId:             { type: String },
  name:               { type: String, required: true },
  specialization:     { type: String, required: true },
  registrationNumber: { type: String, required: true },
  councilName:        { type: String, required: true },
  experienceYears:    { type: Number, default: 5 },
  languages:          { type: [String], default: ['Hindi', 'English'] },
  isAvailable:        { type: Boolean, default: true },
  avatar:             { type: String },
  rating:             { type: Number, default: 4.8 }
}, { timestamps: true });

// ─── 4. Consultation ──────────────────────────────────────────────────────────
export interface IConsultationDoc extends Omit<IConsultation, 'id'>, Document { id: string; }

export const ConsultationSchema = new Schema<IConsultationDoc>({
  id:                   { type: String, required: true, unique: true, index: true },
  patientPhoneNumber:   { type: String, required: true, index: true },
  patientProfile:       { type: Schema.Types.Mixed, required: true },
  doctor:               { type: Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['QUEUED', 'IN_CALL', 'COMPLETED', 'CANCELLED', 'REFERRED_IN_PERSON'],
    default: 'QUEUED',
    index: true
  },
  triageSummary:          { type: Schema.Types.Mixed },
  queuePosition:          { type: Number, default: 1 },
  estimatedWaitMinutes:   { type: Number, default: 5 },
  scheduledAt:            { type: String, default: () => new Date().toISOString() },
  startedAt:              { type: String },
  endedAt:                { type: String },
  bandwidthMode:          { type: String, default: 'ADAPTIVE' },
  prescriptionId:         { type: String },
  referralNote:           { type: String },
  chatMessages: [{
    sender: { type: String },
    text:   { type: String },
    time:   { type: String }
  }]
}, { timestamps: true });

// ─── 5. Prescription ─────────────────────────────────────────────────────────
export interface IPrescriptionDoc extends Omit<IPrescription, 'id'>, Document { id: string; }

export const PrescriptionSchema = new Schema<IPrescriptionDoc>({
  id:                  { type: String, required: true, unique: true, index: true },
  consultationId:      { type: String, required: true, index: true },
  patientName:         { type: String, required: true },
  patientAge:          { type: Number, required: true },
  patientGender:       { type: String, required: true },
  patientPhone:        { type: String, required: true, index: true },
  doctorName:          { type: String, required: true },
  doctorRegNo:         { type: String, required: true },
  doctorCouncil:       { type: String, required: true },
  doctorSignatureDate: { type: String, required: true },
  diagnosis:           { type: String, required: true },
  symptoms:            { type: [String], default: [] },
  medicines: [{
    id:            { type: String },
    name:          { type: String, required: true },
    dosage:        { type: String, required: true },
    frequency:     { type: String, required: true },
    timing:        { type: String, required: true },
    durationDays:  { type: Number, required: true },
    instructionEn: { type: String },
    instructionHi: { type: String },
    instructionGu: { type: String }
  }],
  generalAdvice:      { type: String },
  followUpDays:       { type: Number, default: 3 },
  referralDetails:    { type: String },
  verificationQrData: { type: String, required: true },
  isOfflineAvailable: { type: Boolean, default: true },
  createdAt:          { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// ─── 6. ASHA Vitals ───────────────────────────────────────────────────────────
export interface IVitalsDoc extends Omit<IVitalsRecord, 'id'>, Document { id: string; }

export const VitalsSchema = new Schema<IVitalsDoc>({
  id:                  { type: String, required: true, unique: true, index: true },
  patientPhone:        { type: String, required: true, index: true },
  profileId:           { type: String, required: true },
  patientName:         { type: String, required: true },
  systolicBp:          { type: Number },
  diastolicBp:         { type: Number },
  spO2:                { type: Number },
  pulseRate:           { type: Number },
  temperatureF:        { type: Number },
  bloodSugarMgDl:      { type: Number },
  recordedByAshaId:    { type: String, required: true },
  recordedByAshaName:  { type: String, required: true },
  notes:               { type: String },
  timestamp:           { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// ─── 7. Follow-Up Check-In ────────────────────────────────────────────────────
export interface IFollowUpDoc extends Omit<IFollowUpCheckIn, 'id'>, Document { id: string; }

export const FollowUpSchema = new Schema<IFollowUpDoc>({
  id:                 { type: String, required: true, unique: true, index: true },
  prescriptionId:     { type: String, required: true, index: true },
  patientPhone:       { type: String, required: true, index: true },
  profileId:          { type: String, required: true },
  patientName:        { type: String, required: true },
  status:             { type: String, enum: ['IMPROVED', 'SAME', 'WORSENED'], required: true },
  feedbackNotes:      { type: String },
  escalatedToDoctor:  { type: Boolean, default: false },
  timestamp:          { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// ─── 8. Referral Note ────────────────────────────────────────────────────────
export interface IReferralDoc extends Omit<IReferralNote, 'id'>, Document { id: string; }

export const ReferralNoteSchema = new Schema<IReferralDoc>({
  id:                      { type: String, required: true, unique: true, index: true },
  consultationId:          { type: String, required: true, index: true },
  patientName:             { type: String, required: true },
  patientPhone:            { type: String, required: true },
  referringDoctor:         { type: String, required: true },
  doctorRegNo:             { type: String, required: true },
  targetFacility:          { type: String, required: true },
  priority:                { type: String, enum: ['ROUTINE', 'URGENT', 'EMERGENCY'], required: true },
  clinicalReason:          { type: String, required: true },
  investigationsRequested: { type: [String], default: [] },
  issuedAt:                { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// ─── 9. Audit Log ────────────────────────────────────────────────────────────
export interface IAuditDoc extends Omit<IAuditLog, 'id'>, Document { id: string; }

export const AuditLogSchema = new Schema<IAuditDoc>({
  id:                    { type: String, required: true, unique: true },
  timestamp:             { type: String, default: () => new Date().toISOString() },
  patientPhone:          { type: String, required: true },
  profileName:           { type: String, required: true },
  initialComplaint:      { type: String, required: true },
  aiTriageLevel:         { type: String, required: true },
  doctorFinalDisposition:{ type: String },
  isConcordant:          { type: Boolean },
  redFlagsDetected:      { type: [String], default: [] },
  reviewedByClinician:   { type: Boolean, default: false },
  clinicalNotes:         { type: String }
}, { timestamps: true });

// ─── 10. Facility ────────────────────────────────────────────────────────────
export interface IFacilityDoc extends Omit<IFacility, 'id'>, Document { id: string; }

export const FacilitySchema = new Schema<IFacilityDoc>({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  distance:      { type: String, required: true },
  type:          { type: String, required: true },
  beds:          { type: String, required: true },
  phone:         { type: String, required: true },
  ambulanceTime: { type: String, required: true }
}, { timestamps: true });

// ─── Model Exports ────────────────────────────────────────────────────────────
export const UserModel         = (mongoose.models.User         as mongoose.Model<IUserDoc>)         || mongoose.model<IUserDoc>('User', UserSchema);
export const FamilyProfileModel= (mongoose.models.FamilyProfile as mongoose.Model<IFamilyProfileDoc>) || mongoose.model<IFamilyProfileDoc>('FamilyProfile', FamilyProfileSchema);
export const DoctorModel       = (mongoose.models.Doctor       as mongoose.Model<IDoctorDoc>)       || mongoose.model<IDoctorDoc>('Doctor', DoctorSchema);
export const ConsultationModel = (mongoose.models.Consultation as mongoose.Model<IConsultationDoc>) || mongoose.model<IConsultationDoc>('Consultation', ConsultationSchema);
export const PrescriptionModel = (mongoose.models.Prescription as mongoose.Model<IPrescriptionDoc>) || mongoose.model<IPrescriptionDoc>('Prescription', PrescriptionSchema);
export const VitalsModel       = (mongoose.models.Vitals       as mongoose.Model<IVitalsDoc>)       || mongoose.model<IVitalsDoc>('Vitals', VitalsSchema);
export const FollowUpModel     = (mongoose.models.FollowUp     as mongoose.Model<IFollowUpDoc>)     || mongoose.model<IFollowUpDoc>('FollowUp', FollowUpSchema);
export const ReferralNoteModel = (mongoose.models.ReferralNote as mongoose.Model<IReferralDoc>)     || mongoose.model<IReferralDoc>('ReferralNote', ReferralNoteSchema);
export const AuditLogModel     = (mongoose.models.AuditLog     as mongoose.Model<IAuditDoc>)        || mongoose.model<IAuditDoc>('AuditLog', AuditLogSchema);
export const FacilityModel     = (mongoose.models.Facility     as mongoose.Model<IFacilityDoc>)     || mongoose.model<IFacilityDoc>('Facility', FacilitySchema);

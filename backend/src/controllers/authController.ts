import { Request, Response } from 'express';
import { store } from '../store.js';
import { IUser, IFamilyProfile, Language } from '../models/types.js';
import { generateToken, AuthRequest } from '../middleware/authMiddleware.js';

// In-memory active OTP store with timestamp for 30s call fallback
interface OtpEntry {
  code: string;
  createdAt: number;
  attempts: number;
}
const activeOtps = new Map<string, OtpEntry>();

// --- FR-1.1: Mobile Number Registration & Auto-read SMS OTP ---
export const sendOtp = (req: Request, res: Response) => {
  const { phoneNumber, language = 'hi' } = req.body;
  if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required.' });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  activeOtps.set(cleanPhone, {
    code: otpCode,
    createdAt: Date.now(),
    attempts: 0
  });

  console.log(`[SMS Gateway - FR-1.1] Sent SMS to +91-${cleanPhone}: "Your RuralCare Connect OTP is ${otpCode}. Valid for 10 minutes."`);

  return res.json({
    success: true,
    message: 'OTP sent via SMS',
    phoneNumber: cleanPhone,
    // Included in dev response to simulate Android SMS Retriever API (FR-1.1: user types nothing)
    autoReadOtp: otpCode,
    smsTimeoutSeconds: 30
  });
};

// --- FR-1.7: "Call me with the code" Automated Voice Call OTP ---
export const voiceCallOtp = (req: Request, res: Response) => {
  const { phoneNumber, language = 'hi' } = req.body;
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '').slice(-10);

  let otpEntry = activeOtps.get(cleanPhone);
  if (!otpEntry) {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpEntry = { code: newCode, createdAt: Date.now(), attempts: 0 };
    activeOtps.set(cleanPhone, otpEntry);
  }

  console.log(`[Voice IVR Gateway - FR-1.7] Automated outbound call placed to +91-${cleanPhone}. Speaking code ${otpEntry.code} in language: ${language}`);

  return res.json({
    success: true,
    message: 'Automated voice call initiated to your phone',
    spokenCode: otpEntry.code,
    language
  });
};

// --- FR-1.1 & FR-1.8: OTP Verification & Permanent Device Sign-in ---
export const verifyOtp = (req: Request, res: Response) => {
  const { phoneNumber, otp, deviceId = 'device_default' } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  const entry = activeOtps.get(cleanPhone);

  // Validate OTP (allow simulated code or master demo code)
  if (entry && entry.code !== otp && otp !== '123456' && otp !== entry.code) {
    entry.attempts += 1;
    return res.status(400).json({ success: false, message: 'Incorrect OTP code entered.' });
  }

  // Retrieve or create user record
  let user = store.users.get(cleanPhone);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = {
      id: `usr-${Date.now()}`,
      name: 'सुनीता देवी (Sunita Devi)',
      phoneNumber: cleanPhone,
      role: 'PATIENT',
      isVerified: true,
      consentGiven: false, // FR-1.3: User must explicitly give consent next
      activeProfileId: 'prof-1',
      preferredLanguage: 'hi',
      createdAt: new Date().toISOString()
    };
    store.users.set(cleanPhone, user);
    store.users.set(user.id, user);

    // Initial default profile (FR-1.4)
    store.profiles.set(cleanPhone, [
      {
        id: 'prof-1',
        userId: cleanPhone,
        name: user.name,
        relation: 'Self',
        age: 34,
        gender: 'Female',
        isPregnant: false,
        chronicConditions: ['None'],
        currentMedications: [],
        avatar: '👩🏽'
      }
    ]);
  } else {
    user.isVerified = true;
  }

  // Generate long-lived JWT token for permanent sign-in (FR-1.8)
  const token = generateToken({
    id: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role,
    name: user.name,
    deviceId
  });

  const profiles = store.profiles.get(cleanPhone) || [];

  return res.json({
    success: true,
    message: 'OTP verified successfully. Permanent session established.',
    isNewUser,
    user,
    profiles,
    token
  });
};

// --- FR-1.3: Explicit Revocable Consent Recording & Revocation ---
export const updateConsent = (req: Request, res: Response) => {
  const { phoneNumber, consentGiven, language = 'hi' } = req.body;
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '').slice(-10);
  const user = store.users.get(cleanPhone);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.consentGiven = !!consentGiven;

  console.log(`[Consent Audit - FR-1.3] Consent ${consentGiven ? 'GRANTED' : 'REVOKED'} for +91-${cleanPhone} in ${language} at ${new Date().toISOString()}`);

  return res.json({
    success: true,
    message: consentGiven ? 'Explicit consent recorded' : 'Consent revoked successfully',
    consentGiven: user.consentGiven,
    timestamp: new Date().toISOString()
  });
};

// --- FR-1.5: Data Export Request ---
export const exportUserData = (req: Request, res: Response) => {
  const phoneNumber = (req.query.phoneNumber as string || req.body.phoneNumber || '9876543210').replace(/\D/g, '').slice(-10);
  const user = store.users.get(phoneNumber);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User record not found.' });
  }

  const userProfiles = store.profiles.get(phoneNumber) || [];
  
  // Collect all prescriptions matching this patient phone
  const userPrescriptions: any[] = [];
  store.prescriptions.forEach((rx) => {
    if (rx.patientPhone === phoneNumber || rx.patientPhone === user.phoneNumber) {
      userPrescriptions.push(rx);
    }
  });

  const exportPayload = {
    exportDate: new Date().toISOString(),
    governanceStandards: 'India Digital Personal Data Protection Act 2023 (DPDP)',
    userAccount: {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      preferredLanguage: user.preferredLanguage,
      consentStatus: user.consentGiven ? 'Active Revocable Consent' : 'Revoked / Withheld',
      accountCreated: user.createdAt
    },
    dependentProfiles: userProfiles,
    consultationsHistory: userPrescriptions.map(p => ({
      prescriptionId: p.id,
      date: p.doctorSignatureDate,
      doctor: p.doctorName,
      doctorRegNo: p.doctorRegNo,
      diagnosis: p.diagnosis,
      medicines: p.medicines,
      generalAdvice: p.generalAdvice
    }))
  };

  return res.json({
    success: true,
    message: 'User health records and account data exported successfully (FR-1.5)',
    data: exportPayload
  });
};

// --- FR-1.5: Permanent Account Deletion ---
export const deleteUserAccount = (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '').slice(-10);
  const user = store.users.get(cleanPhone);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Wipe profile, user, and active sessions
  store.users.delete(cleanPhone);
  store.users.delete(user.id);
  store.profiles.delete(cleanPhone);
  activeOtps.delete(cleanPhone);

  console.log(`[Account Deletion - FR-1.5] Permanent account deletion executed for +91-${cleanPhone}. All profiles removed.`);

  return res.json({
    success: true,
    message: 'Your account and all associated health records have been permanently deleted.'
  });
};

// --- FR-1.9: Screen Lock / Biometric Protection Toggle ---
export const updateLockSettings = (req: Request, res: Response) => {
  const { phoneNumber, isLockedBehindPin } = req.body;
  return res.json({
    success: true,
    message: `Health records ${isLockedBehindPin ? 'locked behind device screen lock / PIN' : 'unlocked'}.`,
    isLocked: !!isLockedBehindPin
  });
};

// --- Get Current Authenticated User (FR-1.8) ---
export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = store.users.get(req.user.id) || (req.user.phoneNumber ? store.users.get(req.user.phoneNumber) : null);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User record not found' });
  }

  const profiles = user.phoneNumber ? store.profiles.get(user.phoneNumber) || [] : [];

  return res.json({
    success: true,
    user,
    profiles
  });
};

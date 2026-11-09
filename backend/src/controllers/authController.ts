import { Request, Response } from 'express';
import { store } from '../store.js';

export const sendOtp = (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || phoneNumber.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required.' });
  }

  // Generate 6-digit mock OTP (PRD FR-1.1)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[SMS Gateway Mock] Dispatched OTP to +91-${phoneNumber}: ${otp}`);

  return res.json({
    success: true,
    message: 'OTP dispatched successfully via SMS.',
    otp, // Returned in dev mode for auto-read SMS simulation
    autoReadDelayMs: 2200
  });
};

export const verifyOtp = (req: Request, res: Response) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required.' });
  }

  let user = store.users.get(phoneNumber);
  if (!user) {
    // New registration
    user = {
      phoneNumber,
      isVerified: true,
      consentGiven: false,
      activeProfileId: 'prof-1',
      preferredLanguage: 'hi'
    };
    store.users.set(phoneNumber, user);

    // Initial default profile
    store.profiles.set(phoneNumber, [
      {
        id: 'prof-1',
        userId: phoneNumber,
        name: 'Resident Patient',
        relation: 'Self',
        age: 30,
        gender: 'Female',
        avatar: '👩🏽'
      }
    ]);
  } else {
    user.isVerified = true;
  }

  const userProfiles = store.profiles.get(phoneNumber) || [];

  return res.json({
    success: true,
    user,
    profiles: userProfiles,
    token: `rc_token_${phoneNumber}_${Date.now()}`
  });
};

export const recordConsent = (req: Request, res: Response) => {
  const { phoneNumber, consentGiven } = req.body;
  const user = store.users.get(phoneNumber);

  if (user) {
    user.consentGiven = !!consentGiven;
  }

  return res.json({ success: true, message: 'Telemedicine and DPDP consent updated.' });
};

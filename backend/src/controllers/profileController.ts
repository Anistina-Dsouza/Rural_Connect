import { Request, Response } from 'express';
import { store } from '../store.js';
import { IFamilyProfile } from '../models/types.js';

export const getProfiles = (req: Request, res: Response) => {
  const phoneNumber = (req.query.phoneNumber as string) || '9876543210';
  const profiles = store.profiles.get(phoneNumber) || [];
  const user = store.users.get(phoneNumber);

  return res.json({
    success: true,
    profiles,
    activeProfileId: user?.activeProfileId || profiles[0]?.id
  });
};

export const addProfile = (req: Request, res: Response) => {
  const { phoneNumber, name, relation, age, gender, isPregnant, chronicConditions } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  const phone = phoneNumber || '9876543210';
  const existingProfiles = store.profiles.get(phone) || [];

  const avatar = relation === 'Child' ? '👶🏽' : relation === 'Parent' ? '👴🏽' : gender === 'Female' ? '👩🏽' : '👨🏽';

  const newProfile: IFamilyProfile = {
    id: `prof-${Date.now()}`,
    userId: phone,
    name: name.trim(),
    relation: relation || 'Other',
    age: Number(age) || 20,
    gender: gender || 'Female',
    isPregnant: gender === 'Female' ? !!isPregnant : false,
    chronicConditions: chronicConditions || [],
    avatar
  };

  existingProfiles.push(newProfile);
  store.profiles.set(phone, existingProfiles);

  const user = store.users.get(phone);
  if (user) {
    user.activeProfileId = newProfile.id;
  }

  return res.json({
    success: true,
    message: 'Family profile added successfully',
    profile: newProfile,
    profiles: existingProfiles
  });
};

export const switchActiveProfile = (req: Request, res: Response) => {
  const { phoneNumber, profileId } = req.body;
  const phone = phoneNumber || '9876543210';
  const user = store.users.get(phone);

  if (user) {
    user.activeProfileId = profileId;
  }

  return res.json({
    success: true,
    activeProfileId: profileId
  });
};

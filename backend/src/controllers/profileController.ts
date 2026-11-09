import { Request, Response } from 'express';
import { store } from '../store.js';
import { IFamilyProfile } from '../models/types.js';

// --- FR-1.4: Retrieve all dependent profiles for an account ---
export const getProfiles = (req: Request, res: Response) => {
  const phoneNumber = ((req.query.phoneNumber as string) || '9876543210').replace(/\D/g, '').slice(-10);
  const profiles = store.profiles.get(phoneNumber) || [];
  const user = store.users.get(phoneNumber);

  return res.json({
    success: true,
    profiles,
    activeProfileId: user?.activeProfileId || profiles[0]?.id
  });
};

// --- FR-1.4: Add dependent profile (Child, Elder, Pregnant, etc.) ---
export const addProfile = (req: Request, res: Response) => {
  const { 
    phoneNumber = '9876543210', 
    name, 
    relation = 'Child', 
    age, 
    gender = 'Female', 
    isPregnant = false, 
    chronicConditions = [], 
    currentMedications = [],
    avatar 
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Profile name is required' });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  const existingProfiles = store.profiles.get(cleanPhone) || [];

  const defaultAvatar = relation === 'Child' ? '👶🏽' : relation === 'Parent' ? '👴🏽' : gender === 'Female' ? '👩🏽' : '👨🏽';

  const newProfile: IFamilyProfile = {
    id: `prof-${Date.now()}`,
    userId: cleanPhone,
    name: name.trim(),
    relation,
    age: Number(age) || 1,
    gender,
    isPregnant: gender === 'Female' ? !!isPregnant : false,
    chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
    currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
    avatar: avatar || defaultAvatar
  };

  existingProfiles.push(newProfile);
  store.profiles.set(cleanPhone, existingProfiles);

  const user = store.users.get(cleanPhone);
  if (user) {
    user.activeProfileId = newProfile.id;
  }

  return res.json({
    success: true,
    message: 'Dependent profile added successfully (FR-1.4)',
    profile: newProfile,
    profiles: existingProfiles
  });
};

// --- Update a dependent profile ---
export const updateProfile = (req: Request, res: Response) => {
  const { id } = req.params;
  const { phoneNumber = '9876543210', name, relation, age, gender, isPregnant, chronicConditions, currentMedications } = req.body;
  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  const profiles = store.profiles.get(cleanPhone) || [];

  const target = profiles.find((p) => p.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Profile not found' });
  }

  if (name) target.name = name.trim();
  if (relation) target.relation = relation;
  if (age !== undefined) target.age = Number(age);
  if (gender) target.gender = gender;
  if (isPregnant !== undefined) target.isPregnant = !!isPregnant;
  if (chronicConditions) target.chronicConditions = chronicConditions;
  if (currentMedications) target.currentMedications = currentMedications;

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    profile: target,
    profiles
  });
};

// --- Delete a dependent profile ---
export const deleteProfile = (req: Request, res: Response) => {
  const { id } = req.params;
  const phoneNumber = ((req.query.phoneNumber as string) || req.body.phoneNumber || '9876543210').replace(/\D/g, '').slice(-10);
  const profiles = store.profiles.get(phoneNumber) || [];

  const filtered = profiles.filter((p) => p.id !== id);
  if (filtered.length === profiles.length) {
    return res.status(404).json({ success: false, message: 'Profile not found' });
  }

  store.profiles.set(phoneNumber, filtered);

  const user = store.users.get(phoneNumber);
  if (user && user.activeProfileId === id) {
    user.activeProfileId = filtered[0]?.id || '';
  }

  return res.json({
    success: true,
    message: 'Profile removed',
    profiles: filtered
  });
};

// --- FR-1.9: Switch active profile on shared phone ---
export const switchActiveProfile = (req: Request, res: Response) => {
  const { phoneNumber = '9876543210', profileId } = req.body;
  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  const user = store.users.get(cleanPhone);

  if (user) {
    user.activeProfileId = profileId;
  }

  return res.json({
    success: true,
    activeProfileId: profileId
  });
};

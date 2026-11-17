import { Request, Response } from 'express';
import { store } from '../store.js';

// Clinician-Approved First-Aid Emergency Stabilization Protocols (PRD FR-3.3)
export const EMERGENCY_FIRST_AID_GUIDELINES = {
  CARDIAC: {
    condition: 'Cardiac / Severe Chest Pain',
    steps: [
      'Keep patient resting comfortably in a seated or semi-reclining position.',
      'Loosen all tight clothing around neck, chest, and waist.',
      'Calm and reassure the patient; ensure good airflow (open windows).',
      'Do not allow patient to walk, climb stairs, or exert themselves while waiting for the 108 ambulance.'
    ]
  },
  SEVERE_BLEEDING: {
    condition: 'Major Bleeding & Hemorrhage Shock',
    steps: [
      'Apply firm, continuous direct pressure over the bleeding wound using a clean cloth or sterile gauze.',
      'Do not remove soaked cloth; place additional clean layers directly on top.',
      'If bleeding is on a limb, keep the limb elevated above heart level if no fracture is suspected.',
      'Keep the patient lying down warmly to counter hypovolemic shock.'
    ]
  },
  STROKE_NEURO: {
    condition: 'Acute Stroke (FAST) or Post-Seizure',
    steps: [
      'Turn patient onto their side into the recovery position to prevent tongue obstruction or aspiration.',
      'Do NOT give water, food, or oral medicines to avoid choking due to impaired swallowing reflexes.',
      'Clear the immediate surroundings of sharp objects if seizure is occurring; never force anything between their teeth.',
      'Note the exact time symptoms started to inform the ambulance crew and hospital stroke unit.'
    ]
  },
  PREGNANCY_DISTRESS: {
    condition: 'Obstetric Emergency / Maternal Distress',
    steps: [
      'Position patient strictly on her left side (left lateral position) to relieve pressure on the inferior vena cava.',
      'Elevate legs slightly with a pillow if feeling dizzy.',
      'Do not perform any vaginal examination or insert anything.',
      'Keep 108 / 102 Janani Shishu ambulance dispatched with urgent maternal priority.'
    ]
  },
  ENV_POISONING: {
    condition: 'Snakebite or Toxic Exposure',
    steps: [
      'Keep patient calm and completely still. Movement speeds venom circulation.',
      'Immobilize the bitten limb below heart level using a splint or firm stick.',
      'Do NOT cut, suck, or apply tight tourniquets or ice.',
      'Note snake markings if safely observed, and rush immediately to the nearest PHC stocking Anti-Snake Venom (ASV).'
    ]
  },
  INFANT_FEVER: {
    condition: 'High Fever in Infant / Neonate',
    steps: [
      'Remove excess heavy blankets and woolens; dress infant in light, breathable cotton.',
      'Gently wipe forehead, neck, and torso with a cotton cloth soaked in normal tap water (cool sponging).',
      'Never use ice, ice water, or alcohol rubs.',
      'Continue frequent small sips of breast milk or clean fluids to prevent rapid dehydration.'
    ]
  }
};

export const getNearbyFacilities = (req: Request, res: Response) => {
  return res.json({
    success: true,
    facilities: store.facilities,
    emergencyHotlines: {
      ambulance108: '108',
      policeEmergency112: '112',
      pregnantWomanChild102: '102',
      teleManasPsychiatry14416: '14416'
    },
    firstAidGuidelines: EMERGENCY_FIRST_AID_GUIDELINES
  });
};



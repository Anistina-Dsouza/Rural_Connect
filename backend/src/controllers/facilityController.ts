import { Request, Response } from 'express';
import { store } from '../store.js';

export const getNearbyFacilities = (req: Request, res: Response) => {
  return res.json({
    success: true,
    facilities: store.facilities,
    emergencyHotlines: {
      ambulance108: '108',
      policeEmergency112: '112',
      pregnantWomanChild102: '102',
      teleManasPsychiatry14416: '14416'
    }
  });
};


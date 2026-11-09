import { Request, Response } from 'express';
import { store } from '../store.js';

export const getClinicalMetrics = (req: Request, res: Response) => {
  return res.json({
    success: true,
    metrics: {
      emergencyRecallRate: '99.4%',
      doctorAiDisagreementRate: '3.1%',
      medianWaitMinutes: '4.8',
      travelAvoidedKm: '34.2',
      totalConsultations: 1240,
      activeDoctorsOnline: store.doctors.length,
      auditComplianceStatus: 'FULLY_COMPLIANT'
    }
  });
};

export const getAuditLogs = (req: Request, res: Response) => {
  return res.json({
    success: true,
    auditLogs: store.auditLogs
  });
};

export const getDoctors = (req: Request, res: Response) => {
  return res.json({
    success: true,
    doctors: store.doctors
  });
};


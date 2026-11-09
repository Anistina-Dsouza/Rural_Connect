import React, { useState, useEffect } from 'react';
import { Prescription, Language } from '../types';
import { translations } from '../data/translations';
import { generatePrescriptionPdf } from '../utils/pdfGenerator';
import QRCode from 'qrcode';
import { 
  FileDown, 
  Share2, 
  QrCode, 
  CheckCircle2, 
  WifiOff, 
  ShieldCheck, 
  Building, 
  Clock, 
  Printer,
  ExternalLink
} from 'lucide-react';

interface PrescriptionViewerProps {
  currentLanguage: Language;
  prescription: Prescription;
  onVerifyPrescription: (id: string) => void;
}

export const PrescriptionViewer: React.FC<PrescriptionViewerProps> = ({
  currentLanguage,
  prescription,
  onVerifyPrescription
}) => {
  const t = translations[currentLanguage];
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    // Generate QR code for pharmacist verification
    QRCode.toDataURL(
      JSON.stringify({
        id: prescription.id,
        doctor: prescription.doctorName,
        reg: prescription.doctorRegNo,
        patient: prescription.patientName,
        date: prescription.doctorSignatureDate
      }),
      { width: 140, margin: 1 }
    ).then((url) => setQrCodeDataUrl(url));
  }, [prescription]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePrescriptionPdf(prescription);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsapp = () => {
    const text = `*RuralCare Connect e-Prescription*\nPatient: ${prescription.patientName}\nDoctor: Dr. ${prescription.doctorName} (Reg: ${prescription.doctorRegNo})\nRx ID: ${prescription.id}\nVerification Link: https://ruralcare.gov.in/verify/${prescription.id}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Offline Storage & Verification Header Badge (PRD FR-5.5) */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-900">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Official Telemedicine e-Prescription Issued</h4>
            <p className="text-slate-600 mt-0.5">{t.offlineAvailable}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : t.downloadPdf}</span>
          </button>

          <button
            onClick={handleShareWhatsapp}
            className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareWhatsapp}</span>
          </button>
        </div>
      </div>

      {showShareToast && (
        <div className="p-3 bg-slate-900 text-white text-xs rounded-xl text-center shadow-lg animate-bounce">
          Prescription link copied for WhatsApp sharing!
        </div>
      )}

      {/* Main Prescription Paper Preview */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
        {/* Paper Header */}
        <div className="border-b-2 border-emerald-600 pb-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🩺</span>
              <h2 className="text-xl font-black text-slate-900">{t.appTitle} Telemedicine Network</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized Digital e-Prescription • Under India Telemedicine Guidelines 2020
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
              Rx ID: {prescription.id}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Date: {prescription.doctorSignatureDate}</p>
          </div>
        </div>

        {/* Doctor and Patient Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Authorized Practitioner:
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Dr. {prescription.doctorName}</h4>
            <p className="text-slate-600">NMC Reg: <span className="font-mono font-semibold">{prescription.doctorRegNo}</span></p>
            <p className="text-slate-500">{prescription.doctorCouncil}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Patient Details:
            </span>
            <h4 className="font-bold text-slate-900 text-sm">{prescription.patientName}</h4>
            <p className="text-slate-600">Age / Gender: {prescription.patientAge} Yrs / {prescription.patientGender}</p>
            <p className="text-slate-500">Phone: {prescription.patientPhone}</p>
          </div>
        </div>

        {/* Clinical Diagnosis */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 mb-6 text-xs">
          <span className="font-bold text-emerald-800 uppercase text-[10px] block mb-0.5">
            Clinical Diagnosis & Findings:
          </span>
          <p className="font-bold text-slate-900 text-sm">{prescription.diagnosis}</p>
          <p className="text-slate-600 text-[11px] mt-0.5">Symptoms: {prescription.symptoms.join(', ')}</p>
        </div>

        {/* Medication Schedule Table with Bilingual Instructions (PRD FR-5.4) */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
            {t.scheduleHeading}
          </h3>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Medicine & Strength</th>
                  <th className="p-3">Frequency & Timing</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Regional Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescription.medicines.map((med, idx) => (
                  <tr key={med.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-[11px] text-slate-500">{med.dosage}</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      <div className="font-semibold">{med.frequency}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">{med.timing}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{med.durationDays} Days</td>
                    <td className="p-3 text-[11px] text-slate-700">
                      <div>{med.instructionEn}</div>
                      {currentLanguage === 'hi' && (
                        <div className="text-emerald-800 font-medium mt-0.5">{med.instructionHi}</div>
                      )}
                      {currentLanguage === 'gu' && (
                        <div className="text-emerald-800 font-medium mt-0.5">{med.instructionGu}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advice & Follow up */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 mb-6 text-xs text-amber-950">
          <span className="font-bold uppercase text-[10px] text-amber-800 block mb-0.5">
            General Lifestyle & Precautionary Advice:
          </span>
          <p className="leading-relaxed">{prescription.generalAdvice}</p>
          {prescription.followUpDays && (
            <p className="mt-2 font-bold text-amber-900">
              Follow-up recommendation: Consult again after {prescription.followUpDays} days if not completely relieved.
            </p>
          )}
        </div>

        {/* Prescription Footer: QR Code & Signature Verification Block */}
        <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Pharmacist QR Code (PRD FR-5.6) */}
          <div className="flex items-center gap-3">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Prescription Verification QR" className="w-24 h-24 border border-slate-200 rounded-xl p-1" />
            ) : (
              <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-400" />
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Pharmacist Verification QR:
              </span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">Scan to verify dispensing authenticity</p>
              <button
                onClick={() => onVerifyPrescription(prescription.id)}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 mt-1"
              >
                <span>Open Verification Check</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Digital Signature Box */}
          <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-emerald-700 block uppercase">
              Digitally Signed by
            </span>
            <div className="font-serif italic text-base font-bold text-slate-900 my-0.5">
              Dr. {prescription.doctorName}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Reg: {prescription.doctorRegNo}</p>
            <p className="text-[10px] text-slate-400">Timestamp: {prescription.createdAt.slice(0, 10)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


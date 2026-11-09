import React, { useState } from 'react';
import { 
  Doctor, 
  FamilyProfile, 
  ClinicalTriageResult, 
  Prescription, 
  PrescriptionMedicine, 
  Language 
} from '../types';
import { translations } from '../data/translations';
import { 
  BANNED_TELEMEDICINE_DRUGS, 
  PERMITTED_TELEMEDICINE_FORMULARY 
} from '../data/clinicalLibrary';
import { 
  Stethoscope, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  FileCheck, 
  Sparkles, 
  CheckCircle,
  Building,
  UserCheck
} from 'lucide-react';

interface DoctorConsoleProps {
  currentLanguage: Language;
  doctor: Doctor;
  activePatient: FamilyProfile;
  triageSummary: ClinicalTriageResult | null;
  onIssuePrescription: (prescription: Prescription) => void;
  onIssueReferral: (referralNote: string) => void;
}

export const DoctorConsole: React.FC<DoctorConsoleProps> = ({
  currentLanguage,
  doctor,
  activePatient,
  triageSummary,
  onIssuePrescription,
  onIssueReferral
}) => {
  const t = translations[currentLanguage];

  const [diagnosis, setDiagnosis] = useState('Acute Upper Respiratory Tract Infection (Mild Viral URI)');
  const [symptomsInput, setSymptomsInput] = useState('Mild fever, dry cough, throat irritation for 2 days');
  const [generalAdvice, setGeneralAdvice] = useState('Drink plenty of warm fluids, steam inhalation twice a day, avoid cold food. Observe for breathing difficulty.');
  const [followUpDays, setFollowUpDays] = useState(3);
  const [referralText, setReferralText] = useState('');
  const [isReferralMode, setIsReferralMode] = useState(false);

  // Prescription medicines state
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      id: 'med-1',
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: '1-0-1 (Morning & Night)',
      timing: 'After Food',
      durationDays: 3,
      instructionEn: 'Take 1 tablet after food only if fever or body pain occurs.',
      instructionHi: 'बुखार या दर्द होने पर ही भोजन के बाद 1 गोली लें।',
      instructionGu: 'તાવ અથવા દુખાવો થાય ત્યારે જ જમ્યા પછી 1 ગોળી લેવી.'
    },
    {
      id: 'med-2',
      name: 'Cetirizine',
      dosage: '10mg',
      frequency: '0-0-1 (At Bedtime)',
      timing: 'After Food',
      durationDays: 3,
      instructionEn: 'Take 1 tablet at bedtime for runny nose and throat irritation.',
      instructionHi: 'गले की खराश और बहती नाक के लिए रात को सोते समय 1 गोली लें।',
      instructionGu: 'ગળાની ખારાશ માટે રાત્રે સૂતી વખતે 1 ગોળી લેવી.'
    }
  ]);

  // New drug input state
  const [newDrugName, setNewDrugName] = useState('');
  const [newDosage, setNewDosage] = useState('500mg');
  const [newFreq, setNewFreq] = useState('1-0-1');
  const [newTiming, setNewTiming] = useState<'Before Food' | 'After Food' | 'With Food' | 'Anytime'>('After Food');
  const [newDays, setNewDays] = useState(3);
  const [bannedDrugAlert, setBannedDrugAlert] = useState<string | null>(null);

  // Check banned drug list per PRD FR-5.7
  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName.trim()) return;

    const lowerName = newDrugName.trim().toLowerCase();
    const isBanned = BANNED_TELEMEDICINE_DRUGS.some((banned) => lowerName.includes(banned));

    if (isBanned) {
      setBannedDrugAlert(`SAFETY VIOLATION (FR-5.7): "${newDrugName}" is a Schedule X / restricted substance and is legally prohibited from teleconsultation prescription under NMC Guidelines.`);
      return;
    }

    setBannedDrugAlert(null);

    const newMed: PrescriptionMedicine = {
      id: `med-${Date.now()}`,
      name: newDrugName.trim(),
      dosage: newDosage,
      frequency: newFreq,
      timing: newTiming,
      durationDays: newDays,
      instructionEn: `Take ${newDosage} ${newFreq} [${newTiming}] for ${newDays} days.`,
      instructionHi: `${newDays} दिनों तक [${newTiming}] ${newFreq} लें।`,
      instructionGu: `${newDays} દિવસ સુધી નિયમિત [${newTiming}] લેવી.`
    };

    setMedicines([...medicines, newMed]);
    setNewDrugName('');
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const handleSelectQuickFormulary = (item: typeof PERMITTED_TELEMEDICINE_FORMULARY[0]) => {
    const newMed: PrescriptionMedicine = {
      id: `med-${Date.now()}`,
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      timing: item.timing,
      durationDays: item.durationDays,
      instructionEn: item.instructionsEn,
      instructionHi: item.instructionsHi,
      instructionGu: item.instructionsGu
    };
    setMedicines([...medicines, newMed]);
  };

  const handleFinalSignAndIssue = () => {
    if (isReferralMode) {
      onIssueReferral(referralText || 'Referred to Community Health Centre for physical examination.');
      return;
    }

    const prescriptionId = `RC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const finalPrescription: Prescription = {
      id: prescriptionId,
      consultationId: `CONS-${Date.now()}`,
      patientName: activePatient.name,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      patientPhone: '9876543210',
      doctorName: doctor.name,
      doctorRegNo: doctor.registrationNumber,
      doctorCouncil: doctor.councilName,
      doctorSignatureDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      diagnosis,
      symptoms: symptomsInput.split(',').map((s) => s.trim()),
      medicines,
      generalAdvice,
      followUpDays,
      verificationQrData: `https://ruralcare.gov.in/verify/${prescriptionId}`,
      isOfflineAvailable: true,
      createdAt: new Date().toISOString()
    };

    onIssuePrescription(finalPrescription);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Doctor Verification Header (PRD FR-7.1) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-400"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Dr. {doctor.name}</h2>
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-400/40 font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                NMC Verified Practitioner
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Registration No: <span className="font-mono font-bold text-white">{doctor.registrationNumber}</span> • {doctor.councilName}
            </p>
            <p className="text-xs text-slate-400">
              Specialization: {doctor.specialization} ({doctor.experienceYears} Years Exp)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            Live Queue: 1 Patient Waiting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Case Summary & Patient Profile (PRD FR-4.4) */}
        <div className="space-y-4">
          {/* Patient Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Patient Profile
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl p-1 bg-slate-100 rounded-xl">{activePatient.avatar}</span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{activePatient.name}</h4>
                <p className="text-xs text-slate-600">
                  {activePatient.age} Yrs • {activePatient.gender} • {activePatient.relation}
                </p>
                {activePatient.isPregnant && (
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded mt-1 inline-block">
                    Pregnant (Priority)
                  </span>
                )}
              </div>
            </div>

            {activePatient.chronicConditions && activePatient.chronicConditions.length > 0 && activePatient.chronicConditions[0] !== 'None' && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Chronic History:</span>
                <div className="flex flex-wrap gap-1">
                  {activePatient.chronicConditions.map((cond, i) => (
                    <span key={i} className="text-[10px] bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded border border-amber-200">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Intake Summary (PRD FR-2.7, FR-4.4) */}
          {triageSummary && (
            <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                AI Triage Handover Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Reported Problem:</span>
                  <p className="font-semibold text-slate-900">{triageSummary.doctorCaseSummary.chiefComplaint}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Duration & Onset:</span>
                  <p className="text-slate-800">{triageSummary.doctorCaseSummary.timeline}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Triage Acuity Level:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    triageSummary.triageLevel === 'EMERGENCY' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {triageSummary.triageLevel}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Red-Flag Scan:</span>
                  <p className="text-slate-700 font-mono text-[11px]">{triageSummary.doctorCaseSummary.redFlagCheck}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Telemedicine Formulary (One-click add) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Approved Formulary (One-Click Add)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {PERMITTED_TELEMEDICINE_FORMULARY.slice(0, 5).map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQuickFormulary(f)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                >
                  + {f.name} ({f.dosage})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Prescription Builder (PRD FR-5.1) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">{t.createPrescription}</h3>
              </div>

              {/* In-Person Referral Mode Toggle (PRD FR-4.5) */}
              <button
                type="button"
                onClick={() => setIsReferralMode(!isReferralMode)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                  isReferralMode
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {isReferralMode ? 'Switch to Standard Rx' : '+ Issue In-Person Referral Note'}
              </button>
            </div>

            {/* Banned Drug Safety Alert Banner (PRD FR-5.7) */}
            {bannedDrugAlert && (
              <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3.5 mb-4 text-xs text-red-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800">TELEMEDICINE DRUG SAFETY GUARDRAIL</h4>
                  <p className="mt-0.5 font-medium">{bannedDrugAlert}</p>
                </div>
              </div>
            )}

            {!isReferralMode ? (
              <div className="space-y-4">
                {/* Clinical Diagnosis */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical Diagnosis & Impression
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Prescribed Medicines Table */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Prescribed Medicines (Telemedicine Permitted)
                  </label>

                  <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 text-[11px] font-bold">
                        <tr>
                          <th className="p-2.5">Medicine</th>
                          <th className="p-2.5">Dose</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Timing</th>
                          <th className="p-2.5">Days</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {medicines.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                            <td className="p-2.5 text-slate-700">{m.dosage}</td>
                            <td className="p-2.5 text-slate-700">{m.frequency}</td>
                            <td className="p-2.5 text-slate-700">{m.timing}</td>
                            <td className="p-2.5 text-slate-700">{m.durationDays}d</td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicine(m.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add New Medicine Row */}
                  <form onSubmit={handleAddMedicine} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      value={newDrugName}
                      onChange={(e) => setNewDrugName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg flex-1 min-w-[140px]"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (500mg)"
                      value={newDosage}
                      onChange={(e) => setNewDosage(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg w-24"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (1-0-1)"
                      value={newFreq}
                      onChange={(e) => setNewFreq(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg w-24"
                    />
                    <select
                      value={newTiming}
                      onChange={(e) => setNewTiming(e.target.value as any)}
                      className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    >
                      <option value="After Food">After Food</option>
                      <option value="Before Food">Before Food</option>
                      <option value="With Food">With Food</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newDays}
                      onChange={(e) => setNewDays(Number(e.target.value))}
                      className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg w-16"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Drug</span>
                    </button>
                  </form>
                </div>

                {/* Advice & Lifestyle Guidance */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    General Care, Hydration & Dietary Advice
                  </label>
                  <textarea
                    rows={2}
                    value={generalAdvice}
                    onChange={(e) => setGeneralAdvice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Follow up */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Follow-up Days:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-center"
                  />
                  <span className="text-xs text-slate-500">days if symptoms do not resolve</span>
                </div>
              </div>
            ) : (
              // In-Person Referral Form (PRD FR-4.5)
              <div className="space-y-3 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>Clinical In-Person Referral Note (PRD FR-4.5)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Issue formal referral to nearest CHC/District Hospital if case requires physical palpation, emergency auscultation, or diagnostic lab tests.
                </p>
                <textarea
                  rows={4}
                  value={referralText}
                  onChange={(e) => setReferralText(e.target.value)}
                  placeholder="e.g. Patient referred to Community Health Centre for physical abdomen examination and CBC / Dengue NS1 antigen screening..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            )}

            {/* Final Sign & Issue Button */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Signing will append NMC Reg No <span className="font-mono font-bold text-slate-800">{doctor.registrationNumber}</span> and cryptographic QR code.
              </div>
              <button
                type="button"
                onClick={handleFinalSignAndIssue}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isReferralMode ? 'Issue Clinical Referral Note' : t.signAndIssue}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

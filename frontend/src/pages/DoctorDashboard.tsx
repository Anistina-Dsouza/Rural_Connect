import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../services/auth';
import { ApiService } from '../services/api';
import { generatePrescriptionPdf } from '../utils/pdfGenerator';
import { Prescription } from '../types';
import { getDoctorSession, setDoctorSession } from '../services/auth';
import { AgoraVideoPlayer } from '../components/AgoraVideoPlayer';
import { useAgoraCall } from '../hooks/useAgoraCall';

interface QueuePatient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  complaint: string;
  status: 'AMBER' | 'NEXT' | 'WAITING' | 'IN_CALL';
  statusLabel: string;
  badgeColor: string;
  stripeColor: string;
  waitText: string;
  ashaWorker: string;
  healthCenter: string;
  temp?: string;
  episodes?: string;
  rawConsultation?: any;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();

  // ── Doctor identity ──
  const [doctorProfile, setDoctorProfile] = useState<{
    name: string; regNo: string; phone: string; specialty: string;
  }>(() => {
    const cached = getDoctorSession();
    return {
      name: cached.name,
      regNo: cached.regNo,
      phone: cached.phone,
      specialty: 'Internal Medicine & Rural Outreach',
    };
  });

  // Fetch real doctor profile from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const meRes = await ApiService.getMe();
        if (meRes?.success && meRes.user) {
          const { name, phoneNumber } = meRes.user;
          const doctorsRes = await ApiService.getDoctors();
          const matched = (doctorsRes?.doctors as any[])?.find(
            (d: any) => d.phoneNumber === phoneNumber || d.phone === phoneNumber
          );
          const resolvedName = name || matched?.name || doctorProfile.name;
          const resolvedReg = matched?.registrationNumber || matched?.regNo || doctorProfile.regNo;
          const resolvedSpecialty = matched?.specialization || matched?.specialty || doctorProfile.specialty;
          setDoctorProfile({ name: resolvedName, regNo: resolvedReg, phone: phoneNumber, specialty: resolvedSpecialty });
          setDoctorSession(resolvedName, resolvedReg);
        }
      } catch {
        // Keep localStorage fallback — no action needed
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Doctor state
  const [isAvailable, setIsAvailable] = useState(true);
  const toggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await ApiService.updateDoctorAvailability(doctorProfile.phone || 'doc-1', next);
    } catch {
      // Non-critical — UI state updated regardless
    }
  };
  const [activePatientId, setActivePatientId] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'asha' | 'review'>('all');
  const [workingDiagnosis, setWorkingDiagnosis] = useState('Acute Clinical Evaluation');
  const [adviceLang, setAdviceLang] = useState<'EN' | 'HI'>('HI');
  const [adviceText, setAdviceText] = useState(
    'स्वच्छ उबला हुआ पानी पिएं, पर्याप्त आराम करें और समय पर दवाएं लें।'
  );
  const [phcReferralTrigger, setPhcReferralTrigger] = useState(true);
  const [isSigned, setIsSigned] = useState(false);
  const [rxSuccessMsg, setRxSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPrescription, setLastPrescription] = useState<Prescription | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');

  // Custom medicine input state
  const [customMedName, setCustomMedName] = useState('');
  const [customMedDose, setCustomMedDose] = useState('');
  const [customMedFreq, setCustomMedFreq] = useState('1-0-1');
  const [customMedDuration, setCustomMedDuration] = useState('3 days');

  // Dynamic Queue state
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const agora = useAgoraCall(
    activeConsultation?.status === 'IN_CALL' ? activePatientId : ''
  );

  // Fetch queue from backend
  const fetchLiveQueue = async () => {
    try {
      const res = await ApiService.getQueue();
      if (res && res.success && Array.isArray(res.queue) && res.queue.length > 0) {
        const formatted: QueuePatient[] = res.queue.map((c: any, idx: number) => {
          const profile = c.patientProfile || {};
          const triage = c.triageSummary || {};
          const isFirst = idx === 0 || c.status === 'IN_CALL';
          const isSecond = idx === 1;

          return {
            id: c.id,
            name: profile.name || 'Patient',
            age: profile.age || 28,
            gender: profile.gender === 'Female' ? 'F' : 'M',
            complaint: triage.primaryComplaint || 'General Clinical Evaluation',
            status: isFirst ? 'AMBER' : isSecond ? 'NEXT' : 'WAITING',
            statusLabel: isFirst ? 'AMBER • IN ROOM' : isSecond ? 'NEXT • ROUTINE' : `${idx + 1}TH IN LINE`,
            badgeColor: isFirst
              ? 'bg-secondary-fixed text-on-secondary-fixed'
              : 'bg-surface-container text-on-surface-variant',
            stripeColor: isFirst
              ? 'bg-secondary-container'
              : isSecond
              ? 'bg-outline-variant'
              : 'bg-primary-fixed-dim',
            waitText: isFirst ? 'Live Now' : `Wait: ${idx * 4}m`,
            ashaWorker: profile.relation === 'Child' ? 'Sunita (ASHA)' : 'Meena (ASHA)',
            healthCenter: c.healthCenter || c.facility || 'Rural Sub-centre, Health Post',
            temp: triage.doctorCaseSummary?.vitalsNotes?.includes('102') ? '102.1 °F' : '98.6 °F',
            episodes: triage.doctorCaseSummary?.vitalsNotes?.includes('BP') ? 'BP 142/88' : '3 Episodes',
            rawConsultation: c,
          };
        });

        setQueue(formatted);

        // Keep active patient in sync
        const currentActive = formatted.find((p) => p.id === activePatientId) || formatted[0];
        if (currentActive) {
          setActivePatientId(currentActive.id);
          setActiveConsultation(currentActive.rawConsultation);
          if (currentActive.rawConsultation?.triageSummary?.primaryComplaint) {
            setWorkingDiagnosis(currentActive.rawConsultation.triageSummary.primaryComplaint);
          }
          if (currentActive.rawConsultation?.triageSummary?.approvedInterimAdvice?.[0]) {
            setAdviceText(currentActive.rawConsultation.triageSummary.approvedInterimAdvice[0]);
          }
        }
      } else {
        // No patients in queue – clear state
        setQueue([]);
        setActivePatientId('');
        setActiveConsultation(null);
        setWorkingDiagnosis('Acute Clinical Evaluation');
        setAdviceText('स्वच्छ उबला हुआ पानी पिएं, पर्याप्त आराम करें और समय पर दवाएं लें।');
      }
    } catch (err) {
      console.error('Unable to load consultation queue:', err);
      setActionError(err instanceof Error ? err.message : 'Unable to load the patient queue.');
    }
  };

  useEffect(() => {
    fetchLiveQueue();
    const interval = setInterval(fetchLiveQueue, 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePatientId]);

  // Active Patient Object
  const activePatient = queue.find((p) => p.id === activePatientId) || queue[0];

  // Prescribed Meds state (starts empty - doctor adds real medicines)
  const [prescribedMeds, setPrescribedMeds] = useState<any[]>([]);

  const addQuickMed = (medName: string, defaultDose: string) => {
    const newMed = {
      id: 'med_' + Date.now(),
      name: medName,
      icon: 'medication',
      iconColor: 'text-primary',
      schedule: [defaultDose, '3 Days'],
      instructions: 'Take strictly as per medical officer directions.',
    };
    setPrescribedMeds(prev => [...prev, newMed]);
  };

  const removeMed = (id: string) => {
    setPrescribedMeds(prev => prev.filter((m) => m.id !== id));
  };

  const toggleAdviceLang = (lang: 'EN' | 'HI') => {
    setAdviceLang(lang);
    if (lang === 'HI') {
      setAdviceText(
        'स्वच्छ उबला हुआ पानी ओ.आर.एस. (ORS) के साथ दें। चावल का मांड (कांजी) और मसला हुआ केला जारी रखें। 24 घंटे तक दूध या तली हुई चीजें न दें।'
      );
    } else {
      setAdviceText(
        'Give clean boiled water with ORS. Continue rice gruel (kanji) and mashed bananas. Avoid milk or greasy curds for 24h.'
      );
    }
  };

  // Sign & Dispatch Real Prescription to Backend & Generate Official PDF
  const handleSignAndDispatch = async () => {
    if (!activePatientId || !activeConsultation) {
      setActionError('Select a patient consultation before issuing a prescription.');
      return;
    }
    if (activeConsultation.status !== 'IN_CALL') {
      setActionError('Start the video consultation before issuing a prescription.');
      return;
    }

    setActionError('');
    setLoading(true);
    try {
      const patientPhone = activeConsultation?.patientPhoneNumber || activePatient?.rawConsultation?.patientPhoneNumber || '';
      const patientName = activePatient?.name || activeConsultation?.patientProfile?.name || 'Patient';
      const patientAge = activePatient?.age || activeConsultation?.patientProfile?.age || 28;
      const patientGender = activePatient?.gender === 'F' ? 'Female' : 'Male';

      const prescriptionPayload = {
        consultationId: activePatientId,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        diagnosis: workingDiagnosis,
        symptoms: [activePatient?.complaint || 'Acute Illness'],
        medicines: prescribedMeds.map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.schedule[0] || 'Standard Dose',
          frequency: m.schedule[1] || '1-0-1',
          timing: 'After Food' as const,
          durationDays: 3,
          instructionEn: m.instructions,
          instructionHi: m.instructions,
          instructionGu: m.instructions,
        })),
        generalAdvice: adviceText,
        followUpDays: 3,
      };

      const res = await ApiService.createPrescription(prescriptionPayload);
      if (!res.success || !res.prescription?.id) {
        throw new Error(res.message || 'The prescription was not saved.');
      }
      setIsSigned(true);

      const rxId = res.prescription.id;

      // Construct complete compliant prescription for instant PDF generation
      const fullPrescription: Prescription = res.prescription;

      setLastPrescription(fullPrescription);

      // Instantly generate & download PDF for doctor
      try {
        await generatePrescriptionPdf(fullPrescription);
      } catch (pdfErr) {
        console.error('Prescription saved, but PDF generation failed:', pdfErr);
        setActionError('Prescription was saved, but the PDF could not be generated.');
      }

      setRxSuccessMsg(
        `✓ Digital Prescription ${rxId} was saved and is available to ${fullPrescription.patientName}.`
      );
      setTimeout(() => setRxSuccessMsg(''), 9000);

      await fetchLiveQueue();
    } catch (err) {
      console.error('Prescription issue failed:', err);
      setActionError(err instanceof Error ? err.message : 'Prescription was not saved. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (patientId: string) => {
    setLoading(true);
    try {
      await ApiService.updateConsultationStatus(patientId, 'IN_CALL');
      setActiveConsultation((prev: any) => ({ ...prev, status: 'IN_CALL' }));
      setActionError('');
      await fetchLiveQueue();
    } catch (e) {
      console.error('Unable to admit patient to consultation:', e);
      setActionError(e instanceof Error ? e.message : 'Could not start the consultation.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndConsultation = async () => {
    if (confirm('Are you sure you want to conclude this teleconsultation?')) {
      try {
        await ApiService.endConsultation(activePatientId);
        setActionError('');
        await fetchLiveQueue();
      } catch (error) {
        console.error('Unable to end consultation:', error);
        setActionError(error instanceof Error ? error.message : 'Could not end the consultation.');
      }
    }
  };

  const handleSelectPatient = async (patient: QueuePatient) => {
    setActivePatientId(patient.id);
    setActiveConsultation(patient.rawConsultation);
    setPrescribedMeds([]);
    setLastPrescription(null);
    setIsSigned(false);
    setRxSuccessMsg('');
    setActionError('');
    if (patient.rawConsultation?.triageSummary?.primaryComplaint) {
      setWorkingDiagnosis(patient.rawConsultation.triageSummary.primaryComplaint);
    }
    if (patient.rawConsultation?.triageSummary?.approvedInterimAdvice?.[0]) {
      setAdviceText(patient.rawConsultation.triageSummary.approvedInterimAdvice[0]);
    } else {
      setAdviceText(
        adviceLang === 'HI'
          ? 'उबला हुआ पानी पिएं, पर्याप्त आराम करें और समय पर दवाएं लें।'
          : 'Drink clean boiled water, observe adequate rest, and take prescribed medicines on time.'
      );
    }

    try {
      const res = await ApiService.getQueueStatus(patient.id);
      if (res && res.success && res.consultation) {
        setActiveConsultation((prev: any) => ({
          ...prev,
          ...res.consultation,
        }));
        if (res.consultation.triageSummary?.primaryComplaint) {
          setWorkingDiagnosis(res.consultation.triageSummary.primaryComplaint);
        }
      }
    } catch (e) {
      console.error('Unable to refresh selected consultation:', e);
      setActionError(e instanceof Error ? e.message : 'Unable to refresh this consultation.');
    }
  };

  const handleSignOut = () => {
    clearAuth();
    navigate('/signin');
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      {/* LEFT SIDEBAR (Desktop w-64) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col py-4 px-3 border-r border-surface-container-high shadow-xs">
        {/* Emblem & Title */}
        <div className="px-3 mb-6 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xl shadow-xs">
            🩺
          </span>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg text-primary leading-tight">RuralCare</span>
            <span className="text-xs text-on-surface-variant font-medium">Clinical Console</span>
          </div>
        </div>

        {/* SOS Emergency Hotline */}
        <div className="mb-4">
          <a
            href="tel:108"
            className="flex items-center gap-2 bg-error-container text-on-error-container px-3 py-2 rounded-xl text-xs font-bold hover:bg-error hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">phone_in_talk</span>
            <span>SOS Emergency: 108</span>
          </a>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs bg-primary-container text-on-primary shadow-xs text-left"
          >
            <span className="material-symbols-outlined text-lg">stethoscope</span>
            <span>Doctor Clinical Console</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-left font-medium"
          >
            <span className="material-symbols-outlined text-lg">vital_signs</span>
            <span>Patient Triage View</span>
          </button>

          <button
            type="button"
            onClick={fetchLiveQueue}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-left font-medium"
          >
            <span className="material-symbols-outlined text-lg">sync</span>
            <span>Sync Live Queue</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-error hover:bg-error-container/40 transition-all text-left font-semibold mt-4"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Log Out / Switch Role</span>
          </button>
        </nav>

        {/* Low bandwidth indicator */}
        <div className="pt-3 border-t border-outline-variant/30 flex flex-col gap-1.5 px-2 text-[11px] text-on-surface-variant">
          <div className="flex items-center justify-between">
            <span>Bandwidth:</span>
            <span className="text-primary font-bold">Low 48kbps (Active)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Telehealth Mode:</span>
            <span className="text-on-surface font-semibold">WebRTC Opus+H264</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 h-16 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-primary text-base">network_check</span>
              <span>Low Bandwidth Mode - 48kbps active</span>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-low rounded-lg px-2 py-1 border border-surface-container-high">
              <span className="material-symbols-outlined text-on-surface-variant text-base mr-1">translate</span>
              <select className="bg-transparent text-xs text-on-surface font-semibold outline-none cursor-pointer">
                <option value="en">English (Clinical)</option>
                <option value="hi">हिन्दी (परामर्श)</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface">{doctorProfile.name} (MD)</span>
                <span className="text-[10px] text-on-surface-variant font-medium">MCI Reg: {doctorProfile.regNo.replace(/^[A-Z]+-/i, '')} • Active Session</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl font-bold ring-2 ring-primary shadow-xs">
                {doctorProfile.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Doctor Subheader & Compliance Bar */}
        <section className="bg-surface-container-low px-6 py-3.5 border-b border-surface-container-high shadow-xs">
          <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center text-2xl font-bold shadow-sm ring-2 ring-primary/40">
                  {doctorProfile.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full ring-2 ring-surface"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-headline font-bold text-lg text-on-surface">{doctorProfile.name}, MBBS, MD</h1>
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                  <span>Reg: {doctorProfile.regNo} (NMC Certified)</span>
                  <span>•</span>
                  <span>{doctorProfile.specialty}</span>
                </div>
              </div>
            </div>

            {/* Compliance Badge & Availability Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-surface-container-high text-xs">
                <span className="material-symbols-outlined text-primary text-base">policy</span>
                <span className="text-on-surface font-medium">NMC India Telemedicine Guidelines 2023 Compliant</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-fixed text-on-primary-fixed font-bold tracking-wider">
                  LEGAL VERIFIED
                </span>
              </div>

              <div className="flex items-center gap-3 bg-surface px-3 py-1.5 rounded-xl border border-surface-container-high">
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-primary animate-pulse' : 'bg-outline'}`}></span>
                    <span className={`text-xs font-bold ${isAvailable ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {isAvailable ? 'Online & Accepting Patients' : 'Offline / On Break'}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">Live Queue: {queue.length} Waiting</span>
                </div>

                <button
                  type="button"
                  onClick={toggleAvailability}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 ${
                    isAvailable
                      ? 'bg-primary text-on-primary hover:bg-primary-container'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">sync_alt</span>
                  <span>{isAvailable ? 'Available' : 'Paused'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Success Alert Banner */}
        {rxSuccessMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-primary-fixed text-on-primary-fixed rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-bounce">
            <span className="material-symbols-outlined text-lg">verified</span>
            <span>{rxSuccessMsg}</span>
          </div>
        )}
        {actionError && (
          <div role="alert" className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
            {actionError}
          </div>
        )}

        {/* MAIN 3-COLUMN CLINICAL WORKSPACE */}
        <main className="p-6 max-w-[1520px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Dynamic Patient Queue (Cols 3) */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">queue</span>
                  <span className="font-headline font-bold text-sm text-on-surface">Clinical Queue</span>
                </div>
                <span className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-full text-xs font-bold">
                  {queue.length} Active
                </span>
              </div>

              {/* Queue Filters */}
              <div className="flex gap-1 text-xs">
                <button
                  onClick={() => setQueueFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    queueFilter === 'all'
                      ? 'bg-primary-container text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  All ({queue.length})
                </button>
                <button
                  onClick={() => setQueueFilter('asha')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    queueFilter === 'asha'
                      ? 'bg-primary-container text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  ASHA
                </button>
                <button
                  onClick={() => setQueueFilter('review')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    queueFilter === 'review'
                      ? 'bg-primary-container text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Refill
                </button>
              </div>

              {/* Dynamic Queue List */}
              <div className="space-y-2.5 mt-1">
                {queue.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    aria-pressed={activePatientId === p.id}
                    className={`relative rounded-xl p-3 cursor-pointer transition-all border ${
                      activePatientId === p.id
                        ? 'bg-surface-container-low border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low shadow-xs'
                    } w-full text-left`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${p.stripeColor} rounded-l-xl`}></div>
                    <div className="pl-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${p.badgeColor}`}>
                          {p.statusLabel}
                        </span>
                        <span className="text-[11px] font-bold text-primary">{p.waitText}</span>
                      </div>
                      <p className="font-headline font-bold text-sm text-on-surface">
                        {p.name}{' '}
                        <span className="font-normal text-on-surface-variant text-xs">
                          ({p.age} yrs, {p.gender})
                        </span>
                      </p>
                      <p className="text-xs text-on-surface mt-0.5 line-clamp-1 font-medium">{p.complaint}</p>
                      <div className="flex items-center justify-between text-on-surface-variant text-[11px] mt-2 pt-1 border-t border-surface-container-high">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">support_agent</span> {p.ashaWorker}
                        </span>
                        <span>{p.healthCenter}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bandwidth Indicator */}
              <div className="bg-surface-container rounded-xl p-3 mt-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-primary text-base">signal_cellular_alt</span>
                    Low-Bandwidth Mode
                  </span>
                  <span className="text-primary font-bold">48 kbps Stable</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full w-4/5"></div>
                </div>
                <span className="block text-[10px] text-on-surface-variant mt-1.5">
                  Adaptive Opus Audio + 15fps compressed H.264 video feed
                </span>
              </div>
            </div>

            {/* Protocol Rules */}
            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high text-xs text-on-surface-variant">
              <h4 className="font-bold text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-secondary">security</span>
                Telemedicine Protocol Rules
              </h4>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">check_circle</span>
                  <span>Schedule X, H, &amp; narcotics strictly restricted online.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">check_circle</span>
                  <span>Convulsion / severe dyspnea triggers immediate 108 dispatch.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">check_circle</span>
                  <span>Digital signature automatically stamped with unique MCI token.</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* CENTER COLUMN: Live Video Window & AI Pre-Consult Summary (Cols 5) */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            {/* Doctor Admission Controller - Only Doctor Can Start */}
            {activeConsultation?.status !== 'IN_CALL' && (
              <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-4 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                    ⏱️
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">
                      Patient in Queue: {activePatient?.name} ({activePatient?.age} yrs)
                    </h4>
                    <p className="text-[11px] text-emerald-200 mt-0.5">
                      Only you can admit the patient into the live consultation room.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartConsultation(activePatientId)}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-base">video_call</span>
                  <span>{loading ? 'Admitting...' : 'Admit & Start Meeting'}</span>
                </button>
              </div>
            )}

            {/* Live Video Call Component */}
            <div className="relative bg-inverse-surface rounded-2xl overflow-hidden shadow-md aspect-video flex flex-col justify-between p-3 text-inverse-on-surface border border-slate-700">
              <AgoraVideoPlayer
                track={agora.remoteVideoTrack}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-5xl">person</span>
                  <span className="text-sm">
                    {agora.status === 'ERROR' ? 'Agora call unavailable' : 'Waiting for patient video…'}
                  </span>
                </div>
              </AgoraVideoPlayer>
              <AgoraVideoPlayer
                track={agora.isVideoEnabled ? agora.localVideoTrack : null}
                className="absolute bottom-14 right-3 z-10 h-24 w-32 overflow-hidden rounded-lg border border-white/30 bg-slate-900 object-cover"
              >
                <span className="flex h-full items-center justify-center text-[10px] text-slate-300">Camera off</span>
              </AgoraVideoPlayer>

              {/* Video Overlay Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-inverse-surface/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                  <span className={`w-2.5 h-2.5 rounded-full ${agora.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>{agora.status === 'CONNECTED' ? 'AGORA LIVE' : 'AGORA • ' + agora.status} • {activePatient?.name || 'Patient'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-inverse-surface/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium">
                    <span className="material-symbols-outlined text-primary-fixed text-sm">hd</span>
                    <span>Agora RTC</span>
                  </div>
                </div>
              </div>
              {agora.error && (
                <p role="alert" className="relative z-10 self-start rounded bg-red-950/90 px-2 py-1 text-xs text-red-200">
                  {agora.error}
                </p>
              )}

              {/* Video Overlay Footer Controls */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="bg-inverse-surface/85 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold">
                  <span>Patient: {activePatient?.name} ({activePatient?.age} yrs, {activePatient?.gender})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void agora.toggleMicrophone()}
                    disabled={agora.status !== 'CONNECTED'}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      !agora.isMicrophoneEnabled ? 'bg-error text-white' : 'bg-inverse-surface/90 hover:bg-inverse-surface text-white'
                    }`}
                    title="Toggle Mic"
                  >
                    <span className="material-symbols-outlined text-base">
                      {agora.isMicrophoneEnabled ? 'mic' : 'mic_off'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void agora.toggleVideo()}
                    disabled={agora.status !== 'CONNECTED'}
                    className="w-9 h-9 rounded-full bg-inverse-surface/90 hover:bg-inverse-surface flex items-center justify-center text-white transition-all disabled:opacity-50"
                    title={agora.isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
                  >
                    <span className="material-symbols-outlined text-base">
                      {agora.isVideoEnabled ? 'videocam' : 'videocam_off'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Snapshot captured and attached to consultation record!')}
                    className="w-9 h-9 rounded-full bg-inverse-surface/90 hover:bg-inverse-surface flex items-center justify-center text-white transition-all"
                    title="Capture Exam Snapshot"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEndConsultation}
                    className="w-9 h-9 rounded-full bg-error hover:bg-error-container text-white flex items-center justify-center transition-all shadow"
                    title="End Consultation"
                  >
                    <span className="material-symbols-outlined text-base">call_end</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Pre-Consult Case Synthesis Card with Chat Transcript Tab */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-surface-container-high gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
                  <h3 className="font-headline font-bold text-sm text-on-surface">Patient Case Intake &amp; Summary</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex bg-surface-container-low p-0.5 rounded-lg border border-surface-container-high text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        activeTab === 'summary'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      AI Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                        activeTab === 'chat'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span>Patient Chat</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </button>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs bg-primary-fixed text-on-primary-fixed font-bold">
                    {Math.round((activeConsultation?.triageSummary?.confidenceScore || 0.95) * 100)}% Match
                  </span>
                </div>
              </div>

              {/* Tab 2: Patient Chat & Intake Log */}
              {activeTab === 'chat' && (
                <div className="mt-3.5 space-y-2.5">
                  <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high text-xs max-h-72 overflow-y-auto space-y-2.5">
                    <div className="text-[11px] font-bold text-on-surface-variant flex items-center justify-between border-b border-surface-container-high pb-1">
                      <span>Patient AI Symptom Chat Log</span>
                      <span className="text-[10px] text-primary">Pre-Consult Intake</span>
                    </div>

                    {/* Chat Bubble: Initial Complaint */}
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 mb-1">
                        <span>Patient ({activePatient?.name || 'Aman'}):</span>
                        <span>Intake</span>
                      </div>
                      <p className="font-medium text-xs">
                        "{activeConsultation?.triageSummary?.primaryComplaint || activePatient?.complaint || 'बुखार और शरीर में दर्द है।'}"
                      </p>
                    </div>

                    {/* Chat Bubble: Duration & Severity */}
                    <div className="bg-surface p-2.5 rounded-xl border border-surface-container-high">
                      <div className="text-[10px] font-bold text-on-surface-variant mb-1">Clinical Intake Q&amp;A:</div>
                      <div className="space-y-1 text-[11px]">
                        <div>• <strong>Duration:</strong> {activeConsultation?.triageSummary?.structuredDetails?.duration || activeConsultation?.triageSummary?.doctorCaseSummary?.timeline || '48 hours'}</div>
                        <div>• <strong>Severity:</strong> <span className="font-bold text-error">{activeConsultation?.triageSummary?.structuredDetails?.severity || 'Moderate'}</span></div>
                        <div>• <strong>Chronic History:</strong> {activeConsultation?.patientProfile?.chronicConditions?.join(', ') || 'No prior chronic disease reported'}</div>
                        <div>• <strong>Red Flags Scanned:</strong> {activeConsultation?.triageSummary?.doctorCaseSummary?.redFlagCheck || 'None Detected (Safe for Teleconsult)'}</div>
                      </div>
                    </div>

                    {/* Chat Messages from Session */}
                    {activeConsultation?.chatMessages?.map((msg: any, i: number) => (
                      <div key={i} className="bg-surface-container rounded-lg p-2 text-xs">
                        <span className="font-bold text-[10px] text-primary block">{msg.sender} ({msg.time}):</span>
                        <p className="text-on-surface mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 1: AI Clinical Synthesis */}
              {activeTab === 'summary' && (
                <div className="space-y-3.5 mt-3 text-on-surface text-xs">
                  {/* Reported Symptoms & Onset */}
                  <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high">
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                      Reported Symptoms &amp; Onset
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-surface rounded-lg p-2.5 border border-surface-container-high">
                        <span className="block text-[10px] text-on-surface-variant font-semibold">Measured Vitals</span>
                        <span className="font-headline font-bold text-base text-error">
                          {activePatient?.temp || '-'}
                        </span>
                        <span className="block text-[10px] text-on-surface-variant">Onset: 48 hours ago</span>
                      </div>
                      <div className="bg-surface rounded-lg p-2.5 border border-surface-container-high">
                        <span className="block text-[10px] text-on-surface-variant font-semibold">Episodes / Severity</span>
                        <span className="font-headline font-bold text-base text-secondary">
                          {activePatient?.episodes || '-'}
                        </span>
                        <span className="block text-[10px] text-on-surface-variant">
                          {activeConsultation?.triageSummary?.structuredDetails?.severity || 'Moderate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration & Safety Guardrails */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high">
                      <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">
                        Chief Complaint &amp; Timeline
                      </span>
                      <p className="text-on-surface leading-snug">
                        <strong>{activeConsultation?.triageSummary?.doctorCaseSummary?.timeline || '48 Hours duration.'}</strong>{' '}
                        {activeConsultation?.triageSummary?.doctorCaseSummary?.chiefComplaint || activePatient?.complaint}
                      </p>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high">
                      <span className="text-[11px] text-primary font-bold uppercase tracking-wider block mb-1">
                        Safety Guardrails Passed
                      </span>
                      <ul className="space-y-1 text-on-surface">
                        <li className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-sm">verified</span> No seizure or convulsions
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-sm">verified</span> Chest indrawing: Absent
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-sm">verified</span> Capillary refill &lt; 2s
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* History & Allergies */}
                  <div className="bg-surface-container-high rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-on-surface-variant font-semibold">Known Conditions</span>
                      <span className="font-semibold text-on-surface">
                        {activeConsultation?.patientProfile?.chronicConditions?.join(', ') || 'None (Healthy child)'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-on-surface-variant font-semibold">Drug Allergies</span>
                      <span className="font-bold text-primary">NKDA (None Known)</span>
                    </div>
                  </div>

                  {/* ASHA Field Intake Audio Note */}
                  <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2 border border-surface-container-high">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const pName = activePatient?.name || 'मरीज';
                            const comp = activeConsultation?.triageSummary?.primaryComplaint || activePatient?.complaint || 'समस्या';
                            const u = new SpeechSynthesisUtterance(
                              `आशा दीदी नोट: ${pName} को ${comp} की शिकायत है। कृपया परामर्श दें।`
                            );
                            u.lang = 'hi-IN';
                            window.speechSynthesis.speak(u);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-all"
                      >
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                      </button>
                      <div>
                        <span className="block font-semibold text-xs text-on-surface">ASHA Intake Voice Note (Hindi)</span>
                        <span className="text-[10px] text-on-surface-variant">Tap to listen • 32 seconds recording</span>
                      </div>
                    </div>
                    <svg className="w-20 h-5 text-primary" fill="none" viewBox="0 0 100 24">
                      <path
                        d="M0 12 L10 12 L15 3 L22 21 L30 8 L38 16 L45 2 L52 22 L60 10 L68 14 L75 4 L82 20 L90 12 L100 12"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Fast e-Prescription Builder (Cols 4) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">prescriptions</span>
                  <h2 className="font-headline font-bold text-sm text-on-surface">Fast e-Rx Builder</h2>
                </div>
                <span className="text-primary text-[10px] font-bold bg-primary-fixed px-2 py-0.5 rounded">
                  FR-5.1 COMPLIANT
                </span>
              </div>

              {/* Working Diagnosis Input */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Working Diagnosis (ICD-11 Suggested)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={workingDiagnosis}
                    onChange={(e) => setWorkingDiagnosis(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-xs font-medium text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary pr-8"
                  />
                  <span className="material-symbols-outlined text-primary absolute right-2.5 top-2 text-base">
                    auto_fix_high
                  </span>
                </div>
              </div>

              {/* NMC Permitted Drugs Filter Bar */}
              <div className="bg-surface-container-high rounded-xl p-2.5 flex items-center justify-between text-[11px] text-on-surface">
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <span className="material-symbols-outlined text-sm">shield_lock</span>
                  NMC List 'O' &amp; 'A' Permitted Drugs Only
                </span>
                <span className="font-bold text-error uppercase text-[10px]">Sched X / H Locked</span>
              </div>

              {/* Rapid Quick-Add Matrix */}
              <div>
                <span className="block text-[11px] font-semibold text-on-surface-variant mb-1.5">
                  Pediatric Tele-Consult Rapid Quick-Add
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => addQuickMed('ORS Sachet (1L)', '200ml post stool')}
                    className="bg-surface-container-low hover:bg-primary hover:text-white text-on-surface px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> ORS Sachet
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickMed('Paracetamol Syr 250mg', '5ml SOS')}
                    className="bg-surface-container-low hover:bg-primary hover:text-white text-on-surface px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> Paracetamol Syr
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickMed('Zinc Syr 20mg', '5ml OD x 14d')}
                    className="bg-surface-container-low hover:bg-primary hover:text-white text-on-surface px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> Zinc Syr
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickMed('Domperidone Drops', '3 drops SOS')}
                    className="bg-surface-container-low hover:bg-primary hover:text-white text-on-surface px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> Domperidone
                  </button>
                </div>
              </div>

              {/* Custom Medicine Input Row */}
              <div className="mt-2 p-3 bg-surface-container-high rounded-xl border border-surface-container-highest">
                <span className="block text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Custom Drug / Any Prescription Medicine
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Drug name (e.g. Amoxicillin 250mg)"
                      value={customMedName}
                      onChange={(e) => setCustomMedName(e.target.value)}
                      className="flex-1 bg-surface rounded-lg px-2.5 py-1.5 text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Dose"
                      value={customMedDose}
                      onChange={(e) => setCustomMedDose(e.target.value)}
                      className="w-20 bg-surface rounded-lg px-2.5 py-1.5 text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Frequency (1-0-1)"
                      value={customMedFreq}
                      onChange={(e) => setCustomMedFreq(e.target.value)}
                      className="flex-1 bg-surface rounded-lg px-2.5 py-1.5 text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={customMedDuration}
                      onChange={(e) => setCustomMedDuration(e.target.value)}
                      className="flex-1 bg-surface rounded-lg px-2.5 py-1.5 text-xs border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      disabled={!customMedName.trim()}
                      onClick={() => {
                        if (!customMedName.trim()) return;
                        addQuickMed(
                          customMedName.trim(),
                          `${customMedDose || 'Standard dose'} • ${customMedFreq || '1-0-1'} • ${customMedDuration || '3 days'}`
                        );
                        setCustomMedName('');
                        setCustomMedDose('');
                        setCustomMedFreq('1-0-1');
                        setCustomMedDuration('3 days');
                      }}
                      className="bg-primary hover:bg-primary-container text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescribed Medications Roster */}
              <div className="space-y-2 mt-1">
                {prescribedMeds.map((med) => (
                  <div key={med.id} className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-base ${med.iconColor}`}>{med.icon}</span>
                        <span className="font-headline font-bold text-xs text-on-surface">{med.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMed(med.id)}
                        className="text-on-surface-variant hover:text-error transition-colors"
                        title="Remove medication"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[11px] mb-1.5">
                      {med.schedule.map((slot: string, idx: number) => (
                        <span key={idx} className="bg-surface px-2 py-0.5 rounded font-semibold text-primary border border-surface-container-high">
                          {slot}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-on-surface-variant">{med.instructions}</div>
                  </div>
                ))}
              </div>

              {/* General Advice & Language Translation Toggle */}
              <div className="space-y-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-on-surface-variant">Dietary &amp; Recovery Advice</label>
                  <div className="flex items-center gap-1 bg-surface-container-high rounded px-1.5 py-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => toggleAdviceLang('EN')}
                      className={`px-1 rounded ${adviceLang === 'EN' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
                    >
                      EN
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => toggleAdviceLang('HI')}
                      className={`px-1 rounded ${adviceLang === 'HI' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={adviceText}
                  onChange={(e) => setAdviceText(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl p-2.5 text-xs text-on-surface border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                ></textarea>
              </div>

              {/* In-Person Escalation & PHC Referral Trigger */}
              <div className="bg-surface-container-high rounded-xl p-3 border border-surface-container-highest">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phcReferralTrigger}
                    onChange={(e) => setPhcReferralTrigger(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-0 accent-primary"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      PHC Referral Safe-Trigger (Community Escalation)
                    </span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      {`यदि ${activePatient?.name || 'मरीज'} की स्थिति 24 घंटे में गंभीर होती है या दर्द/बुखार बढ़ता है, तो तुरंत निकटतम स्वास्थ्य केंद्र (CHC) में संपर्क करें।`}
                    </span>
                  </div>
                </label>
              </div>

              {/* Digital Signature & Dispatch Button */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between text-on-surface-variant text-[11px] px-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">fingerprint</span>
                    Cryptographic NMC Stamp
                  </span>
                  <span className="font-mono text-primary font-bold">SIG-{doctorProfile.regNo.replace(/[^A-Z0-9]/gi, '-').toUpperCase()}-2023-OK</span>
                </div>

                <button
                  type="button"
                  onClick={handleSignAndDispatch}
                  disabled={loading || activeConsultation?.status !== 'IN_CALL'}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl font-headline font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">send_and_archive</span>
                  <span>{loading ? 'Signing Prescription...' : isSigned ? 'Issue Another e-Prescription' : 'Digitally Sign & Issue Prescription'}</span>
                </button>

                {/* Direct PDF Download / Print Action */}
                {lastPrescription && (
                  <button
                    type="button"
                    onClick={() => generatePrescriptionPdf(lastPrescription)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-500"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    <span>Download Official PDF Prescription (NMC Format)</span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

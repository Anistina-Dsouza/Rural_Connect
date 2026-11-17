import React, { useState, useEffect } from 'react';
import { Language, FamilyProfile, VitalsRecord, AshaHousehold } from '../types';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';
import { speakText } from '../utils/speech';
import { 
  Users, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  Droplet, 
  CheckCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Volume2, 
  Stethoscope, 
  ArrowRight, 
  RefreshCw,
  PlusCircle,
  FileCheck2
} from 'lucide-react';

interface AshaAssistedModeProps {
  currentLanguage: Language;
  onSelectPatientForTriage: (profile: FamilyProfile, vitals?: VitalsRecord) => void;
  onEnrollInQueueWithVitals: (profile: FamilyProfile, vitals: VitalsRecord) => void;
}

export const AshaAssistedMode: React.FC<AshaAssistedModeProps> = ({
  currentLanguage,
  onSelectPatientForTriage,
  onEnrollInQueueWithVitals
}) => {
  const t = translations[currentLanguage];

  // ASHA Worker details
  const ashaWorker = {
    name: 'मीना बेन (Meena Ben)',
    workerId: 'ASHA-GUJ-4091',
    sector: 'Sector 4 Village Cluster',
    phc: 'Primary Health Centre Taluka-A',
    householdCount: 120
  };

  const [households, setHouseholds] = useState<AshaHousehold[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<FamilyProfile>({
    id: 'prof-1',
    name: 'सुनीता देवी (Sunita Devi)',
    relation: 'Self',
    age: 34,
    gender: 'Female',
    avatar: '👩🏽'
  });
  const [selectedPhone, setSelectedPhone] = useState('9876543210');

  // Vitals form state
  const [systolic, setSystolic] = useState<number>(118);
  const [diastolic, setDiastolic] = useState<number>(78);
  const [spO2, setSpO2] = useState<number>(98);
  const [pulse, setPulse] = useState<number>(74);
  const [temperature, setTemperature] = useState<number>(98.6);
  const [bloodSugar, setBloodSugar] = useState<number>(104);
  const [notes, setNotes] = useState('');

  // UI state
  const [vitalsHistory, setVitalsHistory] = useState<VitalsRecord[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load households and past vitals on mount
  useEffect(() => {
    ApiService.getAshaHouseholds()
      .then((res: any) => {
        if (res && res.households) {
          setHouseholds(res.households);
          if (res.households[0] && res.households[0].members[0]) {
            setSelectedPatient(res.households[0].members[0]);
            setSelectedPhone(res.households[0].phoneNumber);
          }
        }
      })
      .catch((err) => console.log('Asha households note:', err));

    loadPatientVitals(selectedPhone);
  }, []);

  const loadPatientVitals = (phone: string) => {
    ApiService.getPatientVitals(phone)
      .then((res: any) => {
        if (res && res.vitalsHistory) {
          setVitalsHistory(res.vitalsHistory);
        }
      })
      .catch(() => {});
  };

  // Clinical abnormal validation warnings
  const abnormalAlerts: string[] = [];
  if (systolic >= 140) abnormalAlerts.push('High Systolic Blood Pressure (Hypertension)');
  if (systolic < 90) abnormalAlerts.push('Low Blood Pressure (Hypotension)');
  if (spO2 < 94) abnormalAlerts.push('Low Oxygen Saturation (Hypoxia alert)');
  if (temperature >= 100.4) abnormalAlerts.push('High Fever detected');
  if (pulse > 100) abnormalAlerts.push('Elevated Heart Rate (Tachycardia)');

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();

    const vitalsData = {
      patientPhone: selectedPhone,
      profileId: selectedPatient.id,
      patientName: selectedPatient.name,
      systolicBp: systolic,
      diastolicBp: diastolic,
      spO2,
      pulseRate: pulse,
      temperatureF: temperature,
      bloodSugarMgDl: bloodSugar,
      notes: notes || 'Doorstep vitals check by ASHA worker'
    };

    try {
      const res: any = await ApiService.recordVitals(vitalsData);
      if (res && res.vitals) {
        setVitalsHistory([res.vitals, ...vitalsHistory]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return;
      }
    } catch (err) {
      // Save to offline queue if network fails
      const offlineRecord = {
        ...vitalsData,
        id: `vit-offline-${Date.now()}`,
        recordedByAshaId: ashaWorker.workerId,
        recordedByAshaName: ashaWorker.name,
        timestamp: new Date().toISOString()
      };
      setOfflineQueue([...offlineQueue, offlineRecord]);
      setVitalsHistory([offlineRecord as VitalsRecord, ...vitalsHistory]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      await ApiService.syncOfflineVitals(offlineQueue);
      setOfflineQueue([]);
      alert('Offline vitals queue synchronized successfully with central server!');
    } catch (err) {
      alert('Unable to sync now. Will retry when connection improves.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReadVitalsAloud = () => {
    const summary = currentLanguage === 'hi'
      ? `${selectedPatient.name} की स्वास्थ्य जांच: ब्लड प्रेशर ${systolic} और ${diastolic}, ऑक्सीजन ${spO2} प्रतिशत, नब्ज ${pulse}, और तापमान ${temperature} डिग्री है।`
      : currentLanguage === 'gu'
      ? `${selectedPatient.name} ની આરોગ્ય તપાસ: બ્લડ પ્રેશર ${systolic} અને ${diastolic}, ઓક્સિજન ${spO2} ટકા, નાડી ${pulse}, અને તાવ ${temperature} ડિગ્રી છે.`
      : `Health vitals for ${selectedPatient.name}: Blood pressure ${systolic} over ${diastolic}, oxygen saturation ${spO2} percent, pulse rate ${pulse} beats per minute, temperature ${temperature} degrees Fahrenheit.`;

    speakText(summary, currentLanguage);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ASHA Header Card */}
      <div className="bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              👩🏽‍⚕️
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded">
                National Rural Health Mission (ASHA)
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                {ashaWorker.name}
              </h2>
              <p className="text-xs text-rose-100">
                Worker ID: <span className="font-mono font-bold text-white">{ashaWorker.workerId}</span> • {ashaWorker.sector} • {ashaWorker.phc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-center border border-white/20">
              <div className="text-xl font-black">{ashaWorker.householdCount}</div>
              <div className="text-[10px] text-rose-200 uppercase font-semibold">Households</div>
            </div>

            {offlineQueue.length > 0 && (
              <button
                onClick={handleSyncOffline}
                disabled={isSyncing}
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Offline ({offlineQueue.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Roster on Left, Vitals Logger on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Village Household Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {t.householdRosterTitle}
                </h3>
              </div>
              <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                Doorstep Visit
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Select a family member to record doorstep vitals or assist them with an online doctor consult.
            </p>

            <div className="space-y-3">
              {households.map((hh) => (
                <div key={hh.householdId} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{hh.headOfFamily}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded">
                      {hh.householdId}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {hh.highRiskFlags.map((flag, idx) => (
                      <span key={idx} className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                    {hh.members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(member);
                          setSelectedPhone(hh.phoneNumber);
                          loadPatientVitals(hh.phoneNumber);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                          selectedPatient.id === member.id
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{member.avatar}</span>
                          <div>
                            <div>{member.name}</div>
                            <div className={`text-[10px] ${selectedPatient.id === member.id ? 'text-rose-100' : 'text-slate-400'}`}>
                              {member.relation} • {member.age} Yrs • {member.gender}
                            </div>
                          </div>
                        </div>

                        {selectedPatient.id === member.id && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Vitals Entry & Direct Doctor Handover (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedPatient.avatar}</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedPatient.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedPatient.relation} • {selectedPatient.age} Yrs • Mobile: +91-{selectedPhone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReadVitalsAloud}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition"
                title="Speak vitals aloud to patient in selected language"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Abnormal Alert Banner */}
            {abnormalAlerts.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Clinical Advisory Note:</span>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    {abnormalAlerts.map((alt, idx) => (
                      <li key={idx} className="font-semibold">{alt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Vitals Form */}
            <form onSubmit={handleSaveVitals} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Blood Pressure Systolic */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span>Systolic BP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(Number(e.target.value))}
                      className="w-full text-lg font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    />
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* Blood Pressure Diastolic */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span>Diastolic BP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(Number(e.target.value))}
                      className="w-full text-lg font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    />
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* Oxygen Saturation SpO2 */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                    <Wind className="w-3.5 h-3.5 text-blue-600" />
                    <span>SpO2 Oxygen</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={spO2}
                      onChange={(e) => setSpO2(Number(e.target.value))}
                      className="w-full text-lg font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    />
                    <span className="text-[10px] text-slate-400">%</span>
                  </div>
                </div>

                {/* Pulse Rate */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                    <Heart className="w-3.5 h-3.5 text-red-600" />
                    <span>Pulse / Heart</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(Number(e.target.value))}
                      className="w-full text-lg font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    />
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                    <span>Body Temp</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full text-lg font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    />
                    <span className="text-[10px] text-slate-400">°F</span>
                  </div>
                </div>

                {/* Blood Sugar */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                    <Droplet className="w-3.5 h-3.5 text-purple-600" />
                    <span>Random Sugar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(Number(e.target.value))}
                      className="w-full text-lg font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                    />
                    <span className="text-[10px] text-slate-400">mg/dL</span>
                  </div>
                </div>
              </div>

              {/* Observation Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Notes (e.g. Taking regular BP medication, feels mild morning dizziness)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.saveVitals}</span>
                </button>

                {saveSuccess && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Vitals logged successfully!
                  </span>
                )}
              </div>
            </form>

            {/* Action Cards for Telemedicine Handover */}
            <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const currentVitals: VitalsRecord = {
                    id: `vit-live-${Date.now()}`,
                    patientPhone: selectedPhone,
                    profileId: selectedPatient.id,
                    patientName: selectedPatient.name,
                    systolicBp: systolic,
                    diastolicBp: diastolic,
                    spO2,
                    pulseRate: pulse,
                    temperatureF: temperature,
                    bloodSugarMgDl: bloodSugar,
                    recordedByAshaId: ashaWorker.workerId,
                    recordedByAshaName: ashaWorker.name,
                    timestamp: new Date().toISOString()
                  };
                  onSelectPatientForTriage(selectedPatient, currentVitals);
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs">{t.launchAssistedTriage}</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Voice triage with low-literacy help</div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentVitals: VitalsRecord = {
                    id: `vit-live-${Date.now()}`,
                    patientPhone: selectedPhone,
                    profileId: selectedPatient.id,
                    patientName: selectedPatient.name,
                    systolicBp: systolic,
                    diastolicBp: diastolic,
                    spO2,
                    pulseRate: pulse,
                    temperatureF: temperature,
                    bloodSugarMgDl: bloodSugar,
                    recordedByAshaId: ashaWorker.workerId,
                    recordedByAshaName: ashaWorker.name,
                    timestamp: new Date().toISOString()
                  };
                  onEnrollInQueueWithVitals(selectedPatient, currentVitals);
                }}
                className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs">{t.bookDoctorQueueWithVitals}</div>
                  <div className="text-[10px] text-rose-700 mt-0.5">Pre-populate vitals for Dr. Patel</div>
                </div>
                <Stethoscope className="w-4 h-4 text-rose-700 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Past Doorstep Vitals Log for Patient */}
          {vitalsHistory.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-rose-600" />
                Previous Doorstep Vitals Records ({vitalsHistory.length})
              </h4>

              <div className="space-y-2">
                {vitalsHistory.map((rec) => (
                  <div key={rec.id} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{rec.systolicBp}/{rec.diastolicBp} mmHg</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span>SpO2: <strong className="text-blue-700">{rec.spO2}%</strong></span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span>Pulse: <strong>{rec.pulseRate} bpm</strong></span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span>Temp: <strong>{rec.temperatureF}°F</strong></span>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Logged by {rec.recordedByAshaName} • {new Date(rec.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


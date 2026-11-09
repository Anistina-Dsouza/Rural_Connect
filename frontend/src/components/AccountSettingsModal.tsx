import React, { useState } from 'react';
import { Language, UserSession } from '../types';
import { translations } from '../data/translations';
import { ApiService } from '../services/api';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  Lock, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  X,
  ShieldAlert
} from 'lucide-react';

interface AccountSettingsModalProps {
  currentLanguage: Language;
  userSession: UserSession;
  isOpen: boolean;
  onClose: () => void;
  onConsentToggled: (newStatus: boolean) => void;
  onSignOut: () => void;
  onAccountDeleted: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  currentLanguage,
  userSession,
  isOpen,
  onClose,
  onConsentToggled,
  onSignOut,
  onAccountDeleted
}) => {
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // FR-1.5: Users can request data export
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res: any = await ApiService.exportUserData(userSession.phoneNumber);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `RuralCare_HealthData_Export_${userSession.phoneNumber}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportNotice('Health records exported successfully as JSON file per DPDP 2023 regulations.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.warn('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // FR-1.5: Users can delete their account
  const handleDeleteAccount = async () => {
    try {
      await ApiService.deleteUserAccount(userSession.phoneNumber);
      localStorage.clear();
      onAccountDeleted();
    } catch (err) {
      console.warn('Delete error:', err);
      localStorage.clear();
      onAccountDeleted();
    }
  };

  // FR-1.3: Revocable consent toggle
  const handleToggleConsent = async () => {
    const nextConsent = !userSession.consentGiven;
    try {
      await ApiService.recordConsent(userSession.phoneNumber, nextConsent, currentLanguage);
    } catch (e) {
      console.warn('Consent toggle note:', e);
    }
    onConsentToggled(nextConsent);
  };

  // FR-1.9: Lock health records behind screen lock / PIN on shared household device
  const handleTogglePinLock = async () => {
    const nextLock = !isPinLocked;
    setIsPinLocked(nextLock);
    try {
      await ApiService.updateLockSettings(userSession.phoneNumber, nextLock);
    } catch (e) {
      console.warn('Lock toggle note:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              PRD Section 7.1: Account & Consent
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Account, Privacy & Governance Settings
            </h3>
            <p className="text-xs text-slate-500">Mobile: +91 {userSession.phoneNumber}</p>
          </div>
        </div>

        {exportNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* FR-1.3: Explicit, Revocable Consent */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                Telemedicine & DPDP Consent (FR-1.3)
              </span>
              <button
                type="button"
                onClick={handleToggleConsent}
                className={`px-3 py-1 rounded-full font-bold text-xs border transition ${
                  userSession.consentGiven
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}
              >
                {userSession.consentGiven ? 'Consent: Granted ✓' : 'Consent: Revoked ✕'}
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Under India's Digital Personal Data Protection Act (DPDP 2023), you hold the right to revoke your teleconsultation and data processing consent at any time.
            </p>
          </div>

          {/* FR-1.9: Screen Lock / Biometric Protection on Shared Household Phone */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-900 text-sm">
                  Household Shared Phone Lock (FR-1.9)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPinLocked}
                onChange={handleTogglePinLock}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-slate-600 leading-relaxed">
              Because phones are often shared in a rural family, health records and prescriptions can be locked behind the device screen lock or fingerprint.
            </p>
          </div>

          {/* FR-1.5: Data Export Request */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                Request Data Export (FR-1.5)
              </span>
              <p className="text-slate-600 mt-0.5">
                Download a complete digital copy of your dependent profiles, prescriptions, and consult history.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>

          {/* FR-1.8: Permanent Sign-in / Sign Out */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                Permanent Device Sign-in (FR-1.8)
              </span>
              <p className="text-slate-600 mt-0.5">
                Currently signed in permanently on this device. Sign out if passing phone to non-household members.
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* FR-1.5: Delete Account */}
          <div className="border border-red-200 bg-red-50/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-900 block text-sm">
                  Delete Account & Health Records (FR-1.5)
                </span>
                <p className="text-red-700 mt-0.5 leading-relaxed">
                  Permanently deletes your mobile registration, all dependent family profiles, and consultation history from the servers.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            ) : (
              <div className="bg-white border border-red-300 p-3 rounded-xl space-y-2">
                <p className="font-bold text-red-900 text-xs">
                  Are you completely sure? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
                  >
                    Yes, Permanently Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

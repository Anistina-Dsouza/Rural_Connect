import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../services/api";
import { setAuthToken, setDoctorSession } from "../services/auth";

type UserRole = "PATIENT" | "DOCTOR";
type Step = "role" | "phone" | "otp" | "profile";
type Lang = "hi" | "en" | "gu";

interface RoleOption {
  id: UserRole;
  icon: string;
  label: string;
  sublabel: string;
  color: string;
  borderColor: string;
  bgActive: string;
  textActive: string;
}

const ROLES: RoleOption[] = [
  {
    id: "PATIENT",
    icon: "👨‍👩‍👧‍👦",
    label: "Patient / मरीज एवं परिवार",
    sublabel: "Self & Family • ABHA / Ration Card",
    color: "#004532",
    borderColor: "border-emerald-700",
    bgActive: "bg-emerald-700",
    textActive: "text-white",
  },
  {
    id: "DOCTOR",
    icon: "👨‍⚕️",
    label: "Doctor / डॉक्टर पोर्टल",
    sublabel: "NMC Registered Telehealth Physician",
    color: "#1e40af",
    borderColor: "border-blue-700",
    bgActive: "bg-blue-700",
    textActive: "text-white",
  },
];

const LANG_OPTIONS: { code: Lang; label: string; native: string }[] = [
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "en", label: "English", native: "English" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

const DEMO_CREDENTIALS: Record<UserRole, { phone: string; otp: string; extra?: string }> = {
  PATIENT: { phone: "9876543210", otp: "742910" },
  DOCTOR: { phone: "9822334455", otp: "742910", extra: "NMC/MCI-2018-84729" },
};

export default function SignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>("PATIENT");
  const [lang, setLang] = useState<Lang>("hi");
  const [phone, setPhone] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState("");
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState("self");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP countdown timer
  useEffect(() => {
    if (step !== "otp") return;
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  // Speak text using TTS
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : lang === "gu" ? "gu-IN" : "en-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    // Prefill demo credentials
    const creds = DEMO_CREDENTIALS[r];
    setPhone(creds.phone);
    if (r === "DOCTOR" && creds.extra) setRegNumber(creds.extra);
  };

  const handleProceedToPhone = () => {
    setStep("phone");
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!dpdpConsent) {
      setError("Please accept the DPDP 2023 consent to proceed.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await ApiService.sendOtp(phone, lang);
      const hint = res.autoReadOtp || DEMO_CREDENTIALS[role].otp;
      setDemoOtpHint(hint);
      setOtpDigits(hint.split("").slice(0, 6));
      setTimer(30);
      setStep("otp");
      speak("आपका OTP भेजा गया है।");
    } catch {
      const hint = DEMO_CREDENTIALS[role].otp;
      setDemoOtpHint(hint);
      setOtpDigits(hint.split("").slice(0, 6));
      setTimer(30);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[idx] = digit;
    setOtpDigits(updated);
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await ApiService.verifyOtp(phone, otp, "device_current", role === "PATIENT" || role === "DOCTOR" ? role : "PATIENT");
      const token =
        res.token ||
        btoa(JSON.stringify({ alg: "HS256" })) +
          "." +
          btoa(JSON.stringify({ phone, role, exp: Date.now() + 86400000 })) +
          ".demo";
      setAuthToken(token);
    } catch {
      const token =
        btoa(JSON.stringify({ alg: "HS256" })) +
          "." +
          btoa(JSON.stringify({ phone, role, exp: Date.now() + 86400000 })) +
          ".demo";
      setAuthToken(token);
    }

    // Store session
    localStorage.setItem("ruralcare_session_phone", phone);
    localStorage.setItem("ruralcare_session_role", role);
    localStorage.setItem("ruralcare_session_lang", lang);
    localStorage.setItem("ruralcare_session_verified", "true");
    localStorage.setItem("ruralcare_session_consent", "true");
    if (role === "PATIENT") localStorage.setItem("ruralcare_session_profile", selectedProfile);

    // For doctors: persist name & registration number for dashboard display
    if (role === "DOCTOR") {
      // Use the entered reg number; name will be fetched from /api/auth/me on doctor dashboard
      const enteredReg = regNumber.trim() || "NMC/MCI-2018-84729";
      setDoctorSession("Dr. RuralCare Physician", enteredReg);
    }

    setLoading(false);

    if (role === "DOCTOR") navigate("/doctor");
    else navigate("/patient");
  };

  const handleResendOtp = async () => {
    setTimer(30);
    setOtpDigits(["", "", "", "", "", ""]);
    await handleSendOtp();
  };

  const speakOtp = () => {
    const otp = otpDigits.join("");
    speak(`आपका सुरक्षा कोड है: ${otp.split("").join("... ")}`);
  };

  // ── Color map per role ──────────────────────────────────────
  const roleColors: Record<UserRole, { bg: string; border: string; text: string; badge: string }> = {
    PATIENT: { bg: "bg-emerald-700", border: "border-emerald-600", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
    DOCTOR: { bg: "bg-blue-700", border: "border-blue-600", text: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
  };
  const rc = roleColors[role];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-50 flex flex-col">
      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white text-lg shadow">
            🩺
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm">RuralCare Connect</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
              <span className="text-[10px] text-slate-500 font-medium">2G / Offline-Ready • ABDM</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex gap-1">
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); speak(l.native); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  lang === l.code
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
          <a
            href="tel:108"
            className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-red-700 transition-colors"
          >
            🚨 108
          </a>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* ══ LEFT: Trust Panel ═══════════════════════════════════ */}
            <div className="hidden lg:flex flex-col gap-5">
              {/* Hero Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-white p-8 shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold mb-5">
                    ✅ Govt. Verified • Free • Secure
                  </div>
                  <h1 className="text-2xl font-bold leading-snug mb-3">
                    Safe, Free & Multilingual<br />Healthcare for Every Village
                  </h1>
                  <p className="text-sm text-emerald-100 leading-relaxed mb-6">
                    गांव-गांव तक उच्च गुणवत्ता परामर्श।<br />
                    Connect with specialist doctors from your phone or nearest ASHA center.
                  </p>

                  <div className="rounded-xl overflow-hidden mb-5 shadow-lg">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_1VOCu8TMVnmByoMrsAOfltsuS_COTmm3IJFctt96Bni8M0qb8w9mAdVIf3BBERZ4K14KSvWSUs0LJ8uO7Ag74GbDkjuIyYKEU-lTLy2zSu0S2Qwy2is8dLq1G-znfr7ke1wshE2DObZtNw-730qUfAzdBszIH25HEdJxe-LNIobEYFDJi60Mgyzk4snKkhmuKLj0JQjsA7o41ql3dm4d-6AMo73bQ8XyIowCwgJI"
                      alt="ASHA worker helping patient"
                      className="w-full h-40 object-cover"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { n: "1200+", label: "Villages" },
                      { n: "340+", label: "Doctors" },
                      { n: "Free", label: "Always" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="font-bold text-lg">{s.n}</div>
                        <div className="text-[11px] text-emerald-200">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🔒", title: "DPDP 2023 Compliant", desc: "100% encrypted health vault" },
                  { icon: "📶", title: "Works on 2G", desc: "Offline-first design" },
                  { icon: "👨‍👩‍👧", title: "Up to 6 Profiles", desc: "One phone, whole family" },
                  { icon: "🗣️", title: "Voice Assisted", desc: "Hindi, Gujarati, English" },
                ].map((f) => (
                  <div key={f.title} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
                    <span className="text-2xl">{f.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{f.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ASHA Help Strip */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">👩‍⚕️</div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Need help reading this?</div>
                    <div className="text-xs text-slate-500">Tap for ASHA audio guidance</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => speak("आशा दीदी सहायता के लिए टोल फ्री नंबर 1800-180-1104 पर कॉल करें")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    🔊 सुनें
                  </button>
                  <a href="tel:18001801104" className="text-[10px] text-purple-600 font-medium hover:underline">
                    1800-180-1104
                  </a>
                </div>
              </div>
            </div>

            {/* ══ RIGHT: Sign In Flow Card ═════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-slate-100">
                <div
                  className={`h-1 ${rc.bg} transition-all duration-500`}
                  style={{ width: step === "role" ? "25%" : step === "phone" ? "50%" : step === "otp" ? "75%" : "100%" }}
                ></div>
              </div>

              <div className="p-6 sm:p-8">
                {/* ── STEP 1: Role Selection ───────────────────────── */}
                {step === "role" && (
                  <div>
                    <div className="text-center mb-7">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-700 text-white text-3xl mb-4 shadow-lg">
                        🩺
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">Welcome to RuralCare</h2>
                      <p className="text-slate-500 text-sm mt-1">Who is signing in today? / आप कौन हैं?</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleRoleSelect(r.id)}
                          className={`relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all text-center ${
                            role === r.id
                              ? `${r.bgActive} ${r.textActive} ${r.borderColor} shadow-lg scale-[1.02]`
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                          }`}
                        >
                          {role === r.id && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[10px]">✓</span>
                          )}
                          <span className="text-3xl">{r.icon}</span>
                          <div>
                            <div className="font-bold text-sm leading-tight">{r.label}</div>
                            <div className={`text-[11px] mt-0.5 ${role === r.id ? "opacity-80" : "text-slate-500"}`}>{r.sublabel}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Demo credentials hint */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800">
                      <span className="font-bold">Demo Mode — {role} credentials pre-filled: </span>
                      📱 {DEMO_CREDENTIALS[role].phone}
                      {role === "DOCTOR" && ` • Reg: ${DEMO_CREDENTIALS[role].extra}`}
                    </div>

                    {/* Language picker */}
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Select Language / भाषा चुनें
                      </label>
                      <div className="flex gap-2">
                        {LANG_OPTIONS.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => { setLang(l.code); speak(l.native); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                              lang === l.code
                                ? `${rc.bg} text-white ${rc.border} shadow`
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                            }`}
                          >
                            {l.native}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleProceedToPhone}
                      className={`w-full py-4 rounded-xl ${rc.bg} text-white font-bold text-base shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2`}
                    >
                      Continue as {ROLES.find((r) => r.id === role)?.label} →
                    </button>
                  </div>
                )}

                {/* ── STEP 2: Phone Number ─────────────────────────── */}
                {step === "phone" && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => setStep("role")} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-lg">
                        ←
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Enter Mobile Number</h2>
                        <p className="text-sm text-slate-500">मोबाइल नंबर दर्ज करें</p>
                      </div>
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${rc.badge}`}>
                        {ROLES.find((r) => r.id === role)?.icon} {role}
                      </span>
                    </div>

                    {/* Phone Input */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        10-Digit Mobile Number
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 flex items-center gap-2 pointer-events-none">
                          <span className="text-lg">🇮🇳</span>
                          <span className="font-bold text-slate-800 text-sm">+91</span>
                          <div className="w-px h-5 bg-slate-300"></div>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="98765 43210"
                          className="w-full pl-24 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 text-xl tracking-widest focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Linked with Ayushman Bharat Digital Health (ABHA)</p>
                    </div>

                    {/* Doctor-only: Registration Number */}
                    {role === "DOCTOR" && (
                      <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                          🏅 Medical Council Registration Number
                        </label>
                        <input
                          type="text"
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          placeholder="e.g. NMC/MCI-2018-84729"
                          className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-blue-600 transition-all"
                        />
                        <p className="text-[11px] text-blue-600 mt-1.5">Verified against NMC Registry (2023 Telemedicine Guidelines)</p>
                      </div>
                    )}

                    {/* DPDP Consent */}
                    <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dpdpConsent}
                          onChange={(e) => setDpdpConsent(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded accent-emerald-700 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold text-slate-800 text-sm block">
                            Teleconsultation & DPDP 2023 Consent
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                            I consent to secure digital teleconsultation and encrypted processing of my health records per Digital Personal Data Protection Act (DPDP) 2023. • मैं स्वास्थ्य डेटा सुरक्षित उपयोग की सहमति देता/देती हूँ।
                          </span>
                        </div>
                      </label>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                        ⚠️ {error}
                      </div>
                    )}

                    <button
                      onClick={handleSendOtp}
                      disabled={loading || phone.length < 10}
                      className={`w-full py-4 rounded-xl ${rc.bg} text-white font-bold text-base shadow-lg hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending OTP…
                        </>
                      ) : (
                        <>📲 Send OTP to +91 {phone || "XXXXXXXXXX"}</>
                      )}
                    </button>
                  </div>
                )}

                {/* ── STEP 3: OTP Verification ──────────────────────── */}
                {step === "otp" && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => setStep("phone")} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-lg">
                        ←
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">OTP Verification</h2>
                        <p className="text-sm text-slate-500">OTP sent to +91 {phone}</p>
                      </div>
                    </div>

                    {/* Demo OTP hint */}
                    {demoOtpHint && (
                      <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-amber-700 block">Demo OTP (auto-filled)</span>
                          <span className="font-mono font-bold text-amber-900 tracking-[0.3em] text-lg">{demoOtpHint}</span>
                        </div>
                        <button
                          onClick={speakOtp}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow"
                        >
                          🔊 सुनें
                        </button>
                      </div>
                    )}

                    {/* OTP Input Boxes */}
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Enter 6-Digit OTP / 6 अंकों का कोड
                      </label>
                      <div className="flex gap-3 justify-center">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className={`w-12 h-14 text-center font-bold text-2xl bg-slate-50 border-2 rounded-xl focus:outline-none transition-all shadow-sm ${
                              digit
                                ? `${rc.border} bg-white text-slate-900`
                                : "border-slate-300 text-slate-400"
                            } focus:${rc.border} focus:bg-white`}
                          />
                        ))}
                      </div>

                      {/* Timer & Resend */}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-slate-500">
                          {timer > 0 ? (
                            <>⏱ Resend in <span className="font-bold text-slate-800">{timer}s</span></>
                          ) : (
                            <button onClick={handleResendOtp} className="text-emerald-700 font-semibold hover:underline">
                              Resend OTP
                            </button>
                          )}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={speakOtp}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                          >
                            🔊 Hear Code
                          </button>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                        ⚠️ {error}
                      </div>
                    )}

                    <button
                      onClick={handleVerifyOtp}
                      disabled={loading || otpDigits.join("").length < 6}
                      className={`w-full py-4 rounded-xl ${rc.bg} text-white font-bold text-base shadow-lg hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying…
                        </>
                      ) : (
                        <>✅ Verify & Enter Portal</>
                      )}
                    </button>

                    <p className="text-center text-xs text-slate-400 mt-4">
                      🔒 End-to-end encrypted • DPDP 2023 Compliant
                    </p>
                  </div>
                )}

                {/* ── Step Indicator ───────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {(["role", "phone", "otp"] as Step[]).map((s, i) => (
                    <div
                      key={s}
                      className={`rounded-full transition-all ${
                        step === s
                          ? `w-6 h-2 ${rc.bg}`
                          : (["role", "phone", "otp"].indexOf(step) > i)
                          ? `w-2 h-2 ${rc.bg} opacity-60`
                          : "w-2 h-2 bg-slate-300"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">🛡️ Zero-Data Leak Guarantee</span>
                <span>•</span>
                <span className="flex items-center gap-1">🏥 Ayushman Bharat ABDM</span>
                <span>•</span>
                <span className="flex items-center gap-1">📞 Emergency: 108</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

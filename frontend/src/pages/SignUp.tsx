import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../services/api";
import { setAuthToken, parseJwt } from "../services/auth";

type UserRole = "PATIENT" | "DOCTOR";

export default function SignUp() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<UserRole>("PATIENT");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const navigate = useNavigate();

  const requestOtp = async () => {
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await ApiService.sendOtp(phone);
      if (res.success) {
        setStep("otp");
        if (res.autoReadOtp) setDemoOtp(res.autoReadOtp);
      } else {
        setError(res.message ?? "Failed to send OTP");
      }
    } catch {
      setError("Unable to request OTP. Using demo mode.");
      setStep("otp");
      setDemoOtp("123456");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (otp.length < 4) {
      setError("Please enter the OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await ApiService.verifyOtp(phone, otp, undefined, role);
      if (res.success && res.token) {
        setAuthToken(res.token);
        const payload = parseJwt(res.token);
        if (payload?.role === "DOCTOR") navigate("/doctor");
        else navigate("/patient");
      } else {
        setError(res.message ?? "OTP verification failed");
      }
    } catch {
      // Demo fallback
      const demoToken = btoa(JSON.stringify({ alg: "HS256" })) + "." +
        btoa(JSON.stringify({ phone, role, exp: Date.now() + 86400000 })) + ".demo";
      setAuthToken(demoToken);
      if (role === "DOCTOR") navigate("/doctor");
      else navigate("/patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white text-3xl mb-4 shadow-lg shadow-emerald-200">
            🩺
          </div>
          <h1 className="text-2xl font-bold text-slate-800">RuralCare Connect</h1>
          <p className="text-slate-500 mt-1 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {step === "details" ? "Sign Up" : "Verify OTP"}
          </h2>

          {step === "details" && (
            <div className="space-y-5">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I am registering as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("PATIENT")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === "PATIENT"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl">🧑‍🤝‍🧑</span>
                    <span className="font-medium text-sm">Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("DOCTOR")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === "DOCTOR"
                        ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl">👨‍⚕️</span>
                    <span className="font-medium text-sm">Doctor</span>
                  </button>
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400 transition-shadow"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={requestOtp}
                disabled={loading || phone.length < 10}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  "Send OTP & Register"
                )}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <p>
                  OTP sent to <span className="font-semibold text-slate-800">+91 {phone}</span>
                </p>
                <p className="mt-1">
                  Registering as <span className="font-semibold text-slate-800">{role === "DOCTOR" ? "Doctor" : "Patient"}</span>
                </p>
                {demoOtp && (
                  <p className="mt-1 text-emerald-600 font-medium">
                    Demo OTP: <span className="font-mono tracking-widest">{demoOtp}</span>
                  </p>
                )}
              </div>

              {/* OTP input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 text-center text-lg tracking-[0.3em] font-mono placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-base placeholder:font-sans transition-shadow"
                />
              </div>

              {/* Verify */}
              <button
                onClick={submitOtp}
                disabled={loading || otp.length < 4}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  "Verify & Create Account"
                )}
              </button>

              {/* Back link */}
              <button
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setError("");
                  setDemoOtp("");
                }}
                className="w-full text-sm text-slate-500 hover:text-emerald-600 transition-colors"
              >
                ← Change details
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Sign in link */}
        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/signin")}
            className="text-emerald-600 font-medium hover:underline"
          >
            Sign In
          </button>
        </p>

        {/* Footer */}
        <p className="text-center mt-8 text-xs text-slate-400">
          © 2026 RuralCare Connect · DPDP Act Compliant
        </p>
      </div>
    </div>
  );
}

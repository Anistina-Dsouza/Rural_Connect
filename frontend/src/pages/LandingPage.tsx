import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalConsultations: 1240,
    medianWaitMinutes: '4.8',
    activeDoctorsOnline: 2
  });
  const [topDoctor, setTopDoctor] = useState({
    name: 'Dr. Anita Patel (MBBS, MD)',
    specialty: 'Internal Medicine Specialist'
  });

  useEffect(() => {
    ApiService.getClinicalMetrics()
      .then(res => {
        if (res && res.metrics) {
          setMetrics(prev => ({
            ...prev,
            totalConsultations: res.metrics.totalConsultations || prev.totalConsultations,
            medianWaitMinutes: res.metrics.medianWaitMinutes || prev.medianWaitMinutes,
            activeDoctorsOnline: res.metrics.activeDoctorsOnline || prev.activeDoctorsOnline
          }));
        }
      })
      .catch(() => {});

    ApiService.getDoctors()
      .then(res => {
        if (res && res.doctors && res.doctors.length > 0) {
          const doc = res.doctors[0];
          setTopDoctor({
            name: `${doc.name.startsWith('Dr.') ? '' : 'Dr. '}${doc.name}`,
            specialty: doc.specialization || 'Telemedicine Specialist'
          });
        }
      })
      .catch(() => {});
  }, []);

  const playDemoAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('नमस्ते! मुझे दो दिन से हल्का बुखार और उल्टी जैसा लग रहा है।');
      u.lang = 'hi-IN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* Top Notification Bar */}
      <div className="w-full bg-primary-container text-on-primary py-2 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary-fixed">campaign</span>
            <span>Free Community Telehealth Camps Active Today in 42 Primary Health Centers (PHCs)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary-fixed font-semibold">2G/3G Mode: Ultra-Lite (&lt;50 KB per session)</span>
            <span className="hidden sm:inline text-primary-fixed/40">|</span>
            <button
              onClick={playDemoAudio}
              className="underline hover:text-primary-fixed transition-colors font-semibold"
            >
              Listen to Hindi Voice Demo 🔊
            </button>
          </div>
        </div>
      </div>

      {/* Global Header */}
      <header className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high shadow-xs">
        <div className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xl shadow-xs">
              🩺
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-lg text-primary">RuralCare Connect</span>
                <span className="text-xs text-on-surface-variant font-medium">(ग्रामीण सेवा)</span>
              </div>
              <span className="text-[11px] text-on-surface-variant font-medium">AI-Assisted Rural Telemedicine</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <button onClick={() => navigate('/landing')} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary">
              Home
            </button>
            <button onClick={() => navigate('/signin')} className="px-3 py-1.5 rounded-lg hover:bg-surface-container-high hover:text-on-surface transition-all">
              Sign In / Onboarding
            </button>
            <button onClick={() => navigate('/patient')} className="px-3 py-1.5 rounded-lg hover:bg-surface-container-high hover:text-on-surface transition-all">
              Patient Portal
            </button>
            <button onClick={() => navigate('/doctor')} className="px-3 py-1.5 rounded-lg hover:bg-surface-container-high hover:text-on-surface transition-all">
              Doctor Console
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:108"
              className="flex items-center gap-1.5 bg-error-container text-on-error-container px-3 py-1.5 rounded-full text-xs font-bold shadow-xs hover:bg-error hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">emergency</span>
              <span>108 / 102 Emergency</span>
            </a>

            <button
              onClick={() => navigate('/signin')}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs shadow-sm hover:bg-primary-container transition-all"
            >
              Enter Portal
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low to-surface py-16 lg:py-24">
        {/* Glow Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Content (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-surface-container-highest text-primary px-3 py-1 rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  ABDM &amp; Ayushman Bharat Compliant
                </span>
                <span className="inline-flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">speed</span>
                  Average Wait: 7 Mins
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-headline font-bold text-base text-secondary tracking-wide">
                  अपने गांव में घर बैठे डॉक्टर से तुरंत सलाह लें
                </span>
                <h1 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-primary tracking-tight leading-tight">
                  Doctor Consultation In Your Village in Under 10 Minutes.
                </h1>
              </div>

              <p className="text-base text-on-surface-variant max-w-2xl leading-relaxed">
                AI-assisted voice triage in <strong className="text-on-surface font-semibold">Hindi, Gujarati &amp; English</strong>. Optimized specifically for low-bandwidth 2G/3G village connections. Consult verified MBBS medical officers with zero waiting fees.
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/signin')}
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-headline font-bold text-sm shadow-md hover:shadow-xl transition-all group"
                >
                  <span className="material-symbols-outlined text-2xl text-primary-fixed group-hover:scale-110 transition-transform">
                    mic
                  </span>
                  <div className="flex flex-col items-start text-left">
                    <span>Start Free Symptom Check</span>
                    <span className="text-[11px] font-normal text-primary-fixed">आवाज से बताएं (Press to Speak)</span>
                  </div>
                </button>

                <a
                  href="tel:108"
                  className="inline-flex items-center justify-center gap-3 px-5 py-4 bg-error text-on-error rounded-xl font-headline font-bold text-sm shadow-xs hover:bg-on-error-container transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">e911_emergency</span>
                  <div className="flex flex-col items-start text-left">
                    <span>Emergency: 108 / 102</span>
                    <span className="text-[11px] font-normal text-error-container">Immediate Ambulance Help</span>
                  </div>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-on-surface-variant text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">signal_cellular_alt</span>
                  <span>Ultra-low 48kbps WebRTC</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">lock</span>
                  <span>256-Bit Encrypted Triage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">currency_rupee</span>
                  <span>100% Free Rural Tier</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Mosaic (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-surface-container border border-slate-100">
                <img
                  className="w-full h-80 object-cover"
                  alt="Rural health worker using mobile telemedicine"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2P_zHmKmjkkFXaqOqPt_KQc8bNfBrvWAxOtjmy49-e8Cb53cZNc4VQZtabqoeRgY1G09Em6vGY8FHSgFHeF0OLnhTECSS2m9Qz3_db0qIOV1xkNPSRaiTEnxuht4BKKWSE0Vggmm57eTE2rxcsabVyW1vqglhgMmeGtYAr-nM0yYq08KZBksSXntQj2_mbdLD840_9kz_B274IsKC7UX_0qhcJNUm-IevACzqGd2s"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent flex flex-col justify-end p-5 text-on-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-headline font-bold text-base">Sunita Devi (ASHA)</p>
                      <p className="text-xs text-primary-fixed">Khamaria Sub-Health Centre, MP</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest/20 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                      <span className="h-2 w-2 rounded-full bg-primary-fixed animate-ping"></span>
                      <span>Live Queue: 2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Doctor Badge */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-lg -mt-8 mx-4 z-10 flex items-center justify-between gap-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <span className="material-symbols-outlined text-xl">stethoscope</span>
                  </div>
                  <div>
                    <span className="font-headline font-bold text-xs text-on-surface block">{topDoctor.name}</span>
                    <span className="text-[11px] text-on-surface-variant block">{topDoctor.specialty}</span>
                  </div>
                </div>
                <div className="bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded">
                  {metrics.activeDoctorsOnline} Online
                </div>
              </div>
            </div>
          </div>

          {/* Quick Statistics Ribbon */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-md border border-slate-100">
            <div className="flex flex-col">
              <span className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
                {metrics.totalConsultations.toLocaleString()}+
              </span>
              <span className="text-xs text-on-surface-variant font-semibold">Consultations Completed</span>
              <span className="text-[11px] text-secondary font-medium">Madhya Pradesh &amp; Gujarat</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
                &lt; {metrics.medianWaitMinutes} Mins
              </span>
              <span className="text-xs text-on-surface-variant font-semibold">Avg Doctor Connect Time</span>
              <span className="text-[11px] text-secondary font-medium">Reduced from 180 min PHC wait</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">100% Free</span>
              <span className="text-xs text-on-surface-variant font-semibold">Ayushman Sponsored Tier</span>
              <span className="text-[11px] text-secondary font-medium">Zero cost to rural citizen</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">48 kbps</span>
              <span className="text-xs text-on-surface-variant font-semibold">Low Data Requirement</span>
              <span className="text-[11px] text-secondary font-medium">Runs seamlessly on 2G &amp; 3G</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-surface-container-high py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-primary">RuralCare Connect</span>
            <span>•</span>
            <span>National Telemedicine Mission • DPDP Act 2023 Compliant</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/signin')} className="hover:text-primary font-medium">Sign In</button>
            <button onClick={() => navigate('/patient')} className="hover:text-primary font-medium">Patient Portal</button>
            <button onClick={() => navigate('/doctor')} className="hover:text-primary font-medium">Doctor Console</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

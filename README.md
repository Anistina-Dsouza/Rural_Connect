# RuralCare Connect 🩺🌾
### AI-Assisted Rural Telemedicine & Clinical Triage Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Telemedicine Practice Guidelines](https://img.shields.io/badge/Compliant-India%20Telemedicine%202020-blue.svg)](https://www.nmc.org.in/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Bundle Size](https://img.shields.io/badge/Bundle-Under%201MB%20(Target%20%3C40MB)-success.svg)]()

> **RuralCare Connect** is a lightweight, multilingual, voice-first telemedicine and AI clinical triage platform engineered for residents living far from hospitals or clinics across rural India.

---

## 📖 Executive Summary & PRD Alignment

Built strictly according to the **RuralCare Connect Product Requirements Document (PRD v1.0)**, this platform bridges the critical healthcare gap where hospital travel often takes hours and costs an entire day's wages.

### Key Personas Supported:
- **Sunita (34, Farm labourer & mother):** Limited literacy, voice-first navigation, simple regional language (Hindi / Gujarati), child health guidance.
- **Ramesh (62, Retired farmer):** Chronic hypertension/diabetes follow-ups, large touch targets, shared family smartphone accounts.
- **Dr. Patel (41, Licensed General Physician):** Remote consultations, AI-generated intake summaries, digital prescription builder with statutory safety guardrails.
- **Clinical Governance & Health Officers:** Audit trails, red-flag accuracy monitoring, safety rule overrides.

---

## 🌟 Core Feature Matrix (PRD Requirements)

| PRD Req ID | Feature | Implementation in Codebase |
|------------|---------|----------------------------|
| **FR-1.1** | Phone & OTP Sign-in | Auto-read SMS simulation with instant code population (`OnboardingModal.tsx`) |
| **FR-1.2** | Multilingual First Launch | Full dynamic switching across **Hindi (हिन्दी)**, **Gujarati (ગુજરાતી)**, and **English** (`translations.ts`) |
| **FR-1.3** | Telemedicine & Data Consent | Explicit revocable consent compliant with India DPDP Act 2023 |
| **FR-1.4 & FR-1.9** | Shared Phone Family Profiles | Multi-profile picker (Self, Child, Elder, Pregnant) with independent vitals (`ProfilePicker.tsx`) |
| **FR-1.6 & FR-1.7** | Voice OTP & Read Aloud | "Call me with code" automated call fallback + "Read code aloud" speaker button for low-literacy users |
| **FR-2.1** | Voice & Text Input | Web Speech API speech-to-text with microphone tap (`speech.ts`) |
| **FR-2.2** | Structured AI Follow-ups | Interactive clinical inquiry: duration, severity, age, pregnancy, chronic conditions (`SymptomChat.tsx`) |
| **FR-2.3** | Three-tier Triage | Classifies cases into **Emergency (Red)**, **Consult Soon (Yellow)**, or **Self-Care (Green)** (`aiTriageEngine.ts`) |
| **FR-2.4** | Clinician Interim Advice | Approved non-pharmacological advice library (ORS formulation, steam, hydration). **Zero AI drug prescriptions** |
| **FR-2.5** | Plain-language Disclaimer | "AI triage guidance only - not a doctor diagnosis" visible on every turn |
| **FR-2.6** | Red-Flag Immediate Escalation | Immediate detection of chest pain, breathing difficulty, stroke signs, obstetric bleeding, infant fever; bypasses questions directly to Emergency Screen |
| **FR-2.7** | AI Doctor Handover Summary | Generates structured chief complaint, timeline, vitals notes, and triage classification for doctor console |
| **FR-2.8** | Cautious Uncertainty Bias | Ambiguous or unclear inputs automatically default to higher caution triage level |
| **FR-2.9** | Skip AI Button | One-click "Consult Doctor Directly" bypass |
| **FR-3.1 & FR-3.2** | Emergency Flow & Facilities | One-tap **108 Ambulance** and **112 Helpline** dialers + nearby CHC/PHC facility GPS directory (`EmergencyScreen.tsx`) |
| **FR-4.1 - FR-4.3** | Virtual Queue & Rejoin Window | Real-time queue position, estimated wait countdown, and 5-minute reconnect grace window |
| **FR-4.2** | Low-Bandwidth Mode | Adaptive video degrading to **150kbps low-res** and **Audio-Only 2G fallback** (`VideoCallRoom.tsx`) |
| **FR-4.7** | In-Call Text Chat | Fallback text messaging inside consultation room if audio stutters |
| **FR-5.1 & FR-5.2** | Digital Prescription & PDF | NMC-compliant doctor e-prescription with diagnosis, bilingual schedule, digital signature, and verification QR code (`pdfGenerator.ts`) |
| **FR-5.3 & FR-5.5** | WhatsApp & Offline Storage | One-click WhatsApp sharing, downloadable PDF, and local offline cache |
| **FR-5.6** | Pharmacist QR Verification | Pharmacist verification portal (`PrescriptionVerifier.tsx`) to validate authenticity |
| **FR-5.7** | Telemedicine Drug Guardrail | Statutory block preventing doctors from prescribing Schedule X / controlled narcotics online |
| **FR-7.1 & FR-7.2** | Doctor NMC Verification | Verified doctor badge, council registration display, and live queue feed (`DoctorConsole.tsx`) |
| **FR-7.3 & FR-7.4** | Clinical Governance Dashboard | Triage audit logs, doctor-AI concordance tracking (&lt;5% target), and red-flag rule management (`AdminDashboard.tsx`) |

---

## 🏗️ Architecture & Technology Stack

- **Frontend & App Engine:** React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Audio & Accessibility Layer:** Web Speech Recognition API (Speech-to-Text in Hindi/Gujarati/English) and Web Speech Synthesis API (Text-to-Speech).
- **Document & Verification Layer:** `jsPDF` for client-side verifiable PDF generation; `qrcode` for cryptographic pharmacist scanning.
- **Low-Bandwidth Optimization:** CSS and client asset payload under 1MB (PRD Target &lt;40MB), compatible with Android 8+ and 2G/3G connections.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or v20+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/RuralConnect.git
cd RuralConnect

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
```

---

## 🛡️ Clinical Governance & Regulatory Compliance

1. **National Telemedicine Practice Guidelines (India 2020):**
   - Strictly enforces doctor identity verification via National Medical Commission (NMC) registration numbers.
   - Enforces Schedule X drug prohibitions: sedatives, injectables, narcotics, and habit-forming drugs are systematically blocked from online prescriptions.
2. **Digital Personal Data Protection (DPDP) Act 2023:**
   - Granular consent capture prior to consultations.
   - No identifiable patient data utilized for AI model fine-tuning without explicit consent.
   - Secure role-based access control ensuring doctors access only assigned consultation cases.

---

## 📄 License
Released under the [MIT License](LICENSE).

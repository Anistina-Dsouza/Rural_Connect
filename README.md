# RuralCare Connect 🩺🌾
### Full-Stack MERN AI-Assisted Rural Telemedicine & Clinical Triage Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Stack: MERN](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-success.svg)]()
[![Telemedicine Practice Guidelines](https://img.shields.io/badge/Compliant-India%20Telemedicine%202020-blue.svg)](https://www.nmc.org.in/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

> **RuralCare Connect** is a full-stack MERN telemedicine and clinical AI triage platform engineered for residents living far from clinics across rural India (Hindi, Gujarati, English).

---

## 🏛️ Project Architecture (MERN Monorepo)

```
RuralConnect/
├── package.json              # Root orchestrator scripts (dev, build)
├── README.md                 # Complete system documentation
├── .gitignore                # Production ignore rules
│
├── backend/                  # Express.js REST API & Database Service
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # Express server & CORS configuration
│       ├── db.ts             # MongoDB connection with zero-latency in-memory fallback
│       ├── store.ts          # Centralized repository & pilot seed data
│       ├── models/
│       │   └── types.ts      # Clinical & User data schemas
│       ├── controllers/
│       │   ├── authController.ts         # OTP generation, SMS auto-read, DPDP consent
│       │   ├── profileController.ts      # Multi-profile household dependent management
│       │   ├── triageController.ts       # AI clinical triage, red-flag escalation, interim advice
│       │   ├── consultationController.ts # Waiting room queue, in-call chat, WebRTC handover
│       │   ├── prescriptionController.ts # Rx builder, Schedule X drug blocker, QR verification
│       │   ├── adminController.ts        # Clinical governance & concordance tracking
│       │   └── facilityController.ts     # Nearby CHC/PHC hospital emergency directory
│       └── routes/
│           └── api.ts                    # Clean unified /api route map
│
└── frontend/                 # React 18 + Vite + TypeScript + Tailwind Client
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── services/
        │   └── api.ts        # Unified API Client connecting to backend
        ├── components/
        │   ├── Header.tsx                # Language switcher, 2G low-data toggle, emergency dialer
        │   ├── OnboardingModal.tsx       # Phone sign-in, auto-read SMS simulation, spoken OTP
        │   ├── ProfilePicker.tsx         # Household profile switcher (Sunita, Ramesh, Child)
        │   ├── SymptomChat.tsx           # Voice & text AI triage assistant
        │   ├── EmergencyScreen.tsx       # 108/112 dialer & nearby health center locator
        │   ├── ConsultationQueue.tsx     # Virtual waiting room with live countdown
        │   ├── VideoCallRoom.tsx         # Video/Audio consultation room with in-call chat
        │   ├── DoctorConsole.tsx         # Doctor workspace with AI summary & Rx builder
        │   ├── PrescriptionViewer.tsx    # Verifiable e-Prescription with QR & PDF download
        │   ├── PrescriptionVerifier.tsx  # Pharmacist verification portal (/verify)
        │   └── AdminDashboard.tsx        # Clinical governance metrics & safety audit
        ├── data/
        │   ├── translations.ts           # Complete Hindi, Gujarati, English dictionaries
        │   └── clinicalLibrary.ts        # Red flags, non-pharmacological advice, formulary
        ├── utils/
        │   ├── aiTriageEngine.ts         # Clinical triage heuristic evaluation
        │   ├── pdfGenerator.ts           # jsPDF e-Prescription generator with QR code
        │   └── speech.ts                 # Web Speech API recognition & speech synthesis
        └── App.tsx                       # Main application shell with seamless dynamic flow
```

---

## ⚡ REST API Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Auth** | `POST` | `/api/auth/send-otp` | Sends SMS OTP with auto-read simulation |
| **Auth** | `POST` | `/api/auth/verify-otp` | Verifies OTP and returns user session |
| **Auth** | `POST` | `/api/auth/consent` | Stores explicit DPDP Act 2023 consent |
| **Profiles** | `GET` | `/api/profiles` | Fetches all dependent profiles for account |
| **Profiles** | `POST` | `/api/profiles/add` | Adds new family member (Child, Elder, etc.) |
| **Profiles** | `POST` | `/api/profiles/switch` | Switches active household profile |
| **Triage** | `POST` | `/api/triage/assess` | AI clinical triage evaluation & doctor summary |
| **Queue** | `POST` | `/api/queue/join` | Enqueues patient in virtual waiting room |
| **Queue** | `GET` | `/api/queue/:id` | Polls live queue position and wait time |
| **Consultation**| `POST` | `/api/consultations/:id/chat` | Sends in-call text message |
| **Consultation**| `POST` | `/api/consultations/:id/end` | Concludes consultation session |
| **Prescriptions**| `POST`| `/api/prescriptions` | Issues e-prescription with drug safety check |
| **Prescriptions**| `GET` | `/api/prescriptions/:id` | Fetches prescription by ID |
| **Prescriptions**| `GET` | `/api/prescriptions/verify/:id` | Pharmacist QR code verification portal |
| **Admin** | `GET` | `/api/admin/metrics` | Clinical governance KPIs (emergency recall &ge;99%) |
| **Admin** | `GET` | `/api/admin/audit` | Clinical review audit log |
| **Facilities** | `GET` | `/api/facilities` | Nearby emergency centers (CHC, PHC, District Civil) |

---

## 🚀 Running the Project

### 1. Start Both Frontend & Backend Together
From the root directory:
```bash
npm run dev
```

- **Frontend Client:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

### 2. Independent Service Scripts
```bash
# Start backend server only
npm run dev:backend

# Start frontend client only
npm run dev:frontend

# Build both services for production
npm run build
```

---

## 🛡️ Telemedicine & Safety Compliance

1. **Zero AI Diagnosis & Prescriptions (`FR-2.4`, `FR-2.5`)**:
   The AI assistant acts exclusively as a triage and guidance tool. It never diagnoses and never recommends prescription medications or specific doses.
2. **Statutory Drug Safety Block (`FR-5.7`)**:
   Controlled substances (Schedule X, narcotics, sedatives) are blocked from teleconsultation prescriptions per National Medical Commission (NMC) Guidelines 2020.
3. **Emergency Escalation (`FR-2.6`, `FR-3.1`)**:
   Red flags (cardiac, acute respiratory distress, stroke signs, severe hemorrhage, obstetric complications, infant fever) trigger direct escalation to the 108 Ambulance protocol.

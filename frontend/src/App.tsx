import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignIn />} />
        {/* Patient protected area */}
        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}> 
          <Route path="/patient/*" element={<PatientDashboard />} />
        </Route>
        {/* Doctor protected area */}
        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}> 
          <Route path="/doctor/*" element={<DoctorDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

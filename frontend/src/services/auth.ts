export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('ruralcare_session_phone');
  localStorage.removeItem('ruralcare_session_role');
  localStorage.removeItem('ruralcare_session_lang');
  localStorage.removeItem('ruralcare_session_verified');
  localStorage.removeItem('ruralcare_session_consent');
  localStorage.removeItem('ruralcare_doctor_name');
  localStorage.removeItem('ruralcare_doctor_regno');
};

export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/** Read cached doctor profile from localStorage */
export const getDoctorSession = (): { name: string; regNo: string; phone: string } => {
  return {
    name: localStorage.getItem('ruralcare_doctor_name') || 'Dr. RuralCare Physician',
    regNo: localStorage.getItem('ruralcare_doctor_regno') || 'NMC-00000',
    phone: localStorage.getItem('ruralcare_session_phone') || '',
  };
};

/** Save doctor profile to localStorage after login */
export const setDoctorSession = (name: string, regNo: string) => {
  localStorage.setItem('ruralcare_doctor_name', name);
  localStorage.setItem('ruralcare_doctor_regno', regNo);
};


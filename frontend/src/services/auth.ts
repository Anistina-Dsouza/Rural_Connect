const TAB_AUTH_TOKEN_KEY = 'ruralcare_tab_auth_token';
const ROLE_AUTH_TOKEN_PREFIX = 'ruralcare_auth_token_';

export const setAuthToken = (token: string) => {
  const role = parseJwt(token)?.role;
  sessionStorage.setItem(TAB_AUTH_TOKEN_KEY, token);

  if (typeof role === 'string') {
    sessionStorage.setItem('ruralcare_session_role', role);
    localStorage.setItem(`${ROLE_AUTH_TOKEN_PREFIX}${role}`, token);
  }
};

export const getAuthToken = (): string | null => {
  const tabToken = sessionStorage.getItem(TAB_AUTH_TOKEN_KEY);
  if (tabToken) return tabToken;

  const sessionRole = sessionStorage.getItem('ruralcare_session_role');
  const storedRole = sessionRole || localStorage.getItem('ruralcare_session_role');
  const roleToken = storedRole
    ? localStorage.getItem(`${ROLE_AUTH_TOKEN_PREFIX}${storedRole}`)
    : null;
  const legacyToken = localStorage.getItem('authToken');
  const token = roleToken || legacyToken;
  if (!token) return null;

  const tokenRole = parseJwt(token)?.role;
  if (storedRole && tokenRole && storedRole !== tokenRole) return null;

  sessionStorage.setItem(TAB_AUTH_TOKEN_KEY, token);
  if (typeof tokenRole === 'string') {
    sessionStorage.setItem('ruralcare_session_role', tokenRole);
  }
  return token;
};

export const clearAuth = () => {
  const role = sessionStorage.getItem('ruralcare_session_role');
  sessionStorage.removeItem(TAB_AUTH_TOKEN_KEY);
  sessionStorage.removeItem('ruralcare_session_role');
  if (role) localStorage.removeItem(`${ROLE_AUTH_TOKEN_PREFIX}${role}`);
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

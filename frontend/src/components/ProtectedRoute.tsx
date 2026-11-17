import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, parseJwt } from '../services/auth';

interface Props {
  allowedRoles: ('PATIENT' | 'DOCTOR' | 'ADMIN')[ ];
}

/**
 * Checks JWT token for a valid role and either renders the child route
 * (via <Outlet/>) or redirects to the sign‑in page.
 */
export default function ProtectedRoute({ allowedRoles }: Props) {
  const token = getAuthToken();
  if (!token) return <Navigate to="/signin" replace />;
  const payload = parseJwt(token);
  if (!payload?.role || !allowedRoles.includes(payload.role)) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}


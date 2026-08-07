import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/storeHooks';
import { normalizeRole, type AppRole } from '../config/permissions';

interface ProtectedRouteProps {
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { token, user } = useAppSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = normalizeRole(user?.role);

  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
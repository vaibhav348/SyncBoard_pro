import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../hooks/storeHooks';
import { normalizeRole, type AppRole } from '../../config/permissions';

interface Props {
  allowedRoles: AppRole[];
}

const RoleGuard = ({ allowedRoles }: Props) => {
  const { user } = useAppSelector((state) => state.auth);
  const normalizedRole = normalizeRole(user?.role);

  if (allowedRoles.includes(normalizedRole)) {
    return <Outlet />;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default RoleGuard;

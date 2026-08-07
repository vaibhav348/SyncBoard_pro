import { useMemo } from 'react';
import { useAppSelector } from './storeHooks';
import { hasPermission, type PermissionKey, normalizeRole, type AppRole } from '../config/permissions';

export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.auth);

  return useMemo(() => {
    const role = normalizeRole(user?.role);

    return {
      role,
      hasPermission: (permission: PermissionKey | PermissionKey[]) => hasPermission(role, permission),
      canAccess: (allowedRoles: AppRole[]) => allowedRoles.includes(role),
    };
  }, [user?.role]);
};

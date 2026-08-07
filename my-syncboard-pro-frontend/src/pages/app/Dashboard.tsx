import { useAppSelector } from '../../hooks/storeHooks';
import { useDashboardData } from '../../hooks/useDashboardData';
import { normalizeRole } from '../../config/permissions';
import type { DashboardRole } from '../../types/dashboard.types';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import AdminDashboard, { SuperAdminDashboard } from '../../components/dashboard/AdminDashboard';
import ManagerDashboard from '../../components/dashboard/ManagerDashboard';
import DeveloperDashboard from '../../components/dashboard/DeveloperDashboard';
import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const role = normalizeRole(user?.role ?? 'employee') as DashboardRole;
  const data = useDashboardData();

  return (
    <div className="h-full min-h-0 flex flex-col justify-start overflow-y-auto overflow-x-hidden bg-white px-4 pt-8 pb-10 sm:px-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <DashboardHeader userName={user?.name ?? ''} role={role} />

        {data.loading ? (
          <DashboardSkeleton />
        ) : data.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Dashboard unavailable</p>
              <p className="text-sm text-red-700 mt-1">{data.error}</p>
            </div>
          </div>
        ) : (
          <>
            {role === 'superadmin' && <SuperAdminDashboard data={data} />}
            {role === 'owner' && <AdminDashboard data={data} />}
            {role === 'manager' && <ManagerDashboard data={data} />}
            {role === 'employee' && <DeveloperDashboard data={data} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

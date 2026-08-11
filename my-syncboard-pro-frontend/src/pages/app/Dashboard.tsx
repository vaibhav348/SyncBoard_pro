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
    <div className="h-full min-h-0 flex flex-col justify-start overflow-y-auto overflow-x-hidden bg-slate-50 px-4 pt-8 pb-14 sm:px-10 lg:px-20">
      {/* Soft directional wash behind the header — quiet, not decorative for its own sake */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-white to-transparent" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <DashboardHeader userName={user?.name ?? ''} role={role} />

        {data.loading ? (
          <DashboardSkeleton />
        ) : data.error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">Dashboard unavailable</p>
              <p className="mt-1 text-sm leading-relaxed text-red-700">{data.error}</p>
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
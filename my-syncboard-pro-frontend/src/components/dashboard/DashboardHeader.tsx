import { Sparkles } from 'lucide-react';
import { heroCopy } from '../../config/dashboardConfig';
import type { DashboardRole } from '../../types/dashboard.types';

interface Props {
  userName: string;
  role: DashboardRole;
}

const formatRole = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

const DashboardHeader = ({ userName, role }: Props) => {
  const copy = heroCopy[role];

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600 shadow-sm">
            <Sparkles size={12} className="text-zinc-900" />
            Role-based dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Welcome back, {userName || 'there'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-[15px]">
            {copy.title} — {copy.subtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm shadow-sm">
          <p className="font-semibold text-zinc-950">{formatRole(role)}</p>
          <p className="text-zinc-600">Primary dashboard view</p>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
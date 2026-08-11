import { Sparkles } from 'lucide-react';
import { heroCopy } from '../../config/dashboardConfig';
import type { DashboardRole } from '../../types/dashboard.types';

interface Props {
  userName: string;
  role: DashboardRole;
}

const formatRole = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

// Signature system: each role carries one accent color through the whole
// dashboard (header bar, icon tiles, badges) so the four views stay
// instantly distinguishable while everything else stays neutral ink/slate.
const roleTheme: Record<DashboardRole, {
  bar: string; iconBg: string; iconText: string; pillText: string; pillBg: string; pillBorder: string;
}> = {
  superadmin: { bar: 'from-indigo-500 via-indigo-400 to-violet-400', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600', pillText: 'text-indigo-700', pillBg: 'bg-indigo-50', pillBorder: 'border-indigo-200' },
  owner:      { bar: 'from-blue-500 via-blue-400 to-sky-400',       iconBg: 'bg-blue-50',   iconText: 'text-blue-600',   pillText: 'text-blue-700',   pillBg: 'bg-blue-50',   pillBorder: 'border-blue-200' },
  // 'admin' mirrors 'owner' — same operational-control accent (blue).
  admin:      { bar: 'from-blue-500 via-blue-400 to-sky-400',       iconBg: 'bg-blue-50',   iconText: 'text-blue-600',   pillText: 'text-blue-700',   pillBg: 'bg-blue-50',   pillBorder: 'border-blue-200' },
  manager:    { bar: 'from-amber-500 via-amber-400 to-orange-400',  iconBg: 'bg-amber-50',  iconText: 'text-amber-600',  pillText: 'text-amber-700',  pillBg: 'bg-amber-50',  pillBorder: 'border-amber-200' },
  employee:   { bar: 'from-emerald-500 via-emerald-400 to-teal-400',iconBg: 'bg-emerald-50',iconText: 'text-emerald-600',pillText: 'text-emerald-700',pillBg: 'bg-emerald-50',pillBorder: 'border-emerald-200' },
};

const DashboardHeader = ({ userName, role }: Props) => {
  const copy = heroCopy[role];
  const theme = roleTheme[role];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.14)]">
      {/* Signature accent rail — the one colored, role-specific element */}
      <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} aria-hidden="true" />

      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full border ${theme.pillBorder} ${theme.pillBg} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.pillText}`}>
            <Sparkles size={12} />
            Role-based dashboard
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-[2.25rem]">
            Welcome back, {userName || 'there'}
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-slate-600">
            <span className="font-medium text-slate-800">{copy.title}</span>
            <span className="text-slate-400"> — </span>
            {copy.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconText} text-sm font-bold`}>
            {formatRole(role).slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-950">{formatRole(role)}</p>
            <p className="text-xs leading-tight text-slate-500">Primary dashboard view</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
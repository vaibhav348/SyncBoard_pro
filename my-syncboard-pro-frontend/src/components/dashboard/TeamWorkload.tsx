import { Users } from 'lucide-react';
import EmptyState from '../EmptyState';
import ProgressBar from './ProgressBar';
import type { TeamMemberLoad } from '../../types/dashboard.types';

const CARD =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.14)]';

const getInitials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const TeamWorkload = ({ members }: { members: TeamMemberLoad[] }) => {
  if (members.length === 0) {
    return (
      <div className={`${CARD} p-5`}>
        <EmptyState
          icon={<Users size={18} />}
          title="No team members yet"
          description="Add members to your project to see their workload here."
          actionLabel="Add member"
          actionTo="/invite"
        />
      </div>
    );
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Team workload</h2>
            <p className="text-xs text-slate-400">Capacity balance across your team</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Live
        </span>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        {members.map((m) => {
          const loadPct = Math.round((m.openIssues / m.capacity) * 100);
          // Load color: green < 60%, amber 60-85%, red > 85%
          const loadColor =
            loadPct > 85 ? '#ef4444' : loadPct > 60 ? '#f59e0b' : '#22c55e';

          return (
            <div
              key={m.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 transition-colors hover:border-slate-200 hover:bg-white"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-[10px] font-semibold text-slate-700">
                    {getInitials(m.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                </div>

                {/* Monochrome badge + semantic dot — no colored background */}
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-600">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: loadColor }}
                  />
                  {m.openIssues} issues
                </div>
              </div>
              <ProgressBar value={loadPct} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamWorkload;
import { Users } from 'lucide-react';
import EmptyState from '../EmptyState';
import ProgressBar from './ProgressBar';
import type { TeamMemberLoad } from '../../types/dashboard.types';

const getInitials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const TeamWorkload = ({ members }: { members: TeamMemberLoad[] }) => {
  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Team workload</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Capacity balance across your team</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-500">
          Live
        </span>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {members.map((m) => {
          const loadPct = Math.round((m.openIssues / m.capacity) * 100);
          // Load color: green < 60%, amber 60-85%, red > 85%
          const loadColor =
            loadPct > 85 ? '#ef4444' : loadPct > 60 ? '#f59e0b' : '#22c55e';

          return (
            <div
              key={m.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 transition-colors hover:border-zinc-200"
            >
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-[10px] font-semibold text-zinc-700 shrink-0">
                    {getInitials(m.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{m.name}</p>
                    <p className="text-xs text-zinc-500">{m.role}</p>
                  </div>
                </div>

                {/* Monochrome badge + semantic dot — no colored background */}
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-white text-zinc-600 shrink-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
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
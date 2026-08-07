import { Building2 } from 'lucide-react';
import EmptyState from '../EmptyState';
import type { CompanySummary } from '../../types/dashboard.types';

const statusDot: Record<string, string> = {
  active:   '#22c55e',
  inactive: '#6b7280',
};

const SystemOverview = ({ companies }: { companies: CompanySummary[] }) => {
  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <EmptyState
          icon={<Building2 size={18} />}
          title="No companies on the platform"
          description="Workspaces will appear here as they sign up."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900">Companies on platform</h2>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {companies.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 transition-colors hover:border-zinc-200"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
              <p className="text-xs text-zinc-500">
                {c.projectCount} projects · {c.memberCount} members
              </p>
            </div>

            {/* Semantic dot + monochrome badge */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-white text-zinc-600 shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusDot[c.status] ?? statusDot.inactive }}
              />
              {c.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemOverview;
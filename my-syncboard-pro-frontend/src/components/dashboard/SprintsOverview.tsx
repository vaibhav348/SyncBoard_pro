import { Layers } from 'lucide-react';
import EmptyState from '../EmptyState';

export interface SprintOverviewRow {
  id: string;
  name: string;
  status: string;
  storyCount: number;
  totalPoints: number;
}

// Semantic dot only — badge stays monochrome
const statusDot: Record<string, string> = {
  active:    '#3b82f6',
  planned:   '#6b7280',
  completed: '#22c55e',
};

const SprintsOverview = ({ sprints }: { sprints: SprintOverviewRow[] }) => {
  if (sprints.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <EmptyState
          icon={<Layers size={18} />}
          title="No sprints yet"
          description="Sprints you create or open will show up here."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Sprints</h2>
          <p className="mt-0.5 text-xs text-zinc-500">From the last project you opened</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-500">
          {sprints.length} total
        </span>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {sprints.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 transition-colors hover:border-zinc-200"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate max-w-[220px]">
                {s.name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {s.storyCount} stor{s.storyCount === 1 ? 'y' : 'ies'} · {s.totalPoints} pts
              </p>
            </div>

            {/* Semantic dot + monochrome badge */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-white text-zinc-600 shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusDot[s.status] ?? statusDot.planned }}
              />
              {s.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SprintsOverview;
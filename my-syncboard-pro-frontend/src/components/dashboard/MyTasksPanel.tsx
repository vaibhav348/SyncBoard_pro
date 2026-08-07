import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import EmptyState from '../EmptyState';
import type { IssueSummary } from '../../types/dashboard.types';

// Semantic dot colors — badge itself stays monochrome
const statusDot: Record<IssueSummary['status'], string> = {
  'todo':        '#6b7280',
  'in-progress': '#3b82f6',
  'done':        '#22c55e',
};

const MyIssuesPanel = ({ issues }: { issues: IssueSummary[] }) => {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <EmptyState
          icon={<CheckCircle2 size={18} />}
          title="No issues assigned"
          description="When you're assigned to issues, they will show up here."
          actionLabel="Browse projects"
          actionTo="/projects"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">My work</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Issues assigned to you</p>
        </div>
        <Link
          to="/my-tasks"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {issues.map((t) => {
          const content = (
            <>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {t.issueKey && (
                    <span className="font-mono text-[10px] text-zinc-400 shrink-0 uppercase">
                      #{t.issueKey}
                    </span>
                  )}
                  <p className="text-sm font-medium text-zinc-900 truncate">{t.title}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{t.projectName}</p>
              </div>

              {/* Semantic dot + monochrome badge */}
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-white text-zinc-600 shrink-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: statusDot[t.status] }}
                />
                {t.status.replace('-', ' ')}
              </div>
            </>
          );

          if (t.projectId && t.id) {
            return (
              <Link
                key={t.id}
                to={`/project/${t.projectId}/issue/${t.id}`}
                state={{ returnTo: '/dashboard' }}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyIssuesPanel;
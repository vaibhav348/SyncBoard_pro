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

const CARD =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.14)]';

const MyIssuesPanel = ({ issues }: { issues: IssueSummary[] }) => {
  if (issues.length === 0) {
    return (
      <div className={`${CARD} p-5`}>
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
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">My work</h2>
            <p className="text-xs text-slate-400">Issues assigned to you</p>
          </div>
        </div>
        
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        {issues.map((t) => {
          const content = (
            <>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {t.issueKey && (
                    <span className="shrink-0 font-mono text-[10px] uppercase text-slate-400">
                      #{t.issueKey}
                    </span>
                  )}
                  <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{t.projectName}</p>
              </div>

              {/* Semantic dot + monochrome badge */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-600">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
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
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 transition-colors hover:border-slate-300 hover:bg-white"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5"
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
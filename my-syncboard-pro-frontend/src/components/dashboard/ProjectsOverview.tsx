import { FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../EmptyState';
import ProgressBar from './ProgressBar';
import type { ProjectSummary } from '../../types/dashboard.types';

const CARD =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.14)]';

const ProjectsOverview = ({ projects }: { projects: ProjectSummary[] }) => {
  if (projects.length === 0) {
    return (
      <div className={`${CARD} p-5`}>
        <EmptyState
          icon={<FolderKanban size={18} />}
          title="No projects yet"
          description="Create your first project to start organizing your team's work."
          actionLabel="Create project"
          actionTo="/projects/new"
        />
      </div>
    );
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <FolderKanban size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Projects</h2>
            <p className="text-xs text-slate-400">Current momentum across your workspace</p>
          </div>
        </div>
        <Link
          to="/projects"
          className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          View all
        </Link>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="block rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 transition-colors hover:border-slate-300 hover:bg-white"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">Owner · {p.ownerName}</p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                {p.memberCount} members
              </span>
            </div>
            <ProgressBar value={p.progress} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectsOverview;
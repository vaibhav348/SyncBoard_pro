import { FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../EmptyState';
import ProgressBar from './ProgressBar';
import type { ProjectSummary } from '../../types/dashboard.types';

const ProjectsOverview = ({ projects }: { projects: ProjectSummary[] }) => {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Projects</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Current momentum across your workspace</p>
        </div>
        <Link
          to="/projects"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="block rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
                <p className="text-xs text-zinc-500">Owner · {p.ownerName}</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-white text-zinc-500 shrink-0">
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
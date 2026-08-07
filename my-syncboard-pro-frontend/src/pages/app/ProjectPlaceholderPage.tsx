import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppSelector } from '../../hooks/storeHooks';

interface ProjectPlaceholderPageProps {
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
}

const ProjectPlaceholderPage = ({ title, description, badge, icon: Icon }: ProjectPlaceholderPageProps) => {
  const { projectId } = useParams<{ projectId?: string }>();
  const { data: activeProject } = useAppSelector((state) => state.activeProject);
  const projectName = activeProject?.name ?? 'Selected project';

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-[24px] border border-border bg-bg p-8 shadow-sm">
      <Link to={projectId ? `/projects/${projectId}` : '/projects'} className="inline-flex items-center gap-2 text-sm font-medium text-text/70 transition-colors hover:text-accent">
        <ArrowLeft size={16} />
        Back to overview
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-accent-bg text-accent">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{badge}</p>
          <h1 className="text-2xl font-semibold text-text-h">{title}</h1>
        </div>
      </div>

      <p className="text-sm leading-6 text-text/70">{description}</p>

      <div className="rounded-2xl border border-border bg-accent-bg/70 p-4 text-sm text-text/70">
        You are currently viewing <span className="font-semibold text-text-h">{projectName}</span>.
      </div>
    </div>
  );
};

export default ProjectPlaceholderPage;

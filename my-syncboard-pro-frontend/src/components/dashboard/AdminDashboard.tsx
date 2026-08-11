import {
  Building2, CheckCircle2, FolderKanban, Users,
} from 'lucide-react';
import type { Metric } from '../../types/dashboard.types';
import type { UseDashboardDataResult } from '../../hooks/useDashboardData';
import MetricsGrid from './MetricsGrid';
import ProjectsOverview from './ProjectsOverview';
import TeamWorkload from './TeamWorkload';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import { quickActionsByRole } from '../../config/dashboardConfig';
import SystemOverview from './SystemOverview';

interface Props {
  data: UseDashboardDataResult;
}

const withIcons = (metrics: Omit<Metric, 'icon'>[], icons: Array<Metric['icon']>): Metric[] =>
  metrics.map((m, i) => ({ ...m, icon: icons[i] }));

// Owner / admin role accent: blue
const ICON_CLASS = 'text-blue-600';

const AdminDashboard = ({ data }: Props) => {
  const metrics = withIcons(data.metricsForOwner, [
    <FolderKanban size={16} key="p" className={ICON_CLASS} />,
    <CheckCircle2 size={16} key="o" className={ICON_CLASS} />,
    <Building2 size={16} key="c" className={ICON_CLASS} />,
  ]);

  return (
    <>
  <div className="flex flex-wrap items-stretch gap-4">
  <MetricsGrid metrics={metrics} />
  <QuickActions actions={quickActionsByRole.owner} />
</div>
 
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <ProjectsOverview projects={data.projectSummaries} />
          <TeamWorkload members={data.teamWorkload} />
        </div>
        <div className="space-y-6">
          <ActivityFeed items={data.activity} accentBg="bg-blue-50" accentText="text-blue-600" />
        </div>
      </section>
    </>
  );
};

export const SuperAdminDashboard = ({ data }: Props) => {
  const SUPER_ICON_CLASS = 'text-indigo-600';
  return (
    <>
      <MetricsGrid metrics={withIcons(data.metricsForSuperadmin, [
        <FolderKanban size={16} key="p" className={SUPER_ICON_CLASS} />,
        <CheckCircle2 size={16} key="i" className={SUPER_ICON_CLASS} />,
        <Users size={16} key="u" className={SUPER_ICON_CLASS} />,
      ])} />
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <SystemOverview companies={[]} />
          <ProjectsOverview projects={data.projectSummaries} />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActionsByRole.superadmin} />
          <ActivityFeed items={data.activity} accentBg="bg-indigo-50" accentText="text-indigo-600" />
        </div>
      </section>
    </>
  );
};

export default AdminDashboard;
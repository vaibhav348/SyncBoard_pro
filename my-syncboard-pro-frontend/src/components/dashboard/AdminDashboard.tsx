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

const AdminDashboard = ({ data }: Props) => {
  const metrics = withIcons(data.metricsForOwner, [
    <FolderKanban size={16} key="p" />,
    <CheckCircle2 size={16} key="o" />,
    <Building2 size={16} key="c" />,
  ]);

  return (
    <>
      <MetricsGrid metrics={metrics} />
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <ProjectsOverview projects={data.projectSummaries} />
          <TeamWorkload members={data.teamWorkload} />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActionsByRole.owner} />
          <ActivityFeed items={data.activity} />
        </div>
      </section>
    </>
  );
};

export const SuperAdminDashboard = ({ data }: Props) => (
  <>
    <MetricsGrid metrics={withIcons(data.metricsForSuperadmin, [
      <FolderKanban size={16} key="p" />,
      <CheckCircle2 size={16} key="i" />,
      <Users size={16} key="u" />,
    ])} />
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <div className="space-y-6">
        <SystemOverview companies={[]} />
        <ProjectsOverview projects={data.projectSummaries} />
      </div>
      <div className="space-y-6">
        <QuickActions actions={quickActionsByRole.superadmin} />
        <ActivityFeed items={data.activity} />
      </div>
    </section>
  </>
);

export default AdminDashboard;

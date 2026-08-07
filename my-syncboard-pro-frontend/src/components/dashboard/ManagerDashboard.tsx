import { CheckCircle2, Layers, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useAppSelector } from '../../hooks/storeHooks';
import type { UseDashboardDataResult } from '../../hooks/useDashboardData';
import type { Metric } from '../../types/dashboard.types';
import type { SprintOverviewRow } from './SprintsOverview';
import MetricsGrid from './MetricsGrid';
import SprintsOverview from './SprintsOverview';
import TeamWorkload from './TeamWorkload';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import { quickActionsByRole } from '../../config/dashboardConfig';

interface Props {
  data: UseDashboardDataResult;
}

const ManagerDashboard = ({ data }: Props) => {
  const { sprints, storiesBySprint } = useAppSelector((state) => state.scrum);

  const sprintRows = useMemo<SprintOverviewRow[]>(
    () =>
      sprints.map((sp) => {
        const list = storiesBySprint?.[sp._id] ?? [];
        return {
          id: sp._id,
          name: sp.name,
          status: sp.status ?? 'planned',
          storyCount: list.length,
          totalPoints: list.reduce((sum: number, s: any) => sum + (s.storyPoints ?? 0), 0),
        };
      }),
    [sprints, storiesBySprint]
  );

  const metrics: Metric[] = data.metricsForManager.map((m, i) => ({
    ...m,
    icon: [<Layers size={16} key="s" />, <CheckCircle2 size={16} key="i" />, <Users size={16} key="t" />][i],
  }));

  return (
    <>
      <MetricsGrid metrics={metrics} />
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <SprintsOverview sprints={sprintRows} />
          <TeamWorkload members={data.teamWorkload} />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActionsByRole.manager} />
          <ActivityFeed items={data.activity} />
        </div>
      </section>
    </>
  );
};

export default ManagerDashboard;

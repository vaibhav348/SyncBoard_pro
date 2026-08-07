import { CheckCircle2, Layers, Target } from 'lucide-react';
import type { UseDashboardDataResult } from '../../hooks/useDashboardData';
import type { Metric } from '../../types/dashboard.types';
import MetricsGrid from './MetricsGrid';
import MyIssuesPanel from './MyTasksPanel';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import { quickActionsByRole } from '../../config/dashboardConfig';

interface Props {
  data: UseDashboardDataResult;
}

const DeveloperDashboard = ({ data }: Props) => {
  const metrics: Metric[] = data.metricsForEmployee.map((m, i) => ({
    ...m,
    icon: [<CheckCircle2 size={16} key="a" />, <Target size={16} key="s" />, <Layers size={16} key="p" />][i],
  }));

  return (
    <>
      <MetricsGrid metrics={metrics} />
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <MyIssuesPanel issues={data.myIssues} />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActionsByRole.employee} />
          <ActivityFeed items={data.activity} />
        </div>
      </section>
    </>
  );
};

export default DeveloperDashboard;

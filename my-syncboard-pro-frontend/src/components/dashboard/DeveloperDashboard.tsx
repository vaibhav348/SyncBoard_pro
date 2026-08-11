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

// Employee / developer role accent: emerald
const ICON_CLASS = 'text-emerald-600';

const DeveloperDashboard = ({ data }: Props) => {
  const metrics: Metric[] = data.metricsForEmployee.map((m, i) => ({
    ...m,
    icon: [
      <CheckCircle2 size={16} key="a" className={ICON_CLASS} />,
      <Target size={16} key="s" className={ICON_CLASS} />,
      <Layers size={16} key="p" className={ICON_CLASS} />,
    ][i],
  }));

  return (
    <>
     <div className="flex flex-wrap items-stretch gap-4">
  <MetricsGrid metrics={metrics} />
  <QuickActions actions={quickActionsByRole.employee} />
</div>
 

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <MyIssuesPanel issues={data.myIssues} />
        </div>
        <div className="space-y-6">
          <ActivityFeed items={data.activity} accentBg="bg-emerald-50" accentText="text-emerald-600" />
        </div>
      </section>
    </>
  );
};

export default DeveloperDashboard;
import MetricCard from './MetricCard';
import type { Metric } from '../../types/dashboard.types';

// No wrapping element of its own — returns the cards as flat flex items so
// they merge into whatever row renders this (e.g. alongside QuickActions).
// Each card grows/shrinks to share the available width fairly, however
// many metrics there are. Nothing scrolls; it only wraps to a new line if
// the row truly runs out of room on a narrow screen.
const MetricsGrid = ({ metrics }: { metrics: Metric[] }) => (
  <>
    {metrics.map((metric) => (
      <div key={metric.label} className="min-w-[170px] flex-1 basis-[180px]">
        <MetricCard {...metric} />
      </div>
    ))}
  </>
);

export default MetricsGrid;
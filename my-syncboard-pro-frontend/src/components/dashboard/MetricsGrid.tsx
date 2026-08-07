import MetricCard from './MetricCard';
import type { Metric } from '../../types/dashboard.types';

const MetricsGrid = ({ metrics }: { metrics: Metric[] }) => (
  <section className="grid gap-4 md:grid-cols-3">
    {metrics.map((metric) => (
      <MetricCard key={metric.label} {...metric} />
    ))}
  </section>
);

export default MetricsGrid;
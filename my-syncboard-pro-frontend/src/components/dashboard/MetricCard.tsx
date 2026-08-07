import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Metric } from '../../types/dashboard.types';

const trendIcon = {
  up: <TrendingUp size={14} className="text-emerald-600" />,
  down: <TrendingDown size={14} className="text-red-500" />,
  neutral: <Minus size={14} className="text-zinc-400" />,
};

const trendBadgeStyles = {
  up: 'border-emerald-200 bg-emerald-50',
  down: 'border-red-200 bg-red-50',
  neutral: 'border-zinc-200 bg-zinc-50',
};

const MetricCard = ({ label, value, hint, trend = 'neutral', icon }: Metric) => (
  <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 shadow-sm">
        {icon}
      </div>
      <div className={`rounded-full border px-2 py-1 ${trendBadgeStyles[trend]}`}>
        {trendIcon[trend]}
      </div>
    </div>
    <p className="text-sm text-zinc-600">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
    <p className="mt-1 text-xs text-zinc-500">{hint}</p>
  </div>
);

export default MetricCard;
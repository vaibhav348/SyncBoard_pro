import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { QuickAction } from '../../types/dashboard.types';

// Same pattern as MetricsGrid: no wrapping box of its own, just flat
// flex items. Whether there are 3 actions or 4, each one grows/shrinks to
// share the row fairly alongside the metric cards. Nothing scrolls.
const QuickActions = ({ actions }: { actions: QuickAction[] }) => (
  <>
    {actions.map((action) => (
      <Link
        key={action.label}
        to={action.to}
        className="group flex min-w-[190px] flex-1 basis-[200px] flex-col items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow"
      >
        <div className="mb-5 w-full space-y-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
            {action.label}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
            {action.description}
          </p>
        </div>

        <div className="flex w-full items-center justify-between">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Go
          </span>
          <ArrowRight
            size={14}
            className="text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-700"
          />
        </div>
      </Link>
    ))}
  </>
);

export default QuickActions;
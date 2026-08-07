import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { QuickAction } from '../../types/dashboard.types';

const QuickActions = ({ actions }: { actions: QuickAction[] }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-5">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-zinc-900">Quick actions</h2>
      <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-500">
        Fast lane
      </span>
    </div>

    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="group flex flex-col items-start justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <div className="w-full space-y-1 mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1">
              {action.label}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
              {action.description}
            </p>
          </div>

          <div className="flex w-full items-center justify-end">
            {/* Arrow moves right on hover — no translate on card itself */}
            <ArrowRight
              size={14}
              className="text-zinc-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-zinc-700"
            />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default QuickActions;
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import EmptyState from '../EmptyState';
import type { ActivityItem } from '../../types/dashboard.types';

const CARD = 'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]';

const ActivityFeed = ({ items }: { items: ActivityItem[] }) => {
  if (items.length === 0) {
    return (
      <div className={`${CARD} p-5 h-[480px] flex flex-col`}>
        <EmptyState
          icon={<Activity size={18} />}
          title="No activity yet"
          description="Updates from your team will show up here as work happens."
        />
      </div>
    );
  }

  return (
    <div className={`${CARD} p-5 h-[600px] flex flex-col`}>
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Recent activity</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Latest updates from your workspace</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-500">
          Live
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {items.map((item) => {
          const inner = (
            <>
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700 uppercase">
                {item.actorName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <p className="text-xs leading-relaxed text-zinc-600 break-all">
                <span className="font-medium text-zinc-900">{item.actorName}</span>{' '}
                {item.action}{' '}
                <span className="font-medium text-zinc-900">{item.target}</span>
                <span className="text-zinc-400"> · {item.timestamp}</span>
              </p>
            </>
          );

          if (item.projectId && item.issueId) {
            return (
              <Link
                key={item.id}
                to={`/project/${item.projectId}/issue/${item.issueId}`}
                state={{ returnTo: '/dashboard' }}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/10 px-3 py-2.5 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 text-sm"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import EmptyState from '../EmptyState';
import type { ActivityItem } from '../../types/dashboard.types';

interface Props {
  items: ActivityItem[];
  /** Optional role accent for the icon tile — defaults to neutral slate. */
  accentBg?: string;
  accentText?: string;
}

const CARD =
  'flex h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.14)]';

const ActivityFeed = ({ items, accentBg = 'bg-slate-100', accentText = 'text-slate-700' }: Props) => {
  if (items.length === 0) {
    return (
      <div className={`${CARD} h-[480px] p-5`}>
        <EmptyState
          icon={<Activity size={18} />}
          title="No activity yet"
          description="Updates from your team will show up here as work happens."
        />
      </div>
    );
  }

  return (
    <div className={CARD}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentBg} ${accentText}`}>
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
            <p className="text-xs text-slate-400">Latest updates from your workspace</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        {items.map((item) => {
          const inner = (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase text-slate-700">
                {item.actorName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 break-all">
                <span className="font-medium text-slate-900">{item.actorName}</span>{' '}
                {item.action}{' '}
                <span className="font-medium text-slate-900">{item.target}</span>
                <span className="text-slate-400"> · {item.timestamp}</span>
              </p>
            </div>
          );

          if (item.projectId && item.issueId) {
            return (
              <Link
                key={item.id}
                to={`/project/${item.projectId}/issue/${item.issueId}`}
                state={{ returnTo: '/dashboard' }}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm"
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
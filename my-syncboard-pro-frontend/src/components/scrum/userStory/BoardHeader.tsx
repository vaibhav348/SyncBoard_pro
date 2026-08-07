import { useEffect, useState } from 'react';
import {
  CalendarDays, Plus, Search, SlidersHorizontal, Target,
  Play, CheckCircle2, AlertTriangle,
  Edit,
} from 'lucide-react';
import type { ISprint } from '../../../types/scrum.types';
import type { TaskStatus } from '../../../types/Board.types';
import { StatCard } from './StatCard';
import { usePermissions } from '../../../hooks/usePermissions';
import { canCreateStory, canManageSprint } from '../../../config/permissions';
import { useAppSelector } from '../../../hooks/storeHooks';

const COLUMNS: TaskStatus[] = ['Todo', 'In-Progress', 'Review', 'Done'];

const colTheme: Record<TaskStatus, { label: string; borderTop: string; dot: string; countBg: string }> = {
  'Todo':       { label: 'Todo',        borderTop: 'border-t-zinc-300',   dot: 'bg-zinc-400',    countBg: 'bg-zinc-100 text-zinc-600' },
  'In-Progress':{ label: 'In Progress', borderTop: 'border-t-blue-400',   dot: 'bg-blue-400',    countBg: 'bg-blue-50 text-blue-600' },
  'Review':     { label: 'Review',      borderTop: 'border-t-amber-400',  dot: 'bg-amber-400',   countBg: 'bg-amber-50 text-amber-600' },
  'Done':       { label: 'Done',        borderTop: 'border-t-emerald-400',dot: 'bg-emerald-500', countBg: 'bg-emerald-50 text-emerald-700' },
};

interface BoardHeaderProps {
  sprint: ISprint;
  storyCount: number;
  totalPoints: number;
  completedPoints: number;
  progressPercent: number;
  openCount: number;
  closedCount: number;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  countByCol: (col: TaskStatus) => number;
  onAddStory: () => void;
  formatDate: (d?: string) => string;
  taskCounts?: { total: number; completed: number; inProgress: number; review?: number; todo: number };
  canManage?: boolean;
  onStartSprint?: () => void;
  onCompleteSprint?: () => void;
  onEditSprint?: () => void;
  isActionLoading?: boolean;
}

const getSprintStatusMeta = (status?: string) => {
  const s = (status ?? 'planned').toLowerCase();
  if (s === 'active')    return { label: 'Active',    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  if (s === 'completed') return { label: 'Completed', cls: 'border-violet-200 bg-violet-50 text-violet-700',   dot: 'bg-violet-500' };
  return                        { label: 'Planned',   cls: 'border-zinc-200 bg-zinc-100 text-zinc-600',        dot: 'bg-zinc-400' };
};

const formatRelativeTime = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 'No end date set';
  const end   = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)  return `Overdue by ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Ends today';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
};

export const BoardHeader = ({
  sprint, storyCount, totalPoints, completedPoints, progressPercent,
  openCount, closedCount, searchQuery, setSearchQuery, countByCol,
  onAddStory, formatDate, taskCounts, canManage,
  onStartSprint, onCompleteSprint, onEditSprint, isActionLoading,
}: BoardHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { hasPermission } = usePermissions();
  const canCreateStoryAction  = hasPermission('story.create') && canCreateStory(user as any);
  const canManageSprintAction = Boolean(canManage ?? canManageSprint(user as any, null as any, sprint));
  const statusMeta   = getSprintStatusMeta(sprint.status);
  const timelineText = formatRelativeTime(sprint.startDate, sprint.endDate);
  const isOverdue    = sprint.endDate
    ? new Date(sprint.endDate) < new Date(new Date().setHours(0, 0, 0, 0))
    : false;

  // scroll detection — untouched
  useEffect(() => {
    const el = document.getElementById('board-scroll-root');
    const scrollEl = el?.closest('main') ?? el?.parentElement ?? el;
    if (!scrollEl) return;
    let ticking = false, cooldownUntil = 0;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const now = performance.now();
        if (now < cooldownUntil) return;
        const top = scrollEl.scrollTop;
        setIsScrolled(prev => {
          const next = prev ? top > 2 : top > 10;
          if (next !== prev) cooldownUntil = now + 320;
          return next;
        });
      });
    };
    scrollEl.addEventListener('scroll', handler, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-zinc-200 shadow-sm">

      {/* ── Top row: title + actions ── */}
      <div className={`px-5 transition-[padding] duration-300 ease-in-out ${isScrolled ? 'py-2.5' : 'py-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Left: sprint name + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`truncate font-semibold tracking-tight text-zinc-900 transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-lg'}`}>
                {sprint.name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${statusMeta.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>

            {!isScrolled && (
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  <span>{sprint.startDate ? formatDate(sprint.startDate) : '—'}</span>
                  <span className="text-zinc-300">→</span>
                  <span>{sprint.endDate ? formatDate(sprint.endDate) : '—'}</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${isOverdue ? 'text-red-500' : 'text-zinc-500'}`}>
                  {isOverdue ? <AlertTriangle size={12} /> : <Target size={12} />}
                  {timelineText}
                </div>
                {sprint.goal && (
                  <span className="truncate max-w-xs text-zinc-400 hidden md:block">· {sprint.goal}</span>
                )}
              </div>
            )}
          </div>

          {/* Right: action buttons + search + filter */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManageSprintAction && (
              <>
                {sprint.status === 'planned' && (
                  <button
                    onClick={onStartSprint}
                    disabled={isActionLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play size={12} />
                    {isActionLoading ? 'Starting…' : 'Start sprint'}
                  </button>
                )}
                {sprint.status === 'active' && (
                  <button
                    onClick={onCompleteSprint}
                    disabled={isActionLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle2 size={12} />
                    {isActionLoading ? 'Completing…' : 'Complete sprint'}
                  </button>
                )}
                <button
                  onClick={onEditSprint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <Edit size={12} />
                  Edit
                </button>
              </>
            )}

            {/* Search */}
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories…"
                className="w-40 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-7 pr-6 text-xs text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-sm leading-none"
                >×</button>
              )}
            </div>

            <button className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 transition-colors">
              <SlidersHorizontal size={12} />
              Filter
            </button>
          </div>
        </div>

        {/* ── Stats row — collapses on scroll ── */}
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isScrolled ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
          <div className="overflow-hidden">
            <div className={`mt-3 pt-3 border-t border-zinc-100 transition-opacity duration-200 ${isScrolled ? 'opacity-0' : 'opacity-100 delay-100'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">

                {/* Progress + stat cards */}
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100 border border-zinc-200">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-zinc-700">{progressPercent}%</span>
                  </div>
                  <div className="w-px h-6 bg-zinc-200" />
                  <StatCard label="Points"    value={totalPoints}      sub="total" />
                  <StatCard label="Completed" value={completedPoints}  sub={`of ${totalPoints}`} />
                  <StatCard label="Open"      value={openCount}        sub="stories" />
                  <StatCard label="Done"      value={closedCount}      sub="stories" />
                </div>

                {/* Column task count chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Total',       value: taskCounts?.total      ?? storyCount,       cls: 'border-zinc-200 bg-zinc-100 text-zinc-700' },
                    { label: 'Todo',        value: taskCounts?.todo       ?? countByCol('Todo'),        cls: 'border-zinc-200 bg-white text-zinc-600' },
                    { label: 'In progress', value: taskCounts?.inProgress ?? countByCol('In-Progress'), cls: 'border-blue-200 bg-blue-50 text-blue-700' },
                    { label: 'Review',      value: taskCounts?.review     ?? countByCol('Review'),      cls: 'border-amber-200 bg-amber-50 text-amber-700' },
                    { label: 'Done',        value: taskCounts?.completed  ?? countByCol('Done'),        cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                  ].map(({ label, value, cls }) => (
                    <span key={label} className={`rounded-md border px-2.5 py-1 font-mono text-xs ${cls}`}>
                      <span className="font-semibold">{value}</span> {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Column labels row ── */}
      <div className="flex bg-white border-t border-zinc-100">
        {/* Story panel label */}
        <div className="w-[280px] shrink-0 flex items-center justify-between border-r border-zinc-200 bg-zinc-950 px-4 py-2.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            Stories · {storyCount}
          </span>
          {canCreateStoryAction && (
            <button
              onClick={onAddStory}
              title="Add story"
              className="flex h-6 w-6 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        {/* Column headers */}
        <div className="flex flex-1">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className={`flex flex-1 items-center justify-between border-r border-zinc-200 border-t-2 px-3 py-2.5 last:border-r-0 bg-white ${colTheme[col].borderTop}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colTheme[col].dot}`} />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  {colTheme[col].label}
                </span>
              </div>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${colTheme[col].countBg}`}>
                {countByCol(col)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BoardHeader;
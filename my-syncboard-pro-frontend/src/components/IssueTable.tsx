import { Check, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/storeHooks';
import { useActiveIssue } from '../hooks/useActiveIssue';
import type { Issue } from '../types/issue';
import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

interface IssueTableProps {
  issues: Issue[];
  setIsAssignePopUp: (open: boolean) => void;
  onIssueUpdate?: (issueId: string, updates: Partial<Issue>) => void;
}

const ENUMS = {
  type: ['Bug', 'Feature', 'Issue'] as const,
  severity: ['Low', 'Normal', 'High', 'Critical'] as const,
  priority: ['Low', 'Medium', 'High'] as const,
  status: ['Todo', 'In-Progress', 'Review', 'Done'] as const,
};

const SEVERITY_RANK: Record<string, number> = { low: 0, normal: 1, high: 2, critical: 3 };
const PRIORITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };
const STATUS_RANK: Record<string, number> = { todo: 0, 'in-progress': 1, review: 2, done: 3 };

type SortKey = 'type' | 'severity' | 'priority' | 'votes' | 'title' | 'status' | 'createdAt' | 'assignee';
type SortDirection = 'asc' | 'desc' | null;

// ── Semantic dot colors — only indicator uses color, badge stays monochrome ──
const typeDot: Record<string, string> = {
  Bug: '#ef4444',
  Feature: '#3b82f6',
  Issue: '#a855f7',
};
const severityDot: Record<string, string> = {
  Low: '#22c55e',
  Normal: '#3b82f6',
  High: '#f97316',
  Critical: '#ef4444',
};
const priorityDot: Record<string, string> = {
  Low: '#6b7280',
  Medium: '#f59e0b',
  High: '#ef4444',
};
const statusDot: Record<string, string> = {
  todo: '#6b7280',
  'in-progress': '#3b82f6',
  review: '#f59e0b',
  done: '#22c55e',
};

const formatStatus = (val: string) => val.replace('-', ' ');

// ── Initials from a name string ──
const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

// ── Status dropdown — monochrome style ──
const StatusDropdown = ({
  value,
  issueId,
  onStatusChange,
  openUpwards,
}: {
  value: string;
  issueId: string;
  onStatusChange: (issueId: string, newStatus: string) => void;
  openUpwards: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const statusKey = value?.toLowerCase() || 'todo';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block w-full">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-1.5 font-mono text-[12px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5 truncate">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: statusDot[statusKey] }}
          />
          <span className="truncate">{formatStatus(value || 'Todo')}</span>
        </div>
        <ChevronDown
          size={11}
          className={`text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 ${openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
            } z-50 w-36 border border-zinc-200 bg-white rounded-lg overflow-hidden`}
        >
          {ENUMS.status.map((opt) => {
            const isSelected = value?.toLowerCase() === opt.toLowerCase();
            return (
              <button
                key={opt}
                onClick={() => { onStatusChange(issueId, opt); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 font-mono text-[12px] uppercase tracking-wide transition-colors cursor-pointer ${isSelected ? 'bg-zinc-50 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: statusDot[opt.toLowerCase()] }}
                  />
                  <span>{formatStatus(opt)}</span>
                </div>
                {isSelected && <Check size={11} className="text-zinc-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Sortable column header ──
const SortableHeader = ({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  align = 'center',
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey | null;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  align?: 'center' | 'start';
}) => {
  const isActive = activeSortKey === sortKey;
  const Icon =
    isActive && direction === 'asc'
      ? ChevronUp
      : isActive && direction === 'desc'
        ? ChevronDown
        : ChevronsUpDown;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 font-mono text-[12px] uppercase tracking-wide transition-colors cursor-pointer ${align === 'center' ? 'justify-center' : ''
        } ${isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
    >
      {label}
      <Icon size={11} className={isActive ? 'text-zinc-900' : 'text-zinc-400'} />
    </button>
  );
};

// ── Main IssueTable ──
const IssueTable = ({ issues = [], setIsAssignePopUp, onIssueUpdate }: IssueTableProps) => {
  const { user } = useAppSelector((state) => state?.auth);
  const activeProject = useAppSelector((state) => state.activeProject);
  const { selectActiveIssue } = useActiveIssue();
  const navigate = useNavigate();
  const location = useLocation();

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortKey(null);
      setSortDirection(null);
    } else {
      setSortDirection('asc');
    }
  };

  // All sorting logic unchanged
  const sortedIssues = useMemo(() => {
    if (!sortKey || !sortDirection) return issues;
    const dir = sortDirection === 'asc' ? 1 : -1;

    return [...issues].sort((a, b) => {
      switch (sortKey) {
        case 'type':
          return (a.type ?? 'Issue').localeCompare(b.type ?? 'Issue') * dir;
        case 'severity': {
          const rankA = SEVERITY_RANK[(a.severity ?? 'Normal').toLowerCase()] ?? 0;
          const rankB = SEVERITY_RANK[(b.severity ?? 'Normal').toLowerCase()] ?? 0;
          return (rankA - rankB) * dir;
        }
        case 'priority': {
          const rankA = PRIORITY_RANK[(a.priority ?? 'Medium').toLowerCase()] ?? 0;
          const rankB = PRIORITY_RANK[(b.priority ?? 'Medium').toLowerCase()] ?? 0;
          return (rankA - rankB) * dir;
        }
        case 'votes':
          return ((a.votes ?? 0) - (b.votes ?? 0)) * dir;
        case 'title': {
          const valA = a.issueKey || a._id || a.title || '';
          const valB = b.issueKey || b._id || b.title || '';
          return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
        }
        case 'status': {
          const rankA = STATUS_RANK[(a.status ?? 'Todo').toLowerCase()] ?? 0;
          const rankB = STATUS_RANK[(b.status ?? 'Todo').toLowerCase()] ?? 0;
          return (rankA - rankB) * dir;
        }
        case 'createdAt': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (timeA - timeB) * dir;
        }
        case 'assignee': {
          const nameA = a.assignedTo?.name ?? '';
          const nameB = b.assignedTo?.name ?? '';
          return nameA.localeCompare(nameB) * dir;
        }
        default:
          return 0;
      }
    });
  }, [issues, sortKey, sortDirection]);

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/issue/update_issue/${issueId}`, { status: newStatus });
      onIssueUpdate?.(issueId, { status: newStatus as any });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openAssignModal = (rowIssue: Issue) => {
    selectActiveIssue(rowIssue);
    setIsAssignePopUp(true);
  };

  return (
    <div className="flex-1 w-full bg-white">
      <div className="overflow-x-auto min-h-[40vh] w-full min-w-[900px]">

        {/* ── Column headers ── */}
        <div className="grid grid-cols-[3fr_3fr_3fr_16fr_5fr_5fr_6fr] gap-3 px-5 py-3 bg-zinc-50 border-b border-zinc-200 items-center">
          <SortableHeader label="Type" sortKey="type" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
          <SortableHeader label="Severity" sortKey="severity" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
          <SortableHeader label="Priority" sortKey="priority" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
          {/* <SortableHeader label="Votes"    sortKey="votes"     activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} /> */}
          <SortableHeader label="Issue" sortKey="title" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} align="start" />
          <SortableHeader label="Status" sortKey="status" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
          <SortableHeader label="Created" sortKey="createdAt" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} align="start" />
          <SortableHeader label="Assignee" sortKey="assignee" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} align="start" />
        </div>

        {/* ── Rows ── */}
        <div className="divide-y divide-zinc-100">
          {sortedIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-zinc-600 mb-1">No issues found</p>
              <p className="text-xs text-zinc-400">Create your first issue to start tracking.</p>
            </div>
          ) : (
            sortedIssues.map((rowIssue, index) => {
              const openUpwards = index >= sortedIssues.length - 2 && sortedIssues.length > 2;

              return (
                <div
                  key={rowIssue._id}
                  className="grid grid-cols-[3fr_3fr_3fr_16fr_5fr_5fr_6fr] gap-3 px-5 py-3 items-center hover:bg-zinc-50/60 transition-colors group"
                >
                  {/* Type — dot + label */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: typeDot[rowIssue.type ?? 'Issue'] }}
                    />
                    <span className="font-mono text-[12px] uppercase tracking-wide text-zinc-500">
                      {rowIssue.type || 'Issue'}
                    </span>
                  </div>

                  {/* Severity — dot + label */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: severityDot[rowIssue.severity ?? 'Normal'] }}
                    />
                    <span className="font-mono text-[12px] uppercase tracking-wide text-zinc-500">
                      {rowIssue.severity || 'Normal'}
                    </span>
                  </div>

                  {/* Priority — dot + label */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: priorityDot[rowIssue.priority ?? 'Medium'] }}
                    />
                    <span className="font-mono text-[12px] uppercase tracking-wide text-zinc-500">
                      {rowIssue.priority}
                    </span>
                  </div>

               

                  {/* Issue title + key */}
                  <div
                    onClick={() =>
                      navigate(`/project/${activeProject?.data?._id}/issue/${rowIssue._id}`, {
                        state: { returnTo: { pathname: location.pathname, search: location.search } },
                      })
                    }
                    className="flex items-start gap-2 pr-4 cursor-pointer min-w-0"
                  >

                    <div
                      className="text-sm  font-normal text-zinc-700  group-hover:text-zinc-950 transition-colors flex justify-between items-center gap-1 line-clamp-1"
                      title={rowIssue.title}
                    >
                      <span className='text-blue-500 group-hover:text-blue-700'>
                        {rowIssue?.issueKey ? `#${rowIssue.issueKey}` : `#${rowIssue?._id?.slice(-4)}`}
                      </span>
                      <span className='line-clamp-1 group-hover:text-zinc-950'>
                        {rowIssue.title}
                      </span>
                    </div>
                  </div>

                  {/* Status — dropdown or static badge */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {(user?.role === 'employee' && user?.id === rowIssue?.assignedTo?._id) ||
                      user?.role === 'manager' ||
                      user?.role === 'owner' ? (
                      <StatusDropdown
                        value={rowIssue.status}
                        issueId={rowIssue._id}
                        onStatusChange={handleStatusChange}
                        openUpwards={openUpwards}
                      />
                    ) : (
                      // Read-only badge for employees not assigned to this issue
                      <div className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-600">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: statusDot[rowIssue.status?.toLowerCase() || 'todo'] }}
                        />
                        {formatStatus(rowIssue.status || 'Todo')}
                      </div>
                    )}
                  </div>

                  {/* Created date */}
                  <div className="font-mono text-[12px] text-zinc-400 whitespace-nowrap">
                    {rowIssue.createdAt
                      ? new Date(rowIssue.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                      : '—'}
                  </div>

                  {/* Assignee — initials circle (no external API) */}
                  {user?.role === 'employee' ? (
                    // Employee: read-only assignee display
                    <div
                      className="flex items-center gap-2"
                      title={rowIssue.assignedTo?.email || 'Unassigned'}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold  shrink-0 ${user?.id === rowIssue?.assignedTo?._id ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'
                          }`}
                      >
                        {rowIssue.assignedTo ? getInitials(rowIssue.assignedTo.name) : '?'}
                      </div>
                      <span className="font-mono text-[12px] text-zinc-500 truncate max-w-[90px]">
                        {rowIssue.assignedTo
                          ? user?.id === rowIssue?.assignedTo?._id
                            ? `You (${rowIssue.assignedTo.name.split(' ')[0]})`
                            : rowIssue.assignedTo.name.split(' ')[0]
                          : 'None'}
                      </span>
                    </div>
                  ) : (
                    // Owner/Manager: clickable to open assign modal
                    <div
                      onClick={() => openAssignModal(rowIssue)}
                      className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 rounded-md px-1 -mx-1 py-0.5 transition-colors"
                      title={rowIssue.assignedTo?.email || 'Click to assign'}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0 ${user?.id === rowIssue?.assignedTo?._id ? 'bg-red-600' : 'bg-zinc-800'
                          }`}
                      >
                        {rowIssue.assignedTo ? getInitials(rowIssue.assignedTo.name) : '?'}
                      </div>
                      <span className="font-mono text-[12px] text-zinc-500 truncate max-w-[90px]">
                        {rowIssue.assignedTo
                          ? user?.id === rowIssue?.assignedTo?._id
                            ? `You (${rowIssue.assignedTo.name.split(' ')[0]})`
                            : rowIssue.assignedTo.name.split(' ')[0]
                          : 'None'}
                      </span>
                      <ChevronDown size={11} className="text-zinc-400 shrink-0" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueTable;
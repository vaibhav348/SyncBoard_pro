import { useMemo, useState } from 'react';
import { Bookmark, ChevronDown, Circle, MoreVertical, Plus, Search, SlidersHorizontal, User } from 'lucide-react';
import type { Issue } from '../../../types/issue';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/storeHooks';

// ── Semantic dot colors — same palette as IssueTable ──
const typeDot: Record<string, string> = {
  Bug: '#ef4444',
  Feature: '#3b82f6',
  Issue: '#a855f7',
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

const formatStatus = (val?: string) => (val ?? 'Todo').replace('-', ' ');

const getAssigneeInitial = (assignedTo?: Issue['assignedTo']) => {
  if (!assignedTo) return null;
  if (typeof assignedTo === 'object' && assignedTo.name) return assignedTo.name.charAt(0).toUpperCase();
  return null;
};

interface SprintIssuesTableProps {
  issues: Issue[];
  onAddIssue?: () => void;
}

export const SprintIssuesTable = ({ issues, onAddIssue }: SprintIssuesTableProps) => {
  const [showTags, setShowTags] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAppSelector((state) => state.auth);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return issues;
    return issues.filter(issue =>
      issue.title.toLowerCase().includes(q) || issue.issueKey?.toLowerCase().includes(q)
    );
  }, [issues, searchQuery]);

  const navigate = useNavigate();
  const location = useLocation();
  const activeProject = useAppSelector((state) => state.activeProject);

  return (
    <div className="bg-white overflow-hidden">

      {/* ── Table header bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Bookmark size={14} className="text-zinc-200" />
          <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-zinc-200">
            Sprint Issues · {filteredIssues.length}
          </span>
          <span className="text-zinc-300">|</span>
          <button
            type="button"
            onClick={() => setShowTags(v => !v)}
            className={`relative w-8 h-4 rounded-full transition-colors ${showTags ? 'bg-blue-500' : 'bg-zinc-200'}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showTags ? 'left-4' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-zinc-200">Tags</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search issues..."
              className="w-40 pl-7 pr-6 py-1.5 text-xs bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-400 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-sm leading-none"
              >
                ×
              </button>
            )}
          </div>

          <button className="w-6 h-6 flex items-center justify-center rounded border border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-100 hover:text-zinc-800 transition-colors">
            <SlidersHorizontal size={12} />
          </button>
          <button
            onClick={onAddIssue}
            title="Add issue"
            className="w-6 h-6 flex items-center justify-center rounded border border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* ── Column labels ── */}
      {filteredIssues.length !== 0 && (
        <div className="flex items-center px-4 py-2 border-b border-zinc-200 text-[12px] font-mono uppercase tracking-widest text-zinc-400">
          <span className="flex-1">Issue</span>
          <span className="w-20 text-center">Type</span>
          <span className="w-20 text-center">Priority</span>
          <span className="w-36 text-center">Status</span>
          <span className="w-28 text-center">Modified</span>
          <span className="w-16 text-center">Assign</span>
          <span className="w-6" />
        </div>
      )}

      {/* ── Rows ── */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 flex items-center justify-center mb-3">
            <Circle size={18} className="text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-600 mb-1">
            {searchQuery ? 'No issues match your search' : 'No issues in this sprint'}
          </p>
          <p className="text-xs text-zinc-400">
            {searchQuery ? 'Try a different keyword.' : 'Add issues to start tracking.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 mb-10">
          {filteredIssues.map(issue => {
            const initial = getAssigneeInitial(issue.assignedTo);
            const statusKey = (issue.status ?? 'todo').toLowerCase();

            return (
              <div key={issue._id} className="flex items-center px-4 py-3 hover:bg-zinc-50/60 transition-colors group">

                {/* Issue title + key */}
                <div
                  onClick={() =>
                    navigate(`/project/${activeProject?.data?._id}/issue/${issue._id}`, {
                      state: {
                        returnTo: {
                          pathname: location.pathname,
                          search: location.search,
                        },
                      },
                    })
                  }
                  className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                >
                  <span className="font-mono text-blue-500 group-hover:text-blue-700 text-[12px] font-semibold shrink-0">
                    #{issue.issueKey}
                  </span>
                  <span className="text-sm text-zinc-700 mr-10 group-hover:text-zinc-950 font-normal truncate">
                    {issue.title}
                  </span>
                </div>

                {/* Type — dot + label */}
                <span className="w-20 min-w-20 flex items-center  justify-center gap-1.5">

<div className="flex items-center justify-start px-2 min-w-20 gap-1.5 truncate">

<span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: typeDot[issue.type ?? 'Issue'] }}
                  />
                  <span className="font-mono text-[12px] uppercase tracking-wide text-zinc-500">
                    {issue.type || 'Issue'}
                  </span>
                  </div>
                </span>

                {/* Priority — dot + label */}
                <span className="w-20 min-w-20 flex items-center  justify-center gap-1.5">

                  <div className="flex items-center justify-start px-2 min-w-20 gap-1.5 truncate">

                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: priorityDot[issue.priority ?? 'Medium'] }}
                    />
                    <span className="font-mono text-[12px] uppercase tracking-wide text-zinc-500">
                      {issue.priority || '—'}
                    </span>
                  </div>
                </span>

                {/* Status — monochrome badge, dot + optional chevron */}
                <span className="  ml-2 bg-red-50 ">
                  <span className="flex items-center justify-between gap-1.5  min-w-32 font-mono text-[12px] uppercase tracking-wide px-2 py-1 rounded-sm border border-zinc-200 bg-zinc-50 text-zinc-600">
                    <div className="flex items-center gap-1.5 truncate">

                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 m-1"
                        style={{ backgroundColor: statusDot[statusKey] }}
                      />
                      <span className="truncate">{formatStatus(issue.status)}</span>
                    </div>
                    {user?.id === issue?.assignedTo?._id && (
                      <ChevronDown size={11} className="text-zinc-400 shrink-0 cursor-pointer hover:text-zinc-700" />
                    )
                    }
                  </span>
                </span>

                {/* Modified date */}
                <span className="w-28 text-center font-mono text-[12px] text-zinc-400 whitespace-nowrap">
                  {issue.updatedAt
                    ? new Date(issue.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </span>

                {/* Assignee — initials circle */}
                <span className="w-16 flex items-center justify-center gap-1">
                  <div
                    title={issue.assignedTo?.name}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${user?.id === issue?.assignedTo?._id ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                      }`}
                  >
                    {initial ?? <User size={10} className="text-zinc-400" />}
                  </div>
                </span>

                <button className="w-6 flex items-center justify-center text-zinc-300 hover:text-zinc-600">
                  <MoreVertical size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SprintIssuesTable;
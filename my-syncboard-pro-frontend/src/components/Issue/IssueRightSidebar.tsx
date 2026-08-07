import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown, Plus, History, Copy,
  Link as LinkIcon, Trash2, UserPlus, Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/storeHooks';
import { useActiveIssue } from '../../hooks/useActiveIssue';
import { useCanEditIssue } from '../../hooks/useCanEditIssue';
import { useIssueFieldUpdate } from '../../hooks/useIssueFieldUpdate';
import axiosInstance from '../../api/axiosInstance';
import type { Issue } from '../../types/issue';
import { DetailTimelineCards } from '../DetailTimelineCards';

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const statusBadge: Record<string, string> = {
  todo: 'bg-rose-100 text-rose-800 border-rose-500',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-500',
  review: 'bg-amber-100 text-amber-800 border-amber-500',
  done: 'bg-emerald-100 text-emerald-800 border-emerald-500',
};

const ENUMS = {
  type: ['Bug', 'Feature', 'Issue'] as const,
  severity: ['Low', 'Normal', 'High', 'Critical'] as const,
  priority: ['Low', 'Medium', 'High'] as const,
  status: ['Todo', 'In-Progress', 'Review', 'Done'] as const,
};

const severityDot: Record<string, string> = {
  low: '#22c55e', normal: '#3b82f6', high: '#f97316', critical: '#ef4444',
};
const priorityDot: Record<string, string> = {
  low: '#94a3b8', medium: '#f59e0b', high: '#ef4444',
};
const typeDot: Record<string, string> = {
  bug: '#ef4444', feature: '#3b82f6', issue: '#a855f7',
};

const getDot = (field: string, value: string) => {
  const v = value.toLowerCase();
  if (field === 'severity') return severityDot[v];
  if (field === 'priority') return priorityDot[v];
  if (field === 'type') return typeDot[v];
  return undefined;
};

const formatStatus = (val: string) => val.replace('-', ' ');

interface FieldDropdownProps {
  label: string;
  value: string;
  options: readonly string[];
  field: string;
  disabled?: boolean;
  onSelect: (field: string, value: string) => void;
}

const FieldDropdown = ({ label, value, options, field, disabled, onSelect }: FieldDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dot = getDot(field, value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={`w-full flex items-center justify-between py-3 last:border-b-0 transition-colors ${disabled ? '' : 'cursor-pointer'}`}
      >
        <span className="text-xs font-medium tracking-wide text-slate-800 capitalize">{label}</span>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-slate-800 capitalize">{value || '—'}</span>
          {dot && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />}
          {!disabled && (
            <ChevronDown
              size={14}
              className={`text-slate-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-48 border-slate-900 bg-white overflow-hidden shadow-lg shadow-slate-200/60">
          {options.map((opt) => {
            const optDot = getDot(field, opt);
            const isSelected = value?.toLowerCase() === opt.toLowerCase();
            return (
              <button
                key={opt}
                onClick={() => { onSelect(field, opt); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 text-sm transition-colors cursor-pointer ${
                  isSelected ? 'bg-white text-slate-900 font-medium' : 'text-slate-800 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="capitalize">{opt}</span>
                </div>
                <div className="flex items-center gap-2">
                  {optDot && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: optDot }} />}
                  {isSelected && <Check size={14} className="text-indigo-500 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatusDropdown = ({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (field: string, value: string) => void;
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
    <div ref={ref} className="relative">
      <div className="flex items-center justify-start gap-4">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-900">Status</p>
        <button
          onClick={() => setOpen((p) => !p)}
          className={`cursor-pointer flex justify-between items-center gap-2 text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md border transition-all duration-200 ${
            statusBadge[statusKey] ?? 'text-slate-500 border-slate-200 bg-slate-50'
          }`}
        >
          {formatStatus(value || 'Todo')}
          <ChevronDown size={13} className={`text-slate-800 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-48 border border-slate-200 bg-white overflow-hidden shadow-lg shadow-slate-200/60">
          {ENUMS.status.map((opt) => {
            const isSelected = value?.toLowerCase() === opt.toLowerCase();
            return (
              <button
                key={opt}
                onClick={() => { onSelect('status', opt); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                }`}
              >
                <span className="px-2.5 py-1">{formatStatus(opt)}</span>
                {isSelected && <Check size={14} className="text-indigo-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface IssueRightSidebarProps {
  setIsPopupOpen: (open: boolean) => void;
  /** Optional callback to sync the board list when assignee changes from detail view. */
  onListSync?: (issue: Issue) => void;
  returnTo?: string | null;
}

export const IssueRightSidebar = ({ setIsPopupOpen, onListSync, returnTo }: IssueRightSidebarProps) => {
  const navigate = useNavigate();
  const { issue, patchActiveIssue } = useActiveIssue();
  const canEditAll = useCanEditIssue();
  const updateField = useIssueFieldUpdate(onListSync);
  const { user } = useAppSelector((state) => state.auth);
  const activeProject = useAppSelector((state) => state.activeProject.data);
  const [deleting, setDeleting] = useState(false);
  const canEditStatus = canEditAll || user?.id === issue?.assignedTo?._id;

  const handleSelect = (field: string, value: string) => {
    void updateField(field, value);
  };

  const handleAssignToMe = async () => {
    if (!issue?._id || !user?.id) return;

    try {
      const res = await axiosInstance.patch(`/issue/update_issue/${issue._id}`, {
        assignedTo: user.id,
      });
      const updated = res.data?.issue as Issue | undefined;
      if (updated) {
        patchActiveIssue(updated);
        onListSync?.(updated);
      }
    } catch (err) {
      console.error('Assign failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!issue?._id) return;
    const confirmed = window.confirm('Delete this issue?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await axiosInstance.delete(`/issue/delete/${issue._id}`);
      navigate(returnTo || `/projects/${activeProject?._id ?? 'unknown'}/issues`);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (!issue) return null;

  return (
    <aside className="w-full lg:w-[290px] bg-slate-100 shrink-0 space-y-4 p-4 border border-l-slate-200 border-t-0 border-r-0 border-b-0 text-slate-800">
      <div className="p-2">
        {user?.role === 'employee' && !canEditStatus ? (
          <div className="flex items-center justify-start gap-4">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-900">Status</p>
            <span
              className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md border ${
                statusBadge[issue.status?.toLowerCase() || 'todo'] ?? 'text-slate-500 border-slate-200 bg-slate-50'
              }`}
            >
              {formatStatus(issue.status || 'Todo')}
            </span>
          </div>
        ) : (
          <StatusDropdown value={issue.status} onSelect={handleSelect} />
        )}
      </div>

      <div className="p-2 pt-5">
        <div>
          <FieldDropdown
            label="Type"
            field="type"
            value={issue.type || '—'}
            options={ENUMS.type}
            disabled={!canEditAll}
            onSelect={handleSelect}
          />
          <FieldDropdown
            label="Severity"
            field="severity"
            value={issue.severity || '—'}
            options={ENUMS.severity}
            disabled={!canEditAll}
            onSelect={handleSelect}
          />
          <FieldDropdown
            label="Priority"
            field="priority"
            value={issue.priority || '—'}
            options={ENUMS.priority}
            disabled={!canEditAll}
            onSelect={handleSelect}
          />
        </div>
      </div>

      <div className="border-t border-slate-400 px-2 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-3.5">Assigned to</p>
        {issue.assignedTo ? (
          <div className="flex items-center pb-4 gap-3.5 mb-4 bg-slate-50 border border-slate-100 p-2.5">
            <div className="w-9 h-9 bg-indigo-10 border border-indigo-400 flex items-center justify-center text-xs font-bold text-indigo-800 shrink-0">
              {getInitials(issue.assignedTo.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate capitalize tracking-wide">
                {issue.assignedTo.name}
              </p>
              <p className="text-xs text-slate-600 truncate mt-0.5">{issue.assignedTo.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 mb-4 text-slate-800 text-sm pt-2.5 px-1 bg-slate-50/70 rounded-xl border border-dashed border-slate-400">
            <div className="w-8 h-8 border border-dashed border-slate-500 flex items-center justify-center shrink-0 ml-1">
              <UserPlus size={14} className="text-slate-400" />
            </div>
            <span className="font-medium">Unassigned</span>
          </div>
        )}

        {canEditAll && (
          <div className={user?.id === issue.assignedTo?._id ? 'w-full' : 'grid grid-cols-2 gap-2.5'}>
            <button
              onClick={() => setIsPopupOpen(true)}
              className="w-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 py-2.5 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add assignee
            </button>
            {user?.id !== issue.assignedTo?._id && (
              <button
                onClick={() => void handleAssignToMe()}
                className="w-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 py-2.5 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Assign to me
              </button>
            )}
          </div>
        )}
      </div>

      <DetailTimelineCards createdAt={issue.createdAt} updatedAt={issue.updatedAt} />

      <div className="border-t border-slate-400 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-3.5">Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: History, label: 'History' },
            { icon: Copy, label: 'Duplicate', ownerOnly: true },
            { icon: LinkIcon, label: 'Copy link' },
            { icon: Trash2, label: 'Delete', danger: true, ownerOnly: true },
          ].map(({ icon: Icon, label, danger, ownerOnly }) => {
            if (ownerOnly && !canEditAll) return null;
            return (
              <button
                key={label}
                title={label}
                onClick={() => {
                  if (label === 'Delete') {
                    void handleDelete();
                  }
                }}
                disabled={deleting && label === 'Delete'}
                className={`flex flex-col items-center justify-center aspect-square rounded-sm border transition-all cursor-pointer ${
                  danger
                    ? 'border-slate-400 bg-white text-slate-800 hover:border-red-400 hover:bg-red-50 hover:text-red-500'
                    : 'border-slate-400 bg-white text-slate-800 hover:border-slate-800 hover:bg-slate-150 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span className="text-[8px] font-medium uppercase tracking-wider mt-1.5 block opacity-80">
                  {label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

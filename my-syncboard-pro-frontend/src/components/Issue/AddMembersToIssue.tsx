import { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { useAppSelector } from '../../hooks/storeHooks';
import { useActiveIssue } from '../../hooks/useActiveIssue';
import axiosInstance from '../../api/axiosInstance';
import type { Issue } from '../../types/issue';
import type { ProjectMember } from '../../features/activeProject/activeProjectSlice';

interface AddMembersToIssueProps {
  onClose: () => void;
  /** Keeps the IssueBoard list row in sync after assignment. */
  onListSync?: (issue: Issue) => void;
}

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const AddMembersToIssue = ({ onClose, onListSync }: AddMembersToIssueProps) => {
  const members = useAppSelector((state) => state.activeProject.data?.members ?? []);
  const { issue, patchActiveIssue } = useActiveIssue();

  const [query, setQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const assignedId = issue?.assignedTo?._id ?? null;

  const filtered = members.filter(
    (m: ProjectMember) =>
      m.name?.toLowerCase().includes(query.toLowerCase()) ||
      m.email?.toLowerCase().includes(query.toLowerCase()) ||
      m.department?.toLowerCase().includes(query.toLowerCase()),
  );

  const handleAssign = async (member: ProjectMember) => {
    if (!issue?._id) return;

    setLoadingId(member._id);
    try {
      const res = await axiosInstance.patch(`/issue/update_issue/${issue._id}`, {
        assignedTo: member._id,
      });

      const updated = res.data?.issue as Issue | undefined;
      if (updated) {
        patchActiveIssue(updated);
        onListSync?.(updated);
      }
    } catch (err) {
      console.error('Assign failed:', err);
    } finally {
      setLoadingId(null);
    }
  };

  if (!issue) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Assign member</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {issue.assignedTo
                ? `Assigned to ${issue.assignedTo.name}`
                : 'No one assigned yet'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email or department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-8 pr-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-72 px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-10">
              No members match &quot;{query}&quot;
            </p>
          ) : (
            filtered.map((m: ProjectMember) => {
              const isAssigned = m._id === assignedId;
              const isThisLoading =
                loadingId === m._id || (isAssigned && loadingId === 'unassign');

              return (
                <div
                  key={m._id}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isAssigned ? 'bg-zinc-50' : 'hover:bg-zinc-50/60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                      isAssigned ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {getInitials(m.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-800 truncate capitalize">{m.name}</p>
                      {isAssigned && (
                        <span className="font-mono text-[9px] uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm shrink-0">
                          Assigned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <p className="text-xs text-zinc-400 truncate">{m.email}</p>
                      {m.department && (
                        <>
                          <span className="text-zinc-300 shrink-0">·</span>
                          <p className="text-xs text-zinc-400 truncate">{m.department}</p>
                        </>
                      )}
                      {m.role && (
                        <>
                          <span className="text-zinc-300 shrink-0">·</span>
                          <p className="text-xs text-zinc-400 truncate">{m.role}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {!isAssigned && (
                    <button
                      onClick={() => void handleAssign(m)}
                      disabled={!!loadingId}
                      title={`Assign ${m.name}`}
                      className="w-8 cursor-pointer h-8 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {isThisLoading ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus size={13} />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <p className="text-xs text-slate-500 mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} in this project
          </p>
          <button
            onClick={onClose}
            className="text-xs font-medium text-zinc-600 cursor-pointer hover:text-zinc-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMembersToIssue;

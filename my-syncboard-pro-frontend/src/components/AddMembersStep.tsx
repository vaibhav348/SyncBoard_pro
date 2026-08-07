import { useEffect, useState } from 'react';
import type { ProjectFormData } from '../pages/app/ProjectCreate';
import { useAppDispatch, useAppSelector } from '../hooks/storeHooks';
import { fetchMembersStart, fetchMembersSuccess, setMemberActionFailure } from '../features/auth/memberSlice';
import axiosInstance from '../api/axiosInstance';
import { Loader2, Search, X, CheckSquare, Square } from 'lucide-react';

interface Props {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
}

const getInitials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const AddMembersStep = ({ formData, setFormData }: Props) => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');

  const { activeMembers, isMembersLoading, error } = useAppSelector((state) => state.members);

  useEffect(() => {
    if (activeMembers.length > 0) return;

    (async () => {
      try {
        dispatch(fetchMembersStart());
        const response = await axiosInstance.get('/auth/users');
        if (response.data?.allUsers) {
          dispatch(fetchMembersSuccess(response.data.allUsers));
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to load team members.';
        dispatch(setMemberActionFailure(errorMessage));
      }
    })();
  }, [dispatch, activeMembers.length]);

  // Non-owner members list filter
  const selectableMembers = activeMembers.filter((m) => m.role !== 'owner');

  const filtered = selectableMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggleMember = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  // ⚡ ENHANCEMENT: Select All / Deselect All Handlers
  const handleSelectAll = () => {
    const allSelectableIds = selectableMembers.map((m) => m._id);
    const isAllSelected = allSelectableIds.every((id) => formData.memberIds.includes(id));

    setFormData((prev) => ({
      ...prev,
      memberIds: isAllSelected ? [] : allSelectableIds,
    }));
  };

  const isAllSelected =
    selectableMembers.length > 0 &&
    selectableMembers.every((m) => formData.memberIds.includes(m._id));

  return (
    <div className="space-y-3">
      {/* Header with Counter & Select All toggle */}
      <div className="flex items-center justify-between pb-1">
        <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Team members ({selectableMembers.length})
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {isAllSelected ? <CheckSquare size={13} /> : <Square size={13} />}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
          <span className="font-mono text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
            {formData.memberIds.length} selected
          </span>
        </div>
      </div>

      {/* ⚡ ENHANCEMENT: Interactive Search Bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search member by name or email..."
          className="w-full rounded-lg bg-white border border-slate-200 pl-9 pr-8 py-2.5 text-xs text-zinc-900 placeholder-slate-400 focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-zinc-700 p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Scrollable Members List */}
      <div
        className="space-y-2 pr-1 max-h-[240px] overflow-y-auto 
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-slate-200 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
      >
        {isMembersLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 size={20} className="animate-spin text-zinc-800" />
            <p className="text-xs font-medium">Fetching directory...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center bg-red-50 text-red-600 rounded-md text-xs">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-medium">No members match "{query}"</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[11px] text-zinc-900 font-semibold underline mt-1"
            >
              Clear search query
            </button>
          </div>
        ) : (
          filtered.map((member) => {
            const checked = formData.memberIds.includes(member._id);
            return (
              <button
                key={member._id}
                type="button"
                onClick={() => toggleMember(member._id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                  checked
                    ? 'border-zinc-900 bg-zinc-50/80 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-zinc-800 shrink-0">
                  {getInitials(member.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-900 font-semibold truncate">{member.name}</p>
                    <span className="font-mono text-[9px] text-slate-400 uppercase tracking-tight">
                      • {member.role || 'Member'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                </div>

                <div
                  className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                    checked ? 'bg-zinc-900 border-zinc-900' : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AddMembersStep;
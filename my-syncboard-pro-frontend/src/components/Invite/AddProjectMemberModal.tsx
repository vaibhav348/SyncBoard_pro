import { useState } from 'react';
import { Search, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import Modal from '../Invite/Modal';
import RoleBadge from '../Invite/RoleBadge';
import type { CompanyMember } from '../../types/invite.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableMembers: CompanyMember[];
  onAdd: (memberId: string) => Promise<void>;
}

const getInitials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const AddProjectMemberModal = ({ isOpen, onClose, availableMembers, onAdd }: Props) => {
  const [query, setQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  const filtered = availableMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  const handleAdd = async (member: CompanyMember) => {
    if (addingId) return;

    setAddingId(member.id);
    try {
      await onAdd(member.id);
      setSuccessName(member.name);

      setTimeout(() => {
        setSuccessName(null);
        setAddingId(null);
        setQuery('');
      }, 2000);
    } catch {
      setAddingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={addingId ? () => {} : onClose} title="Add member to project">
      <div className="bg-white">
        {availableMembers.length !== 0 && (
          <div className="mb-4">
            {successName ? (
              <div className="flex w-full items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold capitalize">{successName}</span>
                  {' '}added to project successfully.
                </p>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company members"
                  disabled={!!addingId}
                  className="w-full rounded-lg bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors duration-200 disabled:opacity-50"
                />
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            {availableMembers.length === 0
              ? 'Everyone in your company is already on this project.'
              : `No members match "${query}"`}
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filtered.map((m) => {
              const isThisAdding = addingId === m.id;
              const isOtherAdding = !!addingId && addingId !== m.id;

              return (
                <div
                  key={m.id}
                  className={`flex mr-1 items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition-opacity duration-200 ${
                    isOtherAdding ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0">
                    {getInitials(m.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>

                  <RoleBadge role={m.role} />

                  {/* Add button */}
                  <button
                    onClick={() => handleAdd(m)}
                    disabled={!!addingId}
                    title={isOtherAdding ? 'Please wait...' : `Add ${m.name}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                  >
                    {isThisAdding ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddProjectMemberModal;
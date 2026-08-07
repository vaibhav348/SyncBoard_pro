import { useState } from 'react';
import { Search, Phone, Calendar, Users } from 'lucide-react';
import RoleBadge from '../Invite/RoleBadge';
import EmptyState from '../EmptyState';
import type { BackendMember } from '../../types/backendMember.types';

const getInitials = (name: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const MembersList = ({ members }: { members: BackendMember[] }) => {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = members.filter((m) => {
    const matchesQuery =
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()) ||
      (m.title && m.title.toLowerCase().includes(query.toLowerCase()));
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <div>
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or designation..."
            className="w-full rounded-xl bg-zinc-50 border border-zinc-200 pl-10 pr-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
        >
          <option value="all">All roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="No members found"
          description="Try adjusting your filters or search term."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => {
            const memberId = m._id;
            const joinedDate = m.createdAt
              ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A';

            return (
              <div
                key={memberId}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:shadow-sm"
              >
                {/* Left: Avatar + identity */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-950 shrink-0">
                    {getInitials(m.name)}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-950 truncate capitalize">{m.name}</p>
                      <div className="sm:hidden">
                        <RoleBadge role={m.role} />
                      </div>
                    </div>
                    <p className="font-mono text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                      {m.title || 'Team member'}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{m.email}</p>
                  </div>
                </div>

                {/* Right: meta */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-5 sm:gap-8 border-t border-zinc-200/70 pt-3 sm:border-0 sm:pt-0">
                  {m.mobileNumber && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Phone size={13} className="text-zinc-300" />
                      <span>{m.mobileNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar size={13} className="text-zinc-300" />
                    <span>Joined {joinedDate}</span>
                  </div>

                  <div className="hidden sm:block shrink-0">
                    <RoleBadge role={m.role} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MembersList;
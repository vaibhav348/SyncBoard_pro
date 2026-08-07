import { Users, Crown } from 'lucide-react';

export interface TeamTableRow {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  title?: string;
  isOwner?: boolean;
}

interface Props {
  title?: string;
  members: TeamTableRow[];
  emptyMessage?: string;
  currentUserId?: string;
}

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const roleStyles: Record<string, string> = {
  owner: 'bg-amber-50 text-amber-700 border-amber-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  employee: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TeamTable = ({
  title = 'Team roster',
  members,
  emptyMessage = 'No team members found.',
  currentUserId,
}: Props) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <Users size={15} className="text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>

      {members.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Users size={17} />
          </div>
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Column headers — desktop only */}
          <div className="hidden sm:grid grid-cols-[2fr_1.2fr_1fr_1.2fr] gap-4 px-5 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Member</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Title</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Role</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Department</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {members.map((member) => {
              const isYou = member.id === currentUserId;
              return (
                <div
                  key={member.id}
                  className={`grid gap-3 px-5 py-4 sm:grid-cols-[2fr_1.2fr_1fr_1.2fr] sm:items-center transition-colors duration-200 ${
                    isYou ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Member info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-[11px] font-semibold ${
                          isYou
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {getInitials(member.name)}
                      </div>
                      {member.isOwner && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                          <Crown size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                        {isYou && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    {member.title ? (
                      <span className="text-sm text-slate-600 truncate">{member.title}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    {member.isOwner ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                        <Crown size={10} />
                        Owner
                      </span>
                    ) : member.role ? (
                      <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${roleStyles[member.role] ?? roleStyles.employee}`}>
                        {member.role}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    {member.department ? (
                      <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
                        {member.department}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamTable;
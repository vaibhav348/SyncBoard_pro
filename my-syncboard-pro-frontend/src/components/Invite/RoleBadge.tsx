type Role = 'owner' | 'manager' | 'employee' | 'superadmin' | 'admin';

const roleStyles: Record<Role, string> = {
  owner: 'text-amber-700 border-amber-200 bg-amber-50',
  manager: 'text-blue-700 border-blue-200 bg-blue-50',
  employee: 'text-zinc-600 border-zinc-200 bg-zinc-50',
  superadmin: 'text-purple-700 border-purple-200 bg-purple-50',
  admin: 'text-violet-700 border-violet-200 bg-violet-50',
};

const RoleBadge = ({ role }: { role: Role }) => (
  <span
    className={`font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${roleStyles[role]}`}
  >
    {role}
  </span>
);

export default RoleBadge;
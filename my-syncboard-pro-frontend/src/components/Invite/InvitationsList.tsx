import { Mail, RotateCw, X } from 'lucide-react';
import RoleBadge from '../Invite/RoleBadge';
import EmptyState from '../EmptyState';

interface Props {
  invitations: any[];
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}

const InvitationsList = ({ invitations, onResend, onRevoke }: Props) => {
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={<Mail size={18} />}
        title="No pending invitations"
        description="Everyone you've invited has already joined."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {invitations.map((inv) => {
        const invitationId = inv._id || inv.id;

        const inviterName =
          typeof inv.invitedBy === 'object' && inv.invitedBy !== null
            ? inv.invitedBy.name
            : inv.invitedBy || 'System';

        const dateDisplay = inv.createdAt
          ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          : inv.invitedAt || 'Just now';

        return (
          <div
            key={invitationId}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 transition-colors duration-200 hover:border-zinc-300 hover:bg-white"
          >
            <div className="w-9 h-9 rounded-full bg-white border border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 shrink-0">
              <Mail size={14} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-950 truncate">{inv.email}</p>
              <p className="text-xs text-zinc-500">
                Invited by {inviterName} · {dateDisplay}
              </p>
            </div>

            <RoleBadge role={inv.role} />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onResend(invitationId)}
                title="Resend invite"
                className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-colors duration-200"
              >
                <RotateCw size={14} />
              </button>
              <button
                onClick={() => onRevoke(invitationId)}
                title="Revoke invite"
                className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors duration-200"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvitationsList;
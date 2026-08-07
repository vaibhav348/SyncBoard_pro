import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import Modal from '../Invite/Modal';
import type { MemberRole } from '../../types/invite.types';
import axiosInstance from '../../api/axiosInstance';
import { useAppSelector } from '../../hooks/storeHooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: MemberRole) => void;
}

const InviteMemberModal = ({ isOpen, onClose, onInvite }: Props) => {
  const { user } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('employee');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await axiosInstance.post<{ message?: string }>('/auth/invite', { email, role });
      console.log('[Invite] API success:', response.data);

      onInvite(email, role);
      setEmail('');
      setRole('employee');
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send invitation. Please try again.';
      console.error('[Invite] API error:', message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite new member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <div>
          <label className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
            <Mail size={11} />
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="w-full rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="flex  items-center gap-1.5 font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
            <ShieldCheck size={11} />
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            className="w-full  rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
          >
            <option value="employee">Employee</option>
            {user?.role === 'owner' && <option value="manager">Manager</option>}
          </select>
          {email && (
            <p className="text-xs text-zinc-400 mt-1.5">
              Invitation link will be sent to <span className="font-medium text-zinc-600">{email}</span>.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-zinc-900 text-white font-medium text-sm py-3 rounded-xl shadow-sm hover:bg-zinc-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending...' : 'Send invitation'}
        </button>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
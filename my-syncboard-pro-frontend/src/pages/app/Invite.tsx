import { useEffect, useState } from 'react';
import { UserPlus, Users, Mail } from 'lucide-react';
import MembersList from '../../components/Invite/MembersList';
import InvitationsList from '../../components/Invite/InvitationsList';
import InviteMemberModal from '../../components/Invite/InviteMemberModal';
import axiosInstance from '../../api/axiosInstance';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import type { PendingInvitation, MemberRole } from '../../types/invite.types';
import {
  addLocalInvitation,
  fetchInvitesStart,
  fetchInvitesSuccess,
  fetchMembersStart,
  fetchMembersSuccess,
  removeLocalInvitation,
  setMemberActionFailure,
} from '../../features/auth/memberSlice';

type Tab = 'active' | 'pending';

const Invite = () => {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeMembers, pendingInvitations } = useAppSelector((state) => state.members);

  // Fetch all members
  useEffect(() => {
    (async () => {
      try {
        dispatch(fetchMembersStart());
        const response = await axiosInstance.get('/auth/users');
        if (response.data?.allUsers) {
          dispatch(fetchMembersSuccess(response.data.allUsers));
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to load members.';
        dispatch(setMemberActionFailure(errorMessage));
      }
    })();
  }, [dispatch, activeMembers.length]);

  // Fetch pending invitations on load
  useEffect(() => {
    (async () => {
      try {
        dispatch(fetchInvitesStart());
        const response = await axiosInstance.get('/auth/invite');
        if (response.data?.invitations) {
          dispatch(fetchInvitesSuccess(response.data.invitations));
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to load invitations.';
        dispatch(setMemberActionFailure(errorMessage));
      }
    })();
  }, [dispatch]);

  const handleInvite = (email: string, role: MemberRole) => {
    const newInvite: PendingInvitation = {
      id: crypto.randomUUID(),
      email,
      role,
      invitedBy: 'You',
      invitedAt: 'Just now',
    };
    dispatch(addLocalInvitation(newInvite));
    setTab('pending');
  };

  const handleResend = (id: string) => console.log('Resending invite:', id);
  const handleRevoke = (id: string) => dispatch(removeLocalInvitation(id));

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden bg-white space-y-6 px-4 py-6 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Members</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage everyone in your company workspace.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm hover:bg-zinc-700 transition-colors duration-200"
          >
            <UserPlus size={16} />
            Invite new member
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-zinc-200 gap-6">
          <button
            onClick={() => setTab('active')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              tab === 'active' ? 'border-zinc-900 text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Users size={14} />
            Active members
            <span className="font-mono text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full px-1.5 py-0.5">
              {activeMembers?.length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              tab === 'pending' ? 'border-zinc-900 text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Mail size={14} />
            Pending invitations
            <span className="font-mono text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full px-1.5 py-0.5">
              {pendingInvitations.length}
            </span>
          </button>
        </div>

        {/* ── Tab content ── */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          {tab === 'active' ? (
            <MembersList members={activeMembers} />
          ) : (
            <InvitationsList invitations={pendingInvitations} onResend={handleResend} onRevoke={handleRevoke} />
          )}
        </div>

        <InviteMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onInvite={handleInvite}
        />
      </div>
    </div>
  );
};

export default Invite;
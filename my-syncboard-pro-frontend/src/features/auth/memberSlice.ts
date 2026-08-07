import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BackendMember } from "../../types/backendMember.types";
import type { PendingInvitation } from "../../types/invite.types";

interface MemberState {
    activeMembers: BackendMember[];
    pendingInvitations: PendingInvitation[];
    isMembersLoading: boolean;
    isInvitesLoading: boolean;
    error: string | null;
}

export const initialMemberState: MemberState = {
    activeMembers: [],
    pendingInvitations: [],
    isMembersLoading: false,
    isInvitesLoading: false,
    error: null
}

const memberSlice = createSlice({
    name: 'members',
    initialState: initialMemberState,
    reducers: {
        fetchMembersStart: (state) => {
            state.isMembersLoading = true;
            state.error = null
        },
        fetchMembersSuccess: (state, action: PayloadAction<BackendMember[]>) => {
            state.isMembersLoading = false;
            state.activeMembers = action.payload;
        },

        // ---- Pending Invitations Handlers ----
        fetchInvitesStart: (state) => {
            state.isInvitesLoading = true;
            state.error = null;
        },
        fetchInvitesSuccess: (state, action: PayloadAction<PendingInvitation[]>) => {
            state.isInvitesLoading = false;
            state.pendingInvitations = action.payload;
        },

        // ---- Operations (Local Syncing without Refetching) ----
        addLocalInvitation: (state, action: PayloadAction<PendingInvitation>) => {
            state.pendingInvitations.unshift(action.payload); // Naya invite list me turant upar jod do
        },
        removeLocalInvitation: (state, action: PayloadAction<string>) => {
            state.pendingInvitations = state.pendingInvitations.filter((inv: any) => {
                const invitationId = inv._id ?? inv.id;
                return invitationId !== action.payload;
            });
        },

        // Action Failures
        setMemberActionFailure: (state, action: PayloadAction<string>) => {
            state.isMembersLoading = false;
            state.isInvitesLoading = false;
            state.error = action.payload;
        },

        // Clear state on logout
        clearMembersStore: (state) => {
            state.activeMembers = [];
            state.pendingInvitations = [];
            state.error = null;
        }
    }
});

export const {
    fetchMembersStart, fetchMembersSuccess,
    fetchInvitesStart, fetchInvitesSuccess,
    addLocalInvitation, removeLocalInvitation,
    setMemberActionFailure, clearMembersStore
} = memberSlice.actions;

export default memberSlice.reducer;
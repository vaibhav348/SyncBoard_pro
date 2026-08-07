import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Issue } from '../../types/issue';

/**
 * Global state for the currently selected / viewed issue.
 * Mirrors the activeProject slice pattern (data + loading + error).
 */
interface ActiveIssueState {
  /** The full active issue object, or null when no issue is open. */
  data: Issue | null;
  /** True while an issue is being fetched from the API. */
  loading: boolean;
  /** Human-readable error message from the last failed fetch or update. */
  error: string | null;
}

const initialState: ActiveIssueState = {
  data: null,
  loading: false,
  error: null,
};

const activeIssueSlice = createSlice({
  name: 'activeIssue',
  initialState,
  reducers: {
    /** Mark the start of an async issue fetch (e.g. opening issue detail). */
    setActiveIssueStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    /**
     * Set the current active issue after a successful fetch or navigation.
     * Resets loading/error so the detail view can render immediately.
     */
    setActiveIssue: (state, action: PayloadAction<Issue>) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },

    /** Record a fetch or load failure for the active issue. */
    setActiveIssueFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    /** Reset active issue state when closing the detail view or switching context. */
    clearActiveIssue: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },

    /**
     * Merge partial fields into the active issue for optimistic / live UI sync.
     * Only applies when an active issue is already loaded.
     */
    updateActiveIssueFields: (state, action: PayloadAction<Partial<Issue>>) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload };
      }
    },
  },
});

export const {
  setActiveIssueStart,
  setActiveIssue,
  setActiveIssueFailure,
  clearActiveIssue,
  updateActiveIssueFields,
} = activeIssueSlice.actions;

export default activeIssueSlice.reducer;

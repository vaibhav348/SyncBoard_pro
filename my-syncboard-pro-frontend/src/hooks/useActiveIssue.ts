import { useCallback } from 'react';
import type { Issue } from '../types/issue';
import {
  setActiveIssueStart,
  setActiveIssue,
  setActiveIssueFailure,
  clearActiveIssue,
  updateActiveIssueFields,
} from '../features/activeIssue/activeIssueSlice';
import { useAppDispatch, useAppSelector } from './storeHooks';

/**
 * Typed hook for reading and updating the globally active issue.
 * Mirrors how components consume `state.activeProject` via selectors + dispatch.
 */
export const useActiveIssue = () => {
  const dispatch = useAppDispatch();
  const activeIssue = useAppSelector((state) => state.activeIssue);

  const startLoadingActiveIssue = useCallback(() => {
    dispatch(setActiveIssueStart());
  }, [dispatch]);

  const selectActiveIssue = useCallback(
    (issue: Issue) => {
      dispatch(setActiveIssue(issue));
    },
    [dispatch],
  );

  const failActiveIssue = useCallback(
    (message: string) => {
      dispatch(setActiveIssueFailure(message));
    },
    [dispatch],
  );

  const resetActiveIssue = useCallback(() => {
    dispatch(clearActiveIssue());
  }, [dispatch]);

  /** Patch specific fields on the active issue for instant UI updates. */
  const patchActiveIssue = useCallback(
    (fields: Partial<Issue>) => {
      dispatch(updateActiveIssueFields(fields));
    },
    [dispatch],
  );

  return {
    /** Raw slice state: `{ data, loading, error }`. */
    activeIssue,
    /** Shorthand for `activeIssue.data`. */
    issue: activeIssue.data,
    loading: activeIssue.loading,
    error: activeIssue.error,
    startLoadingActiveIssue,
    selectActiveIssue,
    failActiveIssue,
    resetActiveIssue,
    patchActiveIssue,
  };
};

import { useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import type { Issue } from '../types/issue';
import { useActiveIssue } from './useActiveIssue';

/**
 * Patches the active issue optimistically, persists via API, then syncs
 * the server response back into Redux (and optionally the board list).
 */
export const useIssueFieldUpdate = (onListSync?: (issue: Issue) => void) => {
  const { issue, patchActiveIssue } = useActiveIssue();

  const updateField = useCallback(
    async (field: string, value: string) => {
      const id = issue?._id;
      if (!id) return;

      patchActiveIssue({ [field]: value } as Partial<Issue>);

      try {
        const res = await axiosInstance.patch(`/issue/update_issue/${id}`, { [field]: value });
        const updated = res.data?.issue as Issue | undefined;
        if (updated) {
          patchActiveIssue(updated);
          onListSync?.(updated);
        }
      } catch (err) {
        console.error('Failed to update field:', field, err);
      }
    },
    [issue?._id, patchActiveIssue, onListSync],
  );

  return updateField;
};

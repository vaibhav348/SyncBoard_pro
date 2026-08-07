import { useAppSelector } from './storeHooks';
import { useActiveIssue } from './useActiveIssue';

const getUserIdValue = (value?: string | { _id?: string | null } | null) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id ?? null;
};

/** Whether the current user may edit all fields on the active issue. */
export const useCanEditIssue = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { issue } = useActiveIssue();

  const currentUserId = (user as any)?.id ?? (user as any)?._id;
  const creatorId = getUserIdValue((issue as any)?.createdBy ?? (issue as any)?.createdById);
  const authorId = getUserIdValue((issue as any)?.assignedBy);
  const projectOwnerId = getUserIdValue((issue as any)?.projectOwner);

  return (
    user?.role === 'owner' ||
    user?.role === 'manager' ||
    user?.role === 'superadmin' ||
    creatorId === currentUserId ||
    authorId === currentUserId ||
    projectOwnerId === currentUserId
  );
};

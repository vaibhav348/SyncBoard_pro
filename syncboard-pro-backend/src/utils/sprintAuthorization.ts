export type SprintRole = 'owner' | 'manager' | 'employee' | 'superadmin' | 'admin';

export type SprintUserLike = {
  _id?: string | null;
  id?: string | null;
  role?: string | null;
};

export type SprintProjectLike = {
  _id?: string | null;
  createdBy?: string | { _id?: string | null } | null;
  managerId?: string | { _id?: string | null } | null;
  project_owner?: string | { _id?: string | null } | null;
  owner?: string | { _id?: string | null } | null;
};

export type SprintLike = {
  _id?: string | null;
  createdBy?: string | { _id?: string | null } | null;
};

const normalizeRole = (role?: string | null): SprintRole => {
  const lowered = role?.toLowerCase();
  if (lowered === 'superadmin' || lowered === 'owner' || lowered === 'admin') return lowered === 'superadmin' ? 'superadmin' : lowered === 'owner' ? 'owner' : 'admin';
  if (lowered === 'manager') return 'manager';
  return 'employee';
};

const getUserId = (user?: SprintUserLike | null) => user?._id ?? user?.id ?? null;
const getEntityId = (value?: string | { _id?: string | null } | null) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id ?? null;
};

export const canManageSprint = (user: SprintUserLike | null | undefined, project?: SprintProjectLike | null, sprint?: SprintLike | null) => {
  const role = normalizeRole(user?.role);
  if (role === 'superadmin' || role === 'owner' || role === 'admin') return true;

  const currentUserId = getUserId(user);
  if (!currentUserId) return false;

  const projectCreatorId = getEntityId(project?.createdBy ?? project?.project_owner ?? project?.owner);
  const projectManagerId = getEntityId(project?.managerId);
  const sprintCreatorId = getEntityId(sprint?.createdBy);

  const isProjectOwnerOrManager = Boolean(
    (projectCreatorId && String(projectCreatorId) === String(currentUserId)) ||
    (projectManagerId && String(projectManagerId) === String(currentUserId))
  );

  if (isProjectOwnerOrManager) return true;

  return Boolean(role === 'manager' && sprintCreatorId && String(sprintCreatorId) === String(currentUserId));
};

export type AppRole = 'owner' | 'manager' | 'employee' | 'superadmin' | 'admin';

export type PermissionKey =
  | 'project.create'
  | 'project.delete'
  | 'workspace.manage'
  | 'billing.manage'
  | 'users.manage'
  | 'sprint.create'
  | 'sprint.manage'
  | 'story.create'
  | 'story.edit'
  | 'story.delete'
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'task.move'
  | 'comment.create'
  | 'board.view'
  | 'project.settings.manage'
  | 'project.members.manage';

const ROLE_PERMISSIONS: Record<AppRole, PermissionKey[]> = {
  superadmin: [
    'project.create',
    'project.delete',
    'workspace.manage',
    'billing.manage',
    'users.manage',
    'sprint.create',
    'sprint.manage',
    'story.create',
    'story.edit',
    'story.delete',
    'task.create',
    'task.edit',
    'task.delete',
    'task.move',
    'comment.create',
    'board.view',
    'project.settings.manage',
    'project.members.manage',
  ],
  admin: [
    'project.create',
    'project.delete',
    'workspace.manage',
    'billing.manage',
    'users.manage',
    'sprint.create',
    'sprint.manage',
    'story.create',
    'story.edit',
    'story.delete',
    'task.create',
    'task.edit',
    'task.delete',
    'task.move',
    'comment.create',
    'board.view',
    'project.settings.manage',
    'project.members.manage',
  ],
  owner: [
    'project.create',
    'project.delete',
    'workspace.manage',
    'billing.manage',
    'users.manage',
    'sprint.create',
    'sprint.manage',
    'story.create',
    'story.edit',
    'story.delete',
    'task.create',
    'task.edit',
    'task.delete',
    'task.move',
    'comment.create',
    'board.view',
    'project.settings.manage',
    'project.members.manage',
  ],
  manager: [
    'project.create',
    'sprint.create',
    'sprint.manage',
    'story.create',
    'story.edit',
    'story.delete',
    'task.create',
    'task.edit',
    'task.delete',
    'task.move',
    'comment.create',
    'board.view',
    'project.settings.manage',
    'project.members.manage',
  ],
  employee: ['board.view', 'task.move', 'comment.create'],
};

export const normalizeRole = (role?: string | null): AppRole => {
  const lowered = role?.toLowerCase();
  if (lowered === 'superadmin' || lowered === 'owner' || lowered === 'manager' || lowered === 'employee' || lowered === 'admin') {
    return lowered as AppRole;
  }
  return 'employee';
};

export const hasAnyRole = (role: AppRole | null | undefined, allowedRoles: AppRole[]) => {
  if (!role) return false;
  return allowedRoles.includes(role);
};

export const hasPermission = (
  role: AppRole | null | undefined,
  permission: PermissionKey | PermissionKey[]
) => {
  const normalizedRole = normalizeRole(role);
  const permissions = Array.isArray(permission) ? permission : [permission];
  return permissions.every((item) => ROLE_PERMISSIONS[normalizedRole].includes(item));
};

export const getRoleLabel = (role?: string | null) => {
  return normalizeRole(role).charAt(0).toUpperCase() + normalizeRole(role).slice(1);
};

const getUserId = (user: { id?: string | null; _id?: string | null } | null | undefined) => user?._id ?? user?.id ?? null;

const getEntityId = (value: { _id?: string | null } | string | null | undefined) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id ?? null;
};

export const canManageSprint = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  project: {
    createdBy?: { _id?: string | null } | string | null;
    managerId?: { _id?: string | null } | string | null;
    project_owner?: { _id?: string | null } | string | null;
    owner?: { _id?: string | null } | string | null;
  } | null | undefined,
  sprint: { createdBy?: { _id?: string | null } | string | null } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'superadmin' || role === 'admin') return true;

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

export const canCreateStory = (user: { role?: string | null } | null | undefined) => {
  const role = normalizeRole(user?.role);
  return role === 'owner' || role === 'manager' || role === 'superadmin';
};

export const canEditStory = (user: { role?: string | null } | null | undefined) => canCreateStory(user);
export const canDeleteStory = (user: { role?: string | null } | null | undefined) => canCreateStory(user);

export const canCreateIssue = (user: { role?: string | null } | null | undefined) => Boolean(user);

export const canEditIssueField = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  issue: {
    assignedTo?: { _id?: string | null } | string | null;
    assignedBy?: { _id?: string | null } | string | null;
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
    assignedById?: string | null;
  } | null | undefined,
  field: 'title' | 'description' | 'priority' | 'type' | 'severity' | 'status' | 'assignedTo' | 'default'
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;

  const currentUserId = getUserId(user);
  const creatorId = getEntityId(issue?.createdBy ?? issue?.createdById);
  const authorId = getEntityId(issue?.assignedBy ?? issue?.assignedById);
  const assigneeId = getEntityId(issue?.assignedTo);

  if (field === 'status' || field === 'description') {
    return Boolean(currentUserId && (creatorId === currentUserId || authorId === currentUserId || assigneeId === currentUserId));
  }

  return Boolean(currentUserId && (creatorId === currentUserId || authorId === currentUserId));
};

export const canDeleteIssue = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  issue: {
    assignedBy?: { _id?: string | null } | string | null;
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
    assignedById?: string | null;
  } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;

  const currentUserId = getUserId(user);
  const creatorId = getEntityId(issue?.createdBy ?? issue?.createdById);
  const authorId = getEntityId(issue?.assignedBy ?? issue?.assignedById);
  return Boolean(currentUserId && (creatorId === currentUserId || authorId === currentUserId));
};

export const canEditTaskTitle = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  task: {
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
  } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;

  const currentUserId = getUserId(user);
  const creatorId = getEntityId(task?.createdBy ?? task?.createdById);
  return Boolean(currentUserId && creatorId && String(currentUserId) === String(creatorId));
};

export const canEditTaskDescription = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  task: {
    assignedTo?: { _id?: string | null } | string | null;
    assignee?: { _id?: string | null } | null;
    assigneeId?: string | null;
    assignedToId?: string | null;
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
  } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;

  const currentUserId = getUserId(user);
  const assigneeId = getEntityId(task?.assignee?._id ?? task?.assigneeId ?? task?.assignedTo ?? task?.assignedToId);
  const creatorId = getEntityId(task?.createdBy ?? task?.createdById);
  return Boolean(currentUserId && (assigneeId === currentUserId || creatorId === currentUserId));
};

export const canEditTaskPriority = (user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined, task: { createdBy?: { _id?: string | null } | string | null; createdById?: string | null } | null | undefined) => canEditTaskTitle(user, task);
export const canChangeTaskAssignee = (user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined, task: { createdBy?: { _id?: string | null } | string | null; createdById?: string | null } | null | undefined) => canEditTaskTitle(user, task);

export const canChangeTaskStatus = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  task: {
    assignedTo?: { _id?: string | null } | string | null;
    assignee?: { _id?: string | null } | null;
    assigneeId?: string | null;
    assignedToId?: string | null;
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
  } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;

  const currentUserId = getUserId(user);
  const assigneeId = getEntityId(task?.assignee?._id ?? task?.assigneeId ?? task?.assignedTo ?? task?.assignedToId);
  const creatorId = getEntityId(task?.createdBy ?? task?.createdById);
  return Boolean(currentUserId && (assigneeId === currentUserId || creatorId === currentUserId));
};

export const canDeleteTask = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  task: {
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
  } | null | undefined,
  sprint?: { status?: string | null } | null
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;
  if (role === 'employee' && sprint?.status === 'active') return false;

  const currentUserId = getUserId(user);
  const creatorId = getEntityId(task?.createdBy ?? task?.createdById);
  return Boolean(currentUserId && creatorId && String(currentUserId) === String(creatorId));
};

export const canEditComment = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  comment: { userId?: { _id?: string | null } | string | null } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return false;
  const currentUserId = getUserId(user);
  const authorId = getEntityId(comment?.userId);
  return Boolean(currentUserId && authorId && String(currentUserId) === String(authorId));
};

export const canDeleteComment = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  comment: { userId?: { _id?: string | null } | string | null } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') return true;
  const currentUserId = getUserId(user);
  const authorId = getEntityId(comment?.userId);
  return Boolean(currentUserId && authorId && String(currentUserId) === String(authorId));
};

export const canEditTask = (
  user: { role?: string | null; id?: string | null; _id?: string | null } | null | undefined,
  task: {
    assignee?: { _id?: string | null } | null;
    assignedTo?: { _id?: string | null } | string | null;
    assigneeId?: string | null;
    assignedToId?: string | null;
    createdBy?: { _id?: string | null } | string | null;
    createdById?: string | null;
  } | null | undefined
) => {
  const role = normalizeRole(user?.role);
  if (role === 'owner' || role === 'manager' || role === 'superadmin') {
    return true;
  }

  if (role !== 'employee' || !user || !task) {
    return false;
  }

  const currentUserId = getUserId(user);
  const assigneeId = getEntityId(task.assignee?._id ?? task.assigneeId ?? task.assignedTo ?? task.assignedToId);
  const creatorId = getEntityId(task.createdBy ?? task.createdById);

  return Boolean(
    currentUserId &&
    ((assigneeId && String(currentUserId) === String(assigneeId)) ||
      (creatorId && String(currentUserId) === String(creatorId)))
  );
};

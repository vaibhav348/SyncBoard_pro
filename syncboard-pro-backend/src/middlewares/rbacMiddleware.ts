import { Request, Response, NextFunction } from 'express';

export type BackendRole = 'owner' | 'manager' | 'employee' | 'superadmin';

export type BackendPermission =
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

const ROLE_PERMISSIONS: Record<BackendRole, BackendPermission[]> = {
  superadmin: [
    'project.create', 'project.delete', 'workspace.manage', 'billing.manage', 'users.manage',
    'sprint.create', 'sprint.manage', 'story.create', 'story.edit', 'story.delete',
    'task.create', 'task.edit', 'task.delete', 'task.move', 'comment.create',
    'board.view', 'project.settings.manage', 'project.members.manage'
  ],
  owner: [
    'project.create', 'project.delete', 'workspace.manage', 'billing.manage', 'users.manage',
    'sprint.create', 'sprint.manage', 'story.create', 'story.edit', 'story.delete',
    'task.create', 'task.edit', 'task.delete', 'task.move', 'comment.create',
    'board.view', 'project.settings.manage', 'project.members.manage'
  ],
  manager: [
    'sprint.create', 'sprint.manage', 'story.create', 'story.edit', 'story.delete',
    'task.create', 'task.edit', 'task.delete', 'task.move', 'comment.create',
    'board.view', 'project.settings.manage', 'project.members.manage'
  ],
  employee: ['board.view', 'task.move', 'comment.create']
};

const normalizeRole = (role?: string | null): BackendRole => {
  const normalized = role?.toLowerCase();
  if (normalized === 'owner' || normalized === 'manager' || normalized === 'employee' || normalized === 'superadmin') {
    return normalized as BackendRole;
  }
  return 'employee';
};

export const authorize = (permission: BackendPermission | BackendPermission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = normalizeRole((req as any).user?.role);
    const required = Array.isArray(permission) ? permission : [permission];
    const allowed = required.every((item) => ROLE_PERMISSIONS[role].includes(item));

    if (!allowed) {
      return res.status(403).json({ message: 'You do not have the required permissions for this action.' });
    }

    return next();
  };
};

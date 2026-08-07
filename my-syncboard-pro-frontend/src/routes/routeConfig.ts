export type AppRole = 'owner' | 'manager' | 'employee' | 'superadmin' | 'admin';

export interface RouteRule {
  path: string;
  allowedRoles: AppRole[] | null;
}

export const ROUTE_RULES: RouteRule[] = [
  { path: '/dashboard', allowedRoles: null },
  { path: '/settings/profile', allowedRoles: null },
  { path: '/my-issues', allowedRoles: null },
  { path: '/projects', allowedRoles: null },
  { path: '/projects/:projectId', allowedRoles: null },
  { path: '/projects/:projectId/board', allowedRoles: null },
  { path: '/projects/:projectId/issues', allowedRoles: null },
  { path: '/projects/:projectId/issue', allowedRoles: null },
  { path: '/projects/:projectId/search', allowedRoles: null },
  { path: '/projects/:projectId/wiki', allowedRoles: null },
  { path: '/projects/:projectId/team', allowedRoles: null },
  { path: '/projects/new', allowedRoles: ['owner', 'manager'] },
  { path: '/team', allowedRoles: ['owner', 'manager','employee'] },
  { path: '/invite', allowedRoles: ['owner', 'manager'] },
  { path: '/settings/workspace', allowedRoles: ['owner'] },
  { path: '/settings/billing', allowedRoles: ['owner'] },
  { path: '/admin', allowedRoles: ['superadmin'] },
  { path: '/admin/workspaces', allowedRoles: ['superadmin'] },
  { path: '/admin/users', allowedRoles: ['superadmin'] },
];

export const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/accept-invite']);

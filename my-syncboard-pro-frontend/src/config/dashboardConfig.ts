import type { DashboardRole, QuickAction } from '../types/dashboard.types';

// 1. Hero Copy with added 'description' field for every role
export const heroCopy: Record<DashboardRole, { title: string; subtitle: string; description: string }> = {
  superadmin: {
    title: 'System control center',
    subtitle: 'Monitor every company workspace on the platform.',
    description: 'Manage comprehensive infrastructure health, provision corporate entities, and address platform-wide system exceptions or audit compliance logs.',
  },
  owner: {
    title: 'Company-wide overview',
    subtitle: 'Track every project and team member across your workspace.',
    description: 'Oversee corporate operations, administer high-level resource assignments, analyze financial configurations, and supervise organizational growth metrics.',
  },
  manager: {
    title: 'Team delivery overview',
    subtitle: 'Keep your projects on track and your team unblocked.',
    description: 'Coordinate functional execution loops, monitor milestone velocities, distribute specialized backlogs, and moderate team delivery standups.',
  },
  employee: {
    title: 'Your work today',
    subtitle: 'Everything assigned to you, in one place.',
    description: 'Execute pending issues, maintain continuous delivery status records, track updates inside operational threads, and review peer integration setups.',
  },
  admin: {
    title: 'System operations overview',
    subtitle: 'Monitor platform health and team delivery from a single place.',
    description: 'Coordinate workspace-wide delivery, review administrative health, and support cross-functional execution.',
  },
};

// 2. Quick Actions with added 'description' field for every single properties/action
export const quickActionsByRole: Record<DashboardRole, QuickAction[]> = {
  superadmin: [
    { 
      label: 'Review workspaces', 
      to: '/admin/workspaces',
      description: 'Audit registered corporate clusters, monitor structural consumption metrics, or adjust tenant licenses.'
    },
    { 
      label: 'Audit users', 
      to: '/admin/users',
      description: 'Review access logs, global security vectors, and regulate authentication contexts.'
    },
  ],
  owner: [
    { 
      label: 'Create project', 
      to: '/projects/new',
      description: 'Initialize a new project workspace and set deliverables.'
    },
    { 
      label: 'View projects', 
      to: '/projects',
      description: 'Manage all projects, members, and issues.'
    },
    { 
      label: 'Invite member', 
      to: '/invite',
      description: 'Add team members to your organization.'
    },
    // { 
    //   label: 'Workspace settings', 
    //   to: '/settings/workspace',
    //   description: 'Configure organization settings and preferences.'
    // },
  ],
  manager: [
    { 
      label: 'Create project', 
      to: '/projects/new',
      description: 'Initialize a clean project workspace, attach baseline resource pools, and set deliverables.'
    },
    { 
      label: 'Review projects', 
      to: '/projects',
      description: 'Audit delivery tracking states, review blocker metrics, and inspect milestone completion.'
    },
    { 
      label: 'Add member', 
      to: '/invite',
      description: 'Provision technical resources and add engineers directly to specific functional teams.'
    },
  ],
  employee: [
    { 
      label: 'My tasks', 
      to: '/my-tasks',
      description: 'View issues and stories assigned to you across all projects.'
    },
    { 
      label: 'Browse projects', 
      to: '/projects',
      description: 'Open a project board, backlog, or issue list.'
    },
    { 
      label: 'Update profile', 
      to: '/settings/profile',
      description: 'Refresh personal credentials and contact details.'
    },
  ],
  admin: [
    {
      label: 'Review projects',
      to: '/projects',
      description: 'Inspect delivery health, sprint velocity, and project-level operations.'
    },
    {
      label: 'Manage members',
      to: '/invite',
      description: 'Coordinate onboarding and team access across workspaces.'
    },
    {
      label: 'Open settings',
      to: '/settings/workspace',
      description: 'Adjust administrative preferences and workspace controls.'
    },
  ],
};
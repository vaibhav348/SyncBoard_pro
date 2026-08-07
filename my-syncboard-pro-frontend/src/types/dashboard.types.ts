import type { ReactNode } from 'react';

export type DashboardRole = 'superadmin' | 'owner' | 'manager' | 'employee' | 'admin';

export interface Metric {
  label: string;
  value: string;
  hint: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: ReactNode; // 👈 ab har metric ka icon zaroori hai
}

export interface ProjectSummary {
  id: string;
  name: string;
  memberCount: number;
  ownerName: string;
  progress: number; // 👈 0-100, completed issues / total issues
}

export interface IssueSummary {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  projectName: string;
  projectId?: string;
  issueKey?: string;
}

export interface TeamMemberLoad {
  id: string;
  name: string;
  openIssues: number;
  capacity: number; // 👈 max issues before "overloaded"
  role: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  projectCount: number;
  memberCount: number;
  status: 'active' | 'inactive';
}

export interface ActivityItem {
  id: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
  projectId?: string;
  issueId?: string;
}

export interface QuickAction {
  label: string;
  to: string;
  description : string;
}
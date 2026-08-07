export type MemberRole = 'owner' | 'manager' | 'employee';

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  title : string;
  role: MemberRole;
  department?: string;
  projects: string[]; // project names this member belongs to
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  invitedAt: string;
}
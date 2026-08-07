/** Shared issue/issue enums aligned with the backend Issue model. */
export type IssueStatus = 'Todo' | 'In-Progress' | 'Review' | 'Done';
export type IssuePriority = 'Low' | 'Medium' | 'High';
export type IssueType = 'Bug' | 'Feature' | 'Issue';
export type IssueSeverity = 'Low' | 'Normal' | 'High' | 'Critical';

/** Populated user reference on an issue (assignee, creator, etc.). */
export interface IssueUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Full issue object returned by the issue API.
 * Used by the active issue slice and issue detail views.
 */
export interface Issue {
  _id: string;
  issueNumber?: number;
  issueKey: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  severity: IssueSeverity;
  projectId?: string;
  companyId?: string;
  assignedTo?: IssueUser;
  assignedBy?: IssueUser;
  projectOwner?: IssueUser;
  votes?: number;
  createdAt?: string;
  updatedAt?: string;
  sprintId : string;
}

/** Lightweight row shape used by legacy table/list views. */
export interface IssueListItem {
  id: string;
  title: string;
  typeColor: string;
  severityColor: string;
  priorityColor: string;
  votes: number;
  status: IssueStatus;
  modified: string;
  assigneeAvatar: string;
}

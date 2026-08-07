export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface KanbanIssue {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  storyPoints: number;
  assignee: {
    name: string;
    avatar: string;
  };
}

export interface KanbanColumnData {
  id: IssueStatus;
  title: string;
}
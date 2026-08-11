// search.types.ts

export interface TaskResult {
  _id: string;
  title: string;
  status?: string;
  priority?: string;
  assignedTo?: {
    name: string;
    avatarUrl?: string;
  };
  updatedAt?: string;
}

export interface SprintResult {
  _id: string;
  name: string;
  goal?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface StoryResult {
  _id: string;
  title: string;
  storyPoints?: number;
  updatedAt?: string;
}

export interface IssueResult {
  _id: string;
  title: string;
  issueKey?: string;
  status?: string;
  priority?: string;
  type?: string;
  updatedAt?: string;
  createdBy?: {
    name: string;
    avatarUrl?: string;
  };
}

export interface MemberResult {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

export interface SearchResults {
  query?: string;
  tasks: TaskResult[];
  sprints: SprintResult[];
  stories: StoryResult[];
  issues: IssueResult[];
  members: MemberResult[];
  total?: number;
}

// A generic shape ResultSection can render without caring about the
// specific result type (Task vs Sprint vs Story vs Member).
export interface SearchItem {
  _id: string;
  primaryText: string;
  secondaryText?: string;
  status?: string;
}
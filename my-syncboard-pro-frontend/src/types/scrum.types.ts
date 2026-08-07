// scrum.types.ts

export interface ISprint {
  _id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'active' | 'planned' | 'completed';
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  completedAt?: string;
}

export interface IUserStory {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  storyPoints: number;
  sprintId: string | null;
  totalTasks: number;
  doneTasks: number;
}

export interface ITask {
  _id: string;
  storyId: string;
  sprintId: string | null;
  title: string;
  description: string;
  status: 'Todo' | 'In-Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  position: number;
}

export interface ITaskComment {
  _id: string;
  taskId: string;
  user: {
    _id: string;
    name: string;
  };
  content: string;
  createdAt: string;
}

export interface IIssue {
  _id: string;
  title: string;
  status: string;
  taskId: string | null;
}

// Redux State Interface
export interface ScrumState {
  sprints: ISprint[];
  activeSprint: ISprint | null;
  backlogStories: IUserStory[];
  storiesBySprint: Record<string, IUserStory[]>; // sprintId -> stories
  tasksByStory: Record<string, ITask[]>;          // storyId -> tasks
  activeSprintTasks: ITask[];                     // Board ke liye flat list
  loading: boolean;
  boardLoading: boolean;
  error: string | null;
  
  // Modals handle karne ke liye global variables
  showCreateSprint: boolean;
  showCreateStory: boolean;
  showCreateTask: boolean;
  showCreateIssues: boolean;
  createIssues: string | null;
  createStoryForSprintId: string | null; // kis sprint ke liye story ban rahi h
  confirmModal: { isOpen: boolean; title: string; message: string };
}
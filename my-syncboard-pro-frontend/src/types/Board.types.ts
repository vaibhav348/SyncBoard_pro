import type { IUserStory } from './scrum.types';

export type TaskStatus = 'Todo' | 'In-Progress' | 'Review' | 'Done';

export interface ITask {
  _id: string;
  title: string;
  description: any;
  status: TaskStatus;
  userStoryId: string;
  assignedTo?: any;
  createdBy?:any;
  previous : any;
  priority?:string;
}

export type BoardStory = IUserStory & {
  assignee ?: any;
  storyPoints?: number;
  status?: string;
  tasks?: ITask[];
};
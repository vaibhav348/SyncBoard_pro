export interface MockSprint {
    id: string;
    name: string;
    status: 'active' | 'planned' | 'completed';
    endDate: string;
  }
  
  export interface MockStory {
    id: string;
    title: string;
    points: number;
    status: 'Todo' | 'In-Progress' | 'Review' | 'Done';
    assignee: string;
  }
  
  export const MOCK_SPRINTS: MockSprint[] = [
    { id: 'sprint-5', name: 'SPRINT 5', status: 'planned', endDate: '25 Aug 2026' },
    { id: 'sprint-3', name: 'SPRINT 3: Users & Permissions', status: 'active', endDate: '10 Aug 2026' },
    { id: 'sprint-2', name: 'SPRINT 2', status: 'completed', endDate: '28 Jul 2026' },
    { id: 'sprint-1', name: 'SPRINT 1', status: 'completed', endDate: '14 Jul 2026' },
  ];
  
  export const MOCK_STORIES: Record<string, MockStory[]> = {
    'sprint-3': [
      { id: 'SCRUM-101', title: 'Implement RBAC Role guards for frontend routes', points: 5, status: 'In-Progress', assignee: 'Vaibhav' },
      { id: 'SCRUM-102', title: 'Design workspace workspace navigation panel', points: 3, status: 'Todo', assignee: 'Ananya' },
      { id: 'SCRUM-103', title: 'Fix user schema token expiration bug', points: 2, status: 'Done', assignee: 'Rohit' },
    ],
    'sprint-5': [
      { id: 'SCRUM-104', title: 'Setup Stripe billing microservice setup', points: 8, status: 'Todo', assignee: 'Unassigned' },
    ],
    'backlog': [
      { id: 'SCRUM-105', title: 'Add export to CSV action button for tables', points: 2, status: 'Todo', assignee: 'Unassigned' },
      { id: 'SCRUM-106', title: 'Integrate dynamic multi-language setup', points: 5, status: 'Todo', assignee: 'Unassigned' },
    ]
  };
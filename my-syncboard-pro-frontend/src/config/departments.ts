export type DepartmentOption =
  // Product & Engineering
  | 'Product Management'
  | 'Software Engineering'
  | 'UI/UX Design'
  | 'Quality Assurance'
  | 'Data Science & Analytics'
  | 'DevOps & SRE'
  | 'Cybersecurity'
  // Business & Operations
  | 'Sales & Business Dev'
  | 'Marketing'
  | 'Customer Success'
  | 'Customer Support'
  | 'Human Resources'
  | 'Finance'
  | 'Legal & Compliance'
  | 'Operations'
  // Admin & Leadership
  | 'Executive Office'
  | 'IT & Infrastructure'
  | 'Strategy & Planning';

export interface DepartmentGroup {
  label: string;
  options: DepartmentOption[];
}

export const DEPARTMENT_GROUPS: DepartmentGroup[] = [
  {
    label: 'Product & Engineering',
    options: [
      'Product Management',
      'Software Engineering',
      'UI/UX Design',
      'Quality Assurance',
      'Data Science & Analytics',
      'DevOps & SRE',
      'Cybersecurity',
    ],
  },
  {
    label: 'Business & Operations',
    options: [
      'Sales & Business Dev',
      'Marketing',
      'Customer Success',
      'Customer Support',
      'Human Resources',
      'Finance',
      'Legal & Compliance',
      'Operations',
    ],
  },
  {
    label: 'Admin & Leadership',
    options: [
      'Executive Office',
      'IT & Infrastructure',
      'Strategy & Planning',
    ],
  },
];

// Utility exports for easy mapping and default states
export const DEPARTMENTS: DepartmentOption[] = DEPARTMENT_GROUPS.flatMap((group) => group.options);
export const DEFAULT_DEPARTMENT: DepartmentOption = 'Software Engineering';
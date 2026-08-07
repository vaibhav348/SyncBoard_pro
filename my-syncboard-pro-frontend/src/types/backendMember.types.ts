export interface BackendMember {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: number;
  role: 'owner' | 'manager' | 'employee';
  title?: string;
  companyId: string;
  createdAt: string;
}
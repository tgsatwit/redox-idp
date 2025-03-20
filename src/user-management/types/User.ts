export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    lastLogin?: string;
    department?: string;
    position?: string;
  };
} 
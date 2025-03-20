export interface UserGroup {
  groupId: string;
  name: string;
  description: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    department?: string;
    region?: string;
  };
} 
export interface Permission {
  permissionId: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  requiredRoleLevel: number;
  createdAt: string;
  updatedAt: string;
}

export enum ResourceType {
  USERS = 'USERS',
  GROUPS = 'GROUPS',
  ROLES = 'ROLES',
  PERMISSIONS = 'PERMISSIONS',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
  MANAGE = 'MANAGE'
} 
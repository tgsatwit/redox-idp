export interface Role {
  roleId: string;
  name: string;
  description: string;
  level: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    defaultPermissions?: string[];
  };
}

export enum SystemRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  USER = 'USER'
}

export const roleHierarchy: Record<SystemRoles, { level: number; description: string }> = {
  [SystemRoles.SUPER_ADMIN]: {
    level: 1,
    description: 'Full system access with ability to manage all aspects'
  },
  [SystemRoles.ADMIN]: {
    level: 2,
    description: 'Administrative access with ability to manage users and groups'
  },
  [SystemRoles.MANAGER]: {
    level: 3,
    description: 'Managerial access with ability to manage team members'
  },
  [SystemRoles.TEAM_LEAD]: {
    level: 4,
    description: 'Team lead access with ability to manage team tasks'
  },
  [SystemRoles.USER]: {
    level: 5,
    description: 'Basic user access'
  }
}; 
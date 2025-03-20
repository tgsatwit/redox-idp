export interface GroupPermission {
  groupId: string;
  permissionId: string;
  assignedAt: string;
  assignedBy: string;
  requiredRoleLevel?: number;
} 
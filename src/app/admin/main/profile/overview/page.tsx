'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Banner from '@/components/admin/main/profile/overview/Banner';
import General from '@/components/admin/main/profile/overview/General';
import Notification from '@/components/admin/main/profile/overview/Notification';
import Project from '@/components/admin/main/profile/overview/Project';
import Storage from '@/components/admin/main/profile/overview/Storage';
import Upload from '@/components/admin/main/profile/overview/Upload';

// Mock data - in production, this would come from your DynamoDB tables
const userGroups = [
  { groupId: '1', name: 'Administrators', description: 'Full system access', roleId: '1' },
  { groupId: '2', name: 'Managers', description: 'Department management', roleId: '2' },
  { groupId: '3', name: 'Users', description: 'Basic access', roleId: '5' }
];

const permissions = [
  { permissionId: '1', name: 'READ_USERS', resource: 'USERS', action: 'READ', requiredRoleLevel: 2 },
  { permissionId: '2', name: 'WRITE_USERS', resource: 'USERS', action: 'WRITE', requiredRoleLevel: 2 },
  { permissionId: '3', name: 'MANAGE_GROUPS', resource: 'GROUPS', action: 'MANAGE', requiredRoleLevel: 1 }
];

const roles = [
  { roleId: '1', name: 'SUPER_ADMIN', level: 1 },
  { roleId: '2', name: 'ADMIN', level: 2 },
  { roleId: '3', name: 'MANAGER', level: 3 },
  { roleId: '4', name: 'TEAM_LEAD', level: 4 },
  { roleId: '5', name: 'USER', level: 5 }
];

// Mock user - in production, this would be the current logged-in user
const user = {
  userId: '1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  roleId: '1',
  groups: ['1'] // Group IDs the user belongs to
};

const UserProfileOverview = () => {
  const [activeTab, setActiveTab] = useState('userGroups');
  const [userGroupMemberships, setUserGroupMemberships] = useState<string[]>(user.groups);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // In a real app, you would fetch this data from DynamoDB
  useEffect(() => {
    // Fetch user data, groups, and permissions
  }, []);

  const handleGroupToggle = (groupId: string) => {
    if (userGroupMemberships.includes(groupId)) {
      setUserGroupMemberships(userGroupMemberships.filter(id => id !== groupId));
    } else {
      setUserGroupMemberships([...userGroupMemberships, groupId]);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.roleId === roleId);
    return role ? role.name : 'Unknown';
  };

  return (
    <div className="mt-3 h-full w-full">
      {/* User Profile Header */}
      <div className="h-[200px] w-full rounded-[20px] bg-gradient-to-br from-brand-400 to-brand-600" />
      
      <div className="mx-auto w-full max-w-5xl -mt-24 px-4">
        <Card extra="mb-5">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                  {user.firstName} {user.lastName}
                </h4>
                <p className="text-base text-gray-600">{user.email}</p>
                <Badge className="mt-2" variant="outline">
                  {getRoleName(user.roleId)}
                </Badge>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Button>Update Profile</Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* User Management Tabs */}
        <Card extra="mb-5">
          <div className="p-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="userGroups">User Groups</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="roleManagement">Role Management</TabsTrigger>
              </TabsList>
              
              {/* User Groups Tab */}
              <TabsContent value="userGroups">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Manage User Groups</h3>
                    <Button>Add New Group</Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Membership</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userGroups.map((group) => (
                        <TableRow key={group.groupId}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.description}</TableCell>
                          <TableCell>{getRoleName(group.roleId)}</TableCell>
                          <TableCell>
                            <Button 
                              variant={userGroupMemberships.includes(group.groupId) ? "default" : "outline"}
                              onClick={() => handleGroupToggle(group.groupId)}
                            >
                              {userGroupMemberships.includes(group.groupId) ? "Member" : "Join"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              {/* Permissions Tab */}
              <TabsContent value="permissions">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Manage Permissions</h3>
                    <div className="flex space-x-2">
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by Resource" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="USERS">Users</SelectItem>
                            <SelectItem value="GROUPS">Groups</SelectItem>
                            <SelectItem value="ROLES">Roles</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button>Add Permission</Button>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Required Role Level</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((permission) => (
                        <TableRow key={permission.permissionId}>
                          <TableCell className="font-medium">{permission.name}</TableCell>
                          <TableCell>{permission.resource}</TableCell>
                          <TableCell>{permission.action}</TableCell>
                          <TableCell>{permission.requiredRoleLevel}</TableCell>
                          <TableCell>
                            <Button 
                              variant={selectedPermissions.includes(permission.permissionId) ? "default" : "outline"}
                              onClick={() => handlePermissionToggle(permission.permissionId)}
                              disabled={roles.find(r => r.roleId === user.roleId)?.level > permission.requiredRoleLevel}
                            >
                              {selectedPermissions.includes(permission.permissionId) ? "Assigned" : "Assign"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              {/* Role Management Tab */}
              <TabsContent value="roleManagement">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Role Management</h3>
                    <Button>Add New Role</Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.roleId}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>{role.level}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="destructive" size="sm" disabled={role.level === 1}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileOverview;

'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Mock data - in production, this would come from your DynamoDB tables
const users = [
  {
    userId: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    status: 'ACTIVE',
    roleId: '1',
    createdAt: '2023-03-15T10:30:00Z',
    groups: ['1']
  },
  {
    userId: '2',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    status: 'ACTIVE',
    roleId: '3',
    createdAt: '2023-04-20T14:15:00Z',
    groups: ['2']
  },
  {
    userId: '3',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    status: 'ACTIVE',
    roleId: '5',
    createdAt: '2023-05-10T09:45:00Z',
    groups: ['3']
  },
  {
    userId: '4',
    email: 'suspended@example.com',
    firstName: 'Suspended',
    lastName: 'User',
    status: 'SUSPENDED',
    roleId: '5',
    createdAt: '2023-02-05T11:20:00Z',
    groups: []
  }
];

const roles = [
  { roleId: '1', name: 'SUPER_ADMIN', level: 1 },
  { roleId: '2', name: 'ADMIN', level: 2 },
  { roleId: '3', name: 'MANAGER', level: 3 },
  { roleId: '4', name: 'TEAM_LEAD', level: 4 },
  { roleId: '5', name: 'USER', level: 5 }
];

const userGroups = [
  { groupId: '1', name: 'Administrators', description: 'Full system access', roleId: '1' },
  { groupId: '2', name: 'Managers', description: 'Department management', roleId: '2' },
  { groupId: '3', name: 'Users', description: 'Basic access', roleId: '5' }
];

const UserOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm]);

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.roleId === roleId);
    return role ? role.name : 'Unknown';
  };

  const getGroupNames = (groupIds: string[]) => {
    return groupIds.map(id => {
      const group = userGroups.find(g => g.groupId === id);
      return group ? group.name : 'Unknown';
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card extra={'w-full h-full mt-3'}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h3 className="text-xl font-bold text-navy-700 dark:text-white">
            User Management
          </h3>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <Link href="/admin/main/users/new-user">
              <Button>Add New User</Button>
            </Link>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.userId}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge 
                    variant={user.status === 'ACTIVE' ? 'default' : 'destructive'} 
                    className="capitalize"
                  >
                    {user.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getRoleName(user.roleId)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getGroupNames(user.groups).map((name, idx) => (
                      <Badge key={idx} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                    {user.groups.length === 0 && (
                      <span className="text-gray-500 text-sm">No groups</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/admin/main/profile/overview?userId=${user.userId}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Button variant="destructive" size="sm">
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No users found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default UserOverview;

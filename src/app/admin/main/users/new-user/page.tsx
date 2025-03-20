'use client';
import { useState } from 'react';
import Card from '@/components/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';

// Mock data - in production, this would come from your DynamoDB tables
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

const NewUser = () => {
  const [userData, setUserData] = useState({
    userId: uuidv4(),
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    groups: [] as string[],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const handleRoleChange = (value: string) => {
    setUserData({
      ...userData,
      roleId: value
    });
  };

  const handleGroupToggle = (groupId: string) => {
    const updatedGroups = userData.groups.includes(groupId)
      ? userData.groups.filter(id => id !== groupId)
      : [...userData.groups, groupId];
    
    setUserData({
      ...userData,
      groups: updatedGroups
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send the data to your API to store in DynamoDB
    console.log('Creating new user:', userData);
    
    // Create user-group memberships for each selected group
    const memberships = userData.groups.map(groupId => ({
      userId: userData.userId,
      groupId,
      joinedAt: new Date().toISOString(),
      addedBy: 'current-admin-id' // In production, this would be the current user's ID
    }));
    
    console.log('User group memberships:', memberships);
    
    // Reset form or redirect
    alert('User created successfully!');
  };

  return (
    <div className="mt-3 h-full w-full">
      <div className="h-[200px] w-full rounded-[20px] bg-gradient-to-br from-brand-400 to-brand-600" />
      
      <div className="mx-auto max-w-4xl -mt-24 px-4 pb-10">
        <Card extra="mb-5">
          <div className="p-6">
            <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-6">
              Create New User
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-white">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              
              {/* Role Assignment */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-white">Role Assignment</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role</Label>
                  <Select 
                    value={userData.roleId}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roles.map(role => (
                          <SelectItem key={role.roleId} value={role.roleId}>
                            {role.name} (Level {role.level})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Group Membership */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-white">Group Membership</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userGroups.map(group => (
                    <div key={group.groupId} className="border rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium">{group.name}</h5>
                          <p className="text-sm text-gray-500">{group.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant={userData.groups.includes(group.groupId) ? "default" : "outline"}
                          onClick={() => handleGroupToggle(group.groupId)}
                          className="ml-2"
                        >
                          {userData.groups.includes(group.groupId) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewUser;

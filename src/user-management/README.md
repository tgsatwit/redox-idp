# User Management System

A robust user management system built with AWS DynamoDB, providing role-based access control (RBAC) and user group management capabilities.

## Features

- User management with role-based access control
- User group management
- Permission management
- Role hierarchy system
- System and custom roles support
- Flexible permission assignments

## System Roles

The system includes the following predefined roles:

1. **SUPER_ADMIN** (Level 1)
   - Full system access
   - Can manage all aspects of the system
   - Highest level of access

2. **ADMIN** (Level 2)
   - Administrative access
   - Can manage users and groups
   - High level of access

3. **MANAGER** (Level 3)
   - Managerial access
   - Can manage team members
   - Medium-high level of access

4. **TEAM_LEAD** (Level 4)
   - Team lead access
   - Can manage team tasks
   - Medium level of access

5. **USER** (Level 5)
   - Basic user access
   - Standard user permissions
   - Lowest level of access

## Database Structure

### Tables

1. **Users**
   - Primary Key: `userId` (String)
   - GSI: `email` (String)
   - Contains user information and role assignments

2. **Roles**
   - Primary Key: `roleId` (String)
   - Contains role definitions and hierarchy levels

3. **UserGroups**
   - Primary Key: `groupId` (String)
   - Contains group information and default roles

4. **UserGroupMemberships**
   - Primary Key: `userId` (String)
   - Sort Key: `groupId` (String)
   - Manages user-group relationships

5. **Permissions**
   - Primary Key: `permissionId` (String)
   - Contains permission definitions and role requirements

6. **GroupPermissions**
   - Primary Key: `groupId` (String)
   - Sort Key: `permissionId` (String)
   - Manages group-permission relationships

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure AWS Credentials**
   Ensure you have AWS credentials configured in your environment:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=us-east-1
   ```

3. **Create DynamoDB Tables**
   ```bash
   npm run create-tables
   ```

4. **Seed Initial Data**
   ```bash
   npm run seed-data
   ```

## Usage

### Managing Users

```typescript
// Create a new user
const user = {
  userId: uuidv4(),
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'ACTIVE',
  roleId: 'role_id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Add user to a group
const membership = {
  userId: user.userId,
  groupId: 'group_id',
  joinedAt: new Date().toISOString(),
  addedBy: 'admin_user_id'
};
```

### Managing Permissions

```typescript
// Create a permission
const permission = {
  permissionId: uuidv4(),
  name: 'READ_USERS',
  description: 'Permission to read user data',
  resource: 'USERS',
  action: 'READ',
  requiredRoleLevel: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Assign permission to a group
const groupPermission = {
  groupId: 'group_id',
  permissionId: permission.permissionId,
  assignedAt: new Date().toISOString(),
  assignedBy: 'admin_user_id'
};
```

## Best Practices

1. **Role Assignment**
   - Always assign the minimum required role level
   - Use custom roles for specific use cases
   - Maintain role hierarchy integrity

2. **Permission Management**
   - Group related permissions together
   - Use descriptive permission names
   - Set appropriate role level requirements

3. **User Groups**
   - Organize users by department or function
   - Use groups for bulk permission management
   - Maintain clear group hierarchies

## Security Considerations

1. **Access Control**
   - Implement proper role-based access checks
   - Validate permission requirements
   - Use principle of least privilege

2. **Data Protection**
   - Encrypt sensitive user data
   - Implement audit logging
   - Regular security reviews

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
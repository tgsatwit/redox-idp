import AWS from 'aws-sdk';
require('dotenv').config({ path: '../../.env.local' });
import { v4 as uuidv4 } from 'uuid';
import {
  SystemRoles,
  roleHierarchy,
  ResourceType,
  ActionType
} from '../src/user-management/types';

AWS.config.update({
  accessKeyId: process.env.APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
  region: process.env.APP_REGION || 'ap-southeast-2'
});

const docClient = new AWS.DynamoDB.DocumentClient();

const putItemIfNotExists = async (tableName: string, item: any, key: string) => {
  try {
    const existingItem = await docClient.get({
      TableName: tableName,
      Key: { [key]: item[key] }
    }).promise();

    if (!existingItem.Item) {
      await docClient.put({
        TableName: tableName,
        Item: item
      }).promise();
      console.log(`Added item to ${tableName}:`, item);
    } else {
      console.log(`Item already exists in ${tableName}:`, item);
    }
  } catch (error) {
    console.error(`Error adding item to ${tableName}:`, error);
  }
};

const seedRoles = async () => {
  const now = new Date().toISOString();
  
  for (const [roleName, roleInfo] of Object.entries(roleHierarchy)) {
    const role = {
      roleId: uuidv4(),
      name: roleName,
      description: roleInfo.description,
      level: roleInfo.level,
      isSystem: true,
      createdAt: now,
      updatedAt: now
    };
    
    await putItemIfNotExists('Roles', role, 'roleId');
  }
};

const seedPermissions = async () => {
  const now = new Date().toISOString();
  
  // Create basic CRUD permissions for each resource
  for (const resource of Object.values(ResourceType)) {
    for (const action of Object.values(ActionType)) {
      const permission = {
        permissionId: uuidv4(),
        name: `${action}_${resource}`,
        description: `Permission to ${action.toLowerCase()} ${resource.toLowerCase()}`,
        resource,
        action,
        requiredRoleLevel: action === ActionType.MANAGE ? 1 : 2, // SUPER_ADMIN for MANAGE, ADMIN for others
        createdAt: now,
        updatedAt: now
      };
      
      await putItemIfNotExists('Permissions', permission, 'permissionId');
    }
  }
};

const seedInitialAdmin = async () => {
  const now = new Date().toISOString();
  
  // Get the SUPER_ADMIN role
  const superAdminRole = await docClient.query({
    TableName: 'Roles',
    IndexName: 'NameIndex',
    KeyConditionExpression: '#name = :name',
    ExpressionAttributeNames: {
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':name': SystemRoles.SUPER_ADMIN
    }
  }).promise();
  
  if (superAdminRole.Items && superAdminRole.Items.length > 0) {
    const adminUser = {
      userId: uuidv4(),
      email: 'admin@example.com',
      firstName: 'System',
      lastName: 'Administrator',
      status: 'ACTIVE',
      roleId: superAdminRole.Items[0].roleId,
      createdAt: now,
      updatedAt: now,
      metadata: {
        department: 'IT',
        position: 'System Administrator'
      }
    };
    
    await putItemIfNotExists('Users', adminUser, 'userId');
  }
};

const seedData = async () => {
  console.log('Seeding initial data...');
  
  await seedRoles();
  await seedPermissions();
  await seedInitialAdmin();
  
  console.log('Initial data seeding completed.');
};

seedData(); 
import AWS from 'aws-sdk';
require('dotenv').config({ path: '../../.env.local' });

AWS.config.update({
  accessKeyId: process.env.APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
  region: process.env.APP_REGION || 'ap-southeast-2'
});

const dynamodb = new AWS.DynamoDB();

const createTableIfNotExists = async (params: AWS.DynamoDB.CreateTableInput) => {
  try {
    await dynamodb.describeTable({ TableName: params.TableName }).promise();
    console.log(`Table ${params.TableName} already exists. Skipping creation.`);
  } catch (error) {
    if ((error as any).code === 'ResourceNotFoundException') {
      console.log(`Creating table ${params.TableName}...`);
      await dynamodb.createTable(params).promise();
      console.log(`Waiting for table ${params.TableName} to be active...`);
      await dynamodb.waitFor('tableExists', { TableName: params.TableName }).promise();
      console.log(`Table ${params.TableName} created successfully.`);
    } else {
      console.error(`Error checking if table ${params.TableName} exists:`, error);
      throw error;
    }
  }
};

// Users Table
const userTableParams: AWS.DynamoDB.CreateTableInput = {
  TableName: 'Users',
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'EmailIndex',
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// Roles Table
const roleTableParams: AWS.DynamoDB.CreateTableInput = {
  TableName: 'Roles',
  KeySchema: [
    { AttributeName: 'roleId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'roleId', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// UserGroups Table
const userGroupTableParams: AWS.DynamoDB.CreateTableInput = {
  TableName: 'UserGroups',
  KeySchema: [
    { AttributeName: 'groupId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'groupId', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// UserGroupMemberships Table
const userGroupMembershipTableParams: AWS.DynamoDB.CreateTableInput = {
  TableName: 'UserGroupMemberships',
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' },
    { AttributeName: 'groupId', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'groupId', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// Permissions Table
const permissionTableParams: AWS.DynamoDB.CreateTableInput = {
  TableName: 'Permissions',
  KeySchema: [
    { AttributeName: 'permissionId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'permissionId', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// GroupPermissions Table
const groupPermissionTableParams: AWS.DynamoDB.CreateTableInput = {
  TableName: 'GroupPermissions',
  KeySchema: [
    { AttributeName: 'groupId', KeyType: 'HASH' },
    { AttributeName: 'permissionId', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'groupId', AttributeType: 'S' },
    { AttributeName: 'permissionId', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

const setupTables = async () => {
  console.log('Setting up DynamoDB tables...');
  
  await createTableIfNotExists(userTableParams);
  await createTableIfNotExists(roleTableParams);
  await createTableIfNotExists(userGroupTableParams);
  await createTableIfNotExists(userGroupMembershipTableParams);
  await createTableIfNotExists(permissionTableParams);
  await createTableIfNotExists(groupPermissionTableParams);
  
  console.log('DynamoDB setup completed successfully.');
};

setupTables(); 
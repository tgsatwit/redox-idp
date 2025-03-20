import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

AWS.config.update({
  accessKeyId: process.env.APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
  region: process.env.APP_REGION
});

const dynamodb = new AWS.DynamoDB();

const createTable = async (params: AWS.DynamoDB.CreateTableInput) => {
  try {
    await dynamodb.createTable(params).promise();
    console.log(`Table ${params.TableName} created successfully.`);
  } catch (error) {
    if ((error as any).code === 'ResourceInUseException') {
      console.log(`Table ${params.TableName} already exists.`);
    } else {
      console.error(`Error creating table ${params.TableName}:`, error);
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
    { AttributeName: 'roleId', AttributeType: 'S' },
    { AttributeName: 'name', AttributeType: 'S' } // Add this line
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'NameIndex',
      KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
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

const createTables = async () => {
  console.log('Creating DynamoDB tables...');
  
  await createTable(userTableParams);
  await createTable(roleTableParams);
  await createTable(userGroupTableParams);
  await createTable(userGroupMembershipTableParams);
  await createTable(permissionTableParams);
  await createTable(groupPermissionTableParams);
  
  console.log('All tables created successfully.');
};

createTables();
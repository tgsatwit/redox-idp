import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  CreateTableCommand, 
  DeleteTableCommand,
  DescribeTableCommand,
  GlobalSecondaryIndex,
  AttributeDefinition,
  KeySchemaElement
} from '@aws-sdk/client-dynamodb';

// Get configuration from environment variables
const region = process.env.APP_REGION || 'ap-southeast-2';
const workflowsTable = process.env.DYNAMODB_WORKFLOWS_TABLE || 'document-processor-workflows';
const tasksTable = process.env.DYNAMODB_WORKFLOW_TASKS_TABLE || 'document-processor-workflow-tasks';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.APP_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_SECRET_ACCESS_KEY || ''
  }
});

// Table definitions
const workflowsTableDefinition = {
  TableName: workflowsTable,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'type', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'N' }
  ] as AttributeDefinition[],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ] as KeySchemaElement[],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'type-createdAt-index',
      KeySchema: [
        { AttributeName: 'type', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ] as GlobalSecondaryIndex[],
  BillingMode: 'PAY_PER_REQUEST'
};

const tasksTableDefinition = {
  TableName: tasksTable,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'stepId', AttributeType: 'N' }
  ] as AttributeDefinition[],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ] as KeySchemaElement[],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'stepId-index',
      KeySchema: [
        { AttributeName: 'stepId', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    }
  ] as GlobalSecondaryIndex[],
  BillingMode: 'PAY_PER_REQUEST'
};

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function deleteTableIfExists(tableName: string): Promise<void> {
  if (await tableExists(tableName)) {
    console.log(`Deleting existing table: ${tableName}`);
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    
    // Wait for table to be deleted
    console.log('Waiting for table deletion...');
    let exists = true;
    while (exists) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      exists = await tableExists(tableName);
    }
  }
}

async function createTable(definition: any): Promise<void> {
  try {
    console.log(`Creating table: ${definition.TableName}`);
    await client.send(new CreateTableCommand(definition));
    
    // Wait for table to be created
    console.log('Waiting for table creation...');
    let tableActive = false;
    while (!tableActive) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await client.send(
        new DescribeTableCommand({ TableName: definition.TableName })
      );
      tableActive = response.Table?.TableStatus === 'ACTIVE';
    }
    
    console.log(`Table ${definition.TableName} created successfully`);
  } catch (error) {
    console.error(`Error creating table ${definition.TableName}:`, error);
    throw error;
  }
}

async function setupTables(forceRecreate: boolean = false) {
  try {
    // Setup Workflows table
    if (forceRecreate) {
      await deleteTableIfExists(workflowsTable);
    }
    if (!await tableExists(workflowsTable)) {
      await createTable(workflowsTableDefinition);
    } else {
      console.log(`Table ${workflowsTable} already exists`);
    }

    // Setup Tasks table
    if (forceRecreate) {
      await deleteTableIfExists(tasksTable);
    }
    if (!await tableExists(tasksTable)) {
      await createTable(tasksTableDefinition);
    } else {
      console.log(`Table ${tasksTable} already exists`);
    }

    console.log('All tables setup completed successfully');
  } catch (error) {
    console.error('Error setting up tables:', error);
    process.exit(1);
  }
}

// Check if script is being run directly
if (require.main === module) {
  const forceRecreate = process.argv.includes('--force');
  setupTables(forceRecreate).catch(console.error);
}

export { setupTables }; 
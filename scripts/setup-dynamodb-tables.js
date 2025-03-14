#!/usr/bin/env node

/**
 * Script to set up the necessary DynamoDB tables for the Horizon document processing system
 * Run with: node scripts/setup-dynamodb-tables.js
 */

require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.APP_REGION || 'ap-southeast-2',
  accessKeyId: process.env.APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
});

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB();

// Table names
const CONFIG_TABLE = process.env.DYNAMODB_CONFIG_TABLE || 'horizon-config';
const RETENTION_POLICY_TABLE = process.env.DYNAMODB_RETENTION_POLICY_TABLE || 'horizon-retention-policies';
const STORAGE_SOLUTIONS_TABLE = process.env.DYNAMODB_STORAGE_SOLUTIONS_TABLE || 'horizon-storage-solutions';

// Table creation parameters
const configTableParams = {
  TableName: CONFIG_TABLE,
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

const retentionPolicyTableParams = {
  TableName: RETENTION_POLICY_TABLE,
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

const storageSolutionsTableParams = {
  TableName: STORAGE_SOLUTIONS_TABLE,
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// DynamoDB Document Client for easier data manipulation
const docClient = new AWS.DynamoDB.DocumentClient();

// Default storage solutions to be created
const defaultStorageSolutions = [
  {
    id: '1',
    name: 'High-Performance Storage',
    description: 'Fast, frequently accessed storage with high IOPS for active documents',
    accessLevel: 'hot',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '2',
    name: 'Standard Storage',
    description: 'General purpose storage for documents accessed occasionally',
    accessLevel: 'warm',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '3',
    name: 'Archive Storage',
    description: 'Low-cost storage for rarely accessed, long-term document retention',
    accessLevel: 'cold',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

/**
 * Create a table if it doesn't exist
 * @param {Object} params - Table creation parameters
 * @returns {Promise<void>}
 */
async function createTableIfNotExists(params) {
  try {
    // Check if the table already exists
    await dynamoDB.describeTable({ TableName: params.TableName }).promise();
    console.log(`Table ${params.TableName} already exists. Skipping creation.`);
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      // Table doesn't exist, create it
      console.log(`Creating table ${params.TableName}...`);
      await dynamoDB.createTable(params).promise();
      
      // Wait for the table to be created
      console.log(`Waiting for table ${params.TableName} to be active...`);
      await dynamoDB.waitFor('tableExists', { TableName: params.TableName }).promise();
      console.log(`Table ${params.TableName} created successfully.`);
    } else {
      // Other error
      console.error(`Error checking if table ${params.TableName} exists:`, error);
      throw error;
    }
  }
}

/**
 * Create default storage solutions
 * @returns {Promise<void>}
 */
async function createDefaultStorageSolutions() {
  try {
    console.log('Checking if default storage solutions need to be created...');
    
    // First, check if any storage solutions already exist
    const existingItems = await docClient.scan({
      TableName: STORAGE_SOLUTIONS_TABLE,
    }).promise();
    
    if (existingItems.Items && existingItems.Items.length > 0) {
      console.log(`${existingItems.Items.length} storage solutions already exist. Skipping default creation.`);
      return;
    }
    
    // If no items exist, create the default storage solutions
    console.log('Creating default storage solutions...');
    
    const putPromises = defaultStorageSolutions.map(solution => {
      return docClient.put({
        TableName: STORAGE_SOLUTIONS_TABLE,
        Item: solution
      }).promise();
    });
    
    await Promise.all(putPromises);
    console.log(`Created ${defaultStorageSolutions.length} default storage solutions.`);
  } catch (error) {
    console.error('Error creating default storage solutions:', error);
    throw error;
  }
}

/**
 * Setup all tables and default data
 */
async function setupTables() {
  try {
    console.log('Setting up DynamoDB tables...');
    
    // Create tables if they don't exist
    await createTableIfNotExists(configTableParams);
    await createTableIfNotExists(retentionPolicyTableParams);
    await createTableIfNotExists(storageSolutionsTableParams);
    
    // Create default data
    await createDefaultStorageSolutions();
    
    console.log('DynamoDB setup completed successfully.');
  } catch (error) {
    console.error('Error setting up DynamoDB tables:', error);
    process.exit(1);
  }
}

// Run the setup
setupTables(); 
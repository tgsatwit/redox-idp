import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Default workflow tasks
const defaultWorkflowTasks = [
  {
    id: 'task_autocls_documents',
    name: 'Auto-classify documents',
    description: 'Automatically classify document types using AWS Comprehend',
    stepId: 2, // Classify & Analyse
    defaultEnabled: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_classify_llm',
    name: 'Classify with LLM',
    description: 'Use LLM to classify documents if AWS classification is unsuccessful',
    stepId: 2, // Classify & Analyse
    defaultEnabled: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_scan_tfn',
    name: 'Scan for TFN',
    description: 'Detect and handle Tax File Numbers in the document',
    stepId: 2, // Classify & Analyse
    defaultEnabled: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_fraud_check',
    name: 'Conduct Fraud Check',
    description: 'Perform fraud analysis and verification',
    stepId: 2, // Classify & Analyse
    defaultEnabled: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_identify_data',
    name: 'Automatically Identify Data Elements',
    description: 'Identify and extract data elements from the document',
    stepId: 3, // Process Document
    defaultEnabled: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_redact_elements',
    name: 'Automatically Redact Elements',
    description: 'Redact sensitive information from the document',
    stepId: 3, // Process Document
    defaultEnabled: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_create_summary',
    name: 'Create Summary',
    description: 'Generate a document summary using LLM',
    stepId: 3, // Process Document
    defaultEnabled: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_save_original',
    name: 'Save Original Document',
    description: 'Save the original document with retention policy',
    stepId: 3, // Process Document
    defaultEnabled: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'task_save_redacted',
    name: 'Save Redacted Document',
    description: 'Save the redacted document with retention policy',
    stepId: 3, // Process Document
    defaultEnabled: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// Get DynamoDB configuration
const getDynamoDBConfig = () => {
  const localEndpoint = process.env.DYNAMODB_LOCAL_ENDPOINT;
  
  console.log('AWS Credentials:', {
    region: process.env.APP_REGION,
    accessKeyId: process.env.APP_ACCESS_KEY_ID ? 'Set' : 'Not set',
    secretAccessKey: process.env.APP_SECRET_ACCESS_KEY ? 'Set' : 'Not set'
  });
  
  if (localEndpoint) {
    console.log('Using local DynamoDB endpoint:', localEndpoint);
    return {
      region: 'local',
      endpoint: localEndpoint,
      credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
      }
    };
  }
  
  console.log('Using AWS DynamoDB in region:', process.env.APP_REGION || 'us-east-1');
  return {
    region: process.env.APP_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.APP_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.APP_SECRET_ACCESS_KEY || ''
    }
  };
};

// Create DynamoDB clients
const dynamoClient = new DynamoDBClient(getDynamoDBConfig());
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const WORKFLOW_TASKS_TABLE = process.env.DYNAMODB_WORKFLOW_TASKS_TABLE || 'document-processor-workflow-tasks';

async function initializeWorkflowTasks() {
  try {
    console.log(`Initializing workflow tasks in table: ${WORKFLOW_TASKS_TABLE}`);

    // First check if table exists and is empty
    // We'll do a simple query for the first task to see if it exists
    console.log('Checking if table already contains items...');
    
    // Use batch write to insert default tasks
    const batchItems = defaultWorkflowTasks.map(task => ({
      PutRequest: {
        Item: task
      }
    }));
    
    console.log(`Preparing to insert ${batchItems.length} default tasks...`);
    
    // DynamoDB can only process 25 items at a time in a batch
    for (let i = 0; i < batchItems.length; i += 25) {
      const batch = batchItems.slice(i, i + 25);
      
      const batchCommand = new BatchWriteCommand({
        RequestItems: {
          [WORKFLOW_TASKS_TABLE]: batch
        }
      });
      
      console.log(`Sending batch of ${batch.length} items to DynamoDB...`);
      await docClient.send(batchCommand);
    }
    
    console.log('Successfully initialized workflow tasks!');
  } catch (error) {
    console.error('Error initializing workflow tasks:', error);
  }
}

// Run the initialization
initializeWorkflowTasks()
  .then(() => {
    console.log('Workflow tasks initialization complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during workflow tasks initialization:', error);
    process.exit(1);
  }); 
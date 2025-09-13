import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { createId } from '@paralleldrive/cuid2';
import { Prompt } from '@/lib/types';

// Configure AWS DynamoDB with proper credentials
const getDynamoDBConfig = () => {
  console.log('Initializing AWS DynamoDB configuration with environment variables');
  
  // Environment variables to check (in order of priority)
  const accessKeyOptions = [
    process.env.APP_ACCESS_KEY_ID,
    process.env.APP_ACCESS_KEY_ID
  ];
  
  const secretKeyOptions = [
    process.env.APP_SECRET_ACCESS_KEY,
    process.env.APP_SECRET_ACCESS_KEY
  ];
  
  const regionOptions = [
    process.env.APP_REGION,
    process.env.APP_REGION,
    'us-east-1'  // Default fallback region
  ];
  
  // Find the first non-empty value
  const accessKeyId = accessKeyOptions.find(key => key && key.trim());
  const secretAccessKey = secretKeyOptions.find(key => key && key.trim());
  const region = regionOptions.find(r => r && r.trim()) || 'us-east-1';
  
  console.log(`Using AWS DynamoDB in region: ${region}`);
  console.log(`AWS credentials: ${accessKeyId ? 'Found' : 'Not found in environment'}`);
  
  const config: any = { region };
  
  // Only add credentials if explicitly provided in environment variables
  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey
    };
  } else {
    console.log('No explicit credentials provided, relying on AWS SDK credential provider chain');
  }
  
  return config;
};

// Table names from environment variables
const PROMPT_CATEGORIES_TABLE = process.env.PROMPT_CATEGORIES_TABLE || 'document-processor-prompt-categories';
const PROMPTS_TABLE = process.env.PROMPTS_TABLE || 'document-processor-prompts';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(getDynamoDBConfig());
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: { 
    removeUndefinedValues: true,
    convertEmptyValues: true
  }
});

/**
 * GET /api/update-config/prompt-categories/[categoryId]/prompts
 * 
 * Fetch all prompts for a specific category
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { categoryId } = await context.params;
    
    console.log(`Fetching prompts for category ${categoryId} from table ${PROMPTS_TABLE}`);
    
    // First, verify that the category exists
    const categoryCommand = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    const categoryResponse = await docClient.send(categoryCommand);
    
    if (!categoryResponse.Item) {
      console.log(`Category ${categoryId} not found in table ${PROMPT_CATEGORIES_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    // Look more carefully at how categoryId is stored in the table
    console.log(`Scanning prompts table for items with category attribute matching: "${categoryId}"`);
    
    // Use a more specific scan with detailed logging
    const scanCommand = new ScanCommand({
      TableName: PROMPTS_TABLE,
      FilterExpression: 'category = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId,
      },
    });
    
    const scanResponse = await docClient.send(scanCommand);
    
    if (scanResponse.Items && scanResponse.Items.length > 0) {
      console.log(`Found ${scanResponse.Items.length} prompts for category ${categoryId}`);
      console.log(`First prompt: ${JSON.stringify(scanResponse.Items[0].name)}`);
    } else {
      console.log(`No prompts found for category ${categoryId} - checking DynamoDB item structure:`);
      
      // Fetch a sample of items to see their structure (for debugging)
      const sampleScanCommand = new ScanCommand({
        TableName: PROMPTS_TABLE,
        Limit: 1
      });
      
      const sampleResponse = await docClient.send(sampleScanCommand);
      if (sampleResponse.Items && sampleResponse.Items.length > 0) {
        console.log(`Sample item structure: ${JSON.stringify(sampleResponse.Items[0])}`);
        console.log(`Sample item categoryId: ${sampleResponse.Items[0].category}`);
        
        // Try an alternative scan if needed
        if (sampleResponse.Items[0].categoryId && !sampleResponse.Items[0].category) {
          console.log("Found 'categoryId' field instead of 'category', trying alternative scan");
          const altScanCommand = new ScanCommand({
            TableName: PROMPTS_TABLE,
            FilterExpression: 'categoryId = :categoryId',
            ExpressionAttributeValues: {
              ':categoryId': categoryId,
            },
          });
          
          const altScanResponse = await docClient.send(altScanCommand);
          if (altScanResponse.Items && altScanResponse.Items.length > 0) {
            console.log(`Alternative scan found ${altScanResponse.Items.length} prompts`);
            return NextResponse.json(altScanResponse.Items);
          }
        }
      } else {
        console.log("No items found in prompts table at all");
      }
    }
    
    return NextResponse.json(scanResponse.Items || []);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/update-config/prompt-categories/[categoryId]/prompts
 * 
 * Create a new prompt for a specific category
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Fix params access
    const { categoryId } = await context.params;
    const data = await request.json();
    
    console.log(`Creating prompt for category ${categoryId} in table ${PROMPTS_TABLE}`);
    
    // First, verify that the category exists
    const categoryCommand = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    const categoryResponse = await docClient.send(categoryCommand);
    
    if (!categoryResponse.Item) {
      console.log(`Category ${categoryId} not found in table ${PROMPT_CATEGORIES_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    const now = Date.now();
    
    // Create the new prompt
    const prompt: Prompt = {
      id: createId(),
      name: data.name,
      description: data.description || '',
      role: data.role,
      content: data.content,
      isActive: data.isActive !== undefined ? data.isActive : true,
      category: categoryId,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log(`Adding prompt to table ${PROMPTS_TABLE}:`, prompt);
    
    const command = new PutCommand({
      TableName: PROMPTS_TABLE,
      Item: prompt,
    });
    
    await docClient.send(command);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/update-config/prompt-categories/[categoryId]/prompts
 * 
 * Batch update prompts for a category (e.g., reordering)
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Fix params access
    const { categoryId } = await context.params;
    const updatedPrompts = await request.json();
    
    if (!Array.isArray(updatedPrompts)) {
      return NextResponse.json(
        { error: 'Expected an array of prompts' },
        { status: 400 }
      );
    }
    
    // First, verify that the category exists
    const categoryCommand = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    const categoryResponse = await docClient.send(categoryCommand);
    
    if (!categoryResponse.Item) {
      console.log(`Category ${categoryId} not found in table ${PROMPT_CATEGORIES_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    console.log(`Batch updating ${updatedPrompts.length} prompts in table ${PROMPTS_TABLE}`);
    
    // Update each prompt
    for (const prompt of updatedPrompts) {
      if (prompt.category !== categoryId) {
        return NextResponse.json(
          { error: 'All prompts must belong to the specified prompt use case' },
          { status: 400 }
        );
      }
      
      const command = new PutCommand({
        TableName: PROMPTS_TABLE,
        Item: {
          ...prompt,
          updatedAt: Date.now()
        },
      });
      
      await docClient.send(command);
    }
    
    return NextResponse.json({ success: true, count: updatedPrompts.length });
  } catch (error) {
    console.error('Error updating prompts:', error);
    return NextResponse.json(
      { error: 'Failed to update prompts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/update-config/prompt-categories/[categoryId]/prompts
 * 
 * Delete all prompts for a category
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Fix params access
    const { categoryId } = await context.params;
    
    console.log(`Deleting all prompts for category ${categoryId} from table ${PROMPTS_TABLE}`);
    
    // First, verify that the category exists
    const categoryCommand = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    const categoryResponse = await docClient.send(categoryCommand);
    
    if (!categoryResponse.Item) {
      console.log(`Category ${categoryId} not found in table ${PROMPT_CATEGORIES_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    // Use scan with filter to find all prompts for this category
    const scanCommand = new ScanCommand({
      TableName: PROMPTS_TABLE,
      FilterExpression: 'category = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId,
      },
    });
    
    const scanResponse = await docClient.send(scanCommand);
    const prompts = scanResponse.Items || [];
    
    if (prompts.length === 0) {
      console.log(`No prompts found for category ${categoryId}`);
      return NextResponse.json({ success: true, count: 0 });
    }
    
    console.log(`Found ${prompts.length} prompts to delete for category ${categoryId}`);
    
    // DynamoDB BatchWrite has a limit of 25 items, so we need to chunk the deletes
    const chunkSize = 25;
    for (let i = 0; i < prompts.length; i += chunkSize) {
      const chunk = prompts.slice(i, i + chunkSize);
      
      const batchCommand = new BatchWriteCommand({
        RequestItems: {
          [PROMPTS_TABLE]: chunk.map(prompt => ({
            DeleteRequest: {
              Key: { id: prompt.id }
            }
          }))
        }
      });
      
      await docClient.send(batchCommand);
      console.log(`Deleted batch of ${chunk.length} prompts`);
    }
    
    return NextResponse.json({ success: true, count: prompts.length });
  } catch (error) {
    console.error('Error deleting prompts:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompts', details: error.message },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  GetCommand, 
  PutCommand, 
  DeleteCommand,
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { createId } from '@paralleldrive/cuid2';
import { PromptCategory } from '@/lib/types';

// Configure AWS DynamoDB with proper credentials
const getDynamoDBConfig = () => {
  console.log('Initializing AWS DynamoDB configuration with environment variables');
  
  // Environment variables to check (in order of priority)
  const accessKeyOptions = [
    process.env.AWS_ACCESS_KEY_ID,
    process.env.APP_ACCESS_KEY_ID
  ];
  
  const secretKeyOptions = [
    process.env.AWS_SECRET_ACCESS_KEY,
    process.env.APP_SECRET_ACCESS_KEY
  ];
  
  const regionOptions = [
    process.env.AWS_REGION,
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
 * GET /api/update-config/prompt-categories
 * 
 * Fetch all prompt categories
 */
export async function GET() {
  try {
    console.log(`Fetching all prompt categories from table: ${PROMPT_CATEGORIES_TABLE}`);
    
    const command = new ScanCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
    });
    
    const response = await docClient.send(command);
    console.log(`Found ${response.Items?.length || 0} prompt categories`);
    
    return NextResponse.json(response.Items || []);
  } catch (error) {
    console.error('Error fetching prompt categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt use cases', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/update-config/prompt-categories
 * 
 * Create a new prompt category
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Add required fields
    const category: PromptCategory = {
      id: createId(),
      name: data.name,
      description: data.description || '',
      prompts: [],
      model: data.model || 'gpt-4',
      temperature: data.temperature || 1,
      responseFormat: data.responseFormat || { type: 'text' },
    };
    
    console.log(`Creating new category in table ${PROMPT_CATEGORIES_TABLE}:`, category);
    
    const command = new PutCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Item: category,
    });
    
    await docClient.send(command);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt use case', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/update-config/prompt-categories
 * 
 * Update an existing prompt category
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    // Get the existing category first
    const getCommand = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: data.id },
    });
    
    const existingItem = await docClient.send(getCommand);
    
    if (!existingItem.Item) {
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    // Merge existing data with updates
    const updatedCategory = {
      ...existingItem.Item,
      name: data.name || existingItem.Item.name,
      description: data.description !== undefined ? data.description : existingItem.Item.description,
      model: data.model || existingItem.Item.model,
      temperature: data.temperature !== undefined ? data.temperature : existingItem.Item.temperature,
      responseFormat: data.responseFormat || existingItem.Item.responseFormat,
    };
    
    console.log(`Updating category in table ${PROMPT_CATEGORIES_TABLE}:`, updatedCategory);
    
    const command = new PutCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Item: updatedCategory,
    });
    
    await docClient.send(command);
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt use case', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/update-config/prompt-categories
 * 
 * Delete a prompt category
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Deleting category with ID ${id} from table ${PROMPT_CATEGORIES_TABLE}`);
    
    const command = new DeleteCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id },
    });
    
    await docClient.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt use case', details: error.message },
      { status: 500 }
    );
  }
} 
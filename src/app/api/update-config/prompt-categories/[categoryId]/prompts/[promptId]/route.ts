import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
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

// Table name from environment variable
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
 * GET /api/update-config/prompt-categories/[categoryId]/prompts/[promptId]
 * 
 * Fetch a specific prompt by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { categoryId: string; promptId: string } }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { promptId, categoryId } = params;
    
    console.log(`Fetching prompt ${promptId} from table ${PROMPTS_TABLE}`);
    
    const command = new GetCommand({
      TableName: PROMPTS_TABLE,
      Key: { id: promptId },
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      console.log(`Prompt ${promptId} not found in table ${PROMPTS_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    // Verify that the prompt belongs to the specified category
    const prompt = response.Item as Prompt;
    if (prompt.category !== categoryId) {
      console.log(`Prompt ${promptId} does not belong to category ${categoryId}`);
      return NextResponse.json(
        { error: 'Prompt does not belong to the specified use case' },
        { status: 400 }
      );
    }
    
    console.log(`Successfully retrieved prompt ${promptId}`);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/update-config/prompt-categories/[categoryId]/prompts/[promptId]
 * 
 * Update a specific prompt
 */
export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string; promptId: string } }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { promptId, categoryId } = params;
    const data = await request.json();
    
    console.log(`Updating prompt ${promptId} in table ${PROMPTS_TABLE}`);
    
    // Get the existing prompt
    const getCommand = new GetCommand({
      TableName: PROMPTS_TABLE,
      Key: { id: promptId },
    });
    
    const response = await docClient.send(getCommand);
    
    if (!response.Item) {
      console.log(`Prompt ${promptId} not found in table ${PROMPTS_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    const existingPrompt = response.Item as Prompt;
    
    // Ensure the prompt belongs to the specified category
    if (existingPrompt.category !== categoryId) {
      console.log(`Prompt ${promptId} does not belong to category ${categoryId}`);
      return NextResponse.json(
        { error: 'Prompt does not belong to the specified use case' },
        { status: 400 }
      );
    }
    
    // Create the updated prompt
    const updatedPrompt: Prompt = {
      ...existingPrompt,
      name: data.name || existingPrompt.name,
      description: data.description !== undefined ? data.description : existingPrompt.description,
      role: data.role || existingPrompt.role,
      content: data.content || existingPrompt.content,
      isActive: data.isActive !== undefined ? data.isActive : existingPrompt.isActive,
      updatedAt: Date.now(),
    };
    
    console.log(`Updating prompt with data:`, updatedPrompt);
    
    const putCommand = new PutCommand({
      TableName: PROMPTS_TABLE,
      Item: updatedPrompt,
    });
    
    await docClient.send(putCommand);
    
    console.log(`Successfully updated prompt ${promptId}`);
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/update-config/prompt-categories/[categoryId]/prompts/[promptId]
 * 
 * Delete a specific prompt
 */
export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string; promptId: string } }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { promptId, categoryId } = params;
    
    console.log(`Deleting prompt ${promptId} from table ${PROMPTS_TABLE}`);
    
    // First verify that the prompt exists and belongs to the specified category
    const getCommand = new GetCommand({
      TableName: PROMPTS_TABLE,
      Key: { id: promptId },
    });
    
    const response = await docClient.send(getCommand);
    
    if (!response.Item) {
      console.log(`Prompt ${promptId} not found in table ${PROMPTS_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    const prompt = response.Item as Prompt;
    
    if (prompt.category !== categoryId) {
      console.log(`Prompt ${promptId} does not belong to category ${categoryId}`);
      return NextResponse.json(
        { error: 'Prompt does not belong to the specified use case' },
        { status: 400 }
      );
    }
    
    // Delete the prompt
    const deleteCommand = new DeleteCommand({
      TableName: PROMPTS_TABLE,
      Key: { id: promptId },
    });
    
    await docClient.send(deleteCommand);
    
    console.log(`Successfully deleted prompt ${promptId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt', details: error.message },
      { status: 500 }
    );
  }
} 
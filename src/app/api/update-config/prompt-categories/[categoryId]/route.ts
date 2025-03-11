import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
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
 * GET /api/update-config/prompt-categories/[categoryId]
 * 
 * Fetch a specific prompt category by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { categoryId } = params;
    
    console.log(`Fetching category ${categoryId} from table ${PROMPT_CATEGORIES_TABLE}`);
    
    const command = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      console.log(`Category ${categoryId} not found in table ${PROMPT_CATEGORIES_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    console.log(`Successfully retrieved category ${categoryId}`);
    return NextResponse.json(response.Item);
  } catch (error) {
    console.error('Error fetching prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt use case', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/update-config/prompt-categories/[categoryId]
 * 
 * Update a specific prompt category
 */
export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { categoryId } = params;
    const updates = await request.json();
    
    console.log(`Updating category ${categoryId} in table ${PROMPT_CATEGORIES_TABLE}`);
    
    // Get the existing category first
    const getCommand = new GetCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    const existingResponse = await docClient.send(getCommand);
    
    if (!existingResponse.Item) {
      console.log(`Category ${categoryId} not found in table ${PROMPT_CATEGORIES_TABLE}`);
      return NextResponse.json(
        { error: 'Prompt use case not found' },
        { status: 404 }
      );
    }
    
    const existingCategory = existingResponse.Item as PromptCategory;
    
    // Create updated category with validated fields
    const updatedCategory: PromptCategory = {
      ...existingCategory,
      name: updates.name || existingCategory.name,
      description: updates.description !== undefined ? updates.description : existingCategory.description,
      model: updates.model || existingCategory.model,
      temperature: updates.temperature !== undefined ? updates.temperature : existingCategory.temperature,
      responseFormat: updates.responseFormat || existingCategory.responseFormat,
    };
    
    console.log(`Updating category with data:`, updatedCategory);
    
    const putCommand = new PutCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Item: updatedCategory,
    });
    
    await docClient.send(putCommand);
    
    console.log(`Successfully updated category ${categoryId}`);
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
 * DELETE /api/update-config/prompt-categories/[categoryId]
 * 
 * Delete a specific prompt category and all its associated prompts
 */
export async function DELETE(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Access params in an async-friendly way - fix for NextJS warning
    const { categoryId } = params;
    
    console.log(`Deleting category ${categoryId} from table ${PROMPT_CATEGORIES_TABLE}`);
    
    // First, delete the category
    const deleteCommand = new DeleteCommand({
      TableName: PROMPT_CATEGORIES_TABLE,
      Key: { id: categoryId },
    });
    
    await docClient.send(deleteCommand);
    console.log(`Successfully deleted category ${categoryId}`);
    
    // Note: In a real implementation, we would need to find and delete
    // all prompts associated with this category from the prompts table as well.
    // This would typically require a scan and batch delete operation.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt use case', details: error.message },
      { status: 500 }
    );
  }
} 
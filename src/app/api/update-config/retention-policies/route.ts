import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { RetentionPolicy } from '@/lib/types';

// Initialize DynamoDB client
const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.APP_REGION || 'ap-southeast-2',
  accessKeyId: process.env.APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
});

// Use a dedicated table for retention policies
const TABLE_NAME = process.env.DYNAMODB_RETENTION_POLICY_TABLE || 'horizon-retention-policies';
const STORAGE_SOLUTIONS_TABLE = process.env.DYNAMODB_STORAGE_SOLUTIONS_TABLE || 'horizon-storage-solutions';

// This ensures the route doesn't use static optimization, which might cause issues with DynamoDB
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to get all retention policies from DynamoDB
async function getAllRetentionPolicies(): Promise<RetentionPolicy[]> {
  try {
    const result = await dynamoDb.scan({
      TableName: TABLE_NAME,
    }).promise();

    return (result.Items || []) as RetentionPolicy[];
  } catch (error) {
    console.error('Error fetching retention policies from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get a single retention policy by ID
async function getRetentionPolicyById(id: string): Promise<RetentionPolicy | null> {
  try {
    const result = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();

    return result.Item as RetentionPolicy || null;
  } catch (error) {
    console.error(`Error fetching retention policy with ID ${id} from DynamoDB:`, error);
    throw error;
  }
}

// Helper function to create a retention policy in DynamoDB
async function createRetentionPolicy(policy: RetentionPolicy): Promise<RetentionPolicy> {
  try {
    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: policy,
    }).promise();
    
    return policy;
  } catch (error) {
    console.error('Error creating retention policy in DynamoDB:', error);
    throw error;
  }
}

// Helper function to update a retention policy in DynamoDB
async function updateRetentionPolicy(id: string, updates: Partial<RetentionPolicy>): Promise<RetentionPolicy> {
  try {
    // First get the existing policy
    const existing = await getRetentionPolicyById(id);
    
    if (!existing) {
      throw new Error(`Retention policy with ID ${id} not found`);
    }
    
    // Prepare updated policy
    const updatedPolicy: RetentionPolicy = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: Date.now(),
    };
    
    // Put the updated policy back in the table
    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: updatedPolicy,
    }).promise();
    
    return updatedPolicy;
  } catch (error) {
    console.error(`Error updating retention policy with ID ${id} in DynamoDB:`, error);
    throw error;
  }
}

// Helper function to delete a retention policy from DynamoDB
async function deleteRetentionPolicy(id: string): Promise<void> {
  try {
    await dynamoDb.delete({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();
  } catch (error) {
    console.error(`Error deleting retention policy with ID ${id} from DynamoDB:`, error);
    throw error;
  }
}

// Helper function to check if a storage solution exists
async function validateStorageSolutions(stages: any[]): Promise<boolean> {
  try {
    // Get unique storage solution IDs
    const storageSolutionIds = Array.from(new Set(stages.map(stage => stage.storageSolutionId)));
    
    // Check if all storage solution IDs exist
    for (const id of storageSolutionIds) {
      const result = await dynamoDb.get({
        TableName: STORAGE_SOLUTIONS_TABLE,
        Key: { id },
      }).promise();
      
      if (!result.Item) {
        throw new Error(`Storage solution with ID ${id} not found`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating storage solutions:', error);
    throw error;
  }
}

// Calculate total duration from stages
function calculateTotalDuration(stages: any[]): number {
  return stages.reduce((total, stage) => total + stage.duration, 0);
}

// POST: Create a new retention policy
export async function POST(request: NextRequest) {
  console.log('POST /api/update-config/retention-policies - Creating new retention policy');
  try {
    const data = await request.json();
    
    if (!data.name || !data.description || !data.stages || !Array.isArray(data.stages) || data.stages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid stages' },
        { status: 400 }
      );
    }
    
    // Validate storage solutions
    await validateStorageSolutions(data.stages);
    
    const now = Date.now();
    const totalDuration = calculateTotalDuration(data.stages);
    
    const newPolicy: RetentionPolicy = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      stages: data.stages.map((stage: any) => ({
        ...stage,
        id: stage.id || uuidv4(),
      })),
      totalDuration,
      duration: totalDuration, // For backward compatibility
      createdAt: now,
      updatedAt: now,
    };
    
    await createRetentionPolicy(newPolicy);
    console.log('Created new retention policy:', newPolicy);
    
    // Add CORS headers
    const response = NextResponse.json(newPolicy, { status: 201 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error creating retention policy:', error);
    return NextResponse.json(
      { error: 'Failed to create retention policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing retention policy
export async function PUT(request: NextRequest) {
  console.log('PUT /api/update-config/retention-policies - Updating retention policy');
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing retention policy ID' },
        { status: 400 }
      );
    }
    
    // Check if the retention policy exists
    const existing = await getRetentionPolicyById(data.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Retention policy not found' },
        { status: 404 }
      );
    }
    
    // Create updates object
    const updates: Partial<RetentionPolicy> = {
      name: data.name || existing.name,
      description: data.description || existing.description,
    };
    
    // Update stages if provided
    if (data.stages && Array.isArray(data.stages)) {
      // Validate storage solutions first
      await validateStorageSolutions(data.stages);
      
      updates.stages = data.stages.map((stage: any) => ({
        ...stage,
        id: stage.id || uuidv4(),
      }));
      
      // Recalculate total duration
      updates.totalDuration = calculateTotalDuration(updates.stages);
      updates.duration = updates.totalDuration; // For backward compatibility
    }
    
    // Update the retention policy
    const updatedPolicy = await updateRetentionPolicy(data.id, updates);
    console.log(`Updated retention policy with ID ${data.id}:`, updatedPolicy);
    
    // Add CORS headers
    const response = NextResponse.json(updatedPolicy, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error updating retention policy:', error);
    return NextResponse.json(
      { error: 'Failed to update retention policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a retention policy
export async function DELETE(request: NextRequest) {
  console.log('DELETE /api/update-config/retention-policies - Deleting retention policy');
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing retention policy ID' },
        { status: 400 }
      );
    }
    
    // Check if the retention policy exists
    const existing = await getRetentionPolicyById(data.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Retention policy not found' },
        { status: 404 }
      );
    }
    
    // Delete the retention policy
    await deleteRetentionPolicy(data.id);
    console.log(`Deleted retention policy with ID ${data.id}`);
    
    // Add CORS headers
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error deleting retention policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete retention policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: Get all retention policies
export async function GET() {
  try {
    console.log('GET /api/update-config/retention-policies - Fetching all retention policies');
    const policies = await getAllRetentionPolicies();
    
    return NextResponse.json(policies, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    
    // Return an empty array instead of an error to prevent UI disruption
    // This helps when tables exist but might be empty
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// OPTIONS: Handle preflight requests for CORS
export async function OPTIONS() {
  console.log('OPTIONS /api/update-config/retention-policies - Handling preflight request');
  const response = new NextResponse(null, { status: 204 }); // No content
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
} 
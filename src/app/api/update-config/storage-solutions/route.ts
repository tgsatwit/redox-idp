import { NextRequest, NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { StorageSolution } from '@/lib/types';

// Initialize DynamoDB client
const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.APP_REGION || 'ap-southeast-2',
  accessKeyId: process.env.APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
});

// Use a dedicated table for storage solutions
const TABLE_NAME = process.env.DYNAMODB_STORAGE_SOLUTIONS_TABLE || 'horizon-storage-solutions';

// This ensures the route doesn't use static optimization, which might cause issues with DynamoDB
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to get all storage solutions from DynamoDB
async function getAllStorageSolutions(): Promise<StorageSolution[]> {
  try {
    const result = await dynamoDb.scan({
      TableName: TABLE_NAME,
    }).promise();

    return (result.Items || []) as StorageSolution[];
  } catch (error) {
    console.error('Error fetching storage solutions from DynamoDB:', error);
    throw error;
  }
}

// Helper function to get a single storage solution by ID
async function getStorageSolutionById(id: string): Promise<StorageSolution | null> {
  try {
    const result = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();

    return result.Item as StorageSolution || null;
  } catch (error) {
    console.error(`Error fetching storage solution with ID ${id} from DynamoDB:`, error);
    throw error;
  }
}

// Helper function to create a storage solution in DynamoDB
async function createStorageSolution(solution: StorageSolution): Promise<StorageSolution> {
  try {
    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: solution,
    }).promise();
    
    return solution;
  } catch (error) {
    console.error('Error creating storage solution in DynamoDB:', error);
    throw error;
  }
}

// Helper function to update a storage solution in DynamoDB
async function updateStorageSolution(id: string, updates: Partial<StorageSolution>): Promise<StorageSolution> {
  try {
    // First get the existing solution
    const existing = await getStorageSolutionById(id);
    
    if (!existing) {
      throw new Error(`Storage solution with ID ${id} not found`);
    }
    
    // Prepare updated solution
    const updatedSolution: StorageSolution = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: Date.now(),
    };
    
    // Put the updated solution back in the table
    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: updatedSolution,
    }).promise();
    
    return updatedSolution;
  } catch (error) {
    console.error(`Error updating storage solution with ID ${id} in DynamoDB:`, error);
    throw error;
  }
}

// Helper function to delete a storage solution from DynamoDB
async function deleteStorageSolution(id: string): Promise<void> {
  try {
    await dynamoDb.delete({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();
  } catch (error) {
    console.error(`Error deleting storage solution with ID ${id} from DynamoDB:`, error);
    throw error;
  }
}

// Helper function to check if a storage solution is used in any retention policy
async function isStorageSolutionInUse(id: string): Promise<boolean> {
  try {
    // Get all retention policies from their dedicated table
    const retentionPoliciesTable = process.env.DYNAMODB_RETENTION_POLICY_TABLE || 'horizon-retention-policies';
    
    const result = await dynamoDb.scan({
      TableName: retentionPoliciesTable,
    }).promise();
    
    const retentionPolicies = result.Items || [];
    
    // Check if the storage solution is used in any retention policy
    return retentionPolicies.some((policy: any) => 
      policy.stages && policy.stages.some((stage: any) => stage.storageSolutionId === id)
    );
  } catch (error) {
    console.error(`Error checking if storage solution with ID ${id} is in use:`, error);
    throw error;
  }
}

// POST: Create a new storage solution
export async function POST(request: NextRequest) {
  console.log('POST /api/update-config/storage-solutions - Creating new storage solution');
  try {
    const data = await request.json();
    
    if (!data.name || !data.description || !data.accessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const now = Date.now();
    const newSolution: StorageSolution = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      accessLevel: data.accessLevel,
      costPerGbPerMonth: data.costPerGbPerMonth || 0,
      createdAt: now,
      updatedAt: now,
    };
    
    await createStorageSolution(newSolution);
    console.log('Created new storage solution:', newSolution);
    
    // Add CORS headers
    const response = NextResponse.json(newSolution, { status: 201 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error creating storage solution:', error);
    return NextResponse.json(
      { error: 'Failed to create storage solution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing storage solution
export async function PUT(request: NextRequest) {
  console.log('PUT /api/update-config/storage-solutions - Updating storage solution');
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing storage solution ID' },
        { status: 400 }
      );
    }
    
    // Check if the storage solution exists
    const existing = await getStorageSolutionById(data.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Storage solution not found' },
        { status: 404 }
      );
    }
    
    // Update the storage solution
    const { id, ...updates } = data;
    const updatedSolution = await updateStorageSolution(id, updates);
    console.log(`Updated storage solution with ID ${id}:`, updatedSolution);
    
    // Add CORS headers
    const response = NextResponse.json(updatedSolution, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error updating storage solution:', error);
    return NextResponse.json(
      { error: 'Failed to update storage solution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a storage solution
export async function DELETE(request: NextRequest) {
  console.log('DELETE /api/update-config/storage-solutions - Deleting storage solution');
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing storage solution ID' },
        { status: 400 }
      );
    }
    
    // Check if the storage solution exists
    const existing = await getStorageSolutionById(data.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Storage solution not found' },
        { status: 404 }
      );
    }
    
    // Check if the storage solution is used in any retention policy
    const isInUse = await isStorageSolutionInUse(data.id);
    
    if (isInUse) {
      return NextResponse.json(
        { error: 'Cannot delete storage solution that is in use by retention policies' },
        { status: 400 }
      );
    }
    
    // Delete the storage solution
    await deleteStorageSolution(data.id);
    console.log(`Deleted storage solution with ID ${data.id}`);
    
    // Add CORS headers
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error deleting storage solution:', error);
    return NextResponse.json(
      { error: 'Failed to delete storage solution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: Get all storage solutions
export async function GET() {
  try {
    console.log('GET /api/update-config/storage-solutions - Fetching all storage solutions');
    const solutions = await getAllStorageSolutions();
    
    return NextResponse.json(solutions, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error fetching storage solutions:', error);
    
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
  console.log('OPTIONS /api/update-config/storage-solutions - Handling preflight request');
  const response = new NextResponse(null, { status: 204 }); // No content
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
} 
import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/middleware/dynamodb-helper';

// Get table name from environment variables
const TABLE_NAME = process.env.DYNAMODB_RETENTION_POLICY_TABLE || 'horizon-retention-policies';

// This ensures the route doesn't use static optimization, which might cause issues with DynamoDB
export const dynamic = 'force-dynamic';

// Helper function to get a single retention policy by ID using our utility
async function getRetentionPolicyById(id: string) {
  try {
    return await getItemById(TABLE_NAME, id);
  } catch (error) {
    console.error(`Error fetching retention policy with ID ${id} from DynamoDB:`, error);
    throw error;
  }
}

// GET: Get a specific retention policy by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`GET /api/update-config/retention-policies/${id} - Fetching specific retention policy from ${TABLE_NAME}`);
    
    if (!id) {
      console.error('Missing policy ID in request');
      return NextResponse.json(
        { error: 'Missing policy ID in request' },
        { status: 400 }
      );
    }

    // First try to get the policy from DynamoDB
    const policy = await getRetentionPolicyById(id);
    
    if (!policy) {
      console.error(`Retention policy with ID ${id} not found in table ${TABLE_NAME}`);
      return NextResponse.json(
        { error: `Retention policy with ID ${id} not found` },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    console.log(`Successfully retrieved policy ${id} from DynamoDB: ${policy.name}`);
    return NextResponse.json(policy, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error(`Error fetching retention policy: ${errorMessage}`);
    console.error(`Error stack: ${errorStack}`);
    
    return NextResponse.json(
      { error: 'Failed to fetch retention policy', details: errorMessage },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// OPTIONS: Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 
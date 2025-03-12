import { DynamoDB } from 'aws-sdk';
import { NextResponse } from 'next/server';
import { FeedbackAuditLog } from '@/lib/types';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const AUDIT_TABLE = process.env.DYNAMODB_AUDIT_TABLE || 'FeedbackAudit';

// GET handler to fetch audit logs with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const feedbackId = searchParams.get('feedbackId');
    const documentId = searchParams.get('documentId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    
    // Build filter expressions based on query parameters
    let filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    if (feedbackId) {
      filterExpressions.push('#feedbackId = :feedbackId');
      expressionAttributeNames['#feedbackId'] = 'feedbackId';
      expressionAttributeValues[':feedbackId'] = feedbackId;
    }
    
    if (documentId) {
      filterExpressions.push('#documentId = :documentId');
      expressionAttributeNames['#documentId'] = 'documentId';
      expressionAttributeValues[':documentId'] = documentId;
    }
    
    // Build DynamoDB scan parameters
    const scanParams: DynamoDB.DocumentClient.ScanInput = {
      TableName: AUDIT_TABLE,
      Limit: limit,
    };
    
    // Add filter expression if filters are applied
    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
      
      if (Object.keys(expressionAttributeNames).length > 0) {
        scanParams.ExpressionAttributeNames = expressionAttributeNames;
      }
    }
    
    // Execute the scan operation
    const result = await dynamoDB.scan(scanParams).promise();
    
    // Sort by timestamp (newest first)
    const sortedItems = (result.Items as FeedbackAuditLog[]).sort(
      (a, b) => b.timestamp - a.timestamp
    );
    
    // Return the results
    return NextResponse.json({
      items: sortedItems,
      count: sortedItems.length,
      scannedCount: result.ScannedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
} 
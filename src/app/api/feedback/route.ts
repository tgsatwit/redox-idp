import { DynamoDB } from 'aws-sdk';
import { NextResponse } from 'next/server';
import { ClassificationFeedback } from '@/lib/types';
import { createId } from '@paralleldrive/cuid2';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FEEDBACK_TABLE = process.env.DYNAMODB_FEEDBACK_TABLE || 'ClassificationFeedback';

// GET handler to fetch feedback records with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const documentType = searchParams.get('documentType');
    const status = searchParams.get('status');
    const minConfidence = searchParams.get('minConfidence');
    const maxConfidence = searchParams.get('maxConfidence');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build filter expressions based on query parameters
    let filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    if (documentType) {
      filterExpressions.push('(#orig.#docType = :docType OR #corrected = :docType)');
      expressionAttributeNames['#orig'] = 'originalClassification';
      expressionAttributeNames['#docType'] = 'documentType';
      expressionAttributeNames['#corrected'] = 'correctedDocumentType';
      expressionAttributeValues[':docType'] = documentType;
    }
    
    if (status) {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }
    
    if (minConfidence) {
      filterExpressions.push('#orig.#conf >= :minConf');
      expressionAttributeNames['#orig'] = expressionAttributeNames['#orig'] || 'originalClassification';
      expressionAttributeNames['#conf'] = 'confidence';
      expressionAttributeValues[':minConf'] = Number(minConfidence);
    }
    
    if (maxConfidence) {
      filterExpressions.push('#orig.#conf <= :maxConf');
      expressionAttributeNames['#orig'] = expressionAttributeNames['#orig'] || 'originalClassification';
      expressionAttributeNames['#conf'] = expressionAttributeNames['#conf'] || 'confidence';
      expressionAttributeValues[':maxConf'] = Number(maxConfidence);
    }
    
    if (startDate) {
      filterExpressions.push('#timestamp >= :startDate');
      expressionAttributeNames['#timestamp'] = 'timestamp';
      expressionAttributeValues[':startDate'] = Number(startDate);
    }
    
    if (endDate) {
      filterExpressions.push('#timestamp <= :endDate');
      expressionAttributeNames['#timestamp'] = expressionAttributeNames['#timestamp'] || 'timestamp';
      expressionAttributeValues[':endDate'] = Number(endDate);
    }
    
    // Build DynamoDB scan parameters
    const scanParams: DynamoDB.DocumentClient.ScanInput = {
      TableName: FEEDBACK_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
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
    
    // Return the results
    return NextResponse.json({
      items: result.Items as ClassificationFeedback[],
      count: result.Count,
      scannedCount: result.ScannedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching feedback records:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback records' }, { status: 500 });
  }
} 
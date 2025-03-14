import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

// Helper to get DynamoDB configuration
const getDynamoDBConfig = () => {
  const config: any = {
    region: process.env.APP_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.APP_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.APP_SECRET_ACCESS_KEY || ''
    }
  };

  // Use local endpoint if specified (for development)
  if (process.env.DYNAMODB_LOCAL_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT;
  }

  return config;
};

// GET endpoint to fetch statistics about classification feedback
export async function GET() {
  try {
    // Initialize stats object
    const stats = {
      total: 0,
      trained: 0,
      untrained: 0,
      byDocumentType: {} as Record<string, {
        total: number;
        trained: number;
        untrained: number;
        bySubType: Record<string, {
          total: number;
          trained: number;
          untrained: number;
        }>;
      }>
    };
    
    // If DynamoDB is not configured, return empty stats
    if (!process.env.DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE) {
      console.warn("Missing DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE, returning empty statistics");
      return NextResponse.json(stats);
    }
    
    // Initialize DynamoDB client
    const dynamoDb = new DynamoDBClient(getDynamoDBConfig());
    
    // Scan DynamoDB table for all feedback items
    const scanResponse = await dynamoDb.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE
      })
    );
    
    // Get items from the response
    const items = scanResponse.Items || [];
    
    // Update total count
    stats.total = items.length;
    
    // Process each feedback item
    items.forEach(item => {
      // Check if the item has been used for training
      const hasBeenUsed = item.hasBeenUsedForTraining?.BOOL === true;
      
      // Update the global counts
      if (hasBeenUsed) {
        stats.trained++;
      } else {
        stats.untrained++;
      }
      
      // Get the document type from the corrected type, or the original classification if available
      let documentType = item.correctedDocumentType?.S || 
        (item.originalClassification?.M?.documentType?.S) || 
        'Unknown';
      
      // Get the document sub-type if available
      const documentSubType = item.documentSubType?.S || 'General';
      
      // Initialize the document type and sub-type stats if they don't exist
      if (!stats.byDocumentType[documentType]) {
        stats.byDocumentType[documentType] = {
          total: 0,
          trained: 0,
          untrained: 0,
          bySubType: {} 
        };
      }
      
      if (!stats.byDocumentType[documentType].bySubType[documentSubType]) {
        stats.byDocumentType[documentType].bySubType[documentSubType] = {
          total: 0,
          trained: 0,
          untrained: 0
        };
      }
      
      // Update the document type counts
      stats.byDocumentType[documentType].total++;
      if (hasBeenUsed) {
        stats.byDocumentType[documentType].trained++;
      } else {
        stats.byDocumentType[documentType].untrained++;
      }
      
      // Update the sub-type counts
      stats.byDocumentType[documentType].bySubType[documentSubType].total++;
      if (hasBeenUsed) {
        stats.byDocumentType[documentType].bySubType[documentSubType].trained++;
      } else {
        stats.byDocumentType[documentType].bySubType[documentSubType].untrained++;
      }
    });
    
    // Return the stats as JSON
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error generating classification feedback statistics:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
} 
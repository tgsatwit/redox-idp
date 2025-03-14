import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ClassificationFeedback, ClassificationResult } from '@/lib/types';

// In-memory storage for development or when DynamoDB is not configured
const inMemoryFeedback: ClassificationFeedback[] = [];

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

interface FeedbackRequestBody {
  documentId: string;
  originalClassification: ClassificationResult | null;
  correctedDocumentType: string | null;
  documentSubType?: string;
  feedbackSource: 'auto' | 'manual' | 'review';
  timestamp: number;
}

export async function POST(request: Request) {
  let parsedBody: FeedbackRequestBody | null = null;
  
  try {
    // Parse request body
    parsedBody = await request.json() as FeedbackRequestBody;
    const { 
      documentId, 
      originalClassification, 
      correctedDocumentType,
      documentSubType,
      feedbackSource = 'manual',
      timestamp = Date.now() 
    } = parsedBody;
    
    // Validate required fields
    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }
    
    // Create feedback item conforming to the ClassificationFeedback interface
    const feedbackItem: ClassificationFeedback = {
      id: uuidv4(),
      documentId,
      originalClassification,
      correctedDocumentType,
      feedbackSource,
      timestamp,
      hasBeenUsedForTraining: false,
      status: 'pending'
    };
    
    // Add any custom fields for storage that aren't in the interface
    const storageItem = {
      ...feedbackItem,
      ...(documentSubType ? { documentSubType } : {})
    };
    
    // Check for required environment variables
    if (!process.env.DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE) {
      console.warn("Missing DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE, storing feedback in memory only");
      inMemoryFeedback.push(feedbackItem);
      return NextResponse.json({
        message: "Classification feedback stored in memory (no DynamoDB table configured)",
        feedbackId: feedbackItem.id
      });
    }
    
    // Initialize DynamoDB client
    const dynamoDb = new DynamoDBClient(getDynamoDBConfig());
    
    // Save feedback to DynamoDB
    await dynamoDb.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE,
        Item: marshall(storageItem)
      })
    );
    
    // Return success
    return NextResponse.json({
      message: "Classification feedback submitted successfully",
      feedbackId: feedbackItem.id
    });
  } catch (error: any) {
    console.error("Error submitting classification feedback:", error);
    
    // If there's an error with DynamoDB, store the feedback in memory as fallback
    if (parsedBody && parsedBody.documentId) {
      try {
        const fallbackItem: ClassificationFeedback = {
          id: uuidv4(),
          documentId: parsedBody.documentId,
          originalClassification: parsedBody.originalClassification,
          correctedDocumentType: parsedBody.correctedDocumentType,
          feedbackSource: parsedBody.feedbackSource || 'manual',
          timestamp: parsedBody.timestamp || Date.now(),
          hasBeenUsedForTraining: false,
          status: 'pending'
        };
        
        inMemoryFeedback.push(fallbackItem);
        console.log("Stored feedback in memory as fallback");
      } catch (fallbackError) {
        console.error("Failed to store feedback in memory:", fallbackError);
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all classification feedback
export async function GET() {
  try {
    // If DynamoDB is not configured, return in-memory data
    if (!process.env.DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE) {
      console.warn("Missing DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE, returning in-memory data");
      return NextResponse.json(inMemoryFeedback);
    }
    
    // Initialize DynamoDB client
    const dynamoDb = new DynamoDBClient(getDynamoDBConfig());
    
    // Scan DynamoDB table for all feedback items
    const scanResponse = await dynamoDb.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_CLASSIFICATION_FEEDBACK_TABLE
      })
    );
    
    // Process the results
    const items = scanResponse.Items || [];
    const feedbackItems = items.map(item => unmarshall(item)) as ClassificationFeedback[];
    
    // Sort by timestamp (newest first)
    feedbackItems.sort((a, b) => b.timestamp - a.timestamp);
    
    return NextResponse.json(feedbackItems);
  } catch (error: any) {
    console.error("Error fetching classification feedback:", error);
    
    // If there's an error with DynamoDB, return in-memory data
    if (inMemoryFeedback.length > 0) {
      console.warn("Returning in-memory feedback due to DynamoDB error");
      return NextResponse.json(inMemoryFeedback);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
} 
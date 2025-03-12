import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ClassificationFeedback, ClassificationResult } from '@/lib/types';
import { marshall } from '@aws-sdk/util-dynamodb';

// In-memory storage for fallback (when DynamoDB has issues)
const inMemoryFeedback: ClassificationFeedback[] = [];

// Configure AWS DynamoDB with proper credentials
function getDynamoDBConfig() {
  const region = process.env.APP_REGION || process.env.AWS_REGION || 'us-east-1';
  console.log(`Using AWS DynamoDB in region: ${region}`);
  
  const config: Record<string, any> = { region };
  
  // If local environment variables are set, use them
  if (process.env.APP_ACCESS_KEY_ID && process.env.APP_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.APP_ACCESS_KEY_ID,
      secretAccessKey: process.env.APP_SECRET_ACCESS_KEY
    };
  }
  
  return config;
}

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
      hasBeenUsedForTraining: false
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
  } catch (error) {
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
          hasBeenUsedForTraining: false
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
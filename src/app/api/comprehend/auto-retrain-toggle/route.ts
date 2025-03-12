import { DynamoDB } from 'aws-sdk';
import { NextResponse } from 'next/server';
import { ModelTrainingConfig } from '@/lib/types';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const CONFIG_TABLE = process.env.DYNAMODB_CONFIG_TABLE || 'ModelTrainingConfig';

// POST handler to toggle auto-retraining setting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enabled, feedbackThreshold } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Enabled status must be a boolean' }, { status: 400 });
    }
    
    // Get current config
    const configParams = {
      TableName: CONFIG_TABLE,
      Key: { id: 'training-config' },
    };
    
    const configResult = await dynamoDB.get(configParams).promise();
    let config = configResult.Item as ModelTrainingConfig | undefined;
    
    // If config doesn't exist, create it
    if (!config) {
      config = {
        autoTrainingEnabled: enabled,
        feedbackThreshold: feedbackThreshold || 50,
        pendingFeedbackCount: 0,
      };
      
      await dynamoDB.put({
        TableName: CONFIG_TABLE,
        Item: {
          id: 'training-config',
          ...config,
        },
      }).promise();
    } else {
      // Update existing config
      const updateExpressions: string[] = ['#auto = :auto'];
      const expressionAttributeValues: Record<string, any> = {
        ':auto': enabled,
      };
      const expressionAttributeNames: Record<string, string> = {
        '#auto': 'autoTrainingEnabled',
      };
      
      // Update threshold if provided
      if (feedbackThreshold !== undefined) {
        updateExpressions.push('#threshold = :threshold');
        expressionAttributeNames['#threshold'] = 'feedbackThreshold';
        expressionAttributeValues[':threshold'] = feedbackThreshold;
      }
      
      await dynamoDB.update({
        TableName: CONFIG_TABLE,
        Key: { id: 'training-config' },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }).promise();
    }
    
    return NextResponse.json({
      success: true,
      autoTrainingEnabled: enabled,
      feedbackThreshold: feedbackThreshold || config.feedbackThreshold,
    });
  } catch (error) {
    console.error('Error toggling auto-retraining:', error);
    return NextResponse.json({ error: 'Failed to toggle auto-retraining' }, { status: 500 });
  }
}

// GET handler to retrieve current auto-retraining settings
export async function GET() {
  try {
    // Get current config
    const configParams = {
      TableName: CONFIG_TABLE,
      Key: { id: 'training-config' },
    };
    
    const configResult = await dynamoDB.get(configParams).promise();
    const config = configResult.Item as ModelTrainingConfig | undefined;
    
    if (!config) {
      // Return default values if config doesn't exist
      return NextResponse.json({
        autoTrainingEnabled: false,
        feedbackThreshold: 50,
        pendingFeedbackCount: 0,
      });
    }
    
    return NextResponse.json({
      autoTrainingEnabled: config.autoTrainingEnabled,
      feedbackThreshold: config.feedbackThreshold,
      pendingFeedbackCount: config.pendingFeedbackCount || 0,
      lastTrainingDate: config.lastTrainingDate,
      modelStatus: config.modelStatus || 'IDLE',
    });
  } catch (error) {
    console.error('Error retrieving auto-retraining config:', error);
    return NextResponse.json({ error: 'Failed to get auto-retraining config' }, { status: 500 });
  }
} 
import { DynamoDB } from 'aws-sdk';
import { NextResponse } from 'next/server';
import { ClassificationFeedback, FeedbackAuditLog } from '@/lib/types';
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
const AUDIT_TABLE = process.env.DYNAMODB_AUDIT_TABLE || 'FeedbackAudit';

// POST handler to update a feedback record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }
    
    // Get the current feedback record
    const getCurrentParams = {
      TableName: FEEDBACK_TABLE,
      Key: { id },
    };
    
    const currentRecord = await dynamoDB.get(getCurrentParams).promise();
    const oldFeedback = currentRecord.Item as ClassificationFeedback;
    
    if (!oldFeedback) {
      return NextResponse.json({ error: 'Feedback record not found' }, { status: 404 });
    }
    
    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};
    
    // Add timestamp
    const now = Date.now();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;
    
    // Track changes for audit log
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    // Process each update field
    Object.entries(updates).forEach(([key, value]) => {
      // Skip id field
      if (key === 'id') return;
      
      // Add to update expression
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
      
      // Record change for audit
      if (oldFeedback[key as keyof ClassificationFeedback] !== value) {
        changes.push({
          field: key,
          oldValue: oldFeedback[key as keyof ClassificationFeedback],
          newValue: value,
        });
      }
    });
    
    // If no changes, return early
    if (changes.length === 0) {
      return NextResponse.json({ success: true, message: 'No changes to apply' });
    }
    
    // Update the feedback record
    const updateParams = {
      TableName: FEEDBACK_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
    
    const updateResult = await dynamoDB.update(updateParams).promise();
    const updatedFeedback = updateResult.Attributes as ClassificationFeedback;
    
    // Create an audit log entry
    const auditLogEntry: FeedbackAuditLog = {
      id: createId(),
      feedbackId: id,
      documentId: oldFeedback.documentId,
      timestamp: now,
      modifiedBy: updates.updatedBy || 'admin', // Default to 'admin' if no user info
      changes,
    };
    
    // Save the audit log entry
    const auditParams = {
      TableName: AUDIT_TABLE,
      Item: auditLogEntry,
    };
    
    await dynamoDB.put(auditParams).promise();
    
    return NextResponse.json({
      success: true,
      feedback: updatedFeedback,
      audit: auditLogEntry,
    });
  } catch (error) {
    console.error('Error updating feedback record:', error);
    return NextResponse.json({ error: 'Failed to update feedback record' }, { status: 500 });
  }
} 
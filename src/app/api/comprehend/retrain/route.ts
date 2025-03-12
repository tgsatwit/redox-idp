import { DynamoDB, Comprehend, S3 } from 'aws-sdk';
import { NextResponse } from 'next/server';
import { ClassificationFeedback, ModelTrainingConfig } from '@/lib/types';
import { createId } from '@paralleldrive/cuid2';

// Initialize AWS clients
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const comprehend = new Comprehend({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const s3 = new S3({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FEEDBACK_TABLE = process.env.DYNAMODB_FEEDBACK_TABLE || 'ClassificationFeedback';
const CONFIG_TABLE = process.env.DYNAMODB_CONFIG_TABLE || 'ModelTrainingConfig';
const TRAINING_BUCKET = process.env.S3_TRAINING_BUCKET || 'document-classification-training';

// POST handler to trigger model retraining
export async function POST(request: Request) {
  try {
    // Get all feedback records that haven't been used for training yet
    const feedbackParams = {
      TableName: FEEDBACK_TABLE,
      FilterExpression: 'hasBeenUsedForTraining = :false AND (status = :reviewed OR status = :corrected)',
      ExpressionAttributeValues: {
        ':false': false,
        ':reviewed': 'reviewed',
        ':corrected': 'corrected',
      },
    };
    
    const feedbackResult = await dynamoDB.scan(feedbackParams).promise();
    const feedbackItems = feedbackResult.Items as ClassificationFeedback[];
    
    if (feedbackItems.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No new feedback records available for training',
      }, { status: 400 });
    }
    
    // Prepare training data in the format required by Comprehend
    const trainingData = await prepareTrainingData(feedbackItems);
    
    // Upload training data to S3
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const s3Key = `training-data/${timestamp}/training-data.csv`;
    
    await s3.putObject({
      Bucket: TRAINING_BUCKET,
      Key: s3Key,
      Body: trainingData,
      ContentType: 'text/csv',
    }).promise();
    
    // Start Comprehend training job
    const modelName = `document-classification-model-${timestamp}`;
    const trainResponse = await comprehend.createDocumentClassifier({
      DocumentClassifierName: modelName,
      DataAccessRoleArn: process.env.COMPREHEND_ROLE_ARN || '',
      InputDataConfig: {
        S3Uri: `s3://${TRAINING_BUCKET}/${s3Key}`,
      },
      LanguageCode: 'en',
    }).promise();
    
    // Update feedback records as used for training
    await Promise.all(
      feedbackItems.map(item => 
        dynamoDB.update({
          TableName: FEEDBACK_TABLE,
          Key: { id: item.id },
          UpdateExpression: 'SET hasBeenUsedForTraining = :true',
          ExpressionAttributeValues: {
            ':true': true,
          },
        }).promise()
      )
    );
    
    // Update training config
    const now = Date.now();
    await dynamoDB.update({
      TableName: CONFIG_TABLE,
      Key: { id: 'training-config' },
      UpdateExpression: 'SET lastTrainingDate = :date, modelStatus = :status, pendingFeedbackCount = :count',
      ExpressionAttributeValues: {
        ':date': now,
        ':status': 'TRAINING',
        ':count': 0,
      },
    }).promise();
    
    return NextResponse.json({
      success: true,
      message: 'Model retraining started successfully',
      modelArn: trainResponse.DocumentClassifierArn,
      trainingJobName: modelName,
      feedbackCount: feedbackItems.length,
    });
  } catch (error) {
    console.error('Error triggering model retraining:', error);
    return NextResponse.json({ 
      error: 'Failed to trigger model retraining',
      details: (error as Error).message,
    }, { status: 500 });
  }
}

// Helper function to prepare training data for Comprehend
async function prepareTrainingData(feedbackItems: ClassificationFeedback[]): Promise<string> {
  // Get document content for each feedback item (this is just a placeholder)
  // In a real implementation, you would fetch the document content from wherever it's stored
  
  // Prepare CSV in the format expected by Comprehend
  // For simple text classification, the format is: CLASS,TEXT
  const trainingRows = await Promise.all(
    feedbackItems.map(async (item) => {
      // In a real implementation, fetch document content from S3 or database
      // For this example, we're just using a placeholder
      const documentText = await getDocumentText(item.documentId);
      
      // Use corrected document type if available, otherwise use original
      const documentClass = item.correctedDocumentType || 
                            (item.originalClassification?.documentType || 'UNKNOWN');
      
      // Escape any commas or quotes in the text
      const escapedText = documentText.replace(/"/g, '""');
      
      return `${documentClass},"${escapedText}"`;
    })
  );
  
  // Add header row and join all rows
  return 'CLASS,TEXT\n' + trainingRows.join('\n');
}

// Placeholder function to get document text
// In a real implementation, this would fetch the document from S3, database, etc.
async function getDocumentText(documentId: string): Promise<string> {
  // This is just a placeholder. In reality, you would fetch the document from your storage
  // For example:
  // const result = await dynamoDB.get({
  //   TableName: 'Documents',
  //   Key: { id: documentId }
  // }).promise();
  // return result.Item?.extractedText || '';
  
  return `This is a placeholder for document ${documentId}. In a real implementation, you would retrieve the actual document content.`;
} 
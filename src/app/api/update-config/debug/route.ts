import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

/**
 * GET - Debug DynamoDB Connection
 */
export async function GET() {
  const debugInfo = {
    envVars: {
      region: process.env.APP_REGION || 'not set',
      hasAccessKey: !!process.env.APP_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.APP_SECRET_ACCESS_KEY,
      docTypeTable: process.env.DYNAMODB_DOCTYPE_TABLE || 'not set',
      subTypeTable: process.env.DYNAMODB_SUBTYPE_TABLE || 'not set',
      elementTable: process.env.DYNAMODB_ELEMENT_TABLE || 'not set',
      localEndpoint: process.env.DYNAMODB_LOCAL_ENDPOINT || 'not set',
    },
    connectionTest: {
      success: false,
      message: '',
      docTypes: [],
      subTypes: [],
      elements: []
    }
  };
  
  try {
    // Configure DynamoDB client
    const config = {
      region: process.env.APP_REGION || 'ap-southeast-2',
    };
    
    // Add credentials if they exist in environment
    if (process.env.APP_ACCESS_KEY_ID && process.env.APP_SECRET_ACCESS_KEY) {
      Object.assign(config, {
        credentials: {
          accessKeyId: process.env.APP_ACCESS_KEY_ID,
          secretAccessKey: process.env.APP_SECRET_ACCESS_KEY
        }
      });
    }
    
    // Add local endpoint if set
    if (process.env.DYNAMODB_LOCAL_ENDPOINT) {
      Object.assign(config, {
        endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT
      });
    }
    
    const client = new DynamoDBClient(config);
    const docClient = DynamoDBDocumentClient.from(client);
    
    // Test document types table
    const docTypesResponse = await docClient.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_DOCTYPE_TABLE || 'document-processor-doctypes',
        Limit: 5
      })
    );
    
    debugInfo.connectionTest.docTypes = docTypesResponse.Items || [];
    
    // Test sub-types table
    const subTypesResponse = await docClient.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_SUBTYPE_TABLE || 'document-processor-subtypes',
        Limit: 5
      })
    );
    
    debugInfo.connectionTest.subTypes = subTypesResponse.Items || [];
    
    // Test elements table
    const elementsResponse = await docClient.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_ELEMENT_TABLE || 'document-processor-elements',
        Limit: 5
      })
    );
    
    debugInfo.connectionTest.elements = elementsResponse.Items || [];
    
    debugInfo.connectionTest.success = true;
    debugInfo.connectionTest.message = 'Successfully connected to DynamoDB and retrieved data';
  } catch (error: any) {
    debugInfo.connectionTest.success = false;
    debugInfo.connectionTest.message = `Error connecting to DynamoDB: ${error.message}`;
    console.error('DynamoDB Debug Error:', error);
  }
  
  return NextResponse.json(debugInfo);
} 
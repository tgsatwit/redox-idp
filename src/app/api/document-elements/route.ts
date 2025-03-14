import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  ScanCommandOutput 
} from '@aws-sdk/lib-dynamodb';

// Use APP_ prefixed environment variables as they're available in your system
const APP_ACCESS_KEY_ID = process.env.APP_ACCESS_KEY_ID; 
const APP_SECRET_ACCESS_KEY = process.env.APP_SECRET_ACCESS_KEY;
const APP_REGION = process.env.APP_REGION || 'ap-southeast-2';

// Check if AWS credentials are available
const hasAwsCredentials = APP_ACCESS_KEY_ID && APP_SECRET_ACCESS_KEY;

// Log for debugging - environment variables are available but values are not exposed
console.log('APP_REGION is set:', !!process.env.APP_REGION);
console.log('APP_ACCESS_KEY_ID is set:', !!process.env.APP_ACCESS_KEY_ID);
console.log('APP_SECRET_ACCESS_KEY is set:', !!process.env.APP_SECRET_ACCESS_KEY);
console.log('DYNAMODB_ELEMENT_TABLE is set:', !!process.env.DYNAMODB_ELEMENT_TABLE);

// Configure DynamoDB client
const clientConfig = {
  region: APP_REGION,
};

// Only add credentials if they're available
if (hasAwsCredentials) {
  Object.assign(clientConfig, {
    credentials: {
      accessKeyId: APP_ACCESS_KEY_ID || '',
      secretAccessKey: APP_SECRET_ACCESS_KEY || '',
    }
  });
}

let client: DynamoDBClient;
let docClient: DynamoDBDocumentClient;

try {
  client = new DynamoDBClient(clientConfig);
  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
    }
  });
  console.log('DynamoDB client initialized successfully');
} catch (error) {
  console.error('Error initializing DynamoDB client:', error);
  throw error;
}

const DYNAMODB_ELEMENT_TABLE = process.env.DYNAMODB_ELEMENT_TABLE || 'document-processor-elements';

// Temporary mapping of document types and subtypes
// In a real implementation, these would be fetched from another DynamoDB table
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'ID Document': 'byvwu9fbl62ku1dj370agewe',
  // Add more mappings as needed
};

const DOCUMENT_SUBTYPE_MAP: Record<string, string> = {
  'Passport': 'aafc32e1-9cbe-4ba4-9a12-a03b19563499',
  "Driver's License": '302bbb499-cb8e-48e3-8baf-4c57f2d13107',
  // Add more mappings as needed
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');
    const subType = searchParams.get('subType');

    console.log(`Processing request for documentType: ${documentType}, subType: ${subType}`);

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Check if AWS credentials are properly configured
    if (!hasAwsCredentials) {
      console.warn('AWS credentials not available, returning empty result');
      return NextResponse.json([]);
    }

    // Determine if we already have an ID or need to map from a display name
    let documentTypeId = documentType;
    let subTypeId = subType;

    // If the document type is in our map, use the mapped ID
    if (DOCUMENT_TYPE_MAP[documentType]) {
      documentTypeId = DOCUMENT_TYPE_MAP[documentType];
      console.log(`Mapped document type "${documentType}" to ID "${documentTypeId}"`);
    }

    // If the subtype is in our map, use the mapped ID
    if (subType && DOCUMENT_SUBTYPE_MAP[subType]) {
      subTypeId = DOCUMENT_SUBTYPE_MAP[subType];
      console.log(`Mapped document subtype "${subType}" to ID "${subTypeId}"`);
    }

    try {
      // Use a scan operation with a filter expression on the ID
      let scanCommand;
      
      if (subTypeId) {
        scanCommand = new ScanCommand({
          TableName: DYNAMODB_ELEMENT_TABLE,
          FilterExpression: 'documentTypeId = :docType AND subTypeId = :subType',
          ExpressionAttributeValues: {
            ':docType': documentTypeId,
            ':subType': subTypeId,
          },
        });
      } else {
        scanCommand = new ScanCommand({
          TableName: DYNAMODB_ELEMENT_TABLE,
          FilterExpression: 'documentTypeId = :docType',
          ExpressionAttributeValues: {
            ':docType': documentTypeId,
          },
        });
      }
      
      console.log(`Sending DynamoDB scan command for table: ${DYNAMODB_ELEMENT_TABLE}`);
      console.log(`Using documentTypeId: ${documentTypeId}, subTypeId: ${subTypeId || 'none'}`);
      
      const scanResponse = await docClient.send(scanCommand) as ScanCommandOutput;
      console.log(`DynamoDB scan successful, found ${scanResponse.Items?.length || 0} items`);
      
      if (scanResponse.Items && scanResponse.Items.length > 0) {
        return NextResponse.json(scanResponse.Items);
      }
      
      // Try a more flexible approach if no items found with the strict filter and we have a subtype
      if (subTypeId) {
        console.log('No items found with strict filters, trying more general search');
        const fallbackScanCommand = new ScanCommand({
          TableName: DYNAMODB_ELEMENT_TABLE,
          FilterExpression: 'documentTypeId = :docType',
          ExpressionAttributeValues: {
            ':docType': documentTypeId,
          },
        });
        
        const fallbackResponse = await docClient.send(fallbackScanCommand) as ScanCommandOutput;
        console.log(`Fallback scan found ${fallbackResponse.Items?.length || 0} items`);
        
        // Filter items post-scan to include those with no subTypeId (generic items for this document type)
        if (fallbackResponse.Items && fallbackResponse.Items.length > 0) {
          const filteredItems = fallbackResponse.Items.filter(item => 
            !item.subTypeId || item.subTypeId === subTypeId
          );
          
          if (filteredItems.length > 0) {
            return NextResponse.json(filteredItems);
          }
        }
      }
      
      // As a last resort, try a simple scan with no filters to confirm the table has data
      console.log('No document elements found with filters, checking if table has any data');
      const checkTableCommand = new ScanCommand({
        TableName: DYNAMODB_ELEMENT_TABLE,
        Limit: 5, // Just get a few items to check
      });
      
      const checkResponse = await docClient.send(checkTableCommand) as ScanCommandOutput;
      console.log(`Table check found ${checkResponse.Items?.length || 0} items`);
      
      if (checkResponse.Items && checkResponse.Items.length > 0) {
        // Table has data but none matched our filters
        console.log('Table has data but no matching elements for this document type/subtype');
        console.log('Sample item from table:', JSON.stringify(checkResponse.Items[0]));
      }
      
      // Return empty array if no elements found
      console.log('No document elements found, returning empty array');
      return NextResponse.json([]);
    } catch (dynamoDbError) {
      console.error('DynamoDB operation failed:', dynamoDbError);
      
      // For security reasons, don't expose the specific error details to the client
      return NextResponse.json(
        { error: 'Database operation failed', message: 'Could not access document elements data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in document-elements API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document elements', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
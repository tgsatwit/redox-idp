import { DynamoDB } from 'aws-sdk';

/**
 * Helper utility for DynamoDB operations that provides fallback mechanisms
 * when indexes are missing or operations fail
 */

// Initialize DynamoDB client
export const createDynamoDBClient = () => {
  return new DynamoDB.DocumentClient({
    region: process.env.APP_REGION || 'ap-southeast-2',
    accessKeyId: process.env.APP_ACCESS_KEY_ID,
    secretAccessKey: process.env.APP_SECRET_ACCESS_KEY,
  });
};

/**
 * Attempts to query using an index, but falls back to scan if the index doesn't exist
 */
export const queryWithFallback = async (
  tableName: string,
  indexName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>,
  expressionAttributeNames?: Record<string, string>,
  filterExpression?: string
): Promise<DynamoDB.DocumentClient.ItemList> => {
  const dynamoDb = createDynamoDBClient();
  
  try {
    console.log(`Attempting to query ${tableName} using index ${indexName}`);
    
    // First try using the index
    const queryParams: DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };
    
    if (expressionAttributeNames) {
      queryParams.ExpressionAttributeNames = expressionAttributeNames;
    }
    
    if (filterExpression) {
      queryParams.FilterExpression = filterExpression;
    }
    
    const result = await dynamoDb.query(queryParams).promise();
    console.log(`Query successful using index ${indexName}, found ${result.Items?.length || 0} items`);
    return result.Items || [];
  } catch (error) {
    // Check if the error is due to a missing index
    if (
      error instanceof Error && 
      (error.name === 'ValidationException' || error.message.includes('index'))
    ) {
      console.warn(`Index ${indexName} not found, falling back to scan operation`);
      
      // Extract the key from the KeyConditionExpression and ExpressionAttributeValues
      // This is a simplified approach and may need adjustment for complex queries
      const keyName = keyConditionExpression.split('=')[0].trim();
      const keyValue = Object.values(expressionAttributeValues)[0];
      
      // Build a filter expression for the scan
      let scanFilterExpression = `${keyName} = :keyValue`;
      if (filterExpression) {
        scanFilterExpression = `${scanFilterExpression} AND ${filterExpression}`;
      }
      
      const scanParams: DynamoDB.DocumentClient.ScanInput = {
        TableName: tableName,
        FilterExpression: scanFilterExpression,
        ExpressionAttributeValues: {
          ...expressionAttributeValues,
          ':keyValue': keyValue,
        },
      };
      
      if (expressionAttributeNames) {
        scanParams.ExpressionAttributeNames = expressionAttributeNames;
      }
      
      console.log(`Scanning ${tableName} with filter: ${scanFilterExpression}`);
      const scanResult = await dynamoDb.scan(scanParams).promise();
      console.log(`Scan successful, found ${scanResult.Items?.length || 0} items`);
      return scanResult.Items || [];
    }
    
    // For other errors, just rethrow
    console.error(`DynamoDB operation failed: ${error}`);
    throw error;
  }
};

/**
 * Get a single item by ID with detailed error logging
 */
export const getItemById = async (
  tableName: string,
  id: string,
  idFieldName: string = 'id'
): Promise<any> => {
  const dynamoDb = createDynamoDBClient();
  
  try {
    console.log(`Fetching item with ${idFieldName}=${id} from ${tableName}`);
    const result = await dynamoDb.get({
      TableName: tableName,
      Key: { [idFieldName]: id },
    }).promise();

    if (!result.Item) {
      console.log(`No item found with ${idFieldName}=${id} in ${tableName}`);
      return null;
    }

    return result.Item;
  } catch (error) {
    console.error(`Error fetching item with ${idFieldName}=${id} from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Scan a table with detailed error logging
 */
export const scanTable = async (
  tableName: string,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, any>
): Promise<DynamoDB.DocumentClient.ItemList> => {
  const dynamoDb = createDynamoDBClient();
  
  try {
    console.log(`Scanning table ${tableName}${filterExpression ? ' with filter' : ''}`);
    const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: tableName,
    };
    
    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }
    
    const result = await dynamoDb.scan(params).promise();
    console.log(`Scan successful, found ${result.Items?.length || 0} items`);
    return result.Items || [];
  } catch (error) {
    console.error(`Error scanning table ${tableName}:`, error);
    throw error;
  }
}; 
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { DataElementConfig } from '@/lib/types';

const configService = new DynamoDBConfigService();

interface RouteParams {
  params: Promise<{
    docTypeId: string;
    subTypeId: string;
  }>;
}

/**
 * GET - Retrieve all data elements for a specific sub-type
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId, subTypeId } = await context.params;
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }
    
    // Check if sub-type exists
    const subType = await configService.getSubType(subTypeId);
    if (!subType) {
      return NextResponse.json(
        { error: 'Sub-type not found' },
        { status: 404 }
      );
    }
    
    const elements = await configService.getDataElementsBySubType(subTypeId);
    return NextResponse.json(elements);
  } catch (error: any) {
    console.error(`Error fetching data elements for sub-type ${(await context.params).subTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data elements for sub-type' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new data element for a specific sub-type
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId, subTypeId } = await context.params;
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }
    
    // Check if sub-type exists
    const subType = await configService.getSubType(subTypeId);
    if (!subType) {
      return NextResponse.json(
        { error: 'Sub-type not found' },
        { status: 404 }
      );
    }
    
    const dataElement = await request.json() as Omit<DataElementConfig, 'id'>;
    
    // Ensure the subTypeId is set correctly
    const elementWithSubType = {
      ...dataElement,
      documentTypeId: docTypeId,
      subTypeId
    };
    
    // Use the createDataElement function with the correct parameter order
    const newElement = await configService.createDataElement(
      docTypeId, 
      elementWithSubType,
      subTypeId
    );
    
    return NextResponse.json(newElement);
  } catch (error: any) {
    console.error(`Error creating data element for sub-type ${(await context.params).subTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to create data element for sub-type', details: error.message },
      { status: 500 }
    );
  }
} 
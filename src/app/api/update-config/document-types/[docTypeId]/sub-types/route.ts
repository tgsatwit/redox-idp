import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { DocumentSubTypeConfig } from '@/lib/types';

const configService = new DynamoDBConfigService();

interface RouteParams {
  params: Promise<{
    docTypeId: string;
  }>;
}

/**
 * GET - Retrieve all sub-types for a document type
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId } = await context.params;
    if (!docTypeId) {
      return NextResponse.json(
        { error: 'Document type ID is required' },
        { status: 400 }
      );
    }
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: `Document type not found: ${docTypeId}` },
        { status: 404 }
      );
    }
    
    const subTypes = await configService.getSubTypesByDocumentType(docTypeId);
    
    // For each sub-type, load its elements
    const subTypesWithElements = await Promise.all(
      subTypes.map(async (subType) => {
        try {
          const elements = await configService.getDataElementsBySubType(subType.id);
          return { ...subType, dataElements: elements };
        } catch (error) {
          console.error(`Error loading elements for sub-type ${subType.id}:`, error);
          return { ...subType, dataElements: [] };
        }
      })
    );
    
    return NextResponse.json(subTypesWithElements);
  } catch (error: any) {
    console.error(`Error fetching sub-types for document type ${(await context.params)?.docTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-types', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new sub-type for a document type
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId } = await context.params;
    if (!docTypeId) {
      return NextResponse.json(
        { error: 'Document type ID is required' },
        { status: 400 }
      );
    }
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: `Document type not found: ${docTypeId}` },
        { status: 404 }
      );
    }
    
    const subType = await request.json() as Omit<DocumentSubTypeConfig, 'id'>;
    const newSubType = await configService.createSubType(docTypeId, subType);
    
    return NextResponse.json(newSubType);
  } catch (error: any) {
    console.error(`Error creating sub-type for document type ${(await context.params)?.docTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to create sub-type', details: error.message },
      { status: 500 }
    );
  }
} 
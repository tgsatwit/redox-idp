import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { DataElementConfig } from '@/lib/types';

const configService = new DynamoDBConfigService();

interface RouteParams {
  params: Promise<{
    docTypeId: string;
    subTypeId: string;
    elementId: string;
  }>;
}

/**
 * GET - Retrieve a specific data element for a sub-type
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId, subTypeId, elementId } = await context.params;
    
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
    
    // Get all elements for the sub-type
    const elements = await configService.getDataElementsBySubType(subTypeId);
    
    // Find the specific element
    const element = elements.find(e => e.id === elementId);
    if (!element) {
      return NextResponse.json(
        { error: 'Data element not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(element);
  } catch (error: any) {
    console.error(`Error fetching data element ${(await context.params).elementId} for sub-type ${(await context.params).subTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data element' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a specific data element for a sub-type
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId, subTypeId, elementId } = await context.params;
    const updates = await request.json() as Partial<DataElementConfig>;
    
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
    
    // Get all elements for the sub-type
    const elements = await configService.getDataElementsBySubType(subTypeId);
    
    // Find the specific element
    const element = elements.find(e => e.id === elementId);
    if (!element) {
      return NextResponse.json(
        { error: 'Data element not found' },
        { status: 404 }
      );
    }
    
    // Update the element
    await configService.updateDataElement(docTypeId, elementId, updates, subTypeId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating data element ${(await context.params).elementId} for sub-type ${(await context.params).subTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update data element', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a specific data element for a sub-type
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId, subTypeId, elementId } = await context.params;
    
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
    
    // Get all elements for the sub-type
    const elements = await configService.getDataElementsBySubType(subTypeId);
    
    // Find the specific element
    const element = elements.find(e => e.id === elementId);
    if (!element) {
      return NextResponse.json(
        { error: 'Data element not found' },
        { status: 404 }
      );
    }
    
    // Delete the element
    await configService.deleteDataElement(docTypeId, elementId, subTypeId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting data element ${(await context.params).elementId} for sub-type ${(await context.params).subTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete data element', details: error.message },
      { status: 500 }
    );
  }
} 
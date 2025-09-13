import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { DocumentTypeConfig } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    docTypeId: string;
  }>;
}

/**
 * GET - Retrieve a specific document type by ID
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId } = await context.params;
    console.log(`API: Fetching document type ${docTypeId}...`);
    
    // Create a new instance of the service for each request
    const configService = new DynamoDBConfigService();
    
    // Get the document type - with enhanced error handling
    let documentType = null;
    try {
      documentType = await configService.getDocumentType(docTypeId);
    } catch (serviceError) {
      console.error(`API: Error from config service for document type ${docTypeId}:`, serviceError);
      return NextResponse.json(
        { 
          error: 'Error fetching document type from service', 
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error',
          docTypeId 
        },
        { status: 500 }
      );
    }
    
    if (!documentType) {
      console.warn(`API: Document type not found: ${docTypeId}`);
      return NextResponse.json(
        { error: 'Document type not found', docTypeId },
        { status: 404 }
      );
    }
    
    console.log(`API: Found document type: ${documentType.name} (${documentType.id})`);
    
    // Initialize arrays if they don't exist to prevent null references
    if (!documentType.subTypes) documentType.subTypes = [];
    if (!documentType.dataElements) documentType.dataElements = [];
    
    // Ensure all subTypes have a dataElements array to prevent null references
    documentType.subTypes.forEach(subType => {
      if (!subType.dataElements) subType.dataElements = [];
    });
    
    // Log detailed information about the data for debugging
    if (documentType.subTypes.length > 0) {
      console.log(`API: Document type has ${documentType.subTypes.length} sub-types`);
      
      // Verify sub-type data elements
      let totalSubTypeElements = 0;
      
      documentType.subTypes.forEach(subType => {
        console.log(`API: - Sub-type: ${subType.name} (${subType.id})`);
        
        // Verify the dataElements array exists
        if (!subType.dataElements) {
          console.warn(`API: Sub-type ${subType.id} has no dataElements array, initializing it`);
          subType.dataElements = [];
        }
        
        if (subType.dataElements && subType.dataElements.length > 0) {
          totalSubTypeElements += subType.dataElements.length;
          console.log(`API:   Has ${subType.dataElements.length} data elements`);
          
          // Verify each element has the correct subTypeId
          subType.dataElements.forEach(element => {
            console.log(`API:   - Element: ${element.name}, Action: ${element.action}, SubTypeId: ${element.subTypeId}`);
            
            // Ensure the subTypeId is set correctly
            if (!element.subTypeId || element.subTypeId !== subType.id) {
              console.warn(`API:     Fixing missing/incorrect subTypeId for element ${element.id}`);
              element.subTypeId = subType.id;
            }
          });
        } else {
          console.log(`API:   Has 0 data elements`);
        }
      });
      
      console.log(`API: Total data elements across all sub-types: ${totalSubTypeElements}`);
    } else {
      console.log(`API: Document type has 0 sub-types`);
    }
    
    if (documentType.dataElements.length > 0) {
      console.log(`API: Document type has ${documentType.dataElements.length} document-level data elements`);
      
      documentType.dataElements.forEach(element => {
        console.log(`API: - Element: ${element.name}, Action: ${element.action}`);
      });
    } else {
      console.log(`API: Document type has 0 document-level data elements`);
    }
    
    return NextResponse.json(documentType);
  } catch (error: any) {
    console.error(`API: Error fetching document type ${(await context.params)?.docTypeId}:`, error);
    
    // Provide a meaningful error response with as much detail as possible
    return NextResponse.json(
      { 
        error: 'Failed to fetch document type', 
        details: error.message || 'Unknown error',
        docTypeId: (await context.params)?.docTypeId,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a document type
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId } = await context.params;
    const updates = await request.json() as Partial<DocumentTypeConfig>;
    
    // Create a new instance of the service for each request
    const configService = new DynamoDBConfigService();
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }
    
    // Update the document type
    await configService.updateDocumentType(docTypeId, updates);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating document type ${(await context.params)?.docTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update document type', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a document type
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { docTypeId } = await context.params;
    
    // Create a new instance of the service for each request
    const configService = new DynamoDBConfigService();
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }
    
    // Delete the document type
    await configService.deleteDocumentType(docTypeId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting document type ${(await context.params)?.docTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete document type', details: error.message },
      { status: 500 }
    );
  }
} 
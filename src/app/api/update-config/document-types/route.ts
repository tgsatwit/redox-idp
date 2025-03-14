import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { DocumentTypeConfig } from '@/lib/types';

/**
 * GET - Retrieve all document types
 */
export async function GET() {
  try {
    console.log('Fetching all document types...');
    
    // Create a new instance of the service for each request to ensure fresh connection checks
    const configService = new DynamoDBConfigService();
    
    const documentTypes = await configService.getAllDocumentTypes();
    console.log(`Found ${documentTypes.length} document types`);
    
    // If document types array is empty, log a warning
    if (documentTypes.length === 0) {
      console.warn('No document types found in database');
    }
    
    return NextResponse.json(documentTypes);
  } catch (error: any) {
    console.error('Error fetching document types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document types', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new document type
 */
export async function POST(request: NextRequest) {
  try {
    const documentType = await request.json() as Omit<DocumentTypeConfig, 'id'>;
    
    if (!documentType.name) {
      console.warn('Attempted to create document type without a name');
      return NextResponse.json(
        { error: 'Document type name is required' },
        { status: 400 }
      );
    }
    
    console.log('Creating new document type:', documentType);
    
    // Create a new instance of the service for each request
    const configService = new DynamoDBConfigService();
    
    const newDocType = await configService.createDocumentType(documentType);
    console.log('Created document type:', newDocType);
    
    return NextResponse.json(newDocType);
  } catch (error: any) {
    console.error('Error creating document type:', error);
    return NextResponse.json(
      { error: 'Failed to create document type', details: error.message },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { DocumentTypeConfig } from '@/lib/types';

const configService = new DynamoDBConfigService();

/**
 * GET - Retrieve all document types
 */
export async function GET() {
  try {
    console.log('Fetching all document types...');
    const documentTypes = await configService.getAllDocumentTypes();
    console.log(`Found ${documentTypes.length} document types`);
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
      return NextResponse.json(
        { error: 'Document type name is required' },
        { status: 400 }
      );
    }
    
    console.log('Creating new document type:', documentType);
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
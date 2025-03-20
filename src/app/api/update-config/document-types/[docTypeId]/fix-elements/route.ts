import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';

const configService = new DynamoDBConfigService();

interface RouteParams {
  params: {
    docTypeId: string;
  };
}

/**
 * POST - Fix and synchronize document elements for a document type
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { docTypeId } = params;
    console.log(`API: Fixing document elements for document type ${docTypeId}`);
    
    // Check if document type exists
    const documentType = await configService.getDocumentType(docTypeId);
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }
    
    // Fix the document type's elements
    const success = await configService.fixDocumentElements(docTypeId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully fixed document elements for ${documentType.name}`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to fix document elements' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`Error fixing document elements for ${params.docTypeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fix document elements', details: error.message },
      { status: 500 }
    );
  }
} 
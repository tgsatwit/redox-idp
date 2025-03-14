import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { WorkflowConfig } from '@/lib/types';

// Initialize the DynamoDB config service
const configService = new DynamoDBConfigService();

/**
 * GET - Retrieve all workflows or filter by type if provided
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    let workflows: WorkflowConfig[];
    
    if (type) {
      workflows = await configService.getWorkflowsByType(type);
    } else {
      workflows = await configService.getAllWorkflows();
    }
    
    return NextResponse.json(workflows);
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const workflowData = await request.json();
    
    // Validate required fields
    if (!workflowData.name || !workflowData.description || !workflowData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, type' },
        { status: 400 }
      );
    }
    
    // Validate workflow type
    if (!['API', 'User', 'Exception'].includes(workflowData.type)) {
      return NextResponse.json(
        { error: 'Invalid workflow type. Must be one of: API, User, Exception' },
        { status: 400 }
      );
    }
    
    // Validate Exception workflows have a linked API workflow
    if (workflowData.type === 'Exception' && !workflowData.linkedWorkflowId) {
      return NextResponse.json(
        { error: 'Exception workflows must have a linkedWorkflowId' },
        { status: 400 }
      );
    }
    
    // Validate API workflows have input and output parameters
    if (workflowData.type === 'API' && (!workflowData.inputParameters || !workflowData.outputParameters)) {
      return NextResponse.json(
        { error: 'API workflows must define inputParameters and outputParameters' },
        { status: 400 }
      );
    }
    
    // Ensure tasks is always an array
    if (!Array.isArray(workflowData.tasks)) {
      workflowData.tasks = [];
    }
    
    // Set default values
    const workflow = {
      ...workflowData,
      isActive: workflowData.isActive !== undefined ? Boolean(workflowData.isActive) : true
    };
    
    const newWorkflow = await configService.addWorkflow(workflow);
    return NextResponse.json(newWorkflow);
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';

// Initialize the DynamoDB config service
const configService = new DynamoDBConfigService();

/**
 * GET - Retrieve a specific workflow by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  
  try {
    const workflow = await configService.getWorkflowById(workflowId);
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error(`Error fetching workflow ${workflowId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a specific workflow
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  
  try {
    const workflow = await configService.getWorkflowById(workflowId);
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    const updates = await request.json();
    
    // Validate workflow type hasn't changed
    if (updates.type && updates.type !== workflow.type) {
      return NextResponse.json(
        { error: 'Workflow type cannot be changed' },
        { status: 400 }
      );
    }
    
    // Validate Exception workflows have a linked API workflow
    if (workflow.type === 'Exception' && updates.linkedWorkflowId === undefined && !workflow.linkedWorkflowId) {
      return NextResponse.json(
        { error: 'Exception workflows must have a linkedWorkflowId' },
        { status: 400 }
      );
    }
    
    // Convert boolean values
    if (updates.isActive !== undefined) {
      updates.isActive = Boolean(updates.isActive);
    }
    
    await configService.updateWorkflow(workflowId, updates);
    
    // Get updated workflow
    const updatedWorkflow = await configService.getWorkflowById(workflowId);
    
    return NextResponse.json(updatedWorkflow);
  } catch (error: any) {
    console.error(`Error updating workflow ${workflowId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a specific workflow
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  
  try {
    const workflow = await configService.getWorkflowById(workflowId);
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    // Check if any Exception workflows are linked to this one
    if (workflow.type === 'API') {
      const allWorkflows = await configService.getAllWorkflows();
      const linkedWorkflows = allWorkflows.filter(w => 
        w.type === 'Exception' && w.linkedWorkflowId === workflowId
      );
      
      if (linkedWorkflows.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot delete API workflow that has linked Exception workflows',
            linkedWorkflows: linkedWorkflows.map(w => ({ id: w.id, name: w.name }))
          },
          { status: 400 }
        );
      }
    }
    
    await configService.deleteWorkflow(workflowId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting workflow ${workflowId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
} 
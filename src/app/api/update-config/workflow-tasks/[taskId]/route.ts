import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';

const configService = new DynamoDBConfigService();

/**
 * GET - Retrieve a specific workflow task
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;
  
  try {
    // Get all tasks and find the one with matching ID
    // Note: We'll need to add a getWorkflowTask method to the service for this
    const allTasks = await configService.getAllWorkflowTasks();
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Workflow task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error: any) {
    console.error(`Error fetching workflow task ${taskId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow task' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a specific workflow task
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;
  
  try {
    const updates = await request.json();
    
    // Validate stepId if provided
    if (updates.stepId !== undefined) {
      if (!Number.isInteger(updates.stepId) || updates.stepId < 1) {
        return NextResponse.json(
          { error: 'stepId must be a positive integer' },
          { status: 400 }
        );
      }
    }
    
    // Convert boolean values
    if (updates.defaultEnabled !== undefined) {
      updates.defaultEnabled = Boolean(updates.defaultEnabled);
    }
    if (updates.isActive !== undefined) {
      updates.isActive = Boolean(updates.isActive);
    }
    
    await configService.updateWorkflowTask(taskId, updates);
    
    // Get updated task
    const tasks = await configService.getAllWorkflowTasks();
    const updatedTask = tasks.find(t => t.id === taskId);
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found after update' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error(`Error updating workflow task ${taskId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update workflow task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a specific workflow task
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;
  
  try {
    // Get all workflows to check for task usage
    const workflows = await configService.getAllWorkflows();
    const workflowsUsingTask = workflows.filter(workflow => 
      workflow.tasks.some(task => task.taskId === taskId)
    );
    
    if (workflowsUsingTask.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete task that is in use by workflows',
          workflows: workflowsUsingTask.map(w => ({ id: w.id, name: w.name }))
        },
        { status: 400 }
      );
    }
    
    await configService.deleteWorkflowTask(taskId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting workflow task ${taskId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete workflow task' },
      { status: 500 }
    );
  }
} 
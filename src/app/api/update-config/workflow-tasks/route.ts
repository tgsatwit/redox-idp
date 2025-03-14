import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBConfigService } from '@/lib/services/dynamodb-config-service';
import { WorkflowTaskConfig } from '@/lib/types';

// Initialize the DynamoDB config service
const configService = new DynamoDBConfigService();

/**
 * GET - Retrieve all workflow tasks or filter by step if provided
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stepId = searchParams.get('stepId');
    
    let tasks: WorkflowTaskConfig[];
    
    if (stepId) {
      tasks = await configService.getWorkflowTasksByStep(parseInt(stepId, 10));
    } else {
      tasks = await configService.getAllWorkflowTasks();
    }
    
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching workflow tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new workflow task
 */
export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json();
    
    // Validate required fields
    if (!taskData.name || !taskData.description || taskData.stepId === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, stepId' },
        { status: 400 }
      );
    }
    
    // Validate stepId is a positive integer
    if (!Number.isInteger(taskData.stepId) || taskData.stepId < 1) {
      return NextResponse.json(
        { error: 'stepId must be a positive integer' },
        { status: 400 }
      );
    }
    
    // Set default values
    const task = {
      ...taskData,
      defaultEnabled: taskData.defaultEnabled !== undefined ? Boolean(taskData.defaultEnabled) : true,
      isActive: taskData.isActive !== undefined ? Boolean(taskData.isActive) : true
    };
    
    const newTask = await configService.addWorkflowTask(task);
    return NextResponse.json(newTask);
  } catch (error: any) {
    console.error('Error creating workflow task:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow task' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a workflow task
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Ensure step ID is a number
    if (updates.stepId !== undefined) {
      updates.stepId = Number(updates.stepId);
    }
    
    // Convert boolean values
    if (updates.defaultEnabled !== undefined) {
      updates.defaultEnabled = Boolean(updates.defaultEnabled);
    }
    
    if (updates.isActive !== undefined) {
      updates.isActive = Boolean(updates.isActive);
    }
    
    await configService.updateWorkflowTask(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating workflow task:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a workflow task
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    await configService.deleteWorkflowTask(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workflow task:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow task' },
      { status: 500 }
    );
  }
} 
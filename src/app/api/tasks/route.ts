import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask } from '@/lib/api';
import { CreateTaskSchema } from '@/lib/validations';
import { logTaskActivity } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Task } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const tasks = getAllTasks(limit, offset);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateTaskSchema.parse(body);
    const task = createTask(validatedData as unknown as Omit<Task, 'createdAt' | 'updatedAt' | 'subtasks' | 'attachments'> & { labelIds?: string[] });
    
    // Log activity
    logTaskActivity(task.id, 'created');
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
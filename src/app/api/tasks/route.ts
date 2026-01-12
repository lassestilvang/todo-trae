import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask } from '@/lib/api';
import { CreateTaskSchema } from '@/lib/validations';
import { logTaskActivity } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Task } from '@/types';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Retrieve a list of tasks
 *     description: Returns all tasks with optional pagination.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of tasks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of tasks to skip
 *     responses:
 *       200:
 *         description: A list of tasks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task and returns the created object.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       201:
 *         description: Created task object.
 *       400:
 *         description: Validation error.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const tasks = getAllTasks(limit, offset);
    return NextResponse.json(tasks);
  } catch (error) {
    logger.error('Error fetching tasks', { error });
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
    logger.info('Task created successfully', { taskId: task.id, name: task.name });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Task validation failed', { error: error.issues });
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    logger.error('Error creating task', { error });
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
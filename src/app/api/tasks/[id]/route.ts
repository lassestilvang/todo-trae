import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask } from '@/lib/api';
import { UpdateTaskSchema } from '@/lib/validations';
import { logTaskActivity, logTaskUpdate } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Task } from '@/types';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createTask, calculateNextRecurringDate, generateNextRecurringTask } from '@/lib/api';

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task object.
 *       404:
 *         description: Task not found.
 *   put:
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTask'
 *     responses:
 *       200:
 *         description: Updated task object.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Task not found.
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Task deleted.
 *       404:
 *         description: Task not found.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await getTaskById(id, session.user.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    logger.error('Error fetching task', { error, taskId: id });
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    const existingTask = await getTaskById(id, session.user.id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await updateTask(id, session.user.id, validatedData as Partial<Task>);

    // Log activity
    await logTaskUpdate(id, validatedData, existingTask, session.user.id);

    // Auto-generate next recurring task instance when completing a recurring task
    if (validatedData.completed === true && existingTask.recurring && !existingTask.completed) {
      try {
        await generateNextRecurringTask(existingTask, session.user.id);
      } catch (error) {
        logger.error('Failed to generate next recurring task', { error, taskId: id });
        // Don't fail the response — task was already updated
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    logger.error('Error updating task', { error });
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingTask = await getTaskById(id, session.user.id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await deleteTask(id, session.user.id);
    
    // Log activity
    await logTaskActivity(id, 'deleted', session.user.id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('Error deleting task', { error });
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

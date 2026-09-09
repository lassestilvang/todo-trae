import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getTaskDependencies, addTaskDependency, removeTaskDependency } from '@/lib/api';
import { z } from 'zod';

const AddDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
});

const RemoveDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const dependencies = await getTaskDependencies(taskId, session.user.id);
    return NextResponse.json(dependencies);
  } catch (error) {
    logger.error('Error fetching task dependencies', { error });
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/tasks/dependencies:
 *   get:
 *     summary: Get task dependencies
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of task dependencies.
 *       401:
 *         description: Unauthorized.
 *   post:
 *     summary: Add a task dependency
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - dependsOnTaskId
 *             properties:
 *               taskId:
 *                 type: string
 *               dependsOnTaskId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dependency created.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *   delete:
 *     summary: Remove a task dependency
 *     tags:
 *       - Tasks
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - dependsOnTaskId
 *             properties:
 *               taskId:
 *                 type: string
 *               dependsOnTaskId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dependency removed.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AddDependencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { taskId, dependsOnTaskId } = parsed.data;
    const dependency = await addTaskDependency(taskId, dependsOnTaskId, session.user.id);
    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      logger.warn('Task dependency error', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error('Error creating task dependency', { error });
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RemoveDependencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { taskId, dependsOnTaskId } = parsed.data;
    await removeTaskDependency(taskId, dependsOnTaskId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error removing task dependency', { error });
    return NextResponse.json({ error: 'Failed to remove dependency' }, { status: 500 });
  }
}

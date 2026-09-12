import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ReorderTasksSchema } from '@/lib/validations';
import { reorderTasks as reorderTasksInDB } from '@/lib/api';
import { logTaskActivity } from '@/lib/activityLog';
import { ZodError } from 'zod';

/**
 * @swagger
 * /api/tasks/reorder:
 *   post:
 *     summary: Reorder tasks within a list
 *     description: Updates the order field of tasks based on the provided ordered list of task IDs.
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
 *               - listId
 *               - orderedIds
 *             properties:
 *               listId:
 *                 type: string
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tasks reordered successfully.
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
    const parsed = ReorderTasksSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { listId, orderedIds } = parsed.data;
    await reorderTasksInDB(session.user.id, listId, orderedIds);

    // Log activity for each moved task
    for (const taskId of orderedIds) {
      await logTaskActivity(taskId, 'moved', session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Reorder validation failed', { error: error.issues });
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Error reordering tasks', { error });
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { bulkUpdateTasks, bulkDeleteTasks, bulkAssignLabels } from '@/lib/api';
import { z } from 'zod';

const BulkActionSchema = z.object({
  action: z.enum(['complete', 'uncomplete', 'delete', 'move', 'assignLabels', 'setPriority']),
  taskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
  // For 'move' action
  listId: z.string().optional(),
  // For 'assignLabels' action
  labelIds: z.array(z.string()).optional(),
  // For 'setPriority' action
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

/**
 * @swagger
 * /api/tasks/bulk:
 *   post:
 *     summary: Perform bulk operations on multiple tasks
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
 *               - action
 *               - taskIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [complete, uncomplete, delete, move, assignLabels, setPriority]
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               listId:
 *                 type: string
 *               labelIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Bulk operation completed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
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
    const parsed = BulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, taskIds, listId, labelIds, priority } = parsed.data;

    switch (action) {
      case 'complete':
        await bulkUpdateTasks(session.user.id, taskIds, { completed: true, completedAt: new Date() });
        logger.info('Bulk complete tasks', { count: taskIds.length, userId: session.user.id });
        break;

      case 'uncomplete':
        await bulkUpdateTasks(session.user.id, taskIds, { completed: false });
        logger.info('Bulk uncomplete tasks', { count: taskIds.length, userId: session.user.id });
        break;

      case 'delete':
        await bulkDeleteTasks(session.user.id, taskIds);
        logger.info('Bulk delete tasks', { count: taskIds.length, userId: session.user.id });
        break;

      case 'move':
        if (!listId) {
          return NextResponse.json({ error: 'listId is required for move action' }, { status: 400 });
        }
        await bulkUpdateTasks(session.user.id, taskIds, { listId });
        logger.info('Bulk move tasks', { count: taskIds.length, toListId: listId, userId: session.user.id });
        break;

      case 'assignLabels':
        if (!labelIds) {
          return NextResponse.json({ error: 'labelIds is required for assignLabels action' }, { status: 400 });
        }
        await bulkAssignLabels(session.user.id, taskIds, labelIds);
        logger.info('Bulk assign labels', { count: taskIds.length, labelCount: labelIds.length, userId: session.user.id });
        break;

      case 'setPriority':
        if (!priority) {
          return NextResponse.json({ error: 'priority is required for setPriority action' }, { status: 400 });
        }
        await bulkUpdateTasks(session.user.id, taskIds, { priority });
        logger.info('Bulk set priority', { count: taskIds.length, priority, userId: session.user.id });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: taskIds.length });
  } catch (error) {
    logger.error('Error in bulk operation', { error });
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}

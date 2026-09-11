import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import {
  taskLists,
  labels,
  tasks,
  subtasks,
  taskLabels,
  taskTemplates,
  reminders,
  taskDependencies,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * @swagger
 * /api/export:
 *   get:
 *     summary: Export all user data as JSON
 *     tags:
 *       - Export
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User data as JSON.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's tasks first to get IDs for filtering relation tables
    const tasksRows = await db.select().from(tasks).where(eq(tasks.userId, userId));
    const taskIds = tasksRows.map((t) => t.id);

    // Fetch all user data in parallel
    const [lists, labelRows, subtaskRows, taskLabelRows, templateRows, reminderRows, depRows] =
      await Promise.all([
        db.select().from(taskLists).where(eq(taskLists.userId, userId)),
        db.select().from(labels).where(eq(labels.userId, userId)),
        taskIds.length > 0
          ? db.select().from(subtasks).where(inArray(subtasks.taskId, taskIds))
          : Promise.resolve([]),
        taskIds.length > 0
          ? db.select().from(taskLabels).where(inArray(taskLabels.taskId, taskIds))
          : Promise.resolve([]),
        db.select().from(taskTemplates).where(eq(taskTemplates.userId, userId)),
        taskIds.length > 0
          ? db.select().from(reminders).where(inArray(reminders.taskId, taskIds))
          : Promise.resolve([]),
        taskIds.length > 0
          ? db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds))
          : Promise.resolve([]),
      ]);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        lists: lists,
        labels: labelRows,
        tasks: tasksRows,
        subtasks: subtaskRows,
        taskLabels: taskLabelRows,
        taskTemplates: templateRows,
        reminders: reminderRows,
        taskDependencies: depRows,
      },
    };

    logger.info('User data exported', { userId, taskCount: tasksRows.length });

    return NextResponse.json(exportData);
  } catch (error) {
    logger.error('Error exporting user data', { error });
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

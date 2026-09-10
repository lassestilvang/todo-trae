import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { reminders, tasks } from '@/db/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

/**
 * @swagger
 * /api/reminders/due:
 *   get:
 *     summary: Get reminders due within a time window
 *     tags:
 *       - Reminders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fetch reminders since this timestamp
 *     responses:
 *       200:
 *         description: Array of due reminders with task info.
 *       401:
 *         description: Unauthorized.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    const now = new Date();

    // Default: check for reminders due in the last 1 minute to next 5 minutes
    let since = new Date(now.getTime() - 60_000);
    let until = new Date(now.getTime() + 5 * 60_000);

    if (sinceParam) {
      since = new Date(sinceParam);
    }

    // Find reminders whose reminderTime falls within our window
    const results = await db
      .select({
        reminderId: reminders.id,
        taskId: reminders.taskId,
        reminderTime: reminders.reminderTime,
        taskName: tasks.name,
        taskPriority: tasks.priority,
        taskDeadline: tasks.deadline,
      })
      .from(reminders)
      .innerJoin(tasks, eq(reminders.taskId, tasks.id))
      .where(
        and(
          eq(tasks.userId, session.user.id),
          gte(reminders.reminderTime, since),
          lt(reminders.reminderTime, until)
        )
      )
      .orderBy(reminders.reminderTime);

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error fetching due reminders', { error });
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

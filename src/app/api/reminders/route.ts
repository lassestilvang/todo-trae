import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getRemindersByTaskId, createReminder, deleteReminder } from '@/lib/api';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const CreateReminderSchema = z.object({
  taskId: z.string(),
  reminderTime: z.coerce.date(),
});

const DeleteReminderSchema = z.object({
  taskId: z.string(),
  reminderTime: z.coerce.date(),
});

/**
 * @swagger
 * /api/reminders:
 *   get:
 *     summary: Get reminders for a task
 *     tags:
 *       - Reminders
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
 *         description: List of reminder times.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: date-time
 *       401:
 *         description: Unauthorized.
 *   post:
 *     summary: Create a reminder for a task
 *     tags:
 *       - Reminders
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
 *               - reminderTime
 *             properties:
 *               taskId:
 *                 type: string
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reminder created.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *   delete:
 *     summary: Delete a reminder
 *     tags:
 *       - Reminders
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
 *               - reminderTime
 *             properties:
 *               taskId:
 *                 type: string
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Reminder deleted.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */
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

    // Verify the task belongs to the user
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);
    if (taskExists.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const reminderTimes = await getRemindersByTaskId(taskId);
    return NextResponse.json(reminderTimes);
  } catch (error) {
    logger.error('Error fetching reminders', { error });
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { taskId, reminderTime } = parsed.data;

    // Verify the task belongs to the user
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);
    if (taskExists.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await createReminder(taskId, reminderTime);
    logger.info('Reminder created', { taskId, reminderTime, userId: session.user.id });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error('Error creating reminder', { error });
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = DeleteReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { taskId, reminderTime } = parsed.data;

    // Verify the task belongs to the user
    const taskExists = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);
    if (taskExists.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await deleteReminder(taskId, reminderTime);
    logger.info('Reminder deleted', { taskId, reminderTime, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting reminder', { error });
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}

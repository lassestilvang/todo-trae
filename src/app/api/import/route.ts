import { NextRequest, NextResponse } from 'next/server';
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
import { z } from 'zod';

const ImportDataSchema = z.object({
  version: z.string().optional(),
  data: z.object({
    lists: z.array(z.any()).optional(),
    labels: z.array(z.any()).optional(),
    tasks: z.array(z.any()).optional(),
    subtasks: z.array(z.any()).optional(),
    taskLabels: z.array(z.any()).optional(),
    taskTemplates: z.array(z.any()).optional(),
    reminders: z.array(z.any()).optional(),
    taskDependencies: z.array(z.any()).optional(),
  }),
});

/**
 * @swagger
 * /api/import:
 *   post:
 *     summary: Import user data from JSON
 *     tags:
 *       - Import
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   lists:
 *                     type: array
 *                   labels:
 *                     type: array
 *                   tasks:
 *                     type: array
 *                   subtasks:
 *                     type: array
 *                   taskLabels:
 *                     type: array
 *                   taskTemplates:
 *                     type: array
 *                   reminders:
 *                     type: array
 *                   taskDependencies:
 *                     type: array
 *     responses:
 *       200:
 *         description: Data imported successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: object
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

    const userId = session.user.id;
    const body = await request.json();

    const parsed = ImportDataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data } = parsed.data;
    const imported = {
      lists: 0,
      labels: 0,
      tasks: 0,
      subtasks: 0,
      taskLabels: 0,
      templates: 0,
      reminders: 0,
      dependencies: 0,
    };

    await db.transaction(async (tx) => {
      // Import lists
      if (data.lists && data.lists.length > 0) {
        for (const list of data.lists) {
          await tx
            .insert(taskLists)
            .values({
              ...list,
              userId,
            })
            .onConflictDoUpdate({
              target: taskLists.id,
              set: { name: list.name, color: list.color, emoji: list.emoji },
            });
          imported.lists++;
        }
      }

      // Import labels
      if (data.labels && data.labels.length > 0) {
        for (const label of data.labels) {
          await tx
            .insert(labels)
            .values({
              ...label,
              userId,
            })
            .onConflictDoUpdate({
              target: labels.id,
              set: { name: label.name, color: label.color, icon: label.icon },
            });
          imported.labels++;
        }
      }

      // Import tasks
      if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
          await tx
            .insert(tasks)
            .values({
              ...task,
              userId,
            })
            .onConflictDoUpdate({
              target: tasks.id,
              set: {
                name: task.name,
                description: task.description,
                completed: task.completed,
                priority: task.priority,
                deadline: task.deadline,
                date: task.date,
                order: task.order,
              },
            });
          imported.tasks++;
        }
      }

      // Import subtasks
      if (data.subtasks && data.subtasks.length > 0) {
        for (const subtask of data.subtasks) {
          await tx
            .insert(subtasks)
            .values(subtask)
            .onConflictDoUpdate({
              target: subtasks.id,
              set: { name: subtask.name, completed: subtask.completed, order: subtask.order },
            });
          imported.subtasks++;
        }
      }

      // Import task labels
      if (data.taskLabels && data.taskLabels.length > 0) {
        for (const tl of data.taskLabels) {
          await tx.insert(taskLabels).values(tl).onConflictDoNothing();
          imported.taskLabels++;
        }
      }

      // Import templates
      if (data.taskTemplates && data.taskTemplates.length > 0) {
        for (const template of data.taskTemplates) {
          await tx
            .insert(taskTemplates)
            .values({
              ...template,
              userId,
            })
            .onConflictDoUpdate({
              target: taskTemplates.id,
              set: {
                name: template.name,
                description: template.description,
                priority: template.priority,
                estimate: template.estimate,
                listId: template.listId,
              },
            });
          imported.templates++;
        }
      }

      // Import reminders
      if (data.reminders && data.reminders.length > 0) {
        for (const reminder of data.reminders) {
          await tx.insert(reminders).values(reminder).onConflictDoNothing();
          imported.reminders++;
        }
      }

      // Import dependencies
      if (data.taskDependencies && data.taskDependencies.length > 0) {
        for (const dep of data.taskDependencies) {
          await tx.insert(taskDependencies).values(dep).onConflictDoNothing();
          imported.dependencies++;
        }
      }
    });

    logger.info('User data imported', { userId, imported });

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    logger.error('Error importing user data', { error });
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}

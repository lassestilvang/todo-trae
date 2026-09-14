import { db } from '@/db';
import {
  taskLists,
  tasks,
  labels,
  subtasks,
  taskLabels,
  activityLog,
  reminders,
  taskDependencies,
  attachments,
} from '@/db/schema';
import {
  Task,
  TaskList,
  Label,
  Subtask,
  ActivityLog,
  Priority,
  RecurringType,
  TaskDependency,
  Attachment,
} from '@/types';
import { logger } from './logger';
import { eq, and, isNull, asc, desc, inArray, or } from 'drizzle-orm';
import { calculateNextRecurringDate as _calculateNextRecurringDate } from './recurring';

// Helper to map DB row to TaskList type
export function mapTaskList(row: typeof taskLists.$inferSelect): TaskList {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    isDefault: !!row.isDefault,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// Helper to map DB row to Label type
export function mapLabel(row: typeof labels.$inferSelect): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// Helper to map DB row to Task type (with optional reminders and dependencies)
export type TaskRow = typeof tasks.$inferSelect & {
  taskLabels: Array<typeof taskLabels.$inferSelect & { label: typeof labels.$inferSelect }>;
};

export function mapTask(
  row: TaskRow,
  options?: { reminders?: Date[]; dependencies?: TaskDependency[] }
): Task {
  return {
    ...row,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
    date: row.date || undefined,
    deadline: row.deadline || undefined,
    completed: !!row.completed,
    completedAt: row.completedAt || undefined,
    recurringEndDate: row.recurringEndDate || undefined,
    description: row.description || undefined,
    estimate: row.estimate || undefined,
    actualTime: row.actualTime || undefined,
    parentTaskId: row.parentTaskId || undefined,
    userId: row.userId || undefined,
    order: row.order || 0,
    priority: (row.priority || 'none') as Priority,
    recurring: (row.recurring || undefined) as RecurringType | undefined,
    labels: row.taskLabels.map((tl) => mapLabel(tl.label)),
    reminders: options?.reminders ?? [],
    dependencies: options?.dependencies,
  };
}

// Task List operations
export async function getAllLists(userId: string): Promise<TaskList[]> {
  const results = await db
    .select()
    .from(taskLists)
    .where(eq(taskLists.userId, userId))
    .orderBy(desc(taskLists.isDefault), asc(taskLists.name));
  return results.map(mapTaskList);
}

export async function getListById(id: string, userId: string): Promise<TaskList | null> {
  const results = await db
    .select()
    .from(taskLists)
    .where(and(eq(taskLists.id, id), eq(taskLists.userId, userId)))
    .limit(1);
  if (results.length === 0) return null;
  return mapTaskList(results[0]);
}

export async function createList(
  list: Omit<TaskList, 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<TaskList> {
  try {
    await db.insert(taskLists).values({
      id: list.id,
      name: list.name,
      color: list.color,
      emoji: list.emoji,
      isDefault: list.isDefault,
      userId,
    });
    logger.info('Task list created', { listId: list.id, name: list.name, userId });
    return (await getListById(list.id, userId))!;
  } catch (error) {
    logger.error('Failed to create task list', { error, list, userId });
    throw error;
  }
}

export async function updateList(
  id: string,
  userId: string,
  updates: Partial<TaskList>
): Promise<TaskList> {
  const dbUpdates: Partial<typeof taskLists.$inferInsert> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
  if (updates.isDefault !== undefined) dbUpdates.isDefault = updates.isDefault;
  dbUpdates.updatedAt = new Date();

  await db
    .update(taskLists)
    .set(dbUpdates)
    .where(and(eq(taskLists.id, id), eq(taskLists.userId, userId)));
  return (await getListById(id, userId))!;
}

export async function deleteList(id: string, userId: string): Promise<void> {
  try {
    await db.delete(taskLists).where(and(eq(taskLists.id, id), eq(taskLists.userId, userId)));
    logger.info('Task list deleted', { listId: id, userId });
  } catch (error) {
    logger.error('Failed to delete task list', { error, listId: id, userId });
    throw error;
  }
}

// Label operations
export async function getAllLabels(userId: string): Promise<Label[]> {
  const results = await db
    .select()
    .from(labels)
    .where(eq(labels.userId, userId))
    .orderBy(asc(labels.name));
  return results.map(mapLabel);
}

export async function getLabelById(id: string, userId: string): Promise<Label | null> {
  const results = await db
    .select()
    .from(labels)
    .where(and(eq(labels.id, id), eq(labels.userId, userId)))
    .limit(1);
  if (results.length === 0) return null;
  return mapLabel(results[0]);
}

export async function createLabel(
  label: Omit<Label, 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<Label> {
  await db.insert(labels).values({
    id: label.id,
    userId,
    name: label.name,
    color: label.color,
    icon: label.icon,
  });
  return (await getLabelById(label.id, userId))!;
}

export async function updateLabel(
  id: string,
  userId: string,
  updates: Partial<Label>
): Promise<Label> {
  const dbUpdates: Partial<typeof labels.$inferInsert> = {
    ...updates,
    updatedAt: new Date(),
  };
  await db
    .update(labels)
    .set(dbUpdates)
    .where(and(eq(labels.id, id), eq(labels.userId, userId)));
  return (await getLabelById(id, userId))!;
}

export async function deleteLabel(id: string, userId: string): Promise<void> {
  await db.delete(labels).where(and(eq(labels.id, id), eq(labels.userId, userId)));
}

// Task operations
export async function getAllTasks(
  userId: string,
  limit?: number,
  offset?: number
): Promise<Task[]> {
  const results = await db.query.tasks.findMany({
    where: eq(tasks.userId, userId),
    with: {
      taskLabels: {
        with: {
          label: true,
        },
      },
    },
    orderBy: [asc(tasks.completed), asc(tasks.order), desc(tasks.createdAt)],
    limit,
    offset,
  });

  if (results.length === 0) return [];

  // Batch-fetch all reminders for all tasks in a single query (avoids N+1)
  const taskIds = results.map((r) => r.id);
  const reminderResults = await db
    .select()
    .from(reminders)
    .where(inArray(reminders.taskId, taskIds))
    .orderBy(asc(reminders.reminderTime));
  const remindersByTaskId = new Map<string, Date[]>();
  for (const r of reminderResults) {
    if (!remindersByTaskId.has(r.taskId)) {
      remindersByTaskId.set(r.taskId, []);
    }
    remindersByTaskId.get(r.taskId)!.push(r.reminderTime);
  }

  return results.map((row) => mapTask(row, { reminders: remindersByTaskId.get(row.id) || [] }));
}

export async function getTasksByListId(
  listId: string,
  userId: string,
  limit?: number,
  offset?: number
): Promise<Task[]> {
  const results = await db.query.tasks.findMany({
    where: and(eq(tasks.listId, listId), eq(tasks.userId, userId), isNull(tasks.parentTaskId)),
    with: {
      taskLabels: {
        with: {
          label: true,
        },
      },
    },
    orderBy: [asc(tasks.completed), asc(tasks.order), desc(tasks.createdAt)],
    limit,
    offset,
  });

  if (results.length === 0) return [];

  // Batch-fetch all reminders (avoids N+1 query pattern)
  const taskIds = results.map((r) => r.id);
  const reminderResults = await db
    .select()
    .from(reminders)
    .where(inArray(reminders.taskId, taskIds))
    .orderBy(asc(reminders.reminderTime));
  const remindersByTaskId = new Map<string, Date[]>();
  for (const r of reminderResults) {
    if (!remindersByTaskId.has(r.taskId)) {
      remindersByTaskId.set(r.taskId, []);
    }
    remindersByTaskId.get(r.taskId)!.push(r.reminderTime);
  }

  return results.map((row) => mapTask(row, { reminders: remindersByTaskId.get(row.id) || [] }));
}

export async function getTaskById(id: string, userId: string): Promise<Task | null> {
  const row = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
    with: {
      taskLabels: {
        with: {
          label: true,
        },
      },
    },
  });

  if (!row) return null;

  const taskReminders = await getRemindersByTaskId(id);
  const taskDeps = await getTaskDependencies(id, userId);

  return mapTask(row, { reminders: taskReminders, dependencies: taskDeps });
}

export async function createTask(
  task: Omit<Task, 'createdAt' | 'updatedAt' | 'subtasks' | 'attachments'> & { labelIds?: string[] }
): Promise<Task> {
  if (!task.userId) throw new Error('userId is required to create a task');

  await db.insert(tasks).values({
    id: task.id,
    listId: task.listId,
    userId: task.userId,
    name: task.name,
    description: task.description,
    date: task.date,
    deadline: task.deadline,
    estimate: task.estimate,
    actualTime: task.actualTime,
    priority: task.priority,
    completed: task.completed,
    recurring: task.recurring,
    recurringEndDate: task.recurringEndDate,
    parentTaskId: task.parentTaskId,
    order: task.order,
  });

  const labelIds = task.labelIds || (task.labels as Label[])?.map((l) => l.id) || [];
  if (labelIds.length > 0) {
    await db.insert(taskLabels).values(
      labelIds.map((labelId) => ({
        taskId: task.id,
        labelId,
      }))
    );
  }

  return (await getTaskById(task.id, task.userId))!;
}

export async function updateTask(
  id: string,
  userId: string,
  updates: Partial<Task> & { labelIds?: string[] }
): Promise<Task> {
  const dbUpdates: Partial<typeof tasks.$inferInsert> = {};

  if (updates.listId !== undefined) dbUpdates.listId = updates.listId;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.estimate !== undefined) dbUpdates.estimate = updates.estimate;
  if (updates.actualTime !== undefined) dbUpdates.actualTime = updates.actualTime;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
  if (updates.completedAt !== undefined) {
    dbUpdates.completedAt = updates.completedAt;
  }
  if (updates.recurring !== undefined) dbUpdates.recurring = updates.recurring;
  if (updates.recurringEndDate !== undefined) dbUpdates.recurringEndDate = updates.recurringEndDate;
  if (updates.parentTaskId !== undefined) dbUpdates.parentTaskId = updates.parentTaskId;
  if (updates.order !== undefined) dbUpdates.order = updates.order;

  dbUpdates.updatedAt = new Date();

  if (Object.keys(dbUpdates).length > 0) {
    await db
      .update(tasks)
      .set(dbUpdates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  const labelIds = updates.labelIds || updates.labels?.map((l) => l.id);
  if (labelIds) {
    await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
    if (labelIds.length > 0) {
      await db.insert(taskLabels).values(
        labelIds.map((labelId) => ({
          taskId: id,
          labelId,
        }))
      );
    }
  }

  return (await getTaskById(id, userId))!;
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function toggleTaskComplete(id: string, userId: string): Promise<Task> {
  const task = await getTaskById(id, userId);
  if (!task) throw new Error('Task not found');

  // When completing a recurring task, generate the next instance
  if (!task.completed && task.recurring) {
    const nextDate = calculateNextRecurringDate(task);
    if (nextDate && (!task.recurringEndDate || nextDate <= task.recurringEndDate)) {
      const originalBase = task.date || task.deadline || new Date();
      const timeOffset = originalBase.getTime() - new Date(originalBase).setHours(0, 0, 0, 0);
      const nextDateWithTime = new Date(nextDate.getTime() + timeOffset);

      // Calculate next deadline maintaining the same time offset from base date
      let nextDeadline: Date | undefined;
      if (task.deadline) {
        nextDeadline = new Date(nextDateWithTime);
        nextDeadline.setHours(task.deadline.getHours(), task.deadline.getMinutes(), 0, 0);
      }

      await createTask({
        id: crypto.randomUUID(),
        name: task.name,
        description: task.description,
        listId: task.listId,
        date: nextDateWithTime,
        deadline: nextDeadline,
        estimate: task.estimate,
        priority: task.priority,
        completed: false,
        recurring: task.recurring,
        recurringEndDate: task.recurringEndDate,
        parentTaskId: undefined,
        order: task.order,
        userId,
        labelIds: task.labels?.map((l) => l.id) || [],
        reminders: [],
      });
    }
  }

  const updates = {
    completed: !task.completed,
    completedAt: !task.completed ? new Date() : null,
  };

  return updateTask(id, userId, updates as Partial<Task>);
}

/**
 * Calculate the next date for a recurring task based on its recurrence type.
 * Re-exports the pure implementation from src/lib/recurring.ts.
 */
export function calculateNextRecurringDate(task: Task): Date | null {
  return _calculateNextRecurringDate(
    task.date,
    task.deadline,
    task.recurring,
    task.recurringEndDate
  );
}

// Subtask operations
export async function getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
  const results = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(asc(subtasks.order));
  return results.map((row) => ({
    ...row,
    completed: !!row.completed,
    order: row.order || 0,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  }));
}

export async function getSubtaskById(id: string): Promise<Subtask | null> {
  const results = await db.select().from(subtasks).where(eq(subtasks.id, id)).limit(1);
  if (results.length === 0) return null;
  const row = results[0];
  return {
    ...row,
    completed: !!row.completed,
    order: row.order || 0,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

export async function createSubtask(
  subtask: Omit<Subtask, 'createdAt' | 'updatedAt'>
): Promise<Subtask> {
  await db.insert(subtasks).values({
    id: subtask.id,
    taskId: subtask.taskId,
    name: subtask.name,
    completed: subtask.completed,
    order: subtask.order,
  });
  return (await getSubtaskById(subtask.id))!;
}

export async function updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask> {
  const dbUpdates: Partial<typeof subtasks.$inferInsert> = {
    ...updates,
    updatedAt: new Date(),
  };
  await db.update(subtasks).set(dbUpdates).where(eq(subtasks.id, id));
  return (await getSubtaskById(id))!;
}

export async function deleteSubtask(id: string): Promise<void> {
  await db.delete(subtasks).where(eq(subtasks.id, id));
}

// Attachment operations
export async function getAttachmentsByTaskId(taskId: string): Promise<Attachment[]> {
  const results = await db
    .select()
    .from(attachments)
    .where(eq(attachments.taskId, taskId))
    .orderBy(asc(attachments.createdAt));
  return results.map((row) => ({
    ...row,
    createdAt: row.createdAt || new Date(),
  }));
}

export async function createAttachment(
  attachment: Omit<Attachment, 'createdAt'>
): Promise<Attachment> {
  await db.insert(attachments).values({
    id: attachment.id,
    taskId: attachment.taskId,
    filename: attachment.filename,
    filePath: attachment.filePath,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
  });
  logger.info('Attachment created', { taskId: attachment.taskId, filename: attachment.filename });
  return { ...attachment, createdAt: new Date() };
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.delete(attachments).where(eq(attachments.id, id));
  logger.info('Attachment deleted', { attachmentId: id });
}

// Attachment download path resolver — returns the URL path for downloading a file
export function getAttachmentUrl(filePath: string): string {
  // In production, this could point to an S3/CDN URL
  // For local storage, it's a path relative to /public
  return filePath.startsWith('/uploads/') ? filePath : `/uploads/${filePath}`;
}

// Batch task reordering
export async function reorderTasks(
  userId: string,
  listId: string,
  orderedIds: string[]
): Promise<void> {
  // Wrap sequential updates in a transaction for atomicity
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(tasks)
        .set({ order: i })
        .where(and(eq(tasks.id, orderedIds[i]), eq(tasks.userId, userId)));
    }
  });

  logger.info('Tasks reordered', { listId, count: orderedIds.length, userId });
}

// Reminder operations
export async function getRemindersByTaskId(taskId: string): Promise<Date[]> {
  const results = await db
    .select()
    .from(reminders)
    .where(eq(reminders.taskId, taskId))
    .orderBy(asc(reminders.reminderTime));
  return results.map((r) => r.reminderTime);
}

export async function createReminder(taskId: string, reminderTime: Date): Promise<void> {
  await db.insert(reminders).values({
    id: crypto.randomUUID(),
    taskId,
    reminderTime,
  });
}

export async function deleteReminder(taskId: string, reminderTime: Date): Promise<void> {
  await db
    .delete(reminders)
    .where(and(eq(reminders.taskId, taskId), eq(reminders.reminderTime, reminderTime)));
}

export async function deleteAllRemindersForTask(taskId: string): Promise<void> {
  await db.delete(reminders).where(eq(reminders.taskId, taskId));
}

// Bulk operations
export async function bulkUpdateTasks(
  userId: string,
  taskIds: string[],
  updates: Partial<Task> & { labelIds?: string[] }
): Promise<Task[]> {
  // Separate labelIds from scalar field updates
  const { labelIds, ...fieldUpdates } = updates;

  // Build a single DB update payload from non-label fields
  const dbUpdates: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (fieldUpdates.listId !== undefined) dbUpdates.listId = fieldUpdates.listId;
  if (fieldUpdates.name !== undefined) dbUpdates.name = fieldUpdates.name;
  if (fieldUpdates.description !== undefined) dbUpdates.description = fieldUpdates.description;
  if (fieldUpdates.date !== undefined) dbUpdates.date = fieldUpdates.date;
  if (fieldUpdates.deadline !== undefined) dbUpdates.deadline = fieldUpdates.deadline;
  if (fieldUpdates.estimate !== undefined) dbUpdates.estimate = fieldUpdates.estimate;
  if (fieldUpdates.actualTime !== undefined) dbUpdates.actualTime = fieldUpdates.actualTime;
  if (fieldUpdates.priority !== undefined) dbUpdates.priority = fieldUpdates.priority;
  if (fieldUpdates.completed !== undefined) dbUpdates.completed = fieldUpdates.completed;
  if (fieldUpdates.completedAt !== undefined) dbUpdates.completedAt = fieldUpdates.completedAt;
  if (fieldUpdates.recurring !== undefined) dbUpdates.recurring = fieldUpdates.recurring;
  if (fieldUpdates.recurringEndDate !== undefined)
    dbUpdates.recurringEndDate = fieldUpdates.recurringEndDate;
  if (fieldUpdates.parentTaskId !== undefined) dbUpdates.parentTaskId = fieldUpdates.parentTaskId;
  if (fieldUpdates.order !== undefined) dbUpdates.order = fieldUpdates.order;

  // Single batch update instead of N sequential queries
  const scalarKeys = Object.keys(dbUpdates).filter((k) => k !== 'updatedAt');
  if (scalarKeys.length > 0) {
    await db
      .update(tasks)
      .set(dbUpdates)
      .where(and(inArray(tasks.id, taskIds), eq(tasks.userId, userId)));
  }

  // Handle label assignment as a separate batch operation
  if (labelIds) {
    await db.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds));
    if (labelIds.length > 0) {
      await db
        .insert(taskLabels)
        .values(
          taskIds.flatMap((taskId: string) =>
            labelIds.map((labelId: string) => ({ taskId, labelId }))
          )
        );
    }
  }

  // Fetch and return the updated tasks in a single query
  const results = await db.query.tasks.findMany({
    where: and(inArray(tasks.id, taskIds), eq(tasks.userId, userId)),
    with: {
      taskLabels: { with: { label: true } },
    },
  });

  // Batch-fetch reminders for all updated tasks (avoids N+1)
  const reminderResults = await db
    .select()
    .from(reminders)
    .where(
      inArray(
        reminders.taskId,
        results.map((r) => r.id)
      )
    )
    .orderBy(asc(reminders.reminderTime));
  const remindersByTaskId = new Map<string, Date[]>();
  for (const r of reminderResults) {
    if (!remindersByTaskId.has(r.taskId)) {
      remindersByTaskId.set(r.taskId, []);
    }
    remindersByTaskId.get(r.taskId)!.push(r.reminderTime);
  }

  logger.info('Bulk updated tasks', { count: taskIds.length, action: 'bulk-update', userId });
  return results.map((row) => mapTask(row, { reminders: remindersByTaskId.get(row.id) || [] }));
}

export async function bulkDeleteTasks(userId: string, taskIds: string[]): Promise<void> {
  // Fetch task names for activity logging before deletion
  const tasksToDelete = await db
    .select({ id: tasks.id, name: tasks.name })
    .from(tasks)
    .where(and(inArray(tasks.id, taskIds), eq(tasks.userId, userId)));

  // Log activity for each task being deleted
  for (const task of tasksToDelete) {
    await createActivityLog({
      id: crypto.randomUUID(),
      taskId: task.id,
      action: 'deleted',
      userId,
    });
  }

  // Single batch delete — DB-level cascade handles subtasks, labels, reminders,
  // dependencies, and attachments
  await db.delete(tasks).where(and(inArray(tasks.id, taskIds), eq(tasks.userId, userId)));

  logger.info('Bulk deleted tasks', { count: tasksToDelete.length, userId });
}

export async function bulkAssignLabels(
  userId: string,
  taskIds: string[],
  labelIds: string[]
): Promise<void> {
  // Batch delete existing labels for all tasks, then insert new ones
  await db.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds));
  if (labelIds.length > 0) {
    await db
      .insert(taskLabels)
      .values(
        taskIds.flatMap((taskId: string) =>
          labelIds.map((labelId: string) => ({ taskId, labelId }))
        )
      );
  }

  logger.info('Bulk assigned labels', {
    count: taskIds.length,
    labelCount: labelIds.length,
    userId,
  });
}

// Task dependency operations
export async function getTaskDependencies(
  taskId: string,
  userId: string
): Promise<TaskDependency[]> {
  const results = await db
    .select()
    .from(taskDependencies)
    .where(and(eq(taskDependencies.taskId, taskId), eq(tasks.userId, userId)))
    .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id));
  return results.map((r) => ({
    id: r.task_dependencies.id,
    taskId: r.task_dependencies.taskId,
    dependsOnTaskId: r.task_dependencies.dependsOnTaskId,
    createdAt: r.task_dependencies.createdAt || new Date(),
  }));
}

export async function getDependentTasks(taskId: string, userId: string): Promise<Task[]> {
  // Get tasks that depend on this task (i.e., this task is a prerequisite),
  // verified to belong to the user in the same query to avoid leaking
  // dependency existence for tasks we don't own.
  const depResults = await db
    .select({ dependentTaskId: taskDependencies.taskId })
    .from(taskDependencies)
    .innerJoin(tasks, eq(tasks.id, taskDependencies.dependsOnTaskId))
    .where(and(eq(taskDependencies.dependsOnTaskId, taskId), eq(tasks.userId, userId)));

  const taskIds = depResults.map((r) => r.dependentTaskId);
  if (taskIds.length === 0) return [];

  const rawTasks = await db.query.tasks.findMany({
    where: and(inArray(tasks.id, taskIds), eq(tasks.userId, userId)),
    with: {
      taskLabels: { with: { label: true } },
    },
  });
  // Batch-fetch reminders for all dependent tasks
  const reminderResults = await db
    .select()
    .from(reminders)
    .where(inArray(reminders.taskId, taskIds))
    .orderBy(asc(reminders.reminderTime));
  const remindersByTaskId = new Map<string, Date[]>();
  for (const r of reminderResults) {
    if (!remindersByTaskId.has(r.taskId)) {
      remindersByTaskId.set(r.taskId, []);
    }
    remindersByTaskId.get(r.taskId)!.push(r.reminderTime);
  }

  return rawTasks.map((row) => mapTask(row, { reminders: remindersByTaskId.get(row.id) || [] }));
}

export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  userId: string
): Promise<TaskDependency> {
  // Verify both tasks belong to the user
  const userTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(inArray(tasks.id, [taskId, dependsOnTaskId]), eq(tasks.userId, userId)));
  if (userTasks.length !== 2) {
    throw new Error('One or both tasks not found or not owned by user');
  }

  // Prevent self-dependency
  if (taskId === dependsOnTaskId) {
    throw new Error('Task cannot depend on itself');
  }

  // Check for circular dependency: if taskId already (transitively) depends on
  // dependsOnTaskId, then adding taskId → dependsOnTaskId would create a cycle.
  // We start from dependsOnTaskId and follow the chain to see if we reach taskId.
  if (await hasCircularDependency(taskId, dependsOnTaskId)) {
    throw new Error('Circular dependency detected');
  }

  const id = crypto.randomUUID();
  await db.insert(taskDependencies).values({
    id,
    taskId,
    dependsOnTaskId,
  });

  logger.info('Task dependency added', { taskId, dependsOnTaskId, userId });
  return { id, taskId, dependsOnTaskId, createdAt: new Date() };
}

export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  userId: string
): Promise<void> {
  await db
    .delete(taskDependencies)
    .where(
      and(
        eq(taskDependencies.taskId, taskId),
        eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
      )
    );
  logger.info('Task dependency removed', { taskId, dependsOnTaskId, userId });
}

/**
 * Create the next instance of a recurring task.
 * Called when a recurring task is marked complete.
 */
export async function generateNextRecurringTask(task: Task, userId: string): Promise<Task | null> {
  const nextDate = calculateNextRecurringDate(task);
  if (!nextDate) return null;

  // Check if we've passed the recurring end date
  if (task.recurringEndDate && nextDate > task.recurringEndDate) {
    return null;
  }

  const originalBase = task.date || task.deadline || new Date();
  const timeOffset = originalBase.getTime() - new Date(originalBase).setHours(0, 0, 0, 0);

  const nextDateWithTime = new Date(nextDate.getTime() + timeOffset);

  const nextTaskId = crypto.randomUUID();
  const taskData = {
    id: nextTaskId,
    name: task.name,
    description: task.description,
    listId: task.listId,
    date: nextDateWithTime,
    deadline: task.deadline
      ? new Date(
          nextDateWithTime.getTime() +
            (task.deadline.getTime() - (task.date?.getTime() || task.deadline.getTime()))
        )
      : undefined,
    estimate: task.estimate,
    actualTime: undefined,
    priority: task.priority,
    completed: false,
    completedAt: undefined,
    recurring: task.recurring,
    recurringEndDate: task.recurringEndDate,
    parentTaskId: undefined,
    order: task.order,
    userId,
    labelIds: task.labels?.map((l) => l.id) || [],
    createdAt: undefined as Date | undefined,
    updatedAt: undefined as Date | undefined,
    reminders: [] as Date[],
    subtasks: undefined,
    attachments: undefined,
    dependencies: undefined,
  };

  const nextTask = await createTask(taskData);
  return nextTask;
}

export async function removeAllTaskDependencies(taskId: string, userId: string): Promise<void> {
  // Verify the task belongs to the user before deleting its dependencies
  const taskCheck = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);
  if (taskCheck.length === 0) return;

  // Remove dependencies where this task is the dependent or the prerequisite
  await db
    .delete(taskDependencies)
    .where(or(eq(taskDependencies.taskId, taskId), eq(taskDependencies.dependsOnTaskId, taskId)));
}

async function hasCircularDependency(fromTaskId: string, toTaskId: string): Promise<boolean> {
  // Check if toTaskId can reach fromTaskId through dependency chain
  const visited = new Set<string>();
  const queue: string[] = [toTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === fromTaskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = await db
      .select({ dependsOnTaskId: taskDependencies.dependsOnTaskId })
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, current));
    for (const dep of deps) {
      queue.push(dep.dependsOnTaskId);
    }
  }
  return false;
}

// Activity log operations
export async function getAllActivityLogs(
  userId: string,
  limit?: number,
  offset?: number
): Promise<ActivityLog[]> {
  const results = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit || 100)
    .offset(offset || 0);
  return results.map((row) => ({
    ...row,
    action: row.action as ActivityLog['action'],
    taskId: row.taskId || undefined,
    listId: row.listId || undefined,
    labelId: row.labelId || undefined,
    field: row.field || undefined,
    oldValue: row.oldValue || undefined,
    newValue: row.newValue || undefined,
    userId: row.userId || undefined,
    createdAt: row.createdAt || new Date(),
  }));
}

export async function getActivityLogByTaskId(
  taskId: string,
  userId: string,
  limit?: number,
  offset?: number
): Promise<ActivityLog[]> {
  const results = await db
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.taskId, taskId), eq(activityLog.userId, userId)))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit || 100)
    .offset(offset || 0);
  return results.map((row) => ({
    ...row,
    action: row.action as ActivityLog['action'],
    taskId: row.taskId || undefined,
    listId: row.listId || undefined,
    labelId: row.labelId || undefined,
    field: row.field || undefined,
    oldValue: row.oldValue || undefined,
    newValue: row.newValue || undefined,
    userId: row.userId || undefined,
    createdAt: row.createdAt || new Date(),
  }));
}

export async function createActivityLog(log: Omit<ActivityLog, 'createdAt'>): Promise<ActivityLog> {
  await db.insert(activityLog).values({
    id: log.id,
    taskId: log.taskId,
    listId: log.listId,
    labelId: log.labelId,
    action: log.action,
    field: log.field,
    oldValue: log.oldValue,
    newValue: log.newValue,
    userId: log.userId,
  });
  return { ...log, createdAt: new Date() };
}

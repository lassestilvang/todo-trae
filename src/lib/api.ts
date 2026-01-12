import { db } from '@/db';
import { taskLists, tasks, labels, subtasks, taskLabels, activityLog } from '@/db/schema';
import { Task, TaskList, Label, Subtask, ActivityLog, Priority, RecurringType } from '@/types';
import { logger } from './logger';
import { eq, and, isNull, asc, desc } from 'drizzle-orm';

// Helper to map DB row to TaskList type
function mapTaskList(row: typeof taskLists.$inferSelect): TaskList {
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
function mapLabel(row: typeof labels.$inferSelect): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// Task List operations
export async function getAllLists(): Promise<TaskList[]> {
  const results = await db.select().from(taskLists).orderBy(desc(taskLists.isDefault), asc(taskLists.name));
  return results.map(mapTaskList);
}

export async function getListById(id: string): Promise<TaskList | null> {
  const results = await db.select().from(taskLists).where(eq(taskLists.id, id)).limit(1);
  if (results.length === 0) return null;
  return mapTaskList(results[0]);
}

export async function createList(list: Omit<TaskList, 'createdAt' | 'updatedAt'>): Promise<TaskList> {
  try {
    await db.insert(taskLists).values({
      id: list.id,
      name: list.name,
      color: list.color,
      emoji: list.emoji,
      isDefault: list.isDefault,
    });
    logger.info('Task list created', { listId: list.id, name: list.name });
    return (await getListById(list.id))!;
  } catch (error) {
    logger.error('Failed to create task list', { error, list });
    throw error;
  }
}

export async function updateList(id: string, updates: Partial<TaskList>): Promise<TaskList> {
  const dbUpdates: Partial<typeof taskLists.$inferInsert> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
  if (updates.isDefault !== undefined) dbUpdates.isDefault = updates.isDefault;
  dbUpdates.updatedAt = new Date();

  await db.update(taskLists).set(dbUpdates).where(eq(taskLists.id, id));
  return (await getListById(id))!;
}

export async function deleteList(id: string): Promise<void> {
  try {
    await db.delete(taskLists).where(eq(taskLists.id, id));
    logger.info('Task list deleted', { listId: id });
  } catch (error) {
    logger.error('Failed to delete task list', { error, listId: id });
    throw error;
  }
}

// Label operations
export async function getAllLabels(): Promise<Label[]> {
  const results = await db.select().from(labels).orderBy(asc(labels.name));
  return results.map(mapLabel);
}

export async function getLabelById(id: string): Promise<Label | null> {
  const results = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
  if (results.length === 0) return null;
  return mapLabel(results[0]);
}

export async function createLabel(label: Omit<Label, 'createdAt' | 'updatedAt'>): Promise<Label> {
  await db.insert(labels).values({
    id: label.id,
    name: label.name,
    color: label.color,
    icon: label.icon,
  });
  return (await getLabelById(label.id))!;
}

export async function updateLabel(id: string, updates: Partial<Label>): Promise<Label> {
  const dbUpdates: Partial<typeof labels.$inferInsert> = {
    ...updates,
    updatedAt: new Date(),
  };
  await db.update(labels).set(dbUpdates).where(eq(labels.id, id));
  return (await getLabelById(id))!;
}

export async function deleteLabel(id: string): Promise<void> {
  await db.delete(labels).where(eq(labels.id, id));
}

// Task operations
export async function getAllTasks(limit?: number, offset?: number): Promise<Task[]> {
  const results = await db.query.tasks.findMany({
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

  return results.map(row => ({
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
    order: row.order || 0,
    priority: (row.priority || 'none') as Priority,
    recurring: (row.recurring || undefined) as RecurringType | undefined,
    labels: row.taskLabels.map(tl => mapLabel(tl.label)),
    reminders: [], // Reminders not implemented in mapping yet
  }));
}

export async function getTasksByListId(listId: string, limit?: number, offset?: number): Promise<Task[]> {
  const results = await db.query.tasks.findMany({
    where: and(eq(tasks.listId, listId), isNull(tasks.parentTaskId)),
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

  return results.map(row => ({
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
    order: row.order || 0,
    priority: (row.priority || 'none') as Priority,
    recurring: (row.recurring || undefined) as RecurringType | undefined,
    labels: row.taskLabels.map(tl => mapLabel(tl.label)),
    reminders: [],
  }));
}

export async function getTaskById(id: string): Promise<Task | null> {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      taskLabels: {
        with: {
          label: true,
        },
      },
    },
  });

  if (!row) return null;

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
    order: row.order || 0,
    priority: (row.priority || 'none') as Priority,
    recurring: (row.recurring || undefined) as RecurringType | undefined,
    labels: row.taskLabels.map(tl => mapLabel(tl.label)),
    reminders: [],
  };
}

export async function createTask(task: Omit<Task, 'createdAt' | 'updatedAt' | 'subtasks' | 'attachments'> & { labelIds?: string[] }): Promise<Task> {
  await db.insert(tasks).values({
    id: task.id,
    listId: task.listId,
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

  const labelIds = task.labelIds || (task.labels as Label[])?.map(l => l.id) || [];
  if (labelIds.length > 0) {
    await db.insert(taskLabels).values(
      labelIds.map(labelId => ({
        taskId: task.id,
        labelId,
      }))
    );
  }

  return (await getTaskById(task.id))!;
}

export async function updateTask(id: string, updates: Partial<Task> & { labelIds?: string[] }): Promise<Task> {
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
    dbUpdates.completedAt = updates.completedAt === undefined ? null : updates.completedAt;
  }
  if (updates.recurring !== undefined) dbUpdates.recurring = updates.recurring;
  if (updates.recurringEndDate !== undefined) dbUpdates.recurringEndDate = updates.recurringEndDate;
  if (updates.parentTaskId !== undefined) dbUpdates.parentTaskId = updates.parentTaskId;
  if (updates.order !== undefined) dbUpdates.order = updates.order;
  
  dbUpdates.updatedAt = new Date();

  if (Object.keys(dbUpdates).length > 0) {
    await db.update(tasks).set(dbUpdates).where(eq(tasks.id, id));
  }

  const labelIds = updates.labelIds || updates.labels?.map(l => l.id);
  if (labelIds) {
    await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
    if (labelIds.length > 0) {
      await db.insert(taskLabels).values(
        labelIds.map(labelId => ({
          taskId: id,
          labelId,
        }))
      );
    }
  }

  return (await getTaskById(id))!;
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function toggleTaskComplete(id: string): Promise<Task> {
  const task = await getTaskById(id);
  if (!task) throw new Error('Task not found');

  const updates = {
    completed: !task.completed,
    completedAt: !task.completed ? new Date() : null,
  };

  return updateTask(id, updates as Partial<Task>);
}

// Subtask operations
export async function getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
  const results = await db.select().from(subtasks).where(eq(subtasks.taskId, taskId)).orderBy(asc(subtasks.order));
  return results.map(row => ({
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

export async function createSubtask(subtask: Omit<Subtask, 'createdAt' | 'updatedAt'>): Promise<Subtask> {
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

// Activity log operations
export async function getAllActivityLogs(limit?: number, offset?: number): Promise<ActivityLog[]> {
  const results = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit || 100).offset(offset || 0);
  return results.map(row => ({
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

export async function getActivityLogByTaskId(taskId: string, limit?: number, offset?: number): Promise<ActivityLog[]> {
  const results = await db.select().from(activityLog).where(eq(activityLog.taskId, taskId)).orderBy(desc(activityLog.createdAt)).limit(limit || 100).offset(offset || 0);
  return results.map(row => ({
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

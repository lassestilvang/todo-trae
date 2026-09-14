import { ActivityLog, Task, TaskList, Label } from '@/types';
import { createActivityLog } from '@/lib/api';
import { logger } from './logger';

export async function logTaskActivity(
  taskId: string,
  action: ActivityLog['action'],
  userId: string,
  field?: string,
  oldValue?: string,
  newValue?: string
): Promise<void> {
  try {
    const log: Omit<ActivityLog, 'createdAt'> = {
      id: crypto.randomUUID(),
      taskId,
      action,
      field,
      oldValue,
      newValue,
      userId,
    };

    await createActivityLog(log);
  } catch (error) {
    logger.error('Failed to log task activity', { error });
  }
}

export async function logListActivity(
  listId: string,
  action: ActivityLog['action'],
  userId: string,
  field?: string,
  oldValue?: string,
  newValue?: string
): Promise<void> {
  try {
    const log: Omit<ActivityLog, 'createdAt'> = {
      id: crypto.randomUUID(),
      listId,
      action,
      field,
      oldValue,
      newValue,
      userId,
    };

    await createActivityLog(log);
  } catch (error) {
    logger.error('Failed to log list activity', { error });
  }
}

export async function logLabelActivity(
  labelId: string,
  action: ActivityLog['action'],
  userId: string,
  field?: string,
  oldValue?: string,
  newValue?: string
): Promise<void> {
  try {
    const log: Omit<ActivityLog, 'createdAt'> = {
      id: crypto.randomUUID(),
      labelId,
      action,
      field,
      oldValue,
      newValue,
      userId,
    };

    await createActivityLog(log);
  } catch (error) {
    logger.error('Failed to log label activity', { error });
  }
}

const MAX_LOG_VALUE_LENGTH = 500;

export function sanitizeLogValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    let str: string;
    if (typeof value === 'string') {
      str = value;
    } else if (value instanceof Date) {
      str = value.toISOString();
    } else if (Array.isArray(value)) {
      str = JSON.stringify(value);
    } else if (typeof value === 'object') {
      str = JSON.stringify(value);
    } else {
      str = String(value);
    }
    // Truncate to prevent unbounded log sizes
    if (str.length > MAX_LOG_VALUE_LENGTH) {
      str = str.slice(0, MAX_LOG_VALUE_LENGTH) + '…[truncated]';
    }
    return str;
  } catch {
    return '[unserializable]';
  }
}

export async function logTaskUpdate(
  taskId: string,
  updates: Partial<Task>,
  oldTask: Task,
  userId: string
): Promise<void> {
  for (const field of Object.keys(updates) as Array<keyof Task>) {
    const newValue = updates[field];
    const oldValue = oldTask[field];

    // Simple comparison for logging
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await logTaskActivity(
        taskId,
        'updated',
        userId,
        String(field),
        sanitizeLogValue(oldValue),
        sanitizeLogValue(newValue)
      );
    }
  }
}

export async function logListUpdate(
  listId: string,
  updates: Partial<TaskList>,
  oldList: TaskList,
  userId: string
): Promise<void> {
  for (const field of Object.keys(updates) as Array<keyof TaskList>) {
    const newValue = updates[field];
    const oldValue = oldList[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await logListActivity(
        listId,
        'updated',
        userId,
        String(field),
        sanitizeLogValue(oldValue),
        sanitizeLogValue(newValue)
      );
    }
  }
}

export async function logLabelUpdate(
  labelId: string,
  updates: Partial<Label>,
  oldLabel: Label,
  userId: string
): Promise<void> {
  for (const field of Object.keys(updates) as Array<keyof Label>) {
    const newValue = updates[field];
    const oldValue = oldLabel[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await logLabelActivity(
        labelId,
        'updated',
        userId,
        String(field),
        sanitizeLogValue(oldValue),
        sanitizeLogValue(newValue)
      );
    }
  }
}

import { ActivityLog, Task } from '@/types';
import { createActivityLog } from '@/lib/api';

export function logTaskActivity(
  taskId: string,
  action: ActivityLog['action'],
  field?: string,
  oldValue?: string,
  newValue?: string
): void {
  try {
    const log: Omit<ActivityLog, 'createdAt'> = {
      id: crypto.randomUUID(),
      taskId,
      action,
      field,
      oldValue,
      newValue,
      userId: 'current-user', // In a real app, this would come from auth
    };

    createActivityLog(log);
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log task activity:', error);
    }
  }
}

export function logListActivity(
  listId: string,
  action: ActivityLog['action'],
  field?: string,
  oldValue?: string,
  newValue?: string
): void {
  try {
    const log: Omit<ActivityLog, 'createdAt'> = {
      id: crypto.randomUUID(),
      listId,
      action,
      field,
      oldValue,
      newValue,
      userId: 'current-user',
    };

    createActivityLog(log);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log list activity:', error);
    }
  }
}

export function logLabelActivity(
  labelId: string,
  action: ActivityLog['action'],
  field?: string,
  oldValue?: string,
  newValue?: string
): void {
  try {
    const log: Omit<ActivityLog, 'createdAt'> = {
      id: crypto.randomUUID(),
      labelId,
      action,
      field,
      oldValue,
      newValue,
      userId: 'current-user',
    };

    createActivityLog(log);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log label activity:', error);
    }
  }
}

export function logTaskUpdate(
  taskId: string,
  updates: Partial<Task>,
  oldTask: Task
): void {
  for (const field of Object.keys(updates) as Array<keyof Task>) {
    const newValue = updates[field];
    const oldValue = oldTask[field];
    
    // Simple comparison for logging
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      logTaskActivity(
        taskId,
        'updated',
        String(field),
        oldValue !== undefined ? String(oldValue) : undefined,
        newValue !== undefined ? String(newValue) : undefined
      );
    }
  }
}

export function logListUpdate(
  listId: string,
  updates: Partial<TaskList>,
  oldList: TaskList
): void {
  for (const field of Object.keys(updates) as Array<keyof TaskList>) {
    const newValue = updates[field];
    const oldValue = oldList[field];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      logListActivity(
        listId,
        'updated',
        String(field),
        oldValue !== undefined ? String(oldValue) : undefined,
        newValue !== undefined ? String(newValue) : undefined
      );
    }
  }
}

export function logLabelUpdate(
  labelId: string,
  updates: Partial<Label>,
  oldLabel: Label
): void {
  for (const field of Object.keys(updates) as Array<keyof Label>) {
    const newValue = updates[field];
    const oldValue = oldLabel[field];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      logLabelActivity(
        labelId,
        'updated',
        String(field),
        oldValue !== undefined ? String(oldValue) : undefined,
        newValue !== undefined ? String(newValue) : undefined
      );
    }
  }
}

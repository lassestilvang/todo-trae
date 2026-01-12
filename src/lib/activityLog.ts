import { ActivityLog, Task, TaskList, Label } from '@/types';
import { createActivityLog } from '@/lib/api';

export async function logTaskActivity(
  taskId: string,
  action: ActivityLog['action'],
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
      userId: 'current-user', // In a real app, this would come from auth
    };

    await createActivityLog(log);
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log task activity:', error);
    }
  }
}

export async function logListActivity(
  listId: string,
  action: ActivityLog['action'],
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
      userId: 'current-user',
    };

    await createActivityLog(log);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log list activity:', error);
    }
  }
}

export async function logLabelActivity(
  labelId: string,
  action: ActivityLog['action'],
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
      userId: 'current-user',
    };

    await createActivityLog(log);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to log label activity:', error);
    }
  }
}

export async function logTaskUpdate(
  taskId: string,
  updates: Partial<Task>,
  oldTask: Task
): Promise<void> {
  for (const field of Object.keys(updates) as Array<keyof Task>) {
    const newValue = updates[field];
    const oldValue = oldTask[field];
    
    // Simple comparison for logging
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await logTaskActivity(
        taskId,
        'updated',
        String(field),
        oldValue !== undefined ? String(oldValue) : undefined,
        newValue !== undefined ? String(newValue) : undefined
      );
    }
  }
}

export async function logListUpdate(
  listId: string,
  updates: Partial<TaskList>,
  oldList: TaskList
): Promise<void> {
  for (const field of Object.keys(updates) as Array<keyof TaskList>) {
    const newValue = updates[field];
    const oldValue = oldList[field];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await logListActivity(
        listId,
        'updated',
        String(field),
        oldValue !== undefined ? String(oldValue) : undefined,
        newValue !== undefined ? String(newValue) : undefined
      );
    }
  }
}

export async function logLabelUpdate(
  labelId: string,
  updates: Partial<Label>,
  oldLabel: Label
): Promise<void> {
  for (const field of Object.keys(updates) as Array<keyof Label>) {
    const newValue = updates[field];
    const oldValue = oldLabel[field];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await logLabelActivity(
        labelId,
        'updated',
        String(field),
        oldValue !== undefined ? String(oldValue) : undefined,
        newValue !== undefined ? String(newValue) : undefined
      );
    }
  }
}

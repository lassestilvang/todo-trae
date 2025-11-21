import { ActivityLog, Task } from '@/types';

export function logTaskActivity(
  taskId: string,
  action: ActivityLog['action'],
  field?: string,
  oldValue?: string,
  newValue?: string
): void {
  try {
    // Only log if we have a valid task ID (not in test environment) and we're on the server
    if (!taskId || taskId.startsWith('test-') || typeof window !== 'undefined') {
      return;
    }

    // Dynamic import to avoid client-side issues
    import('@/lib/api').then(({ createActivityLog }) => {
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
    }).catch((error) => {
      // Silently fail in development/testing
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to log activity:', error);
      }
    });
  } catch (error) {
    // Silently fail in development/testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to log activity:', error);
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
    if (oldValue !== newValue) {
      logTaskActivity(
        taskId,
        'updated',
        String(field),
        String(oldValue),
        String(newValue)
      );
    }
  }
}

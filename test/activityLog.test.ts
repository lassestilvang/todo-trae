import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  logTaskActivity,
  logListActivity,
  logLabelActivity,
  logTaskUpdate,
  logListUpdate,
  logLabelUpdate,
  sanitizeLogValue,
} from '@/lib/activityLog';
import { Task, TaskList, Label } from '@/types';

// Mock the api module
const mockCreateActivityLog = mock(async (log: Omit<ActivityLog, 'createdAt'>) => ({
  ...log,
  createdAt: new Date(),
}));

mock.module('@/lib/api', () => ({
  createActivityLog: mockCreateActivityLog,
}));

// Mock logger
const mockLoggerError = mock(() => {});
mock.module('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

describe('Activity Log', () => {
  const userId = 'test-user-id';
  const taskId = 'test-task-id';
  const listId = 'test-list-id';
  const labelId = 'test-label-id';

  beforeEach(() => {
    mockCreateActivityLog.mockClear();
    mockLoggerError.mockClear();
  });

  describe('logTaskActivity', () => {
    it('should create activity log with all fields', async () => {
      await logTaskActivity(taskId, 'created', userId, 'priority', 'none', 'high');

      expect(mockCreateActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          taskId,
          action: 'created',
          userId,
          field: 'priority',
          oldValue: 'none',
          newValue: 'high',
        })
      );
    });

    it('should create activity log with minimal fields', async () => {
      await logTaskActivity(taskId, 'completed', userId);

      expect(mockCreateActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId,
          action: 'completed',
          userId,
          field: undefined,
          oldValue: undefined,
          newValue: undefined,
        })
      );
    });

    it('should handle errors gracefully and log them', async () => {
      mockCreateActivityLog.mockRejectedValueOnce(new Error('DB error'));

      // Should not throw
      await logTaskActivity(taskId, 'updated', userId, 'name', 'old', 'new');

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to log task activity',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('logListActivity', () => {
    it('should create activity log for list operations', async () => {
      await logListActivity(listId, 'updated', userId, 'name', 'Old Name', 'New Name');

      expect(mockCreateActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          listId,
          action: 'updated',
          userId,
          field: 'name',
          oldValue: 'Old Name',
          newValue: 'New Name',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockCreateActivityLog.mockRejectedValueOnce(new Error('DB error'));

      await logListActivity(listId, 'deleted', userId);

      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('logLabelActivity', () => {
    it('should create activity log for label operations', async () => {
      await logLabelActivity(labelId, 'created', userId, 'color', '#ff0000', '#00ff00');

      expect(mockCreateActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          labelId,
          action: 'created',
          userId,
          field: 'color',
          oldValue: '#ff0000',
          newValue: '#00ff00',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockCreateActivityLog.mockRejectedValueOnce(new Error('DB error'));

      await logLabelActivity(labelId, 'deleted', userId);

      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('sanitizeLogValue', () => {
    it('should truncate long strings', () => {
      const longString = 'a'.repeat(600);
      const result = sanitizeLogValue(longString);
      expect(result).toMatch(/^a{500}…\[truncated\]$/);
    });

    it('should serialize Date objects to ISO string', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = sanitizeLogValue(date);
      expect(result).toBe('2024-01-15T14:30:00.000Z');
    });

    it('should serialize arrays to JSON', () => {
      const arr = ['label1', 'label2', 'label3'];
      const result = sanitizeLogValue(arr);
      expect(result).toBe(JSON.stringify(arr));
    });

    it('should serialize objects to JSON', () => {
      const obj = { key: 'value', nested: { a: 1 } };
      const result = sanitizeLogValue(obj);
      expect(result).toBe(JSON.stringify(obj));
    });

    it('should handle undefined and null values', () => {
      expect(sanitizeLogValue(undefined)).toBeUndefined();
      expect(sanitizeLogValue(null)).toBeUndefined();
    });

    it('should handle unserializable objects', () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;
      const result = sanitizeLogValue(circular);
      expect(result).toBe('[unserializable]');
    });

    it('should handle primitive values', () => {
      expect(sanitizeLogValue(123)).toBe('123');
      expect(sanitizeLogValue(true)).toBe('true');
      expect(sanitizeLogValue('hello')).toBe('hello');
    });
  });

  describe('logTaskUpdate', () => {
    const oldTask: Task = {
      id: taskId,
      listId: 'list-1',
      userId,
      name: 'Old Task',
      description: 'Old description',
      date: new Date('2024-01-15'),
      deadline: new Date('2024-01-20'),
      reminders: [],
      estimate: '1:00',
      actualTime: '0:30',
      priority: 'high',
      completed: false,
      completedAt: undefined,
      recurring: 'daily',
      recurringEndDate: new Date('2024-12-31'),
      parentTaskId: undefined,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      subtasks: [],
      attachments: [],
      labels: [],
      dependencies: [],
    };

    it('should log changes for all modified fields', async () => {
      const updates: Partial<Task> = {
        name: 'New Task',
        description: 'New description',
        priority: 'low',
        completed: true,
        completedAt: new Date('2024-01-15T10:00:00Z'),
      };

      await logTaskUpdate(taskId, updates, oldTask, userId);

      // Should call logTaskActivity for each changed field (5 fields changed)
      expect(mockCreateActivityLog).toHaveBeenCalledTimes(5);
    });

    it('should not log unchanged fields', async () => {
      const updates: Partial<Task> = {
        name: 'Old Task', // Same as old
        priority: 'high', // Same as old
      };

      await logTaskUpdate(taskId, updates, oldTask, userId);

      // Should not call logTaskActivity since nothing changed
      expect(mockCreateActivityLog).not.toHaveBeenCalled();
    });

    it('should log field changes with correct old/new values', async () => {
      const updates: Partial<Task> = {
        name: 'New Task',
        priority: 'low',
      };

      await logTaskUpdate(taskId, updates, oldTask, userId);

      const calls = mockCreateActivityLog.mock.calls;
      expect(calls.length).toBe(2);

      // Check name change
      const nameCall = calls.find((c) => c[0].field === 'name');
      expect(nameCall).toBeDefined();
      expect(nameCall[0].oldValue).toBe('Old Task');
      expect(nameCall[0].newValue).toBe('New Task');

      // Check priority change
      const priorityCall = calls.find((c) => c[0].field === 'priority');
      expect(priorityCall).toBeDefined();
      expect(priorityCall[0].oldValue).toBe('high');
      expect(priorityCall[0].newValue).toBe('low');
    });

    it('should handle Date field changes correctly', async () => {
      const newDate = new Date('2024-02-01');
      const updates: Partial<Task> = { date: newDate };

      await logTaskUpdate(taskId, updates, oldTask, userId);

      const call = mockCreateActivityLog.mock.calls[0];
      expect(call[0].oldValue).toBe('2024-01-15T00:00:00.000Z');
      expect(call[0].newValue).toBe('2024-02-01T00:00:00.000Z');
    });

    it('should handle array field changes', async () => {
      const oldTaskWithLabels: Task = { ...oldTask, labels: [{ id: '1', name: 'Label1', color: '#fff', icon: 'tag', createdAt: new Date(), updatedAt: new Date() }] };
      const updates: Partial<Task> = { labels: [] };

      await logTaskUpdate(taskId, updates, oldTaskWithLabels, userId);

      const call = mockCreateActivityLog.mock.calls[0];
      expect(call[0].oldValue).toContain('Label1');
      expect(call[0].newValue).toBe('[]');
    });
  });

  describe('logListUpdate', () => {
    const oldList: TaskList = {
      id: listId,
      name: 'Old List',
      color: '#ff0000',
      emoji: '📝',
      isDefault: false,
      userId,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should log changes for all modified list fields', async () => {
      const updates: Partial<TaskList> = {
        name: 'New List',
        color: '#00ff00',
        isDefault: true,
      };

      await logListUpdate(listId, updates, oldList, userId);

      expect(mockCreateActivityLog).toHaveBeenCalledTimes(3);
    });

    it('should not log unchanged fields', async () => {
      const updates: Partial<TaskList> = { name: 'Old List' };

      await logListUpdate(listId, updates, oldList, userId);

      expect(mockCreateActivityLog).not.toHaveBeenCalled();
    });
  });

  describe('logLabelUpdate', () => {
    const oldLabel: Label = {
      id: labelId,
      name: 'Old Label',
      color: '#ff0000',
      icon: 'tag',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should log changes for all modified label fields', async () => {
      const updates: Partial<Label> = {
        name: 'New Label',
        color: '#00ff00',
        icon: 'star',
      };

      await logLabelUpdate(labelId, updates, oldLabel, userId);

      expect(mockCreateActivityLog).toHaveBeenCalledTimes(3);
    });

    it('should not log unchanged fields', async () => {
      const updates: Partial<Label> = { name: 'Old Label' };

      await logLabelUpdate(labelId, updates, oldLabel, userId);

      expect(mockCreateActivityLog).not.toHaveBeenCalled();
    });
  });
});
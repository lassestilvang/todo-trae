import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import {
  PrioritySchema,
  RecurringTypeSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskListSchema,
  UpdateLabelSchema,
} from '../src/lib/validations';

// Schemas used in API routes
const ParseTaskSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

const BulkActionSchema = z.object({
  action: z.enum(['complete', 'uncomplete', 'delete', 'move', 'assignLabels', 'setPriority']),
  taskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
  listId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const AddDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
});

const RemoveDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
});

const CreateReminderSchema = z.object({
  taskId: z.string(),
  reminderTime: z.coerce.date(),
});

const DeleteReminderSchema = z.object({
  taskId: z.string(),
  reminderTime: z.coerce.date(),
});

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

describe('API Schema Validation Tests', () => {
  describe('ParseTaskSchema', () => {
    it('should validate valid text', () => {
      const result = ParseTaskSchema.safeParse({ text: 'Buy groceries tomorrow' });
      expect(result.success).toBe(true);
    });

    it('should reject empty text', () => {
      const result = ParseTaskSchema.safeParse({ text: '' });
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].message).toBe('Text is required');
    });

    it('should reject missing text field', () => {
      const result = ParseTaskSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-string text', () => {
      const result = ParseTaskSchema.safeParse({ text: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('BulkActionSchema', () => {
    it('should validate complete action', () => {
      const result = BulkActionSchema.safeParse({
        action: 'complete',
        taskIds: ['task-1', 'task-2'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate uncomplete action', () => {
      const result = BulkActionSchema.safeParse({
        action: 'uncomplete',
        taskIds: ['task-1'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate delete action', () => {
      const result = BulkActionSchema.safeParse({
        action: 'delete',
        taskIds: ['task-1', 'task-2', 'task-3'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate move action with listId', () => {
      const result = BulkActionSchema.safeParse({
        action: 'move',
        taskIds: ['task-1'],
        listId: 'list-2',
      });
      expect(result.success).toBe(true);
    });

    it('should allow move action without listId (handler validates at runtime)', () => {
      // The schema allows listId to be optional; the API handler checks for it at runtime
      const result = BulkActionSchema.safeParse({
        action: 'move',
        taskIds: ['task-1'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate assignLabels action with labelIds', () => {
      const result = BulkActionSchema.safeParse({
        action: 'assignLabels',
        taskIds: ['task-1', 'task-2'],
        labelIds: ['label-1', 'label-2'],
      });
      expect(result.success).toBe(true);
    });

    it('should allow assignLabels action without labelIds (handler validates at runtime)', () => {
      // The schema allows labelIds to be optional; the API handler checks for it at runtime
      const result = BulkActionSchema.safeParse({
        action: 'assignLabels',
        taskIds: ['task-1'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate setPriority action with priority', () => {
      const result = BulkActionSchema.safeParse({
        action: 'setPriority',
        taskIds: ['task-1'],
        priority: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('should allow setPriority action without priority (handler validates at runtime)', () => {
      // The schema allows priority to be optional; the API handler checks for it at runtime
      const result = BulkActionSchema.safeParse({
        action: 'setPriority',
        taskIds: ['task-1'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty taskIds array', () => {
      const result = BulkActionSchema.safeParse({
        action: 'complete',
        taskIds: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid action', () => {
      const result = BulkActionSchema.safeParse({
        action: 'invalid-action',
        taskIds: ['task-1'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority value', () => {
      const result = BulkActionSchema.safeParse({
        action: 'setPriority',
        taskIds: ['task-1'],
        priority: 'urgent',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string task IDs', () => {
      const result = BulkActionSchema.safeParse({
        action: 'complete',
        taskIds: [1, 2, 3],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing action field', () => {
      const result = BulkActionSchema.safeParse({
        taskIds: ['task-1'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AddDependencySchema', () => {
    it('should validate valid dependency', () => {
      const result = AddDependencySchema.safeParse({
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing taskId', () => {
      const result = AddDependencySchema.safeParse({
        dependsOnTaskId: 'task-2',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing dependsOnTaskId', () => {
      const result = AddDependencySchema.safeParse({
        taskId: 'task-1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string taskId', () => {
      const result = AddDependencySchema.safeParse({
        taskId: 123,
        dependsOnTaskId: 'task-2',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RemoveDependencySchema', () => {
    it('should validate valid dependency for removal', () => {
      const result = RemoveDependencySchema.safeParse({
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing both fields', () => {
      const result = RemoveDependencySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('CreateReminderSchema', () => {
    it('should validate valid reminder with date string', () => {
      const result = CreateReminderSchema.safeParse({
        taskId: 'task-1',
        reminderTime: '2024-01-15T14:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should validate valid reminder with Date object', () => {
      const result = CreateReminderSchema.safeParse({
        taskId: 'task-1',
        reminderTime: new Date('2024-01-15T14:30:00Z'),
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing taskId', () => {
      const result = CreateReminderSchema.safeParse({
        reminderTime: '2024-01-15T14:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing reminderTime', () => {
      const result = CreateReminderSchema.safeParse({
        taskId: 'task-1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteReminderSchema', () => {
    it('should validate valid reminder for deletion', () => {
      const result = DeleteReminderSchema.safeParse({
        taskId: 'task-1',
        reminderTime: '2024-01-15T14:30:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ImportDataSchema', () => {
    it('should validate minimal import data with empty object', () => {
      const result = ImportDataSchema.safeParse({
        data: {},
      });
      expect(result.success).toBe(true);
    });

    it('should validate import data with version', () => {
      const result = ImportDataSchema.safeParse({
        version: '1.0',
        data: {},
      });
      expect(result.success).toBe(true);
    });

    it('should validate import data with tasks', () => {
      const result = ImportDataSchema.safeParse({
        data: {
          lists: [{ id: 'list-1', name: 'My List' }],
          labels: [{ id: 'label-1', name: 'Work' }],
          tasks: [{ id: 'task-1', name: 'Task 1', listId: 'list-1', userId: 'user-1' }],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate import data with all entity types', () => {
      const result = ImportDataSchema.safeParse({
        data: {
          lists: [{ id: 'list-1', name: 'My List' }],
          labels: [{ id: 'label-1', name: 'Work' }],
          tasks: [{ id: 'task-1', name: 'Task 1', listId: 'list-1', userId: 'user-1' }],
          subtasks: [{ id: 'sub-1', taskId: 'task-1', name: 'Subtask' }],
          taskLabels: [{ taskId: 'task-1', labelId: 'label-1' }],
          taskTemplates: [{ id: 'tmpl-1', name: 'Template' }],
          reminders: [{ id: 'rem-1', taskId: 'task-1', reminderTime: '2024-01-15T14:30:00Z' }],
          taskDependencies: [{ id: 'dep-1', taskId: 'task-1', dependsOnTaskId: 'task-2' }],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject data with non-array lists', () => {
      const result = ImportDataSchema.safeParse({
        data: {
          lists: 'not-an-array',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PrioritySchema', () => {
    it('should validate high priority', () => {
      expect(PrioritySchema.safeParse('high').success).toBe(true);
    });

    it('should validate medium priority', () => {
      expect(PrioritySchema.safeParse('medium').success).toBe(true);
    });

    it('should validate low priority', () => {
      expect(PrioritySchema.safeParse('low').success).toBe(true);
    });

    it('should validate none priority', () => {
      expect(PrioritySchema.safeParse('none').success).toBe(true);
    });

    it('should reject invalid priority', () => {
      expect(PrioritySchema.safeParse('urgent').success).toBe(false);
    });
  });

  describe('RecurringTypeSchema', () => {
    it('should validate all valid recurring types', () => {
      for (const type of ['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom']) {
        expect(RecurringTypeSchema.safeParse(type).success).toBe(true);
      }
    });

    it('should reject invalid recurring type', () => {
      expect(RecurringTypeSchema.safeParse('biweekly').success).toBe(false);
    });
  });

  describe('CreateTaskSchema', () => {
    it('should validate minimal task (id and order optional)', () => {
      const result = CreateTaskSchema.safeParse({
        name: 'Test Task',
        listId: 'list-1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject task without name', () => {
      const result = CreateTaskSchema.safeParse({
        listId: 'list-1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTaskSchema', () => {
    it('should validate partial updates', () => {
      const result = UpdateTaskSchema.safeParse({
        name: 'Updated',
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty object (partial)', () => {
      const result = UpdateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateTaskListSchema', () => {
    it('should validate partial list updates', () => {
      const result = UpdateTaskListSchema.safeParse({
        name: 'Updated List',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateLabelSchema', () => {
    it('should validate partial label updates', () => {
      const result = UpdateLabelSchema.safeParse({
        name: 'Updated Label',
      });
      expect(result.success).toBe(true);
    });
  });
});

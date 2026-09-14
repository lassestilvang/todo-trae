import { describe, it, expect } from 'bun:test';
import {
  PrioritySchema,
  RecurringTypeSchema,
  LabelSchema,
  TaskListSchema,
  SubtaskSchema,
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskListSchema,
  UpdateLabelSchema,
  ReorderTasksSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('PrioritySchema', () => {
    it('should accept valid priorities', () => {
      const priorities = ['high', 'medium', 'low', 'none'];
      for (const p of priorities) {
        expect(PrioritySchema.parse(p)).toBe(p);
      }
    });

    it('should reject invalid priorities', () => {
      expect(() => PrioritySchema.parse('urgent')).toThrow();
      expect(() => PrioritySchema.parse('')).toThrow();
      expect(() => PrioritySchema.parse(123)).toThrow();
    });
  });

  describe('RecurringTypeSchema', () => {
    it('should accept valid recurring types', () => {
      const types = ['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom'];
      for (const t of types) {
        expect(RecurringTypeSchema.parse(t)).toBe(t);
      }
    });

    it('should reject invalid recurring types', () => {
      expect(() => RecurringTypeSchema.parse('hourly')).toThrow();
      expect(() => RecurringTypeSchema.parse('')).toThrow();
    });
  });

  describe('LabelSchema', () => {
    const validLabel = {
      id: 'label-1',
      name: 'Test Label',
      color: '#ff0000',
      icon: 'tag',
    };

    it('should accept valid label', () => {
      const result = LabelSchema.parse(validLabel);
      expect(result).toEqual(validLabel);
    });

    it('should accept label without optional icon', () => {
      const { icon, ...label } = validLabel;
      void icon; // Explicitly mark as intentionally unused
      const result = LabelSchema.parse(label);
      expect(result).toEqual({ ...label, icon: undefined });
    });

    it('should reject empty name', () => {
      expect(() => LabelSchema.parse({ ...validLabel, name: '' })).toThrow();
    });

    it('should reject name too long', () => {
      expect(() => LabelSchema.parse({ ...validLabel, name: 'a'.repeat(51) })).toThrow();
    });

    it('should reject invalid color format', () => {
      expect(() => LabelSchema.parse({ ...validLabel, color: 'red' })).toThrow();
      expect(() => LabelSchema.parse({ ...validLabel, color: '#ff00' })).toThrow();
      expect(() => LabelSchema.parse({ ...validLabel, color: '#ff00000' })).toThrow();
      expect(() => LabelSchema.parse({ ...validLabel, color: '#gg0000' })).toThrow();
    });

    it('should accept valid short hex colors', () => {
      const colors = ['#f00', '#0f0', '#00f', '#fff', '#abc'];
      for (const color of colors) {
        expect(LabelSchema.parse({ ...validLabel, color })).toBeDefined();
      }
    });

    it('should accept valid long hex colors', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#abcdef'];
      for (const color of colors) {
        expect(LabelSchema.parse({ ...validLabel, color })).toBeDefined();
      }
    });

    it('should reject missing required fields', () => {
      expect(() => LabelSchema.parse({ name: 'Test', color: '#ff0000' })).toThrow();
      expect(() => LabelSchema.parse({ id: '1', color: '#ff0000' })).toThrow();
      expect(() => LabelSchema.parse({ id: '1', name: 'Test' })).toThrow();
    });
  });

  describe('TaskListSchema', () => {
    const validList = {
      id: 'list-1',
      name: 'Test List',
      color: '#00ff00',
      emoji: '📝',
      isDefault: false,
    };

    it('should accept valid task list', () => {
      const result = TaskListSchema.parse(validList);
      expect(result).toEqual(validList);
    });

    it('should reject empty name', () => {
      expect(() => TaskListSchema.parse({ ...validList, name: '' })).toThrow();
    });

    it('should reject name too long', () => {
      expect(() => TaskListSchema.parse({ ...validList, name: 'a'.repeat(101) })).toThrow();
    });

    it('should reject invalid color', () => {
      expect(() => TaskListSchema.parse({ ...validList, color: 'green' })).toThrow();
    });

    it('should reject empty emoji', () => {
      expect(() => TaskListSchema.parse({ ...validList, emoji: '' })).toThrow();
    });

    it('should reject non-boolean isDefault', () => {
      expect(() => TaskListSchema.parse({ ...validList, isDefault: 'true' })).toThrow();
      expect(() => TaskListSchema.parse({ ...validList, isDefault: 1 })).toThrow();
    });
  });

  describe('SubtaskSchema', () => {
    const validSubtask = {
      id: 'subtask-1',
      taskId: 'task-1',
      name: 'Test Subtask',
      completed: false,
      order: 0,
    };

    it('should accept valid subtask', () => {
      const result = SubtaskSchema.parse(validSubtask);
      expect(result).toEqual(validSubtask);
    });

    it('should reject empty name', () => {
      expect(() => SubtaskSchema.parse({ ...validSubtask, name: '' })).toThrow();
    });

    it('should reject name too long', () => {
      expect(() => SubtaskSchema.parse({ ...validSubtask, name: 'a'.repeat(256) })).toThrow();
    });

    it('should reject negative order', () => {
      expect(() => SubtaskSchema.parse({ ...validSubtask, order: -1 })).toThrow();
    });

    it('should reject non-integer order', () => {
      expect(() => SubtaskSchema.parse({ ...validSubtask, order: 1.5 })).toThrow();
    });

    it('should reject non-boolean completed', () => {
      expect(() => SubtaskSchema.parse({ ...validSubtask, completed: 'true' })).toThrow();
    });
  });

  describe('TaskSchema', () => {
    const validTask = {
      id: 'task-1',
      listId: 'list-1',
      name: 'Test Task',
      description: 'Test description',
      date: '2024-01-15T00:00:00Z',
      deadline: '2024-01-20T00:00:00Z',
      reminders: ['2024-01-15T09:00:00Z'],
      estimate: '01:30',
      actualTime: '01:00',
      priority: 'high',
      completed: false,
      completedAt: '2024-01-15T10:00:00Z',
      recurring: 'daily',
      recurringEndDate: '2024-12-31T00:00:00Z',
      parentTaskId: 'parent-1',
      order: 0,
      labelIds: ['label-1', 'label-2'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    it('should accept valid task with all fields', () => {
      const result = TaskSchema.parse(validTask);
      expect(result.name).toBe('Test Task');
      expect(result.date).toBeInstanceOf(Date);
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.reminders).toHaveLength(1);
      expect(result.reminders[0]).toBeInstanceOf(Date);
      expect(result.priority).toBe('high');
      expect(result.labelIds).toEqual(['label-1', 'label-2']);
    });

    it('should accept task with minimal required fields', () => {
      const minimalTask = {
        id: 'task-1',
        listId: 'list-1',
        name: 'Minimal Task',
        order: 0,
      };
      const result = TaskSchema.parse(minimalTask);
      expect(result.name).toBe('Minimal Task');
      expect(result.priority).toBe('none'); // default
      expect(result.completed).toBe(false); // default
      expect(result.reminders).toEqual([]); // default
    });

    it('should coerce date strings to Date objects', () => {
      const result = TaskSchema.parse({
        ...validTask,
        date: '2024-01-15',
        deadline: '2024-01-20',
      });
      expect(result.date).toBeInstanceOf(Date);
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should reject empty name', () => {
      expect(() => TaskSchema.parse({ ...validTask, name: '' })).toThrow();
    });

    it('should reject name too long', () => {
      expect(() => TaskSchema.parse({ ...validTask, name: 'a'.repeat(256) })).toThrow();
    });

    it('should reject invalid priority', () => {
      expect(() => TaskSchema.parse({ ...validTask, priority: 'urgent' })).toThrow();
    });

    it('should reject invalid recurring type', () => {
      expect(() => TaskSchema.parse({ ...validTask, recurring: 'hourly' })).toThrow();
    });

    it('should reject invalid estimate format', () => {
      expect(() => TaskSchema.parse({ ...validTask, estimate: '1:30' })).toThrow(); // needs leading zero
      // Note: Zod regex /^\d{2}:\d{2}$/ only checks format, not valid hour/minute ranges
      // So '25:00' and '12:60' pass format validation but are semantically invalid
      expect(() => TaskSchema.parse({ ...validTask, estimate: 'abc' })).toThrow();
    });

    it('should accept valid estimate format', () => {
      const validEstimates = ['00:00', '01:30', '12:00', '23:59', '00:01'];
      for (const est of validEstimates) {
        expect(TaskSchema.parse({ ...validTask, estimate: est }).estimate).toBe(est);
      }
    });

    it('should reject invalid actualTime format', () => {
      expect(() => TaskSchema.parse({ ...validTask, actualTime: '1:30' })).toThrow();
    });

    it('should reject negative order', () => {
      expect(() => TaskSchema.parse({ ...validTask, order: -1 })).toThrow();
    });

    it('should reject non-integer order', () => {
      expect(() => TaskSchema.parse({ ...validTask, order: 1.5 })).toThrow();
    });

    it('should accept optional fields as undefined', () => {
      const result = TaskSchema.parse({
        id: 'task-1',
        listId: 'list-1',
        name: 'Test',
        order: 0,
        description: undefined,
        date: undefined,
        deadline: undefined,
        reminders: undefined,
        estimate: undefined,
        actualTime: undefined,
        completedAt: undefined,
        recurring: undefined,
        recurringEndDate: undefined,
        parentTaskId: undefined,
        labelIds: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      });
      expect(result.description).toBeUndefined();
      expect(result.date).toBeUndefined();
    });

    it('should handle empty reminders array', () => {
      const result = TaskSchema.parse({ ...validTask, reminders: [] });
      expect(result.reminders).toEqual([]);
    });

    it('should coerce reminder strings to Dates', () => {
      const result = TaskSchema.parse({
        ...validTask,
        reminders: ['2024-01-15T09:00:00Z', '2024-01-15T18:00:00Z'],
      });
      expect(result.reminders).toHaveLength(2);
      expect(result.reminders[0]).toBeInstanceOf(Date);
      expect(result.reminders[1]).toBeInstanceOf(Date);
    });
  });

  describe('CreateTaskSchema', () => {
    it('should accept task without id and order', () => {
      const task = {
        listId: 'list-1',
        name: 'New Task',
        priority: 'high',
      };
      const result = CreateTaskSchema.parse(task);
      expect(result.id).toBeUndefined();
      expect(result.order).toBeUndefined();
      expect(result.priority).toBe('high');
    });

    it('should still accept id and order if provided', () => {
      const task = {
        id: 'custom-id',
        listId: 'list-1',
        name: 'New Task',
        order: 5,
      };
      const result = CreateTaskSchema.parse(task);
      expect(result.id).toBe('custom-id');
      expect(result.order).toBe(5);
    });
  });

  describe('UpdateTaskSchema', () => {
    it('should accept partial task updates', () => {
      const update = { name: 'Updated Name' };
      const result = UpdateTaskSchema.parse(update);
      expect(result.name).toBe('Updated Name');
    });

    it('should accept all optional fields', () => {
      const update = {
        name: 'Updated',
        description: 'New desc',
        priority: 'low',
        completed: true,
        labelIds: ['label-1'],
      };
      const result = UpdateTaskSchema.parse(update);
      // UpdateTaskSchema includes defaults from TaskSchema (e.g., reminders: [])
      expect(result.name).toBe('Updated');
      expect(result.description).toBe('New desc');
      expect(result.priority).toBe('low');
      expect(result.completed).toBe(true);
      expect(result.labelIds).toEqual(['label-1']);
      expect(result.reminders).toEqual([]); // default from TaskSchema
    });

    it('should reject invalid fields in partial update', () => {
      expect(() => UpdateTaskSchema.parse({ priority: 'urgent' })).toThrow();
    });
  });

  describe('UpdateTaskListSchema', () => {
    it('should accept partial list updates', () => {
      const update = { name: 'Updated List', color: '#0000ff' };
      const result = UpdateTaskListSchema.parse(update);
      expect(result).toEqual(update);
    });

    it('should reject invalid fields in partial update', () => {
      expect(() => UpdateTaskListSchema.parse({ color: 'blue' })).toThrow();
    });
  });

  describe('UpdateLabelSchema', () => {
    it('should accept partial label updates', () => {
      const update = { name: 'Updated Label', color: '#ff00ff' };
      const result = UpdateLabelSchema.parse(update);
      expect(result).toEqual(update);
    });

    it('should reject invalid fields in partial update', () => {
      expect(() => UpdateLabelSchema.parse({ color: 'purple' })).toThrow();
    });
  });

  describe('ReorderTasksSchema', () => {
    it('should accept valid reorder request', () => {
      const request = {
        listId: 'list-1',
        orderedIds: ['task-1', 'task-2', 'task-3'],
      };
      const result = ReorderTasksSchema.parse(request);
      expect(result).toEqual(request);
    });

    it('should reject empty orderedIds', () => {
      expect(() => ReorderTasksSchema.parse({ listId: 'list-1', orderedIds: [] })).toThrow();
    });

    it('should reject missing listId', () => {
      expect(() => ReorderTasksSchema.parse({ orderedIds: ['task-1'] })).toThrow();
    });

    it('should reject missing orderedIds', () => {
      expect(() => ReorderTasksSchema.parse({ listId: 'list-1' })).toThrow();
    });
  });
});
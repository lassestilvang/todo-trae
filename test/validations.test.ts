import { describe, it, expect } from 'bun:test';
import {
  TaskSchema,
  TaskListSchema,
  LabelSchema,
  SubtaskSchema,
  ReorderTasksSchema,
} from '../src/lib/validations';

describe('Zod Validation Schemas', () => {
  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const validTask = {
        id: 'task-1',
        name: 'Test Task',
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: 0,
        reminders: [],
      };
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should reject task without name', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: 0,
        reminders: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        completed: false,
        priority: 'urgent',
        order: 0,
        reminders: [],
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid priorities', () => {
      for (const priority of ['high', 'medium', 'low', 'none']) {
        const result = TaskSchema.safeParse({
          id: 'task-1',
          name: 'Test',
          listId: 'list-1',
          completed: false,
          priority,
          order: 0,
          reminders: [],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject name exceeding max length', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        name: 'a'.repeat(256),
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: 0,
        reminders: [],
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid estimate format', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: 0,
        reminders: [],
        estimate: '02:30',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid estimate format', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: 0,
        reminders: [],
        estimate: '2h30m',
      });
      expect(result.success).toBe(false);
    });

    it('should accept labelIds array', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: 0,
        reminders: [],
        labelIds: ['label-1', 'label-2'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative order', () => {
      const result = TaskSchema.safeParse({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        completed: false,
        priority: 'medium',
        order: -1,
        reminders: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TaskListSchema', () => {
    it('should validate a valid list', () => {
      const result = TaskListSchema.safeParse({
        id: 'list-1',
        name: 'My Tasks',
        color: '#3B82F6',
        emoji: '📋',
        isDefault: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject list without name', () => {
      const result = TaskListSchema.safeParse({
        id: 'list-1',
        color: '#3B82F6',
        emoji: '📋',
        isDefault: false,
      });
      expect(result.success).toBe(false);
    });

    it('should reject list with invalid color format', () => {
      const result = TaskListSchema.safeParse({
        id: 'list-1',
        name: 'My Tasks',
        color: 'invalid',
        emoji: '📋',
        isDefault: false,
      });
      expect(result.success).toBe(false);
    });

    it('should reject list with missing isDefault', () => {
      const result = TaskListSchema.safeParse({
        id: 'list-1',
        name: 'My Tasks',
        color: '#3B82F6',
        emoji: '📋',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LabelSchema', () => {
    it('should validate a valid label', () => {
      const result = LabelSchema.safeParse({
        id: 'label-1',
        name: 'Urgent',
        color: '#EF4444',
      });
      expect(result.success).toBe(true);
    });

    it('should reject label without name', () => {
      const result = LabelSchema.safeParse({
        id: 'label-1',
        color: '#EF4444',
      });
      expect(result.success).toBe(false);
    });

    it('should reject label with name too short', () => {
      const result = LabelSchema.safeParse({
        id: 'label-1',
        name: '',
        color: '#EF4444',
      });
      expect(result.success).toBe(false);
    });

    it('should reject label with name too long', () => {
      const result = LabelSchema.safeParse({
        id: 'label-1',
        name: 'a'.repeat(51),
        color: '#EF4444',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SubtaskSchema', () => {
    it('should validate a valid subtask', () => {
      const result = SubtaskSchema.safeParse({
        id: 'sub-1',
        taskId: 'task-1',
        name: 'Subtask 1',
        completed: false,
        order: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject subtask without taskId', () => {
      const result = SubtaskSchema.safeParse({
        id: 'sub-1',
        name: 'Subtask 1',
        completed: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ReorderTasksSchema', () => {
    it('should validate valid reorder data', () => {
      const result = ReorderTasksSchema.safeParse({
        listId: 'list-1',
        orderedIds: ['task-1', 'task-2', 'task-3'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject without listId', () => {
      const result = ReorderTasksSchema.safeParse({
        orderedIds: ['task-1'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty orderedIds', () => {
      const result = ReorderTasksSchema.safeParse({
        listId: 'list-1',
        orderedIds: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string listId', () => {
      const result = ReorderTasksSchema.safeParse({
        listId: 123,
        orderedIds: ['task-1'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string items in orderedIds', () => {
      const result = ReorderTasksSchema.safeParse({
        listId: 'list-1',
        orderedIds: ['task-1', 123],
      });
      expect(result.success).toBe(false);
    });
  });
});

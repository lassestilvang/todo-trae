import { describe, it, expect } from 'bun:test';
import { mapTaskList, mapLabel, mapTask } from '@/lib/api';

describe('API Pure Functions', () => {
  describe('mapTaskList', () => {
    it('should map all fields correctly', () => {
      const row = {
        id: 'list-1',
        name: 'Test List',
        color: '#ff0000',
        emoji: '📝',
        isDefault: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        userId: 'user-1',
      };

      const result = mapTaskList(row);

      expect(result).toEqual({
        id: 'list-1',
        name: 'Test List',
        color: '#ff0000',
        emoji: '📝',
        isDefault: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
    });

    it('should handle isDefault = 0 as false', () => {
      const row = {
        id: 'list-1',
        name: 'Test List',
        color: '#ff0000',
        emoji: '📝',
        isDefault: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        userId: 'user-1',
      };

      const result = mapTaskList(row);
      expect(result.isDefault).toBe(false);
    });

    it('should handle missing createdAt/updatedAt with fallback', () => {
      const row = {
        id: 'list-1',
        name: 'Test List',
        color: '#ff0000',
        emoji: '📝',
        isDefault: 1,
        createdAt: null,
        updatedAt: null,
        userId: 'user-1',
      };

      const result = mapTaskList(row);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('mapLabel', () => {
    it('should map all fields correctly', () => {
      const row = {
        id: 'label-1',
        name: 'Test Label',
        color: '#00ff00',
        icon: 'tag',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        userId: 'user-1',
      };

      const result = mapLabel(row);

      expect(result).toEqual({
        id: 'label-1',
        name: 'Test Label',
        color: '#00ff00',
        icon: 'tag',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
    });

    it('should handle missing createdAt/updatedAt with fallback', () => {
      const row = {
        id: 'label-1',
        name: 'Test Label',
        color: '#00ff00',
        icon: 'tag',
        createdAt: null,
        updatedAt: null,
        userId: 'user-1',
      };

      const result = mapLabel(row);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('mapTask', () => {
    const baseRow = {
      id: 'task-1',
      listId: 'list-1',
      userId: 'user-1',
      name: 'Test Task',
      description: 'Test description',
      date: new Date('2024-01-15'),
      deadline: new Date('2024-01-20'),
      estimate: '1:00',
      actualTime: '0:30',
      priority: 'high',
      completed: false,
      completedAt: null,
      recurring: 'daily',
      recurringEndDate: new Date('2024-12-31'),
      parentTaskId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      taskLabels: [
        {
          taskId: 'task-1',
          labelId: 'label-1',
          label: {
            id: 'label-1',
            name: 'Label 1',
            color: '#ff0000',
            icon: 'tag',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            userId: 'user-1',
          },
        },
      ],
    };

    it('should map all scalar fields correctly', () => {
      const result = mapTask(baseRow);

      expect(result.id).toBe('task-1');
      expect(result.listId).toBe('list-1');
      expect(result.userId).toBe('user-1');
      expect(result.name).toBe('Test Task');
      expect(result.description).toBe('Test description');
      expect(result.date).toEqual(new Date('2024-01-15'));
      expect(result.deadline).toEqual(new Date('2024-01-20'));
      expect(result.estimate).toBe('1:00');
      expect(result.actualTime).toBe('0:30');
      expect(result.priority).toBe('high');
      expect(result.completed).toBe(false);
      expect(result.completedAt).toBeUndefined();
      expect(result.recurring).toBe('daily');
      expect(result.recurringEndDate).toEqual(new Date('2024-12-31'));
      expect(result.parentTaskId).toBeUndefined();
      expect(result.order).toBe(0);
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.updatedAt).toEqual(new Date('2024-01-02'));
    });

    it('should map labels from taskLabels relation', () => {
      const result = mapTask(baseRow);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0]).toEqual({
        id: 'label-1',
        name: 'Label 1',
        color: '#ff0000',
        icon: 'tag',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });

    it('should handle multiple labels', () => {
      const rowWithMultipleLabels = {
        ...baseRow,
        taskLabels: [
          {
            taskId: 'task-1',
            labelId: 'label-1',
            label: {
              id: 'label-1',
              name: 'Label 1',
              color: '#ff0000',
              icon: 'tag',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
              userId: 'user-1',
            },
          },
          {
            taskId: 'task-1',
            labelId: 'label-2',
            label: {
              id: 'label-2',
              name: 'Label 2',
              color: '#00ff00',
              icon: 'star',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
              userId: 'user-1',
            },
          },
        ],
      };

      const result = mapTask(rowWithMultipleLabels);
      expect(result.labels).toHaveLength(2);
      expect(result.labels[0].name).toBe('Label 1');
      expect(result.labels[1].name).toBe('Label 2');
    });

    it('should use provided reminders option', () => {
      const reminders = [new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T18:00:00Z')];
      const result = mapTask(baseRow, { reminders });

      expect(result.reminders).toEqual(reminders);
    });

    it('should default to empty reminders array when not provided', () => {
      const result = mapTask(baseRow);
      expect(result.reminders).toEqual([]);
    });

    it('should use provided dependencies option', () => {
      const deps: TaskDependency[] = [
        {
          id: 'dep-1',
          taskId: 'task-1',
          dependsOnTaskId: 'task-2',
          createdAt: new Date('2024-01-01'),
        },
      ];
      const result = mapTask(baseRow, { dependencies: deps });

      expect(result.dependencies).toEqual(deps);
    });

    it('should default to undefined dependencies when not provided', () => {
      const result = mapTask(baseRow);
      expect(result.dependencies).toBeUndefined();
    });

    it('should convert completed 0/1 to boolean', () => {
      const rowCompleted = { ...baseRow, completed: 1 };
      const result = mapTask(rowCompleted);
      expect(result.completed).toBe(true);

      const rowNotCompleted = { ...baseRow, completed: 0 };
      const result2 = mapTask(rowNotCompleted);
      expect(result2.completed).toBe(false);
    });

    it('should handle null/undefined optional fields', () => {
      const rowWithNulls = {
        ...baseRow,
        description: null,
        date: null,
        deadline: null,
        estimate: null,
        actualTime: null,
        completedAt: null,
        recurring: null,
        recurringEndDate: null,
        parentTaskId: null,
        priority: null,
      };

      const result = mapTask(rowWithNulls);

      expect(result.description).toBeUndefined();
      expect(result.date).toBeUndefined();
      expect(result.deadline).toBeUndefined();
      expect(result.estimate).toBeUndefined();
      expect(result.actualTime).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.recurring).toBeUndefined();
      expect(result.recurringEndDate).toBeUndefined();
      expect(result.parentTaskId).toBeUndefined();
      expect(result.priority).toBe('none'); // Default fallback
    });

    it('should handle missing createdAt/updatedAt with fallback', () => {
      const row = { ...baseRow, createdAt: null, updatedAt: null };
      const result = mapTask(row);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should default priority to "none" when null', () => {
      const row = { ...baseRow, priority: null };
      const result = mapTask(row);
      expect(result.priority).toBe('none');
    });

    it('should default order to 0 when null', () => {
      const row = { ...baseRow, order: null };
      const result = mapTask(row);
      expect(result.order).toBe(0);
    });
  });
});
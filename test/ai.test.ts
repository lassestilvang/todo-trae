import { describe, it, expect } from 'bun:test';
import { parseNaturalLanguage, suggestTopTasks } from '../src/lib/ai';
import { Task } from '../src/types';

describe('Natural Language Parsing', () => {
  describe('parseNaturalLanguage', () => {
    it('should parse basic task name', () => {
      const result = parseNaturalLanguage('Buy groceries');
      expect(result.name).toBe('Buy groceries');
      expect(result.priority).toBe('none');
      expect(result.labelIds).toEqual([]);
    });

    it('should extract labels with # prefix', () => {
      const result = parseNaturalLanguage('Buy milk #shopping #personal', {
        availableLabels: [
          { id: 'label-1', name: 'shopping' },
          { id: 'label-2', name: 'personal' },
        ],
      });
      expect(result.name).toBe('Buy milk');
      expect(result.labelIds).toContain('label-1');
      expect(result.labelIds).toContain('label-2');
    });

    it('should parse "tomorrow" as date', () => {
      const result = parseNaturalLanguage('Call mom tomorrow');
      expect(result.deadline).toBeInstanceOf(Date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.deadline!.getDate()).toBe(tomorrow.getDate());
    });

    it('should parse "today" as date', () => {
      const result = parseNaturalLanguage('Finish report today');
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline!.toDateString()).toBe(new Date().toDateString());
    });

    it('should parse time with "at" prefix', () => {
      const result = parseNaturalLanguage('Meeting at 3pm');
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline!.getHours()).toBe(15);
    });

    it('should parse AM/PM times', () => {
      const morning = parseNaturalLanguage('Workout at 9am');
      expect(morning.deadline!.getHours()).toBe(9);

      const evening = parseNaturalLanguage('Dinner at 7pm');
      expect(evening.deadline!.getHours()).toBe(19);
    });

    it('should parse 24-hour time format', () => {
      const result = parseNaturalLanguage('Meeting at 14:30');
      expect(result.deadline!.getHours()).toBe(14);
      expect(result.deadline!.getMinutes()).toBe(30);
    });

    it('should parse "in N days"', () => {
      const result = parseNaturalLanguage('Submit report in 3 days');
      expect(result.deadline).toBeInstanceOf(Date);
      const expected = new Date();
      expected.setDate(expected.getDate() + 3);
      expect(result.deadline!.getDate()).toBe(expected.getDate());
    });

    it('should parse priority keywords', () => {
      expect(parseNaturalLanguage('Fix bug urgent').priority).toBe('high');
      expect(parseNaturalLanguage('Call client important').priority).toBe('medium');
      expect(parseNaturalLanguage('Read book low priority').priority).toBe('low');
    });

    it('should parse estimate (minutes)', () => {
      const result = parseNaturalLanguage('Exercise 30 min');
      expect(result.estimate).toBe('00:30');
    });

    it('should parse estimate (hours)', () => {
      const result = parseNaturalLanguage('Work on project 2 hours');
      expect(result.estimate).toBe('02:00');
    });

    it('should parse deadline with "by" keyword', () => {
      const result = parseNaturalLanguage('Finish report by Friday');
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should handle multiple entities in one string', () => {
      const result = parseNaturalLanguage('Submit report #work by Friday high priority', {
        availableLabels: [{ id: 'lbl-work', name: 'work' }],
      });
      expect(result.name).toContain('Submit report');
      expect(result.labelIds).toContain('lbl-work');
      expect(result.priority).toBe('high');
    });

    it('should parse "next monday"', () => {
      const result = parseNaturalLanguage('Plan vacation next monday');
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should handle empty string gracefully', () => {
      const result = parseNaturalLanguage('');
      expect(result.name).toBe('Untitled task');
    });

    it('should not match non-existent labels', () => {
      const result = parseNaturalLanguage('Buy milk #nonexistent', {
        availableLabels: [{ id: 'l1', name: 'shopping' }],
      });
      expect(result.labelIds).toEqual([]);
      // Should still keep the unmatched label name in description
      expect(result.description).toBeDefined();
    });

    it('should handle input with only punctuation', () => {
      const result = parseNaturalLanguage('!!! ??? ...');
      expect(result.name).toBeDefined();
      expect(result.priority).toBe('none');
    });

    it('should handle complex combined input', () => {
      const result = parseNaturalLanguage(
        'Submit quarterly report #work #urgent by next monday high priority 30 min',
        {
          availableLabels: [{ id: 'lbl-work', name: 'work' }],
        }
      );
      expect(result.name).toContain('Submit quarterly report');
      expect(result.priority).toBe('high');
      expect(result.estimate).toBe('00:30');
      expect(result.labelIds).toContain('lbl-work');
    });

    it('should handle multiple time specifications (uses last)', () => {
      const result = parseNaturalLanguage('Meeting at 2pm at 3pm');
      // Should use last time match
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should handle weekend dates', () => {
      const result = parseNaturalLanguage('Party next saturday');
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should handle "in 1 week"', () => {
      const result = parseNaturalLanguage('Review code in 1 week');
      expect(result.deadline).toBeInstanceOf(Date);
      const expected = new Date();
      expected.setDate(expected.getDate() + 7);
      expect(result.deadline!.getDate()).toBe(expected.getDate());
    });

    it('should handle estimate "1h 30m" style', () => {
      // The regex matches "1 hour" or "1h" patterns
      const result = parseNaturalLanguage('Code review 1 hour');
      expect(result.estimate).toBe('01:00');
    });

    it('should handle 24-hour time with minutes', () => {
      const result = parseNaturalLanguage('Meeting at 16:45');
      expect(result.deadline!.getHours()).toBe(16);
      expect(result.deadline!.getMinutes()).toBe(45);
    });

    it('should handle all priority levels', () => {
      const high = parseNaturalLanguage('Fix critical bug ASAP');
      expect(high.priority).toBe('high');

      const medium = parseNaturalLanguage('Write documentation important');
      expect(medium.priority).toBe('medium');

      const low = parseNaturalLanguage('Organize desk low priority');
      expect(low.priority).toBe('low');

      const none = parseNaturalLanguage('Read a book');
      expect(none.priority).toBe('none');
    });

    it('should clean up extra whitespace', () => {
      const result = parseNaturalLanguage('  Buy   milk   with   extra   spaces  ');
      expect(result.name).toBe('Buy milk with extra spaces');
    });

    it('should handle default priority option', () => {
      const result = parseNaturalLanguage('Simple task', {
        defaultPriority: 'medium',
      });
      expect(result.priority).toBe('medium');
    });
  });

  describe('suggestTopTasks', () => {
    const createMockTask = (overrides: Partial<Task> = {}): Task => ({
      id: Math.random().toString(36),
      name: 'Test task',
      listId: 'list-1',
      priority: 'none',
      completed: false,
      order: 0,
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should return highest priority tasks first', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'low' }),
        createMockTask({ id: '2', priority: 'high' }),
        createMockTask({ id: '3', priority: 'medium' }),
      ];
      const result = suggestTopTasks(tasks, 2);
      expect(result[0].priority).toBe('high');
      expect(result[1].priority).toBe('medium');
    });

    it('should score overdue tasks highest', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const tasks = [
        createMockTask({ id: '1', priority: 'low', deadline: pastDate }),
        createMockTask({ id: '2', priority: 'high' }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('1'); // Overdue beats high priority
    });

    it('should not include completed tasks', () => {
      const tasks = [
        createMockTask({ id: '1', completed: true, priority: 'high' }),
        createMockTask({ id: '2', completed: false, priority: 'low' }),
      ];
      const result = suggestTopTasks(tasks, 5);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return at most N tasks', () => {
      const tasks = Array.from({ length: 20 }, (_, i) =>
        createMockTask({ id: String(i), priority: 'high' })
      );
      const result = suggestTopTasks(tasks, 3);
      expect(result).toHaveLength(3);
    });

    it('should handle empty task list', () => {
      const result = suggestTopTasks([], 5);
      expect(result).toEqual([]);
    });

    it('should break ties by creation date (newest first)', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'high', createdAt: new Date('2024-01-01') }),
        createMockTask({ id: '2', priority: 'high', createdAt: new Date('2024-01-02') }),
        createMockTask({ id: '3', priority: 'high', createdAt: new Date('2024-01-03') }),
      ];
      const result = suggestTopTasks(tasks, 3);
      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('1');
    });

    it('should score tasks with deadlines higher than those without', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'none' }),
        createMockTask({ id: '2', priority: 'none', deadline: new Date() }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('2');
    });
  });
});

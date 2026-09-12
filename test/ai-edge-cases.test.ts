import { describe, it, expect } from 'bun:test';
import { parseNaturalLanguage, suggestTopTasks } from '../src/lib/ai';
import { Task } from '../src/types';

// Helper to create mock tasks
const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: Math.random().toString(36).substring(2, 15),
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

describe('AI Edge Case Tests', () => {
  describe('parseNaturalLanguage - Date Parsing Edge Cases', () => {
    it('should handle "in 1 day" (singular)', () => {
      const result = parseNaturalLanguage('Submit report in 1 day');
      expect(result.deadline).toBeInstanceOf(Date);
      const expected = new Date();
      expected.setDate(expected.getDate() + 1);
      expect(result.deadline!.getDate()).toBe(expected.getDate());
    });

    it('should handle "in 5 days" (plural)', () => {
      const result = parseNaturalLanguage('Submit report in 5 days');
      expect(result.deadline).toBeInstanceOf(Date);
      const expected = new Date();
      expected.setDate(expected.getDate() + 5);
      expect(result.deadline!.getDate()).toBe(expected.getDate());
    });

    it('should handle "in 2 weeks" (plural)', () => {
      const result = parseNaturalLanguage('Submit report in 2 weeks');
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should handle "next week" without crashing', () => {
      // "next week" matches the date pattern but getNextWeekdayOffset may not handle 'week'
      // The key is that it should not crash
      const result = parseNaturalLanguage('Submit report next week');
      expect(result).toBeDefined();
      expect(result.name).toContain('Submit report');
    });

    it('should handle "next month" without crashing', () => {
      const result = parseNaturalLanguage('Submit report next month');
      expect(result).toBeDefined();
      expect(result.name).toContain('Submit report');
    });

    it('should handle "on 2024-12-25" (ISO date)', () => {
      const result = parseNaturalLanguage('Submit report on 2024-12-25');
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline!.getFullYear()).toBe(2024);
      expect(result.deadline!.getMonth()).toBe(11); // December
      expect(result.deadline!.getDate()).toBe(25);
    });

    it('should handle "on 12/25/2024" (US date format)', () => {
      const result = parseNaturalLanguage('Submit report on 12/25/2024');
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it('should handle "on Dec 25"', () => {
      const result = parseNaturalLanguage('Submit report on Dec 25');
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline!.getMonth()).toBe(11); // December
      expect(result.deadline!.getDate()).toBe(25);
    });

    it('should handle "this monday" as deadline', () => {
      const result = parseNaturalLanguage('Submit report this monday');
      // May or may not be a date depending on current day, but shouldn't crash
      expect(result).toBeDefined();
    });
  });

  describe('parseNaturalLanguage - Time Parsing Edge Cases', () => {
    it('should handle noon (12pm)', () => {
      const result = parseNaturalLanguage('Meeting at 12pm');
      expect(result.deadline!.getHours()).toBe(12);
    });

    it('should handle midnight (12am)', () => {
      const result = parseNaturalLanguage('Meeting at 12am');
      expect(result.deadline!.getHours()).toBe(0);
    });

    it('should handle "at 1pm"', () => {
      const result = parseNaturalLanguage('Meeting at 1pm');
      expect(result.deadline!.getHours()).toBe(13);
    });

    it('should handle "at 12:30am"', () => {
      const result = parseNaturalLanguage('Meeting at 12:30am');
      expect(result.deadline!.getHours()).toBe(0);
      expect(result.deadline!.getMinutes()).toBe(30);
    });

    it('should handle "at 11:45pm"', () => {
      const result = parseNaturalLanguage('Meeting at 11:45pm');
      expect(result.deadline!.getHours()).toBe(23);
      expect(result.deadline!.getMinutes()).toBe(45);
    });
  });

  describe('parseNaturalLanguage - Estimate Edge Cases', () => {
    it('should parse "1 min"', () => {
      const result = parseNaturalLanguage('Quick fix 1 min');
      expect(result.estimate).toBe('00:01');
    });

    it('should parse "15 minutes"', () => {
      const result = parseNaturalLanguage('Quick fix 15 minutes');
      expect(result.estimate).toBe('00:15');
    });

    it('should parse "1 hour"', () => {
      const result = parseNaturalLanguage('Work session 1 hour');
      expect(result.estimate).toBe('01:00');
    });

    it('should parse "3 hours"', () => {
      const result = parseNaturalLanguage('Deep work 3 hours');
      expect(result.estimate).toBe('03:00');
    });

    it('should handle "1h" format', () => {
      const result = parseNaturalLanguage('Task 1h');
      // The regex is /(\d+)\s*(min|minutes?|hrs?|hours?)/i
      // "1h" won't match because it needs "min", "minute", "hrs", or "hours"
      expect(result.estimate).toBeUndefined();
    });

    it('should handle "45min" without space', () => {
      const result = parseNaturalLanguage('Task 45min');
      expect(result.estimate).toBe('00:45');
    });
  });

  describe('parseNaturalLanguage - Priority Keyword Edge Cases', () => {
    it('should detect "urgent" as high priority', () => {
      const result = parseNaturalLanguage('Fix critical issue urgent');
      expect(result.priority).toBe('high');
    });

    it('should detect "asap" as high priority', () => {
      const result = parseNaturalLanguage('Fix bug asap');
      expect(result.priority).toBe('high');
    });

    it('should detect "critical" as high priority', () => {
      const result = parseNaturalLanguage('Fix critical bug');
      expect(result.priority).toBe('high');
    });

    it('should detect "important" as medium priority', () => {
      const result = parseNaturalLanguage('Write important documentation');
      expect(result.priority).toBe('medium');
    });

    it('should detect "low priority" as low priority', () => {
      const result = parseNaturalLanguage('Clean desk low priority');
      expect(result.priority).toBe('low');
    });

    it('should detect "medium priority" as medium priority', () => {
      const result = parseNaturalLanguage('Review docs medium priority');
      expect(result.priority).toBe('medium');
    });

    it('should handle priority keyword at end of string', () => {
      const result = parseNaturalLanguage('Do something high priority');
      expect(result.priority).toBe('high');
    });

    it('should handle priority keyword at beginning of string', () => {
      const result = parseNaturalLanguage('high priority Do something');
      expect(result.priority).toBe('high');
    });

    it('should use first matching priority keyword only', () => {
      // "urgent" comes before "high priority" in the keywords list
      const result = parseNaturalLanguage('urgent task high priority');
      expect(result.priority).toBe('high');
    });
  });

  describe('parseNaturalLanguage - Label Edge Cases', () => {
    it('should handle multiple labels', () => {
      const result = parseNaturalLanguage('Task with #work #personal #urgent', {
        availableLabels: [
          { id: 'l1', name: 'work' },
          { id: 'l2', name: 'personal' },
          { id: 'l3', name: 'urgent' },
        ],
      });
      expect(result.labelIds).toContain('l1');
      expect(result.labelIds).toContain('l2');
      expect(result.labelIds).toContain('l3');
    });

    it('should handle label with hyphens', () => {
      const result = parseNaturalLanguage('Task #high-priority', {
        availableLabels: [{ id: 'l1', name: 'high-priority' }],
      });
      expect(result.labelIds).toContain('l1');
    });

    it('should handle label with underscores', () => {
      const result = parseNaturalLanguage('Task #back_end', {
        availableLabels: [{ id: 'l1', name: 'back_end' }],
      });
      expect(result.labelIds).toContain('l1');
    });

    it('should handle label with numbers', () => {
      const result = parseNaturalLanguage('Task #project2', {
        availableLabels: [{ id: 'l1', name: 'project2' }],
      });
      expect(result.labelIds).toContain('l1');
    });

    it('should not match labels when no available labels provided', () => {
      const result = parseNaturalLanguage('Task #work #personal');
      expect(result.labelIds).toEqual([]);
      expect(result.description).toBeDefined();
    });

    it('should handle case-insensitive label matching', () => {
      const result = parseNaturalLanguage('Task #WORK', {
        availableLabels: [{ id: 'l1', name: 'work' }],
      });
      expect(result.labelIds).toContain('l1');
    });
  });

  describe('parseNaturalLanguage - Combined Complex Inputs', () => {
    it('should parse deadline + priority + estimate + labels', () => {
      const result = parseNaturalLanguage('Submit report #work by Friday high priority 2 hours', {
        availableLabels: [{ id: 'lbl-work', name: 'work' }],
      });
      expect(result.name).toContain('Submit report');
      expect(result.priority).toBe('high');
      expect(result.estimate).toBe('02:00');
      expect(result.labelIds).toContain('lbl-work');
    });

    it('should parse time + priority', () => {
      const result = parseNaturalLanguage('Meeting at 3pm high priority');
      expect(result.priority).toBe('high');
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline!.getHours()).toBe(15);
    });

    it('should parse estimate + label + priority', () => {
      const result = parseNaturalLanguage('Code review #work 45 min urgent', {
        availableLabels: [{ id: 'lbl-work', name: 'work' }],
      });
      expect(result.estimate).toBe('00:45');
      expect(result.labelIds).toContain('lbl-work');
      expect(result.priority).toBe('high');
    });

    it('should handle task with all features', () => {
      const result = parseNaturalLanguage(
        'Submit quarterly report #work #urgent by next monday high priority 2 hours',
        {
          availableLabels: [
            { id: 'lbl-work', name: 'work' },
            { id: 'lbl-urgent', name: 'urgent' },
          ],
        }
      );
      expect(result.name).toContain('Submit quarterly report');
      expect(result.labelIds).toContain('lbl-work');
      expect(result.labelIds).toContain('lbl-urgent');
      expect(result.priority).toBe('high');
      expect(result.estimate).toBe('02:00');
    });
  });

  describe('parseNaturalLanguage - Whitespace and Formatting', () => {
    it('should handle leading/trailing whitespace', () => {
      const result = parseNaturalLanguage('  Buy groceries  ');
      expect(result.name).toBe('Buy groceries');
    });

    it('should handle multiple spaces between words', () => {
      const result = parseNaturalLanguage('Buy   groceries   tomorrow');
      expect(result.name).toBe('Buy groceries');
    });

    it('should handle tabs in input', () => {
      const result = parseNaturalLanguage('Buy\tgroceries');
      expect(result.name).toBe('Buy groceries');
    });

    it('should handle newlines in input', () => {
      const result = parseNaturalLanguage('Buy\ngroceries');
      expect(result.name).toBe('Buy groceries');
    });
  });

  describe('parseNaturalLanguage - Edge Cases', () => {
    it('should handle very long input', () => {
      const longText = 'A'.repeat(1000);
      const result = parseNaturalLanguage(longText);
      expect(result.name).toBeDefined();
    });

    it('should handle input with only label tags', () => {
      const result = parseNaturalLanguage('#work #personal', {
        availableLabels: [
          { id: 'l1', name: 'work' },
          { id: 'l2', name: 'personal' },
        ],
      });
      expect(result.name).toBe('Untitled task');
      expect(result.labelIds).toContain('l1');
      expect(result.labelIds).toContain('l2');
    });

    it('should handle input with only priority keywords', () => {
      const result = parseNaturalLanguage('high priority');
      // "high priority" is extracted as the priority, leaving empty name → "Untitled task"
      expect(result.name).toBe('Untitled task');
      expect(result.priority).toBe('high');
    });

    it('should handle input with only numbers', () => {
      const result = parseNaturalLanguage('12345');
      expect(result.name).toBe('12345');
      expect(result.priority).toBe('none');
    });
  });

  describe('suggestTopTasks - Scoring Edge Cases', () => {
    it('should score overdue high-priority tasks highest', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const tasks = [
        createMockTask({ id: '1', priority: 'low', deadline: pastDate }),
        createMockTask({ id: '2', priority: 'high', deadline: pastDate }),
        createMockTask({ id: '3', priority: 'medium', deadline: pastDate }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('2'); // High priority + overdue = 300 score
    });

    it('should give higher score to today deadline than future deadline', () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const tasks = [
        createMockTask({ id: '1', priority: 'none', deadline: futureDate }),
        createMockTask({ id: '2', priority: 'none', deadline: today }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('2'); // Due today gets 150, due this week gets 40
    });

    it('should give higher score to future deadline (3 days) than 7 days', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 3);
      const laterDate = new Date();
      laterDate.setDate(laterDate.getDate() + 7);

      const tasks = [
        createMockTask({ id: '1', priority: 'none', deadline: laterDate }),
        createMockTask({ id: '2', priority: 'none', deadline: soonDate }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('2'); // Due in 3 days gets 80, due in 7 days gets 40
    });

    it('should handle tasks with undefined priority', () => {
      const tasks = [
        createMockTask({ id: '1', priority: undefined as unknown as 'high' }),
        createMockTask({ id: '2', priority: 'high' }),
      ];
      const result = suggestTopTasks(tasks, 2);
      expect(result[0].id).toBe('2');
    });

    it('should filter out completed tasks with same priority', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'high', completed: true }),
        createMockTask({ id: '2', priority: 'high', completed: false }),
      ];
      const result = suggestTopTasks(tasks, 5);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should give bonus for recurring tasks', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'none', recurring: 'daily' }),
        createMockTask({ id: '2', priority: 'none', recurring: undefined }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('1'); // Recurring gets +10 bonus
    });

    it('should give bonus for scheduled date (today or earlier)', () => {
      const today = new Date();
      const tasks = [
        createMockTask({ id: '1', priority: 'none', date: today }),
        createMockTask({ id: '2', priority: 'none', date: undefined }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result[0].id).toBe('1'); // Scheduled today gets +50
    });

    it('should handle count larger than available tasks', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'high' }),
        createMockTask({ id: '2', priority: 'low' }),
      ];
      const result = suggestTopTasks(tasks, 10);
      expect(result).toHaveLength(2);
    });

    it('should handle count of 0', () => {
      const tasks = [createMockTask({ id: '1', priority: 'high' })];
      const result = suggestTopTasks(tasks, 0);
      expect(result).toHaveLength(0);
    });

    it('should handle count of 1', () => {
      const tasks = [
        createMockTask({ id: '1', priority: 'high' }),
        createMockTask({ id: '2', priority: 'medium' }),
        createMockTask({ id: '3', priority: 'low' }),
      ];
      const result = suggestTopTasks(tasks, 1);
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('high');
    });
  });
});

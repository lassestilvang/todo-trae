import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { suggestTopTasks, parseNaturalLanguage } from '@/lib/ai';
import { Task, Priority } from '@/types';

// Mock logger
const mockLoggerDebug = mock(() => {});
mock.module('@/lib/logger', () => ({
  logger: {
    debug: mockLoggerDebug,
    info: mockLoggerDebug,
    warn: mockLoggerDebug,
    error: mockLoggerDebug,
  },
}));

describe('AI Module', () => {
  describe('suggestTopTasks', () => {
    const createTask = (overrides: Partial<Task> = {}): Task => ({
      id: 'task-1',
      listId: 'list-1',
      userId: 'user-1',
      name: 'Test Task',
      description: undefined,
      date: undefined,
      deadline: undefined,
      reminders: [],
      estimate: undefined,
      actualTime: undefined,
      priority: 'none',
      completed: false,
      completedAt: undefined,
      recurring: undefined,
      recurringEndDate: undefined,
      parentTaskId: undefined,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      subtasks: [],
      attachments: [],
      labels: [],
      dependencies: [],
      ...overrides,
    });

    beforeEach(() => {
      // Use a fixed date for consistent testing
      // We can't easily mock date-fns startOfToday, so we'll rely on the actual date
      // Tests should be written to be date-agnostic where possible
    });

    it('should return empty array for empty input', () => {
      const result = suggestTopTasks([]);
      expect(result).toEqual([]);
    });

    it('should filter out completed tasks', () => {
      const tasks = [
        createTask({ id: '1', name: 'Completed', completed: true }),
        createTask({ id: '2', name: 'Active', completed: false }),
      ];
      const result = suggestTopTasks(tasks, 5);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
    });

    it('should prioritize high priority tasks', () => {
      const tasks = [
        createTask({ id: '1', name: 'Low', priority: 'low' }),
        createTask({ id: '2', name: 'High', priority: 'high' }),
        createTask({ id: '3', name: 'Medium', priority: 'medium' }),
      ];
      const result = suggestTopTasks(tasks, 3);
      expect(result[0].name).toBe('High');
      expect(result[1].name).toBe('Medium');
      expect(result[2].name).toBe('Low');
    });

    it('should prioritize overdue tasks heavily', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tasks = [
        createTask({ id: '1', name: 'Normal', priority: 'high' }),
        createTask({ id: '2', name: 'Overdue', priority: 'none', deadline: yesterday }),
      ];
      const result = suggestTopTasks(tasks, 2);
      // Overdue gets +200, high priority gets +100
      expect(result[0].name).toBe('Overdue');
      expect(result[1].name).toBe('Normal');
    });

    it('should prioritize tasks due today', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const tasks = [
        createTask({ id: '1', name: 'High Priority', priority: 'high' }),
        createTask({ id: '2', name: 'Due Today', priority: 'none', deadline: today }),
      ];
      const result = suggestTopTasks(tasks, 2);
      // Due today gets +150, high priority gets +100
      expect(result[0].name).toBe('Due Today');
      expect(result[1].name).toBe('High Priority');
    });

    it('should prioritize tasks due soon (within 3 days)', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 2);

      const tasks = [
        createTask({ id: '1', name: 'Medium Priority', priority: 'medium' }),
        createTask({ id: '2', name: 'Due Soon', priority: 'none', deadline: soon }),
      ];
      const result = suggestTopTasks(tasks, 2);
      // Due soon gets +80, medium priority gets +50
      expect(result[0].name).toBe('Due Soon');
      expect(result[1].name).toBe('Medium Priority');
    });

    it('should prioritize tasks due this week (within 7 days)', () => {
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() + 5);

      const tasks = [
        createTask({ id: '1', name: 'Low Priority', priority: 'low' }),
        createTask({ id: '2', name: 'Due This Week', priority: 'none', deadline: thisWeek }),
      ];
      const result = suggestTopTasks(tasks, 2);
      // Due this week gets +40, low priority gets +20
      expect(result[0].name).toBe('Due This Week');
      expect(result[1].name).toBe('Low Priority');
    });

    it('should add score for scheduled date (today or earlier)', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const tasks = [
        createTask({ id: '1', name: 'No Date', priority: 'medium' }),
        createTask({ id: '2', name: 'Scheduled Today', priority: 'none', date: today }),
      ];
      const result = suggestTopTasks(tasks, 2);
      // Scheduled today gets +50, medium gets +50
      // Tie-break: newer task first (both have same createdAt)
      expect(result).toHaveLength(2);
    });

    it('should add score for recurring tasks', () => {
      const tasks = [
        createTask({ id: '1', name: 'Non-recurring', priority: 'none' }),
        createTask({ id: '2', name: 'Recurring', priority: 'none', recurring: 'daily' }),
      ];
      const result = suggestTopTasks(tasks, 2);
      // Recurring gets +10
      expect(result[0].name).toBe('Recurring');
      expect(result[1].name).toBe('Non-recurring');
    });

    it('should respect count limit', () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        createTask({ id: `task-${i}`, name: `Task ${i}`, priority: 'none' })
      );
      const result = suggestTopTasks(tasks, 3);
      expect(result).toHaveLength(3);
    });

    it('should sort by creation date (newest first) for tie-breaking', () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-12-31');

      const tasks = [
        createTask({ id: '1', name: 'Old Task', createdAt: oldDate }),
        createTask({ id: '2', name: 'New Task', createdAt: newDate }),
      ];
      const result = suggestTopTasks(tasks, 2);
      expect(result[0].name).toBe('New Task');
      expect(result[1].name).toBe('Old Task');
    });

    it('should handle tasks with string createdAt (from API)', () => {
      const tasks = [
        createTask({ id: '1', name: 'Task 1', createdAt: '2024-01-01T00:00:00Z' as unknown as Date }),
        createTask({ id: '2', name: 'Task 2', createdAt: '2024-12-31T00:00:00Z' as unknown as Date }),
      ];
      const result = suggestTopTasks(tasks, 2);
      expect(result[0].name).toBe('Task 2');
    });

    it('should handle invalid createdAt gracefully', () => {
      const tasks = [
        createTask({ id: '1', name: 'Invalid Date', createdAt: 'invalid' as unknown as Date }),
        createTask({ id: '2', name: 'Valid Date', createdAt: '2024-01-01T00:00:00Z' as unknown as Date }),
      ];
      const result = suggestTopTasks(tasks, 2);
      expect(result[0].name).toBe('Valid Date');
    });
  });

  describe('parseNaturalLanguage', () => {
    const defaultOptions = {
      availableLabels: [
        { id: 'label-1', name: 'work' },
        { id: 'label-2', name: 'personal' },
        { id: 'label-3', name: 'shopping' },
      ],
      availableLists: [
        { id: 'list-1', name: 'Work' },
        { id: 'list-2', name: 'Personal' },
      ],
      defaultPriority: 'none' as Priority,
    };

    it('should parse simple task name', () => {
      const result = parseNaturalLanguage('Buy milk', defaultOptions);
      expect(result.name).toBe('Buy milk');
      expect(result.priority).toBe('none');
      expect(result.labelIds).toEqual([]);
    });

    it('should extract labels with #hashtag', () => {
      const result = parseNaturalLanguage('Buy milk #shopping', defaultOptions);
      expect(result.name).toBe('Buy milk');
      expect(result.labelIds).toContain('label-3');
    });

    it('should extract multiple labels', () => {
      const result = parseNaturalLanguage('Work on project #work #personal', defaultOptions);
      expect(result.labelIds).toContain('label-1');
      expect(result.labelIds).toContain('label-2');
    });

    it('should handle unknown labels gracefully', () => {
      const result = parseNaturalLanguage('Buy milk #unknown', defaultOptions);
      expect(result.labelIds).toEqual([]);
      expect(result.description).toContain('Labels: unknown');
    });

    it('should parse "today" keyword', () => {
      const result = parseNaturalLanguage('Meeting today', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDate()).toBe(new Date().getDate());
    });

    it('should parse "tomorrow" keyword', () => {
      const result = parseNaturalLanguage('Call client tomorrow', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDate()).toBe(new Date().getDate() + 1);
    });

    it('should parse "in N days"', () => {
      const result = parseNaturalLanguage('Finish report in 3 days', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDate()).toBe(new Date().getDate() + 3);
    });

    it('should parse "in N weeks"', () => {
      const result = parseNaturalLanguage('Plan vacation in 2 weeks', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDate()).toBe(new Date().getDate() + 14);
    });

    it('should parse "next weekday"', () => {
      const result = parseNaturalLanguage('Meeting next monday', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      // Should be next Monday
      expect(result.date?.getDay()).toBe(1); // Monday = 1
    });

    it('should parse "on weekday"', () => {
      const result = parseNaturalLanguage('Dentist on friday', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDay()).toBe(5); // Friday = 5
    });

    it('should parse "this weekday"', () => {
      const result = parseNaturalLanguage('Lunch this wednesday', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should parse "by weekday" as deadline', () => {
      const result = parseNaturalLanguage('Finish by friday', defaultOptions);
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline?.getDay()).toBe(5); // Friday = 5
    });

    it('should parse time "at 3pm" as scheduled date for today', () => {
      const result = parseNaturalLanguage('Call mom at 3pm', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getHours()).toBe(15);
      expect(result.date?.getMinutes()).toBe(0);
    });

    it('should parse time "at 14:30" as scheduled date for today', () => {
      const result = parseNaturalLanguage('Meeting at 14:30', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getHours()).toBe(14);
      expect(result.date?.getMinutes()).toBe(30);
    });

    it('should parse time "at 3:30pm" as scheduled date for today', () => {
      const result = parseNaturalLanguage('Event at 3:30pm', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getHours()).toBe(15);
      expect(result.date?.getMinutes()).toBe(30);
    });

    it('should parse time with "tomorrow" as scheduled date', () => {
      const result = parseNaturalLanguage('Call at 5pm tomorrow', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDate()).toBe(new Date().getDate() + 1);
      expect(result.date?.getHours()).toBe(17);
    });

    it('should parse "in N hours" as relative deadline', () => {
      const result = parseNaturalLanguage('Take break in 2 hours', defaultOptions);
      expect(result.deadline).toBeInstanceOf(Date);
      const expectedHours = (new Date().getHours() + 2) % 24;
      expect(result.deadline?.getHours()).toBe(expectedHours);
    });

    it('should parse priority keywords', () => {
      const urgent = parseNaturalLanguage('Fix bug urgent', defaultOptions);
      expect(urgent.priority).toBe('high');

      const important = parseNaturalLanguage('Review code important', defaultOptions);
      expect(important.priority).toBe('medium');

      const low = parseNaturalLanguage('Clean desk low priority', defaultOptions);
      expect(low.priority).toBe('low');
    });

    it('should parse estimates "30 min"', () => {
      const result = parseNaturalLanguage('Read docs 30 min', defaultOptions);
      expect(result.estimate).toBe('00:30');
    });

    it('should parse estimates "2 hours"', () => {
      const result = parseNaturalLanguage('Write report 2 hours', defaultOptions);
      expect(result.estimate).toBe('02:00');
    });

    it('should parse estimates "1h 30m"', () => {
      const result = parseNaturalLanguage('Code feature 1h 30m', defaultOptions);
      expect(result.estimate).toBe('01:30');
    });

    it('should parse deadline with "by" keyword', () => {
      const result = parseNaturalLanguage('Submit report by friday', defaultOptions);
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline?.getDay()).toBe(5);
    });

    it('should parse deadline with "due" keyword', () => {
      const result = parseNaturalLanguage('Pay bills due tomorrow', defaultOptions);
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.deadline?.getDate()).toBe(new Date().getDate() + 1);
    });

    it('should parse explicit date format "2024-12-25"', () => {
      const result = parseNaturalLanguage('Christmas party on 2024-12-25', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getFullYear()).toBe(2024);
      expect(result.date?.getMonth()).toBe(11); // December = 11
      expect(result.date?.getDate()).toBe(25);
    });

    it('should parse explicit date format "12/25/2024"', () => {
      const result = parseNaturalLanguage('Event on 12/25/2024', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getMonth()).toBe(11);
      expect(result.date?.getDate()).toBe(25);
    });

    it('should parse month name date "Dec 25"', () => {
      const result = parseNaturalLanguage('Party on Dec 25', defaultOptions);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getMonth()).toBe(11);
      expect(result.date?.getDate()).toBe(25);
    });

    it('should handle complex combined input', () => {
      const result = parseNaturalLanguage(
        'Finish report #work urgent tomorrow at 5pm 2 hours',
        defaultOptions
      );
      expect(result.name).toBe('Finish report');
      expect(result.labelIds).toContain('label-1');
      expect(result.priority).toBe('high');
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getDate()).toBe(new Date().getDate() + 1);
      expect(result.date?.getHours()).toBe(17);
      expect(result.estimate).toBe('02:00');
    });

    it('should default to "Untitled task" for empty name', () => {
      const result = parseNaturalLanguage('   ', defaultOptions);
      expect(result.name).toBe('Untitled task');
    });

    it('should use defaultPriority when no priority keyword found', () => {
      const options = { ...defaultOptions, defaultPriority: 'low' as Priority };
      const result = parseNaturalLanguage('Simple task', options);
      expect(result.priority).toBe('low');
    });

    it('should handle "asap" as high priority', () => {
      const result = parseNaturalLanguage('Fix critical bug asap', defaultOptions);
      expect(result.priority).toBe('high');
    });

    it('should handle "critical" as high priority', () => {
      const result = parseNaturalLanguage('Server down critical', defaultOptions);
      expect(result.priority).toBe('high');
    });
  });
});
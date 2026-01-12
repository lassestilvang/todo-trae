import { describe, expect, test, beforeEach } from 'bun:test';
import { useTaskStore } from '../src/stores/taskStore';
import { useThemeStore } from '../src/stores/themeStore';

describe('Store Tests', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      lists: [],
      labels: [],
      subtasks: [],
      attachments: [],
      activityLogs: [],
      selectedListId: null,
      selectedView: 'today',
      searchQuery: '',
      showCompleted: true,
      isLoading: false,
    });
    useThemeStore.setState({ theme: 'system', isDarkMode: false });
  });
  describe('Task Store', () => {
    test('should add a new task', () => {
      const store = useTaskStore.getState();
      
      const newTask = {
        id: 'test-task-1',
        listId: 'default-inbox',
        name: 'Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      };

      store.addTask(newTask);

      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].name).toBe('Test Task');
    });

    test('should update a task', () => {
      const store = useTaskStore.getState();
      
      const newTask = {
        id: 'test-task-2',
        listId: 'default-inbox',
        name: 'Original Task',
        priority: 'low' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      };

      store.addTask(newTask);
      store.updateTask('test-task-2', { name: 'Updated Task', priority: 'high' as const });

      expect(store.tasks[0].name).toBe('Updated Task');
      expect(store.tasks[0].priority).toBe('high');
    });

    test('should toggle task completion', () => {
      const store = useTaskStore.getState();
      
      const newTask = {
        id: 'test-task-3',
        listId: 'default-inbox',
        name: 'Toggle Test Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      };

      store.addTask(newTask);
      store.toggleTaskComplete('test-task-3');

      expect(store.tasks[0].completed).toBe(true);
      expect(store.tasks[0].completedAt).toBeDefined();

      store.toggleTaskComplete('test-task-3');

      expect(store.tasks[0].completed).toBe(false);
      expect(store.tasks[0].completedAt).toBeUndefined();
    });

    test('should delete a task', () => {
      const store = useTaskStore.getState();
      
      const newTask = {
        id: 'test-task-4',
        listId: 'default-inbox',
        name: 'Delete Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      };

      store.addTask(newTask);

      expect(store.tasks).toHaveLength(1);

      store.deleteTask('test-task-4');

      expect(store.tasks).toHaveLength(0);
    });

    test('should filter tasks by search query', () => {
      const store = useTaskStore.getState();
      
      const tasks = [
        {
          id: 'task-1',
          listId: 'default-inbox',
          name: 'Buy groceries',
          priority: 'medium' as const,
          completed: false,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          reminders: [],
        },
        {
          id: 'task-2',
          listId: 'default-inbox',
          name: 'Clean house',
          priority: 'low' as const,
          completed: false,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          reminders: [],
        },
      ];

      tasks.forEach(task => store.addTask(task));

      store.setSearchQuery('groceries');

      expect(store.searchQuery).toBe('groceries');
    });
  });

  describe('Theme Store', () => {
    test('should toggle dark mode', () => {
      const store = useThemeStore.getState();
      const initialDarkMode = store.isDarkMode;
      store.toggleDarkMode();
      expect(store.isDarkMode).toBe(!initialDarkMode);
      expect(store.theme).toBe(initialDarkMode ? 'light' : 'dark');
    });

    test('should set theme', () => {
      const store = useThemeStore.getState();
      store.setTheme('dark');
      expect(store.theme).toBe('dark');
      expect(store.isDarkMode).toBe(true);
      store.setTheme('light');
      expect(store.theme).toBe('light');
      expect(store.isDarkMode).toBe(false);
    });
  });
});

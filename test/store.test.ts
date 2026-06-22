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
      useTaskStore.getState().addTask({
        id: 'test-task-1',
        listId: 'default-inbox',
        name: 'Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      });

      const store = useTaskStore.getState();
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].name).toBe('Test Task');
    });

    test('should update a task', () => {
      useTaskStore.getState().addTask({
        id: 'test-task-2',
        listId: 'default-inbox',
        name: 'Original Task',
        priority: 'low' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      });

      useTaskStore.getState().updateTask('test-task-2', { name: 'Updated Task', priority: 'high' as const });

      const store = useTaskStore.getState();
      expect(store.tasks[0].name).toBe('Updated Task');
      expect(store.tasks[0].priority).toBe('high');
    });

    test('should toggle task completion', () => {
      useTaskStore.getState().addTask({
        id: 'test-task-3',
        listId: 'default-inbox',
        name: 'Toggle Test Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      });

      useTaskStore.getState().toggleTaskComplete('test-task-3');

      let store = useTaskStore.getState();
      expect(store.tasks[0].completed).toBe(true);
      expect(store.tasks[0].completedAt).toBeDefined();

      useTaskStore.getState().toggleTaskComplete('test-task-3');

      store = useTaskStore.getState();
      expect(store.tasks[0].completed).toBe(false);
      expect(store.tasks[0].completedAt).toBeUndefined();
    });

    test('should delete a task', () => {
      useTaskStore.getState().addTask({
        id: 'test-task-4',
        listId: 'default-inbox',
        name: 'Delete Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      });

      let store = useTaskStore.getState();
      expect(store.tasks).toHaveLength(1);

      useTaskStore.getState().deleteTask('test-task-4');

      store = useTaskStore.getState();
      expect(store.tasks).toHaveLength(0);
    });

    test('should filter tasks by search query', () => {
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

      tasks.forEach(task => useTaskStore.getState().addTask(task));

      useTaskStore.getState().setSearchQuery('groceries');

      const store = useTaskStore.getState();
      expect(store.searchQuery).toBe('groceries');
    });
  });

  describe('Theme Store', () => {
    test('should toggle dark mode', () => {
      const initialDarkMode = useThemeStore.getState().isDarkMode;
      useThemeStore.getState().toggleDarkMode();
      const store = useThemeStore.getState();
      expect(store.isDarkMode).toBe(!initialDarkMode);
      expect(store.theme).toBe(initialDarkMode ? 'light' : 'dark');
    });

    test('should set theme', () => {
      useThemeStore.getState().setTheme('dark');
      let store = useThemeStore.getState();
      expect(store.theme).toBe('dark');
      expect(store.isDarkMode).toBe(true);

      useThemeStore.getState().setTheme('light');
      store = useThemeStore.getState();
      expect(store.theme).toBe('light');
      expect(store.isDarkMode).toBe(false);
    });
  });
});

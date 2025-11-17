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
    test('should have initial state', () => {
      const store = useTaskStore.getState();
      
      expect(store.tasks).toEqual([]);
      expect(store.lists).toEqual([]);
      expect(store.labels).toEqual([]);
      expect(store.selectedListId).toBeNull();
      expect(store.selectedView).toBe('today');
      expect(store.searchQuery).toBe('');
      expect(store.showCompleted).toBe(true);
      expect(store.isLoading).toBe(false);
    });

    test('should set tasks', () => {
      const mockTasks = [
        {
          id: 'task-1',
          listId: 'default-inbox',
          name: 'Test Task 1',
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
          name: 'Test Task 2',
          priority: 'high' as const,
          completed: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          reminders: [],
        },
      ];

      useTaskStore.setState({ tasks: mockTasks });
      const store = useTaskStore.getState();
      
      expect(store.tasks).toHaveLength(2);
      expect(store.tasks[0].name).toBe('Test Task 1');
      expect(store.tasks[1].name).toBe('Test Task 2');
    });

    test('should add a task', () => {
      // Reset state
      useTaskStore.setState({ tasks: [] });
      
      const newTask = {
        id: 'task-3',
        listId: 'default-inbox',
        name: 'New Task',
        priority: 'low' as const,
        completed: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: [],
      };

      useTaskStore.getState().addTask(newTask);
      const store = useTaskStore.getState();
      
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].name).toBe('New Task');
      expect(store.tasks[0].priority).toBe('low');
    });

    test('should delete a task', () => {
      const mockTasks = [
        {
          id: 'task-4',
          listId: 'default-inbox',
          name: 'Task to Delete',
          priority: 'medium' as const,
          completed: false,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          reminders: [],
        },
      ];

      useTaskStore.setState({ tasks: mockTasks });
      useTaskStore.getState().deleteTask('task-4');
      const store = useTaskStore.getState();
      
      expect(store.tasks).toHaveLength(0);
    });

    test('should update selected view', () => {
      useTaskStore.getState().setSelectedView('next7days');
      const store = useTaskStore.getState();
      
      expect(store.selectedView).toBe('next7days');
    });

    test('should update search query', () => {
      useTaskStore.getState().setSearchQuery('test search');
      const store = useTaskStore.getState();
      
      expect(store.searchQuery).toBe('test search');
    });
  });

  describe('Theme Store', () => {
    test('should have initial state', () => {
      const store = useThemeStore.getState();
      
      expect(store.theme).toBe('system');
      expect(store.isDarkMode).toBe(false);
    });

    test('should set theme', () => {
      useThemeStore.getState().setTheme('dark');
      const store = useThemeStore.getState();
      
      expect(store.theme).toBe('dark');
      expect(store.isDarkMode).toBe(true);

      useThemeStore.getState().setTheme('light');
      const updatedStore = useThemeStore.getState();
      
      expect(updatedStore.theme).toBe('light');
      expect(updatedStore.isDarkMode).toBe(false);
    });
  });
});
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
      selectedLabelId: null,
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

    test('should set selected label', () => {
      useTaskStore.getState().setSelectedLabelId('label-1');
      const store = useTaskStore.getState();
      expect(store.selectedLabelId).toBe('label-1');
    });

    test('should clear selected label when setting selected list', () => {
      useTaskStore.getState().setSelectedLabelId('label-1');
      useTaskStore.getState().setSelectedListId('list-1');
      const store = useTaskStore.getState();
      expect(store.selectedLabelId).toBeNull();
      expect(store.selectedListId).toBe('list-1');
    });

    test('should clear selected list and set view to all when selecting a label', () => {
      useTaskStore.getState().setSelectedListId('list-1');
      useTaskStore.getState().setSelectedLabelId('label-1');
      const store = useTaskStore.getState();
      expect(store.selectedListId).toBeNull();
      expect(store.selectedView).toBe('all');
      expect(store.selectedLabelId).toBe('label-1');
    });

    test('should clear selected label when changing view', () => {
      useTaskStore.getState().setSelectedLabelId('label-1');
      useTaskStore.getState().setSelectedView('today');
      const store = useTaskStore.getState();
      expect(store.selectedLabelId).toBeNull();
      expect(store.selectedView).toBe('today');
    });

    test('should add and delete labels', () => {
      const label = {
        id: 'label-1',
        name: 'Work',
        color: '#FF0000',
        icon: '💼',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useTaskStore.getState().addLabel(label);
      let store = useTaskStore.getState();
      expect(store.labels).toHaveLength(1);
      expect(store.labels[0].name).toBe('Work');

      useTaskStore.getState().updateLabel('label-1', { name: 'Personal' });
      store = useTaskStore.getState();
      expect(store.labels[0].name).toBe('Personal');

      useTaskStore.getState().deleteLabel('label-1');
      store = useTaskStore.getState();
      expect(store.labels).toHaveLength(0);
    });

    test('should reorder tasks within a list', () => {
      useTaskStore.setState({
        tasks: [
          { id: 'task-1', listId: 'list-1', name: 'Task 1', priority: 'none' as const, completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-2', listId: 'list-1', name: 'Task 2', priority: 'none' as const, completed: false, order: 1, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-3', listId: 'list-1', name: 'Task 3', priority: 'none' as const, completed: false, order: 2, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-4', listId: 'list-2', name: 'Task 4', priority: 'none' as const, completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
        ],
        lists: [],
        labels: [],
        selectedListId: null,
        selectedLabelId: null,
        selectedView: 'today',
        searchQuery: '',
        showCompleted: true,
        isLoading: false,
        subtasks: [],
        attachments: [],
        activityLogs: [],
      });

      // Reorder: task-3, task-1, task-2
      useTaskStore.getState().reorderTasks('list-1', ['task-3', 'task-1', 'task-2']);

      const store = useTaskStore.getState();
      const tasksInList = store.tasks.filter(t => t.listId === 'list-1');
      const task3 = tasksInList.find(t => t.id === 'task-3');
      const task1 = tasksInList.find(t => t.id === 'task-1');
      const task2 = tasksInList.find(t => t.id === 'task-2');

      expect(task3?.order).toBe(0);
      expect(task1?.order).toBe(1);
      expect(task2?.order).toBe(2);
      // Task 4 in list-2 should be unchanged
      const task4 = store.tasks.find(t => t.id === 'task-4');
      expect(task4?.order).toBe(0);
    });

    test('should delete list efficiently using Set-based lookup', () => {
      // Add a list with tasks, subtasks, and attachments
      useTaskStore.setState({
        tasks: [
          { id: 'task-1', listId: 'list-to-delete', name: 'Task 1', priority: 'none', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-2', listId: 'other-list', name: 'Task 2', priority: 'none', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-3', listId: 'list-to-delete', name: 'Task 3', priority: 'none', completed: false, order: 1, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
        ],
        lists: [
          { id: 'list-to-delete', name: 'Delete Me', color: '#3B82F6', emoji: '📋', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
          { id: 'other-list', name: 'Keep Me', color: '#EF4444', emoji: '📝', isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        subtasks: [
          { id: 'sub-1', taskId: 'task-1', name: 'Subtask 1', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date() },
          { id: 'sub-2', taskId: 'task-2', name: 'Subtask 2', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date() },
        ],
        attachments: [
          { id: 'att-1', taskId: 'task-1', filename: 'file.txt', filePath: '/tmp/file.txt', fileSize: 100, mimeType: 'text/plain', createdAt: new Date() },
        ],
        selectedListId: null,
        selectedLabelId: null,
        selectedView: 'today',
        searchQuery: '',
        showCompleted: true,
        isLoading: false,
      });

      useTaskStore.getState().deleteList('list-to-delete');

      const store = useTaskStore.getState();
      // List should be deleted
      expect(store.lists).toHaveLength(1);
      expect(store.lists[0].id).toBe('other-list');
      // Tasks in deleted list should be removed
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].id).toBe('task-2');
      // Subtasks for tasks in deleted list should be removed (task-1 had sub-1)
      expect(store.subtasks).toHaveLength(1);
      expect(store.subtasks[0].taskId).toBe('task-2');
      // Attachments for tasks in deleted list should be removed (task-1 had att-1)
      expect(store.attachments).toHaveLength(0);
    });
  });

  describe('Bulk Selection', () => {
    test('should select a single task', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(),
      });

      useTaskStore.getState().selectTask('task-1');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.has('task-1')).toBe(true);
    });

    test('should select multiple tasks', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(),
      });

      useTaskStore.getState().selectTask('task-1');
      useTaskStore.getState().selectTask('task-2');
      useTaskStore.getState().selectTask('task-3');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(3);
      expect(store.selectedTaskIds.has('task-1')).toBe(true);
      expect(store.selectedTaskIds.has('task-2')).toBe(true);
      expect(store.selectedTaskIds.has('task-3')).toBe(true);
    });

    test('should deselect a task', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1', 'task-2']),
      });

      useTaskStore.getState().deselectTask('task-1');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(1);
      expect(store.selectedTaskIds.has('task-1')).toBe(false);
      expect(store.selectedTaskIds.has('task-2')).toBe(true);
    });

    test('should select all tasks', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(),
      });

      useTaskStore.getState().selectAllTasks(['task-1', 'task-2', 'task-3']);
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(3);
      expect(store.selectedTaskIds.has('task-1')).toBe(true);
      expect(store.selectedTaskIds.has('task-2')).toBe(true);
      expect(store.selectedTaskIds.has('task-3')).toBe(true);
    });

    test('should clear selection', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1', 'task-2', 'task-3']),
      });

      useTaskStore.getState().clearSelection();
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(0);
    });

    test('should check if task is selected', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1']),
      });

      expect(useTaskStore.getState().isTaskSelected('task-1')).toBe(true);
      expect(useTaskStore.getState().isTaskSelected('task-2')).toBe(false);
    });

    test('should remove task from selection on delete', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1', 'task-2']),
        tasks: [
          { id: 'task-1', listId: 'list-1', name: 'Task 1', priority: 'none', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-2', listId: 'list-1', name: 'Task 2', priority: 'none', completed: false, order: 1, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
        ],
      });

      useTaskStore.getState().deleteTask('task-1');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.has('task-1')).toBe(false);
      expect(store.selectedTaskIds.has('task-2')).toBe(true);
      expect(store.tasks).toHaveLength(1);
    });

    test('should not duplicate selection when selecting same task twice', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(),
      });

      useTaskStore.getState().selectTask('task-1');
      useTaskStore.getState().selectTask('task-1');
      expect(useTaskStore.getState().selectedTaskIds.size).toBe(1);
    });

    test('should not error when deselecting unselected task', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1']),
      });

      useTaskStore.getState().deselectTask('nonexistent');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(1);
      expect(store.selectedTaskIds.has('task-1')).toBe(true);
    });

    test('should clear non-existent task from selection on delete', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1']),
        tasks: [
          { id: 'task-1', listId: 'list-1', name: 'Task 1', priority: 'none', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
        ],
      });

      useTaskStore.getState().deleteTask('nonexistent');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(1);
      expect(store.tasks).toHaveLength(1);
    });

    test('should preserve other selections when deleting unselected task', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1']),
        tasks: [
          { id: 'task-1', listId: 'list-1', name: 'Task 1', priority: 'none', completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
          { id: 'task-2', listId: 'list-1', name: 'Task 2', priority: 'none', completed: false, order: 1, createdAt: new Date(), updatedAt: new Date(), reminders: [] },
        ],
      });

      useTaskStore.getState().deleteTask('task-2');
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.has('task-1')).toBe(true);
      expect(store.selectedTaskIds.has('task-2')).toBe(false);
      expect(store.tasks).toHaveLength(1);
    });

    test('should handle selectAllTasks with empty array', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['existing']),
      });

      useTaskStore.getState().selectAllTasks([]);
      expect(useTaskStore.getState().selectedTaskIds.size).toBe(0);
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

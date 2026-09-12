import { describe, it, expect, beforeEach } from 'bun:test';
import { useTaskStore } from '../src/stores/taskStore';
import { Task, TaskList, Label, Subtask, Attachment } from '../src/types';

// Helper to create a mock task
const createMockTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  listId: 'default-inbox',
  name: `Task ${id}`,
  priority: 'none',
  completed: false,
  order: 0,
  reminders: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create a mock list
const createMockList = (id: string, overrides: Partial<TaskList> = {}): TaskList => ({
  id,
  name: `List ${id}`,
  color: '#3B82F6',
  emoji: '📋',
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create a mock label
const createMockLabel = (id: string, overrides: Partial<Label> = {}): Label => ({
  id,
  name: `Label ${id}`,
  color: '#6B7280',
  icon: '🏷️',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create a mock subtask
const createMockSubtask = (
  id: string,
  taskId: string,
  overrides: Partial<Subtask> = {}
): Subtask => ({
  id,
  taskId,
  name: `Subtask ${id}`,
  completed: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create a mock attachment
const createMockAttachment = (
  id: string,
  taskId: string,
  overrides: Partial<Attachment> = {}
): Attachment => ({
  id,
  taskId,
  filename: 'file.txt',
  filePath: '/tmp/file.txt',
  fileSize: 100,
  mimeType: 'text/plain',
  createdAt: new Date(),
  ...overrides,
});

describe('Store Operations - Comprehensive Tests', () => {
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
      selectedTaskIds: new Set(),
    });
  });

  describe('Task Operations', () => {
    it('should add multiple tasks in sequence', () => {
      useTaskStore.getState().addTask(createMockTask('task-1'));
      useTaskStore.getState().addTask(createMockTask('task-2'));
      useTaskStore.getState().addTask(createMockTask('task-3'));

      expect(useTaskStore.getState().tasks).toHaveLength(3);
    });

    it('should update task by appending to existing fields', () => {
      const task = createMockTask('task-1', { name: 'Original', priority: 'low' });
      useTaskStore.getState().addTask(task);

      useTaskStore.getState().updateTask('task-1', { priority: 'high' });

      const updated = useTaskStore.getState().tasks[0];
      expect(updated.priority).toBe('high');
      expect(updated.name).toBe('Original'); // Unchanged
    });

    it('should toggle task completion on and off', () => {
      useTaskStore.getState().addTask(createMockTask('task-1', { completed: false }));

      useTaskStore.getState().toggleTaskComplete('task-1');
      expect(useTaskStore.getState().tasks[0].completed).toBe(true);

      useTaskStore.getState().toggleTaskComplete('task-1');
      expect(useTaskStore.getState().tasks[0].completed).toBe(false);
    });

    it('should handle deleteTask when task does not exist', () => {
      useTaskStore.getState().addTask(createMockTask('task-1'));

      // Try to delete a non-existent task
      useTaskStore.getState().deleteTask('nonexistent');

      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('should delete associated subtasks and attachments with task', () => {
      useTaskStore.setState({
        tasks: [createMockTask('task-1')],
        subtasks: [createMockSubtask('sub-1', 'task-1'), createMockSubtask('sub-2', 'task-1')],
        attachments: [createMockAttachment('att-1', 'task-1')],
      });

      useTaskStore.getState().deleteTask('task-1');

      const store = useTaskStore.getState();
      expect(store.tasks).toHaveLength(0);
      expect(store.subtasks).toHaveLength(0);
      expect(store.attachments).toHaveLength(0);
    });

    it('should set tasks (replace entire list)', () => {
      useTaskStore.getState().addTask(createMockTask('old-1'));
      useTaskStore.getState().addTask(createMockTask('old-2'));

      useTaskStore
        .getState()
        .setTasks([createMockTask('new-1'), createMockTask('new-2'), createMockTask('new-3')]);

      expect(useTaskStore.getState().tasks).toHaveLength(3);
      expect(useTaskStore.getState().tasks.map((t) => t.id)).toEqual(['new-1', 'new-2', 'new-3']);
    });
  });

  describe('Subtask Operations', () => {
    it('should add a subtask', () => {
      useTaskStore.getState().addSubtask(createMockSubtask('sub-1', 'task-1'));
      expect(useTaskStore.getState().subtasks).toHaveLength(1);
    });

    it('should update a subtask', () => {
      useTaskStore.getState().addSubtask(createMockSubtask('sub-1', 'task-1'));
      useTaskStore.getState().updateSubtask('sub-1', { name: 'Updated', completed: true });

      const sub = useTaskStore.getState().subtasks[0];
      expect(sub.name).toBe('Updated');
      expect(sub.completed).toBe(true);
    });

    it('should delete a subtask', () => {
      useTaskStore.getState().addSubtask(createMockSubtask('sub-1', 'task-1'));
      useTaskStore.getState().deleteSubtask('sub-1');
      expect(useTaskStore.getState().subtasks).toHaveLength(0);
    });

    it('should toggle subtask completion', () => {
      useTaskStore
        .getState()
        .addSubtask(createMockSubtask('sub-1', 'task-1', { completed: false }));
      useTaskStore.getState().toggleSubtaskComplete('sub-1');
      expect(useTaskStore.getState().subtasks[0].completed).toBe(true);
    });

    it('should handle toggleSubtaskComplete on non-existent subtask gracefully', () => {
      useTaskStore.getState().toggleSubtaskComplete('nonexistent');
      // No crash, no changes
      expect(useTaskStore.getState().subtasks).toHaveLength(0);
    });
  });

  describe('Attachment Operations', () => {
    it('should add an attachment', () => {
      useTaskStore.getState().addAttachment(createMockAttachment('att-1', 'task-1'));
      expect(useTaskStore.getState().attachments).toHaveLength(1);
    });

    it('should delete an attachment', () => {
      useTaskStore.getState().addAttachment(createMockAttachment('att-1', 'task-1'));
      useTaskStore.getState().deleteAttachment('att-1');
      expect(useTaskStore.getState().attachments).toHaveLength(0);
    });

    it('should handle deleteAttachment on non-existent attachment gracefully', () => {
      useTaskStore.getState().addAttachment(createMockAttachment('att-1', 'task-1'));
      useTaskStore.getState().deleteAttachment('nonexistent');
      expect(useTaskStore.getState().attachments).toHaveLength(1);
    });
  });

  describe('Label Operations', () => {
    it('should add a label', () => {
      useTaskStore.getState().addLabel(createMockLabel('label-1'));
      expect(useTaskStore.getState().labels).toHaveLength(1);
    });

    it('should update a label', () => {
      useTaskStore.getState().addLabel(createMockLabel('label-1', { name: 'Original' }));
      useTaskStore.getState().updateLabel('label-1', { name: 'Updated', color: '#FF0000' });

      const label = useTaskStore.getState().labels[0];
      expect(label.name).toBe('Updated');
      expect(label.color).toBe('#FF0000');
    });

    it('should delete a label', () => {
      useTaskStore.getState().addLabel(createMockLabel('label-1'));
      useTaskStore.getState().deleteLabel('label-1');
      expect(useTaskStore.getState().labels).toHaveLength(0);
    });

    it('should handle deleteLabel on non-existent label gracefully', () => {
      useTaskStore.getState().addLabel(createMockLabel('label-1'));
      useTaskStore.getState().deleteLabel('nonexistent');
      expect(useTaskStore.getState().labels).toHaveLength(1);
    });
  });

  describe('List Operations', () => {
    it('should add a list', () => {
      useTaskStore.getState().addList(createMockList('list-1'));
      expect(useTaskStore.getState().lists).toHaveLength(1);
    });

    it('should update a list', () => {
      useTaskStore.getState().addList(createMockList('list-1', { name: 'Original' }));
      useTaskStore.getState().updateList('list-1', { name: 'Updated' });

      expect(useTaskStore.getState().lists[0].name).toBe('Updated');
    });

    it('should delete a list and its tasks', () => {
      useTaskStore.setState({
        lists: [createMockList('list-1'), createMockList('list-2')],
        tasks: [
          createMockTask('task-1', { listId: 'list-1' }),
          createMockTask('task-2', { listId: 'list-1' }),
          createMockTask('task-3', { listId: 'list-2' }),
        ],
      });

      useTaskStore.getState().deleteList('list-1');

      const store = useTaskStore.getState();
      expect(store.lists).toHaveLength(1);
      expect(store.lists[0].id).toBe('list-2');
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].id).toBe('task-3');
    });

    it('should handle deleteList on non-existent list gracefully', () => {
      useTaskStore.setState({
        lists: [createMockList('list-1')],
        tasks: [createMockTask('task-1', { listId: 'list-1' })],
      });

      useTaskStore.getState().deleteList('nonexistent');

      expect(useTaskStore.getState().lists).toHaveLength(1);
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('should clean up subtasks when deleting a list', () => {
      useTaskStore.setState({
        lists: [createMockList('list-1')],
        tasks: [createMockTask('task-1', { listId: 'list-1' })],
        subtasks: [createMockSubtask('sub-1', 'task-1'), createMockSubtask('sub-2', 'task-1')],
      });

      useTaskStore.getState().deleteList('list-1');

      const store = useTaskStore.getState();
      expect(store.subtasks).toHaveLength(0);
      expect(store.tasks).toHaveLength(0);
    });

    it('should clean up attachments when deleting a list', () => {
      useTaskStore.setState({
        lists: [createMockList('list-1')],
        tasks: [createMockTask('task-1', { listId: 'list-1' })],
        attachments: [createMockAttachment('att-1', 'task-1')],
      });

      useTaskStore.getState().deleteList('list-1');

      expect(useTaskStore.getState().attachments).toHaveLength(0);
    });
  });

  describe('Reorder Operations', () => {
    it('should reorder tasks within a list', () => {
      useTaskStore.setState({
        tasks: [
          { ...createMockTask('task-1', { order: 0 }), listId: 'list-1' },
          { ...createMockTask('task-2', { order: 1 }), listId: 'list-1' },
          { ...createMockTask('task-3', { order: 2 }), listId: 'list-1' },
        ],
      });

      useTaskStore.getState().reorderTasks('list-1', ['task-3', 'task-1', 'task-2']);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks.find((t) => t.id === 'task-3')?.order).toBe(0);
      expect(tasks.find((t) => t.id === 'task-1')?.order).toBe(1);
      expect(tasks.find((t) => t.id === 'task-2')?.order).toBe(2);
    });

    it('should not reorder tasks in other lists', () => {
      useTaskStore.setState({
        tasks: [
          { ...createMockTask('task-1', { order: 0 }), listId: 'list-1' },
          { ...createMockTask('task-2', { order: 1 }), listId: 'list-1' },
          { ...createMockTask('task-3', { order: 0 }), listId: 'list-2' },
        ],
      });

      useTaskStore.getState().reorderTasks('list-1', ['task-2', 'task-1']);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks.find((t) => t.id === 'task-3')?.order).toBe(0);
      expect(tasks.find((t) => t.id === 'task-2')?.order).toBe(0);
      expect(tasks.find((t) => t.id === 'task-1')?.order).toBe(1);
    });

    it('should handle reordering with task not in list (no-op for that task)', () => {
      useTaskStore.setState({
        tasks: [
          { ...createMockTask('task-1', { order: 0 }), listId: 'list-1' },
          { ...createMockTask('task-2', { order: 1 }), listId: 'list-1' },
          { ...createMockTask('task-3', { order: 0 }), listId: 'list-2' },
        ],
      });

      useTaskStore.getState().reorderTasks('list-1', ['task-1', 'task-2']);

      // task-3 should not be affected since it's in list-2
      const task3 = useTaskStore.getState().tasks.find((t) => t.id === 'task-3');
      expect(task3?.order).toBe(0);
    });

    it('should handle empty orderedIds array', () => {
      useTaskStore.setState({
        tasks: [{ ...createMockTask('task-1', { order: 5 }), listId: 'list-1' }],
      });

      useTaskStore.getState().reorderTasks('list-1', []);

      // No crash, task order unchanged since the new Set is empty
      expect(useTaskStore.getState().tasks.find((t) => t.id === 'task-1')?.order).toBe(5);
    });
  });

  describe('View and Filter Operations', () => {
    it('should clear selectedLabelId when setting selectedListId', () => {
      useTaskStore.getState().setSelectedLabelId('label-1');
      useTaskStore.getState().setSelectedListId('list-1');
      const store = useTaskStore.getState();
      expect(store.selectedLabelId).toBeNull();
      expect(store.selectedListId).toBe('list-1');
    });

    it('should clear selectedListId and set view to all when setting selectedLabelId', () => {
      useTaskStore.getState().setSelectedListId('list-1');
      useTaskStore.getState().setSelectedView('today');
      useTaskStore.getState().setSelectedLabelId('label-1');
      const store = useTaskStore.getState();
      expect(store.selectedListId).toBeNull();
      expect(store.selectedView).toBe('all');
      expect(store.selectedLabelId).toBe('label-1');
    });

    it('should clear selectedLabelId when changing view', () => {
      useTaskStore.getState().setSelectedLabelId('label-1');
      useTaskStore.getState().setSelectedView('next7days');
      const store = useTaskStore.getState();
      expect(store.selectedLabelId).toBeNull();
      expect(store.selectedView).toBe('next7days');
    });

    it('should set search query', () => {
      useTaskStore.getState().setSearchQuery('buy groceries');
      expect(useTaskStore.getState().searchQuery).toBe('buy groceries');
    });

    it('should set showCompleted flag', () => {
      useTaskStore.getState().setShowCompleted(false);
      expect(useTaskStore.getState().showCompleted).toBe(false);
    });

    it('should set isLoading flag', () => {
      useTaskStore.getState().setIsLoading(true);
      expect(useTaskStore.getState().isLoading).toBe(true);
    });
  });

  describe('Bulk Selection Operations', () => {
    it('should select task and verify it is selected', () => {
      useTaskStore.getState().selectTask('task-1');
      expect(useTaskStore.getState().isTaskSelected('task-1')).toBe(true);
    });

    it('should deselect task and verify it is not selected', () => {
      useTaskStore.getState().selectTask('task-1');
      useTaskStore.getState().deselectTask('task-1');
      expect(useTaskStore.getState().isTaskSelected('task-1')).toBe(false);
    });

    it('should select all tasks when given a list of IDs', () => {
      useTaskStore.getState().selectAllTasks(['task-1', 'task-2', 'task-3']);
      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.size).toBe(3);
      expect(store.isTaskSelected('task-1')).toBe(true);
      expect(store.isTaskSelected('task-2')).toBe(true);
      expect(store.isTaskSelected('task-3')).toBe(true);
    });

    it('should clear selection', () => {
      useTaskStore.setState({ selectedTaskIds: new Set(['task-1', 'task-2']) });
      useTaskStore.getState().clearSelection();
      expect(useTaskStore.getState().selectedTaskIds.size).toBe(0);
    });

    it('should remove deleted task from selection', () => {
      useTaskStore.setState({
        selectedTaskIds: new Set(['task-1', 'task-2']),
        tasks: [createMockTask('task-1'), createMockTask('task-2')],
      });

      useTaskStore.getState().deleteTask('task-1');

      const store = useTaskStore.getState();
      expect(store.selectedTaskIds.has('task-1')).toBe(false);
      expect(store.selectedTaskIds.has('task-2')).toBe(true);
    });
  });

  describe('Activity Log Operations', () => {
    it('should add activity log at the beginning of the array', () => {
      useTaskStore.getState().addActivityLog({
        id: 'log-1',
        action: 'created',
        taskId: 'task-1',
        createdAt: new Date(),
      });
      useTaskStore.getState().addActivityLog({
        id: 'log-2',
        action: 'updated',
        taskId: 'task-1',
        createdAt: new Date(),
      });

      const logs = useTaskStore.getState().activityLogs;
      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe('log-2'); // Most recent first
    });

    it('should handle multiple activity logs', () => {
      for (let i = 0; i < 5; i++) {
        useTaskStore.getState().addActivityLog({
          id: `log-${i}`,
          action: 'created' as const,
          createdAt: new Date(),
        });
      }

      const logs = useTaskStore.getState().activityLogs;
      expect(logs).toHaveLength(5);
      // Most recent should be first (log-4)
      expect(logs[0].id).toBe('log-4');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle updateTask on non-existent task (no-op)', () => {
      useTaskStore.getState().addTask(createMockTask('task-1'));
      useTaskStore.getState().updateTask('nonexistent', { name: 'Updated' });

      // Task list unchanged
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Task task-1');
    });

    it('should preserve task fields when updating with partial data', () => {
      useTaskStore.getState().addTask(
        createMockTask('task-1', {
          name: 'Original',
          priority: 'high',
          completed: false,
        })
      );

      useTaskStore.getState().updateTask('task-1', { name: 'Updated' });

      const task = useTaskStore.getState().tasks[0];
      expect(task.name).toBe('Updated');
      expect(task.priority).toBe('high');
      expect(task.completed).toBe(false);
    });

    it('should handle setTasks completely replacing all tasks', () => {
      useTaskStore.getState().addTask(createMockTask('task-1'));
      useTaskStore.getState().addTask(createMockTask('task-2'));

      useTaskStore.getState().setTasks([createMockTask('task-3')]);

      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].id).toBe('task-3');
    });

    it('should set all store state fields at once', () => {
      useTaskStore.setState({
        tasks: [createMockTask('task-1')],
        lists: [createMockList('list-1')],
        labels: [createMockLabel('label-1')],
        subtasks: [],
        attachments: [],
        activityLogs: [],
        selectedListId: 'list-1',
        selectedLabelId: null,
        selectedView: 'today',
        searchQuery: '',
        showCompleted: true,
        isLoading: false,
        selectedTaskIds: new Set(['task-1']),
      });

      const store = useTaskStore.getState();
      expect(store.tasks).toHaveLength(1);
      expect(store.lists).toHaveLength(1);
      expect(store.labels).toHaveLength(1);
      expect(store.selectedListId).toBe('list-1');
      expect(store.selectedTaskIds.has('task-1')).toBe(true);
    });
  });
});

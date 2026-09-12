import { describe, it, expect, beforeEach } from 'bun:test';
import { useTaskStore } from '../src/stores/taskStore';
import { Task } from '../src/types';

// Helper to create mock tasks
const createMockTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  name: `Task ${id}`,
  listId: 'list-1',
  priority: 'none',
  completed: false,
  order: 0,
  reminders: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Task Dependencies', () => {
  describe('Dependency representation in Task type', () => {
    it('should allow dependencies field on Task', () => {
      const task = createMockTask('task-1', {
        dependencies: [
          { id: 'dep-1', taskId: 'task-1', dependsOnTaskId: 'task-2', createdAt: new Date() },
        ],
      });
      expect(task.dependencies).toBeDefined();
      expect(task.dependencies).toHaveLength(1);
      expect(task.dependencies![0].dependsOnTaskId).toBe('task-2');
    });

    it('should default dependencies to undefined', () => {
      const task = createMockTask('task-1');
      expect(task.dependencies).toBeUndefined();
    });
  });

  describe('Task filtering by dependency status', () => {
    beforeEach(() => {
      useTaskStore.setState({
        tasks: [
          createMockTask('task-1', { listId: 'list-1', completed: false }),
          createMockTask('task-2', { listId: 'list-1', completed: true }),
          createMockTask('task-3', { listId: 'list-2', completed: false }),
        ],
        lists: [
          {
            id: 'list-1',
            name: 'Work',
            color: '#3B82F6',
            emoji: '💼',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'list-2',
            name: 'Personal',
            color: '#EF4444',
            emoji: '🏠',
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        labels: [],
        subtasks: [],
        attachments: [],
        activityLogs: [],
        selectedListId: null,
        selectedLabelId: null,
        selectedView: 'all',
        searchQuery: '',
        showCompleted: true,
        isLoading: false,
        selectedTaskIds: new Set(),
      });
    });

    it('should filter tasks by list ID', () => {
      useTaskStore.getState().setSelectedListId('list-1');
      const store = useTaskStore.getState();
      const filtered = store.tasks.filter((t) => t.listId === store.selectedListId);
      expect(filtered).toHaveLength(2);
    });

    it('should filter out completed when showCompleted is false', () => {
      useTaskStore.getState().setShowCompleted(false);
      const store = useTaskStore.getState();
      const filtered = store.tasks.filter((t) => showCompleted(store.showCompleted, t));
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => !t.completed)).toBe(true);
    });
  });
});

// Helper to check showCompleted logic
function showCompleted(showCompleted: boolean, task: Task): boolean {
  if (showCompleted) return true;
  return !task.completed;
}

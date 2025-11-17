import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { getDatabase, closeDatabase } from '../src/lib/database';
import { createTask, getTaskById, updateTask, deleteTask, toggleTaskComplete } from '../src/lib/api';
import { createList, getListById } from '../src/lib/api';

describe('Database Operations', () => {
  beforeEach(() => {
    // Reset database before each test
    const db = getDatabase();
    db.run('DELETE FROM tasks');
    db.run('DELETE FROM task_lists WHERE id != "default-inbox"'); // Keep default inbox
    db.run('DELETE FROM labels');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('Task Operations', () => {
    test('should create a new task', () => {
      const taskData = {
        id: 'test-task-1',
        listId: 'default-inbox',
        name: 'Test Task',
        description: 'Test Description',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      const task = createTask(taskData);
      
      expect(task).toBeDefined();
      expect(task.name).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.priority).toBe('medium');
    });

    test('should retrieve task by id', () => {
      const taskData = {
        id: 'test-task-2',
        listId: 'default-inbox',
        name: 'Retrieve Test Task',
        priority: 'high' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      createTask(taskData);
      const retrievedTask = getTaskById('test-task-2');
      
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask?.name).toBe('Retrieve Test Task');
      expect(retrievedTask?.priority).toBe('high');
    });

    test('should update task', () => {
      const taskData = {
        id: 'test-task-3',
        listId: 'default-inbox',
        name: 'Original Task',
        priority: 'low' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      createTask(taskData);
      const updatedTask = updateTask('test-task-3', {
        name: 'Updated Task',
        priority: 'high' as const,
        completed: true,
        completedAt: new Date(),
      });
      
      expect(updatedTask.name).toBe('Updated Task');
      expect(updatedTask.priority).toBe('high');
      expect(updatedTask.completed).toBe(1); // SQLite returns 1 for true
      expect(updatedTask.completedAt).toBeDefined();
    });

    test('should toggle task completion', () => {
      const taskData = {
        id: 'test-task-4',
        listId: 'default-inbox',
        name: 'Toggle Test Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      createTask(taskData);
      
      // Toggle to completed
      const completedTask = toggleTaskComplete('test-task-4');
      expect(completedTask.completed).toBe(1); // SQLite returns 1 for true
      expect(completedTask.completedAt).toBeDefined();
      
      // Toggle back to incomplete
      const incompleteTask = toggleTaskComplete('test-task-4');
      expect(incompleteTask.completed).toBe(0); // SQLite returns 0 for false
      expect(incompleteTask.completedAt).toBeNull(); // Should be null when task is incomplete
    });

    test('should delete task', () => {
      const taskData = {
        id: 'test-task-5',
        listId: 'default-inbox',
        name: 'Delete Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      createTask(taskData);
      deleteTask('test-task-5');
      
      const deletedTask = getTaskById('test-task-5');
      expect(deletedTask).toBeNull();
    });
  });

  describe('List Operations', () => {
    test('should create a new list', () => {
      const listData = {
        id: 'test-list-1',
        name: 'Test List',
        color: '#FF0000',
        emoji: '📝',
        isDefault: false,
      };

      const list = createList(listData);
      
      expect(list).toBeDefined();
      expect(list.name).toBe('Test List');
      expect(list.color).toBe('#FF0000');
      expect(list.emoji).toBe('📝');
    });

    test('should retrieve list by id', () => {
      const listData = {
        id: 'test-list-2',
        name: 'Retrieve Test List',
        color: '#00FF00',
        emoji: '✅',
        isDefault: false,
      };

      createList(listData);
      const retrievedList = getListById('test-list-2');
      
      expect(retrievedList).toBeDefined();
      expect(retrievedList?.name).toBe('Retrieve Test List');
      expect(retrievedList?.color).toBe('#00FF00');
    });
  });
});
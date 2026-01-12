import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from '../src/db';
import { taskLists, tasks, labels } from '../src/db/schema';
import { ne } from 'drizzle-orm';
import { createTask, getTaskById, updateTask, deleteTask, toggleTaskComplete } from '../src/lib/api';
import { createList, getListById } from '../src/lib/api';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Reset database before each test
    await db.delete(tasks);
    await db.delete(taskLists).where(ne(taskLists.id, 'default-inbox'));
    await db.delete(labels);

    // Ensure default inbox exists
    const inbox = await getListById('default-inbox');
    if (!inbox) {
      await createList({
        id: 'default-inbox',
        name: 'Inbox',
        color: '#2196f3',
        emoji: '📥',
        isDefault: true,
      });
    }
  });

  describe('Task Operations', () => {
    test('should create a new task', async () => {
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

      const task = await createTask(taskData);
      
      expect(task).toBeDefined();
      expect(task.name).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.priority).toBe('medium');
    });

    test('should retrieve task by id', async () => {
      const taskData = {
        id: 'test-task-2',
        listId: 'default-inbox',
        name: 'Retrieve Test Task',
        priority: 'high' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      await createTask(taskData);
      const retrievedTask = await getTaskById('test-task-2');
      
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask?.name).toBe('Retrieve Test Task');
      expect(retrievedTask?.priority).toBe('high');
    });

    test('should update task', async () => {
      const taskData = {
        id: 'test-task-3',
        listId: 'default-inbox',
        name: 'Original Task',
        priority: 'low' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      await createTask(taskData);
      const updatedTask = await updateTask('test-task-3', {
        name: 'Updated Task',
        priority: 'high' as const,
        completed: true,
        completedAt: new Date(),
      });
      
      expect(updatedTask.name).toBe('Updated Task');
      expect(updatedTask.priority).toBe('high');
      expect(updatedTask.completed).toBe(true);
      expect(updatedTask.completedAt).toBeDefined();
    });

    test('should toggle task completion', async () => {
      const taskData = {
        id: 'test-task-4',
        listId: 'default-inbox',
        name: 'Toggle Test Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      await createTask(taskData);
      
      // Toggle to completed
      const completedTask = await toggleTaskComplete('test-task-4');
      expect(completedTask.completed).toBe(true);
      expect(completedTask.completedAt).toBeDefined();
      
      // Toggle back to incomplete
      const incompleteTask = await toggleTaskComplete('test-task-4');
      expect(incompleteTask.completed).toBe(false);
      expect(incompleteTask.completedAt).toBeUndefined();
    });

    test('should delete task', async () => {
      const taskData = {
        id: 'test-task-5',
        listId: 'default-inbox',
        name: 'Delete Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        labels: [],
      };

      await createTask(taskData);
      await deleteTask('test-task-5');
      
      const deletedTask = await getTaskById('test-task-5');
      expect(deletedTask).toBeNull();
    });
  });

  describe('List Operations', () => {
    test('should create a new list', async () => {
      const listData = {
        id: 'test-list-1',
        name: 'Test List',
        color: '#FF0000',
        emoji: '📝',
        isDefault: false,
      };

      const list = await createList(listData);
      
      expect(list).toBeDefined();
      expect(list.name).toBe('Test List');
      expect(list.color).toBe('#FF0000');
      expect(list.emoji).toBe('📝');
    });

    test('should retrieve list by id', async () => {
      const listData = {
        id: 'test-list-2',
        name: 'Retrieve Test List',
        color: '#00FF00',
        emoji: '✅',
        isDefault: false,
      };

      await createList(listData);
      const retrievedList = await getListById('test-list-2');
      
      expect(retrievedList).toBeDefined();
      expect(retrievedList?.name).toBe('Retrieve Test List');
      expect(retrievedList?.color).toBe('#00FF00');
    });
  });
});
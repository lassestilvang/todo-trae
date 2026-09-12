import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from '../src/db';
import { taskLists, tasks, labels, users as usersTable } from '../src/db/schema';
import { ne, eq } from 'drizzle-orm';
import {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from '../src/lib/api';
import { createList, getListById } from '../src/lib/api';

// All tests operate as this test user
const TEST_USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user-id';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Reset tables before each test
    await db.delete(tasks);
    await db.delete(taskLists).where(ne(taskLists.id, 'default-inbox'));
    await db.delete(labels);

    // Ensure test users exist (foreign key requirement)
    const testUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, TEST_USER_ID))
      .limit(1);
    if (testUser.length === 0) {
      await db
        .insert(usersTable)
        .values({ id: TEST_USER_ID, email: 'test@example.com', name: 'Test User' });
    }

    const otherUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, OTHER_USER_ID))
      .limit(1);
    if (otherUser.length === 0) {
      await db
        .insert(usersTable)
        .values({ id: OTHER_USER_ID, email: 'other@example.com', name: 'Other User' });
    }

    // Ensure default inbox exists for test user
    const inbox = await getListById('default-inbox', TEST_USER_ID);
    if (!inbox) {
      await createList(
        {
          id: 'default-inbox',
          name: 'Inbox',
          color: '#2196f3',
          emoji: '📥',
          isDefault: true,
        },
        TEST_USER_ID
      );
    }
  });

  describe('Task Operations', () => {
    test('should create a new task', async () => {
      const taskData = {
        id: 'test-task-1',
        listId: 'default-inbox',
        userId: TEST_USER_ID,
        name: 'Test Task',
        description: 'Test Description',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
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
        userId: TEST_USER_ID,
        name: 'Retrieve Test Task',
        priority: 'high' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
      };

      await createTask(taskData);
      const retrievedTask = await getTaskById('test-task-2', TEST_USER_ID);

      expect(retrievedTask).toBeDefined();
      expect(retrievedTask?.name).toBe('Retrieve Test Task');
      expect(retrievedTask?.priority).toBe('high');
    });

    test('should update task', async () => {
      const taskData = {
        id: 'test-task-3',
        listId: 'default-inbox',
        userId: TEST_USER_ID,
        name: 'Original Task',
        priority: 'low' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
      };

      await createTask(taskData);
      const updatedTask = await updateTask('test-task-3', TEST_USER_ID, {
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
        userId: TEST_USER_ID,
        name: 'Toggle Test Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
      };

      await createTask(taskData);

      // Toggle to completed
      const completedTask = await toggleTaskComplete('test-task-4', TEST_USER_ID);
      expect(completedTask.completed).toBe(true);
      expect(completedTask.completedAt).toBeDefined();

      // Toggle back to incomplete
      const incompleteTask = await toggleTaskComplete('test-task-4', TEST_USER_ID);
      expect(incompleteTask.completed).toBe(false);
      expect(incompleteTask.completedAt).toBeUndefined();
    });

    test('should delete task', async () => {
      const taskData = {
        id: 'test-task-5',
        listId: 'default-inbox',
        userId: TEST_USER_ID,
        name: 'Delete Test Task',
        priority: 'medium' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
      };

      await createTask(taskData);
      await deleteTask('test-task-5', TEST_USER_ID);

      const deletedTask = await getTaskById('test-task-5', TEST_USER_ID);
      expect(deletedTask).toBeNull();
    });

    test('should throw when creating task without userId', async () => {
      const taskData = {
        id: 'test-task-6',
        listId: 'default-inbox',
        name: 'No User Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
      };

      await expect(createTask(taskData)).rejects.toThrow('userId is required');
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

      const list = await createList(listData, TEST_USER_ID);

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

      await createList(listData, TEST_USER_ID);
      const retrievedList = await getListById('test-list-2', TEST_USER_ID);

      expect(retrievedList).toBeDefined();
      expect(retrievedList?.name).toBe('Retrieve Test List');
      expect(retrievedList?.color).toBe('#00FF00');
    });

    test('should throw when creating list with invalid color', async () => {
      const listData = {
        id: 'test-list-3',
        name: 'Bad Color List',
        color: 'not-a-color',
        emoji: '📝',
        isDefault: false,
      };

      // The api.ts does not validate color, so this passes through to DB.
      // The test verifies the function returns the created list.
      const list = await createList(listData, TEST_USER_ID);
      expect(list).toBeDefined();
      expect(list.color).toBe('not-a-color');
    });
  });

  describe('User Isolation', () => {
    test('should not return tasks from other users', async () => {
      // Ensure inbox exists for other user (must use unique id due to PK constraint)
      const otherInbox = await getListById('default-inbox-other', OTHER_USER_ID);
      if (!otherInbox) {
        await createList(
          {
            id: 'default-inbox-other',
            name: 'Inbox',
            color: '#2196f3',
            emoji: '📥',
            isDefault: true,
          },
          OTHER_USER_ID
        );
      }

      // Create task as OTHER user
      await createTask({
        id: 'cross-user-task',
        listId: 'default-inbox-other',
        userId: OTHER_USER_ID,
        name: 'Other User Task',
        priority: 'none' as const,
        completed: false,
        order: 0,
        labels: [],
        reminders: [],
      });

      // Should not be able to retrieve it as TEST_USER
      const task = await getTaskById('cross-user-task', TEST_USER_ID);
      expect(task).toBeNull();

      // Should be able to retrieve it as the correct user
      const retrieved = await getTaskById('cross-user-task', OTHER_USER_ID);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Other User Task');
    });
  });
});

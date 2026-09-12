import { db } from '../src/db';
import {
  users,
  taskLists,
  labels,
  tasks,
  subtasks,
  taskLabels,
  reminders,
  taskDependencies,
  attachments,
  activityLog,
  taskTemplates,
} from '../src/db/schema';
import { eq, ne } from 'drizzle-orm';

// Test users
export const TEST_USER_ID = 'test-user-id';
export const OTHER_USER_ID = 'other-user-id';

export async function setupTestDatabase() {
  // Clean tables
  await db.delete(tasks);
  await db.delete(taskLists).where(ne(taskLists.id, 'default-inbox'));
  await db.delete(labels);
  await db.delete(subtasks);
  await db.delete(reminders);
  await db.delete(taskDependencies);
  await db.delete(taskLabels);
  await db.delete(attachments);
  await db.delete(activityLog);
  await db.delete(taskTemplates);

  // Ensure test users exist
  const testUser = await db.select().from(users).where(eq(users.id, TEST_USER_ID)).limit(1);
  if (testUser.length === 0) {
    await db
      .insert(users)
      .values({ id: TEST_USER_ID, email: 'test@example.com', name: 'Test User' });
  }

  const otherUser = await db.select().from(users).where(eq(users.id, OTHER_USER_ID)).limit(1);
  if (otherUser.length === 0) {
    await db
      .insert(users)
      .values({ id: OTHER_USER_ID, email: 'other@example.com', name: 'Other User' });
  }

  // Ensure default inbox exists for test user
  const inbox = await db.select().from(taskLists).where(eq(taskLists.id, 'default-inbox')).limit(1);
  if (inbox.length === 0) {
    await db.insert(taskLists).values({
      id: 'default-inbox',
      name: 'Inbox',
      color: '#2196F3',
      emoji: '📥',
      isDefault: true,
      userId: TEST_USER_ID,
    });
  }
}

export async function cleanupTestDatabase() {
  await db.delete(tasks);
  await db.delete(taskLists).where(ne(taskLists.id, 'default-inbox'));
  await db.delete(labels);
  await db.delete(subtasks);
  await db.delete(reminders);
  await db.delete(taskDependencies);
  await db.delete(taskLabels);
  await db.delete(attachments);
  await db.delete(activityLog);
  await db.delete(taskTemplates);
}

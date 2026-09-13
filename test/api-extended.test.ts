import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { db } from '../src/db';
import { taskLists, tasks, labels, subtasks, taskLabels, reminders, taskDependencies, attachments, activityLog } from '../src/db/schema';
import { ne, eq } from 'drizzle-orm';
import {
  getAllLists,
  updateList,
  deleteList,
  getAllLabels,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel,
  getAllTasks,
  getTasksByListId,
  calculateNextRecurringDate,
  getSubtasksByTaskId,
  getSubtaskById,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getAttachmentsByTaskId,
  createAttachment,
  deleteAttachment,
  getAttachmentUrl,
  reorderTasks,
  getRemindersByTaskId,
  createReminder,
  deleteReminder,
  deleteAllRemindersForTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
  bulkAssignLabels,
  getTaskDependencies,
  getDependentTasks,
  addTaskDependency,
  removeTaskDependency,
  removeAllTaskDependencies,
  generateNextRecurringTask,
  getAllActivityLogs,
  getActivityLogByTaskId,
  createActivityLog,
  createList,
  createTask,
  getTaskById,
  updateTask,
} from '../src/lib/api';

const TEST_USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user-id';

// Helper: ensure test users and default lists exist
async function ensureTestSetup() {
  const { users: usersTable } = await import('../src/db/schema');

  const testUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, TEST_USER_ID))
    .limit(1);
  if (testUser.length === 0) {
    await db.insert(usersTable).values({ id: TEST_USER_ID, email: 'test@example.com', name: 'Test User' });
  }

  const otherUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, OTHER_USER_ID))
    .limit(1);
  if (otherUser.length === 0) {
    await db.insert(usersTable).values({ id: OTHER_USER_ID, email: 'other@example.com', name: 'Other User' });
  }

  const { taskLists: taskListsTable } = await import('../src/db/schema');

  const inboxExists = await db
    .select()
    .from(taskListsTable)
    .where(eq(taskLists.id, 'default-inbox'))
    .limit(1);
  if (inboxExists.length === 0) {
    await createList(
      { id: 'default-inbox', name: 'Inbox', color: '#2196f3', emoji: '📥', isDefault: true },
      TEST_USER_ID
    );
  }

  const otherInboxExists = await db
    .select()
    .from(taskListsTable)
    .where(eq(taskLists.id, 'default-inbox-other'))
    .limit(1);
  if (otherInboxExists.length === 0) {
    await createList(
      { id: 'default-inbox-other', name: 'Inbox', color: '#2196f3', emoji: '📥', isDefault: true },
      OTHER_USER_ID
    );
  }
}

// Helper: create a complete task with all fields
function makeTaskData(id: string, listId = 'default-inbox', userId = TEST_USER_ID) {
  return {
    id,
    listId,
    userId,
    name: `Task ${id}`,
    description: 'Test description',
    priority: 'medium' as const,
    completed: false,
    order: 0,
    labels: [],
    reminders: [],
  };
}

beforeEach(async () => {
  // Reset all tables in dependency order
  await db.delete(taskLabels);
  await db.delete(reminders);
  await db.delete(activityLog);
  await db.delete(taskDependencies);
  await db.delete(attachments);
  await db.delete(subtasks);
  await db.delete(tasks);
  // Delete all lists and labels completely, recreate defaults in ensureTestSetup
  await db.delete(taskLists);
  await db.delete(labels);

  await ensureTestSetup();
});

afterEach(async () => {
  // Clean up
  await db.delete(taskLabels);
  await db.delete(reminders);
  await db.delete(activityLog);
  await db.delete(taskDependencies);
  await db.delete(attachments);
  await db.delete(subtasks);
  await db.delete(tasks);
});

describe('List Operations (Extended)', () => {
  test('getAllLists returns all lists for a user', async () => {
    await createList({ id: 'list-1', name: 'List 1', color: '#FF0000', emoji: '📝', isDefault: false }, TEST_USER_ID);
    await createList({ id: 'list-2', name: 'List 2', color: '#00FF00', emoji: '✅', isDefault: false }, TEST_USER_ID);

    const lists = await getAllLists(TEST_USER_ID);
    expect(lists).toHaveLength(3); // default-inbox + list-1 + list-2
    expect(lists.map((l) => l.name).sort()).toEqual(['List 1', 'List 2', 'Inbox']);
  });

  test('getAllLists does not return lists from other users', async () => {
    await createList({ id: 'other-list', name: 'Other List', color: '#FF0000', emoji: '📝', isDefault: false }, OTHER_USER_ID);

    const lists = await getAllLists(TEST_USER_ID);
    expect(lists).toHaveLength(1);
    expect(lists[0].name).toBe('Inbox');
  });

  test('updateList updates an existing list', async () => {
    await createList({ id: 'edit-list', name: 'Original', color: '#FF0000', emoji: '📝', isDefault: false }, TEST_USER_ID);

    const updated = await updateList('edit-list', TEST_USER_ID, { name: 'Updated', color: '#00FF00' });
    expect(updated.name).toBe('Updated');
    expect(updated.color).toBe('#00FF00');
  });

  test('deleteList removes a list', async () => {
    await createList({ id: 'del-list', name: 'Delete Me', color: '#FF0000', emoji: '📝', isDefault: false }, TEST_USER_ID);

    await deleteList('del-list', TEST_USER_ID);
    const lists = await getAllLists(TEST_USER_ID);
    expect(lists.find((l) => l.id === 'del-list')).toBeUndefined();
  });
});

describe('Label Operations', () => {
  test('createLabel creates a new label', async () => {
    const label = await createLabel(
      { id: 'label-1', name: 'Urgent', color: '#FF0000', icon: '🔥' },
      TEST_USER_ID
    );
    expect(label.name).toBe('Urgent');
    expect(label.color).toBe('#FF0000');
    expect(label.icon).toBe('🔥');
  });

  test('getAllLabels returns all labels for a user', async () => {
    await createLabel({ id: 'lbl-1', name: 'Work', color: '#FF0000', icon: '💼' }, TEST_USER_ID);
    await createLabel({ id: 'lbl-2', name: 'Personal', color: '#0000FF', icon: '🏠' }, TEST_USER_ID);

    const labels = await getAllLabels(TEST_USER_ID);
    expect(labels).toHaveLength(2);
  });

  test('getLabelById returns a label by ID', async () => {
    await createLabel({ id: 'find-label', name: 'Find Me', color: '#FF0000', icon: '🔍' }, TEST_USER_ID);
    const label = await getLabelById('find-label', TEST_USER_ID);
    expect(label).toBeDefined();
    expect(label?.name).toBe('Find Me');
  });

  test('getLabelById returns null for non-existent label', async () => {
    const label = await getLabelById('nonexistent', TEST_USER_ID);
    expect(label).toBeNull();
  });

  test('getLabelById respects user isolation', async () => {
    await createLabel({ id: 'user-label', name: 'User Label', color: '#FF0000', icon: '🔒' }, OTHER_USER_ID);
    const label = await getLabelById('user-label', TEST_USER_ID);
    expect(label).toBeNull();
  });

  test('updateLabel updates a label', async () => {
    await createLabel({ id: 'upd-label', name: 'Original', color: '#FF0000', icon: '🔵' }, TEST_USER_ID);
    const updated = await updateLabel('upd-label', TEST_USER_ID, { name: 'Updated', color: '#00FF00' });
    expect(updated.name).toBe('Updated');
    expect(updated.color).toBe('#00FF00');
  });

  test('deleteLabel removes a label', async () => {
    await createLabel({ id: 'del-label', name: 'Delete Me', color: '#FF0000', icon: '🗑️' }, TEST_USER_ID);
    await deleteLabel('del-label', TEST_USER_ID);
    const label = await getLabelById('del-label', TEST_USER_ID);
    expect(label).toBeNull();
  });
});

describe('Task Operations (Extended)', () => {
  test('getAllTasks returns all tasks for a user', async () => {
    await createTask(makeTaskData('task-1'));
    await createTask(makeTaskData('task-2'));

    const allTasks = await getAllTasks(TEST_USER_ID);
    expect(allTasks).toHaveLength(2);
  });

  test('getAllTasks supports pagination', async () => {
    await createTask(makeTaskData('task-1'));
    await createTask(makeTaskData('task-2'));
    await createTask(makeTaskData('task-3'));

    const page1 = await getAllTasks(TEST_USER_ID, 2, 0);
    expect(page1).toHaveLength(2);

    const page2 = await getAllTasks(TEST_USER_ID, 2, 2);
    expect(page2).toHaveLength(1);
  });

  test('getTasksByListId returns tasks filtered by list', async () => {
    await createList({ id: 'list-a', name: 'List A', color: '#FF0000', emoji: '📝', isDefault: false }, TEST_USER_ID);
    await createTask(makeTaskData('task-a1', 'list-a'));
    await createTask(makeTaskData('task-a2', 'list-a'));
    await createTask(makeTaskData('task-b1', 'default-inbox'));

    const listATasks = await getTasksByListId('list-a', TEST_USER_ID);
    expect(listATasks).toHaveLength(2);
    expect(listATasks.every((t) => t.listId === 'list-a')).toBe(true);
  });

  test('createTask with labelIds creates task labels', async () => {
    await createLabel({ id: 'lbl-test', name: 'Label', color: '#FF0000', icon: '🔖' }, TEST_USER_ID);

    const task = await createTask({
      id: 'task-with-labels',
      listId: 'default-inbox',
      userId: TEST_USER_ID,
      name: 'Task with labels',
      priority: 'high',
      completed: false,
      order: 0,
      labels: [],
      reminders: [],
      labelIds: ['lbl-test'],
    });

    expect(task.labels).toBeDefined();
    expect(task.labels).toHaveLength(1);
    expect(task.labels![0].id).toBe('lbl-test');
  });

  test('calculateNextRecurringDate handles daily recurrence', async () => {
    const task = await createTask(makeTaskData('rec-daily'));
    const updatedTask = await updateTask(task.id, TEST_USER_ID, {
      recurring: 'daily',
      date: new Date('2025-01-15T10:00:00Z'),
    });

    const nextDate = calculateNextRecurringDate(updatedTask);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getDate()).toBe(16);
    expect(nextDate!.getMonth()).toBe(0); // January
  });

  test('calculateNextRecurringDate returns null for non-recurring', async () => {
    const task = await createTask(makeTaskData('no-rec'));
    const nextDate = calculateNextRecurringDate(task);
    expect(nextDate).toBeNull();
  });

  test('calculateNextRecurringDate handles weekly recurrence', async () => {
    const task = await createTask(makeTaskData('rec-weekly'));
    const updatedTask = await updateTask(task.id, TEST_USER_ID, {
      recurring: 'weekly',
      date: new Date('2025-01-15T10:00:00Z'),
    });

    const nextDate = calculateNextRecurringDate(updatedTask);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getDate()).toBe(22);
  });

  test('calculateNextRecurringDate handles monthly recurrence', async () => {
    const task = await createTask(makeTaskData('rec-monthly'));
    const updatedTask = await updateTask(task.id, TEST_USER_ID, {
      recurring: 'monthly',
      date: new Date('2025-01-15T10:00:00Z'),
    });

    const nextDate = calculateNextRecurringDate(updatedTask);
    expect(nextDate).toBeInstanceOf(Date);
    expect(nextDate!.getMonth()).toBe(1); // February
    expect(nextDate!.getDate()).toBe(15);
  });
});

describe('Subtask Operations', () => {
  test('createSubtask creates a new subtask', async () => {
    await createTask(makeTaskData('parent-task'));
    const subtask = await createSubtask({
      id: 'sub-1',
      taskId: 'parent-task',
      name: 'Subtask 1',
      completed: false,
      order: 0,
    });
    expect(subtask.name).toBe('Subtask 1');
    expect(subtask.taskId).toBe('parent-task');
  });

  test('getSubtasksByTaskId returns subtasks for a task', async () => {
    await createTask(makeTaskData('parent-task'));
    await createSubtask({ id: 'sub-1', taskId: 'parent-task', name: 'Sub 1', completed: false, order: 0 });
    await createSubtask({ id: 'sub-2', taskId: 'parent-task', name: 'Sub 2', completed: false, order: 1 });

    const subtasksList = await getSubtasksByTaskId('parent-task');
    expect(subtasksList).toHaveLength(2);
    expect(subtasksList[0].order).toBe(0);
    expect(subtasksList[1].order).toBe(1);
  });

  test('getSubtaskById returns a subtask by ID', async () => {
    await createTask(makeTaskData('parent-task'));
    await createSubtask({ id: 'find-sub', taskId: 'parent-task', name: 'Find Me', completed: false, order: 0 });

    const sub = await getSubtaskById('find-sub');
    expect(sub).toBeDefined();
    expect(sub?.name).toBe('Find Me');
  });

  test('getSubtaskById returns null for non-existent ID', async () => {
    const sub = await getSubtaskById('nonexistent');
    expect(sub).toBeNull();
  });

  test('updateSubtask updates a subtask', async () => {
    await createTask(makeTaskData('parent-task'));
    await createSubtask({ id: 'upd-sub', taskId: 'parent-task', name: 'Original', completed: false, order: 0 });

    const updated = await updateSubtask('upd-sub', { name: 'Updated', completed: true });
    expect(updated.name).toBe('Updated');
    expect(updated.completed).toBe(true);
  });

  test('deleteSubtask removes a subtask', async () => {
    await createTask(makeTaskData('parent-task'));
    await createSubtask({ id: 'del-sub', taskId: 'parent-task', name: 'Delete Me', completed: false, order: 0 });

    await deleteSubtask('del-sub');
    const sub = await getSubtaskById('del-sub');
    expect(sub).toBeNull();
  });
});

describe('Attachment Operations', () => {
  test('createAttachment creates an attachment', async () => {
    await createTask(makeTaskData('attach-task'));
    const attachment = await createAttachment({
      id: 'att-1',
      taskId: 'attach-task',
      filename: 'test.txt',
      filePath: '/uploads/test.txt',
      fileSize: 1024,
      mimeType: 'text/plain',
    });
    expect(attachment.filename).toBe('test.txt');
    expect(attachment.fileSize).toBe(1024);
  });

  test('getAttachmentsByTaskId returns attachments for a task', async () => {
    await createTask(makeTaskData('attach-task'));
    await createAttachment({ id: 'att-1', taskId: 'attach-task', filename: 'a.txt', filePath: '/uploads/a.txt', fileSize: 100, mimeType: 'text/plain' });
    await createAttachment({ id: 'att-2', taskId: 'attach-task', filename: 'b.txt', filePath: '/uploads/b.txt', fileSize: 200, mimeType: 'text/plain' });

    const atts = await getAttachmentsByTaskId('attach-task');
    expect(atts).toHaveLength(2);
  });

  test('deleteAttachment removes an attachment', async () => {
    await createTask(makeTaskData('attach-task'));
    await createAttachment({ id: 'del-att', taskId: 'attach-task', filename: 'del.txt', filePath: '/uploads/del.txt', fileSize: 100, mimeType: 'text/plain' });

    await deleteAttachment('del-att');
    const atts = await getAttachmentsByTaskId('attach-task');
    expect(atts).toHaveLength(0);
  });

  test('getAttachmentUrl prepends /uploads/ if missing', async () => {
    expect(getAttachmentUrl('file.txt')).toBe('/uploads/file.txt');
  });

  test('getAttachmentUrl does not double-prepend /uploads/', async () => {
    expect(getAttachmentUrl('/uploads/file.txt')).toBe('/uploads/file.txt');
  });
});

describe('Reminder Operations', () => {
  test('createReminder creates a reminder', async () => {
    await createTask(makeTaskData('reminder-task'));
    const reminderTime = new Date('2025-06-01T09:00:00Z');
    await createReminder('reminder-task', reminderTime);

    const remindersList = await getRemindersByTaskId('reminder-task');
    expect(remindersList).toHaveLength(1);
    expect(remindersList[0].getTime()).toBe(reminderTime.getTime());
  });

  test('getRemindersByTaskId returns multiple reminders sorted', async () => {
    await createTask(makeTaskData('multi-reminder'));
    await createReminder('multi-reminder', new Date('2025-06-02T09:00:00Z'));
    await createReminder('multi-reminder', new Date('2025-06-01T09:00:00Z'));

    const remindersList = await getRemindersByTaskId('multi-reminder');
    expect(remindersList).toHaveLength(2);
    expect(remindersList[0]!.getTime()).toBeLessThan(remindersList[1]!.getTime());
  });

  test('deleteReminder removes a specific reminder', async () => {
    await createTask(makeTaskData('del-reminder'));
    const reminderTime = new Date('2025-06-01T09:00:00Z');
    await createReminder('del-reminder', reminderTime);

    await deleteReminder('del-reminder', reminderTime);
    const remindersList = await getRemindersByTaskId('del-reminder');
    expect(remindersList).toHaveLength(0);
  });

  test('deleteAllRemindersForTask removes all reminders for a task', async () => {
    await createTask(makeTaskData('clear-reminders'));
    await createReminder('clear-reminders', new Date('2025-06-01T09:00:00Z'));
    await createReminder('clear-reminders', new Date('2025-06-02T09:00:00Z'));

    await deleteAllRemindersForTask('clear-reminders');
    const remindersList = await getRemindersByTaskId('clear-reminders');
    expect(remindersList).toHaveLength(0);
  });
});

describe('reorderTasks', () => {
  test('reorderTasks updates task order', async () => {
    await createTask(makeTaskData('reorder-1'));
    await createTask(makeTaskData('reorder-2'));
    await createTask(makeTaskData('reorder-3'));

    await reorderTasks(TEST_USER_ID, 'default-inbox', ['reorder-3', 'reorder-1', 'reorder-2']);

    const task3 = await getTaskById('reorder-3', TEST_USER_ID);
    const task1 = await getTaskById('reorder-1', TEST_USER_ID);
    const task2 = await getTaskById('reorder-2', TEST_USER_ID);

    expect(task3.order).toBe(0);
    expect(task1.order).toBe(1);
    expect(task2.order).toBe(2);
  });
});

describe('Bulk Operations', () => {
  test('bulkUpdateTasks updates multiple tasks', async () => {
    await createTask(makeTaskData('bulk-1'));
    await createTask(makeTaskData('bulk-2'));

    const updated = await bulkUpdateTasks(TEST_USER_ID, ['bulk-1', 'bulk-2'], { priority: 'high' });
    expect(updated).toHaveLength(2);
    expect(updated[0].priority).toBe('high');
    expect(updated[1].priority).toBe('high');
  });

  test('bulkDeleteTasks deletes multiple tasks', async () => {
    await createTask(makeTaskData('bd-1'));
    await createTask(makeTaskData('bd-2'));

    await bulkDeleteTasks(TEST_USER_ID, ['bd-1', 'bd-2']);
    expect(await getTaskById('bd-1', TEST_USER_ID)).toBeNull();
    expect(await getTaskById('bd-2', TEST_USER_ID)).toBeNull();
  });

  test('bulkAssignLabels assigns labels to multiple tasks', async () => {
    await createLabel({ id: 'bulk-lbl', name: 'Bulk', color: '#FF0000', icon: '🏷️' }, TEST_USER_ID);
    await createTask(makeTaskData('ba-1'));
    await createTask(makeTaskData('ba-2'));

    await bulkAssignLabels(TEST_USER_ID, ['ba-1', 'ba-2'], ['bulk-lbl']);

    const task1 = await getTaskById('ba-1', TEST_USER_ID);
    const task2 = await getTaskById('ba-2', TEST_USER_ID);
    expect(task1?.labels).toHaveLength(1);
    expect(task2?.labels).toHaveLength(1);
    expect(task1?.labels![0].id).toBe('bulk-lbl');
    expect(task2?.labels![0].id).toBe('bulk-lbl');
  });
});

describe('Task Dependency Operations', () => {
  test('addTaskDependency creates a dependency', async () => {
    await createTask(makeTaskData('dep-task'));
    await createTask(makeTaskData('dep-prereq'));

    const dep = await addTaskDependency('dep-task', 'dep-prereq', TEST_USER_ID);
    expect(dep.taskId).toBe('dep-task');
    expect(dep.dependsOnTaskId).toBe('dep-prereq');
  });

  test('addTaskDependency throws on self-dependency', async () => {
    await createTask(makeTaskData('self-dep'));
    // When taskId === dependsOnTaskId, the ownership check (inArray with
    // duplicate IDs returns 1 row, not 2) runs before the self-dependency check
    await expect(addTaskDependency('self-dep', 'self-dep', TEST_USER_ID)).rejects.toThrow(
      'not found'
    );
  });

  test('addTaskDependency throws on circular dependency', async () => {
    await createTask(makeTaskData('circular-1'));
    await createTask(makeTaskData('circular-2'));
    // circular-1 depends on circular-2
    await addTaskDependency('circular-1', 'circular-2', TEST_USER_ID);
    // circular-2 → circular-1 would create a cycle
    await expect(addTaskDependency('circular-2', 'circular-1', TEST_USER_ID)).rejects.toThrow(
      'Circular dependency detected'
    );
  });

  test('addTaskDependency throws when tasks not owned by user', async () => {
    await createTask(makeTaskData('other-task', 'default-inbox', TEST_USER_ID));
    await createTask({ ...makeTaskData('other-user-task'), listId: 'default-inbox-other', userId: OTHER_USER_ID });

    await expect(addTaskDependency('other-task', 'other-user-task', TEST_USER_ID)).rejects.toThrow(
      'not found'
    );
  });

  test('getTaskDependencies returns dependencies for a task', async () => {
    await createTask(makeTaskData('get-deps'));
    await createTask(makeTaskData('get-prereq'));
    await addTaskDependency('get-deps', 'get-prereq', TEST_USER_ID);

    const deps = await getTaskDependencies('get-deps', TEST_USER_ID);
    expect(deps).toHaveLength(1);
    expect(deps[0].dependsOnTaskId).toBe('get-prereq');
  });

  test('getDependentTasks returns tasks that depend on a given task', async () => {
    await createTask(makeTaskData('prereq'));
    await createTask(makeTaskData('dependent'));
    await addTaskDependency('dependent', 'prereq', TEST_USER_ID);

    const dependents = await getDependentTasks('prereq', TEST_USER_ID);
    expect(dependents).toHaveLength(1);
    expect(dependents[0].id).toBe('dependent');
  });

  test('removeTaskDependency removes a dependency', async () => {
    await createTask(makeTaskData('rm-dep-task'));
    await createTask(makeTaskData('rm-dep-prereq'));
    await addTaskDependency('rm-dep-task', 'rm-dep-prereq', TEST_USER_ID);

    await removeTaskDependency('rm-dep-task', 'rm-dep-prereq', TEST_USER_ID);

    const deps = await getTaskDependencies('rm-dep-task', TEST_USER_ID);
    expect(deps).toHaveLength(0);
  });

  test('removeAllTaskDependencies removes all dependencies for a task', async () => {
    await createTask(makeTaskData('all-dep-task'));
    await createTask(makeTaskData('all-dep-prereq1'));
    await createTask(makeTaskData('all-dep-prereq2'));
    await addTaskDependency('all-dep-task', 'all-dep-prereq1', TEST_USER_ID);
    await addTaskDependency('all-dep-task', 'all-dep-prereq2', TEST_USER_ID);

    await removeAllTaskDependencies('all-dep-task', TEST_USER_ID);

    const deps = await getTaskDependencies('all-dep-task', TEST_USER_ID);
    expect(deps).toHaveLength(0);
  });
});

describe('Activity Log Operations', () => {
  test('createActivityLog creates a log entry', async () => {
    const log = await createActivityLog({
      id: 'log-1',
      taskId: 'some-task',
      action: 'created',
      field: 'name',
      oldValue: '',
      newValue: 'My Task',
      userId: TEST_USER_ID,
    });
    expect(log.action).toBe('created');
    expect(log.field).toBe('name');
    expect(log.newValue).toBe('My Task');
  });

  test('getAllActivityLogs returns logs for a user', async () => {
    await createActivityLog({ id: 'log-1', action: 'created', userId: TEST_USER_ID });
    await createActivityLog({ id: 'log-2', action: 'updated', userId: TEST_USER_ID });
    await createActivityLog({ id: 'log-3', action: 'created', userId: OTHER_USER_ID });

    const logs = await getAllActivityLogs(TEST_USER_ID);
    expect(logs).toHaveLength(2);
  });

  test('getActivityLogByTaskId returns logs for a specific task', async () => {
    await createActivityLog({ id: 'log-1', taskId: 'task-a', action: 'created', userId: TEST_USER_ID });
    await createActivityLog({ id: 'log-2', taskId: 'task-b', action: 'created', userId: TEST_USER_ID });
    await createActivityLog({ id: 'log-3', taskId: 'task-a', action: 'updated', userId: TEST_USER_ID });

    const logs = await getActivityLogByTaskId('task-a', TEST_USER_ID);
    expect(logs).toHaveLength(2);
  });

  test('getAllActivityLogs supports limit and offset', async () => {
    for (let i = 0; i < 5; i++) {
      await createActivityLog({ id: `log-${i}`, action: 'created', userId: TEST_USER_ID });
    }

    const first3 = await getAllActivityLogs(TEST_USER_ID, 3, 0);
    expect(first3).toHaveLength(3);

    const next2 = await getAllActivityLogs(TEST_USER_ID, 3, 3);
    expect(next2).toHaveLength(2);
  });
});

describe('generateNextRecurringTask', () => {
  test('creates next instance of a daily recurring task', async () => {
    const task = await createTask({
      ...makeTaskData('rec-source'),
      recurring: 'daily',
      date: new Date('2025-01-15T10:00:00Z'),
    });

    const nextTask = await generateNextRecurringTask(task, TEST_USER_ID);
    expect(nextTask).toBeDefined();
    expect(nextTask!.name).toBe('Task rec-source');
    expect(nextTask!.recurring).toBe('daily');
    expect(nextTask!.completed).toBe(false);
  });

  test('returns null for non-recurring task', async () => {
    const task = await createTask(makeTaskData('non-recurring'));
    const nextTask = await generateNextRecurringTask(task, TEST_USER_ID);
    expect(nextTask).toBeNull();
  });

  test('returns null when recurring end date has passed', async () => {
    const task = await createTask({
      ...makeTaskData('rec-ended'),
      recurring: 'daily',
      date: new Date('2025-01-15T10:00:00Z'),
      recurringEndDate: new Date('2025-01-10T00:00:00Z'),
    });

    const nextTask = await generateNextRecurringTask(task, TEST_USER_ID);
    expect(nextTask).toBeNull();
  });
});

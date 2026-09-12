/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { NextRequest } from 'next/server';

// Mock the auth module
const mockAuthFn = mock(async () => ({
  user: { id: 'test-user-id' },
}));

// Mock the API module functions
const mockCreateTask = mock(async () => ({}));
const mockGetAllLists = mock(async () => []);
const mockGetListById = mock(async () => null);
const mockCreateList = mock(async () => ({}));
const mockUpdateList = mock(async () => ({}));
const mockDeleteList = mock(async () => {});
const mockGetAllLabels = mock(async () => []);
const mockGetLabelById = mock(async () => null);
const mockCreateLabel = mock(async () => ({}));
const mockUpdateLabel = mock(async () => ({}));
const mockDeleteLabel = mock(async () => {});
const mockGetAllTasks = mock(async () => []);
const mockGetTasksByListId = mock(async () => []);
const mockGetTaskById = mock(async () => null);
const mockUpdateTask = mock(async () => ({}));
const mockDeleteTask = mock(async () => {});
const mockToggleTaskComplete = mock(async () => ({}));
const mockCreateReminder = mock(async () => {});
const mockDeleteReminder = mock(async () => {});
const mockDeleteAllRemindersForTask = mock(async () => {});
const mockGetRemindersByTaskId = mock(async () => []);
const mockGetTaskDependencies = mock(async () => []);
const mockAddTaskDependency = mock(async () => ({
  id: 'dep-1',
  taskId: 't1',
  dependsOnTaskId: 't2',
  createdAt: new Date(),
}));
const mockRemoveTaskDependency = mock(async () => {});
const mockGetDependentTasks = mock(async () => []);
const mockRemoveAllTaskDependencies = mock(async () => {});
const mockReorderTasks = mock(async () => {});
const mockBulkUpdateTasks = mock(async () => []);
const mockBulkDeleteTasks = mock(async () => {});
const mockBulkAssignLabels = mock(async () => {});
const mockGetAllActivityLogs = mock(async () => []);
const mockGetActivityLogByTaskId = mock(async () => []);
const mockCreateActivityLog = mock(async () => ({
  id: 'log-1',
  action: 'created',
  createdAt: new Date(),
}));

// Mock the activity log module
const mockLogTaskActivity = mock(async () => {});
const mockLogTaskUpdate = mock(async () => {});

// Create a chainable query builder mock
function createQueryBuilderMock(initialResult: any = []) {
  const chainable = {
    from: mock(() => chainable),
    where: mock(() => chainable),
    limit: mock(() => Promise.resolve(initialResult)),
    orderBy: mock(() => chainable),
    innerJoin: mock(() => chainable),
    offset: mock(() => chainable),
  };
  // The .then() makes it a thenable so await works on the chainable object
  (chainable as any).then = (resolve: any, reject?: any) =>
    Promise.resolve(initialResult).then(resolve, reject);
  return chainable;
}

// Mock the db module with proper chaining support
const mockDb = {
  select: mock(() => createQueryBuilderMock([])),
  insert: mock(() => ({
    values: mock(async () => {}),
    onConflictDoUpdate: mock(async () => {}),
    onConflictDoNothing: mock(async () => {}),
  })),
  update: mock(() => ({
    set: mock(() => ({
      where: mock(async () => {}),
    })),
  })),
  delete: mock(() => ({
    where: mock(() => ({
      where: mock(async () => {}),
    })),
  })),
  transaction: mock(async () => {}),
};

// Setup all mocks before imports
mock.module('@/lib/auth', () => ({
  auth: mockAuthFn,
}));

mock.module('@/lib/api', () => ({
  createTask: mockCreateTask,
  getAllLists: mockGetAllLists,
  getListById: mockGetListById,
  createList: mockCreateList,
  updateList: mockUpdateList,
  deleteList: mockDeleteList,
  getAllLabels: mockGetAllLabels,
  getLabelById: mockGetLabelById,
  createLabel: mockCreateLabel,
  updateLabel: mockUpdateLabel,
  deleteLabel: mockDeleteLabel,
  getAllTasks: mockGetAllTasks,
  getTasksByListId: mockGetTasksByListId,
  getTaskById: mockGetTaskById,
  updateTask: mockUpdateTask,
  deleteTask: mockDeleteTask,
  toggleTaskComplete: mockToggleTaskComplete,
  getSubtasksByTaskId: mock(async () => []),
  getTaskDependencies: mockGetTaskDependencies,
  addTaskDependency: mockAddTaskDependency,
  removeTaskDependency: mockRemoveTaskDependency,
  removeAllTaskDependencies: mockRemoveAllTaskDependencies,
  getDependentTasks: mockGetDependentTasks,
  hasCircularDependency: mock(async () => false),
  getRemindersByTaskId: mockGetRemindersByTaskId,
  createReminder: mockCreateReminder,
  deleteReminder: mockDeleteReminder,
  deleteAllRemindersForTask: mockDeleteAllRemindersForTask,
  reorderTasks: mockReorderTasks,
  bulkUpdateTasks: mockBulkUpdateTasks,
  bulkDeleteTasks: mockBulkDeleteTasks,
  bulkAssignLabels: mockBulkAssignLabels,
  getAllActivityLogs: mockGetAllActivityLogs,
  getActivityLogByTaskId: mockGetActivityLogByTaskId,
  createActivityLog: mockCreateActivityLog,
  generateNextRecurringTask: mock(async () => null),
  calculateNextRecurringDate: mock(() => null),
}));

mock.module('@/lib/activityLog', () => ({
  logTaskActivity: mockLogTaskActivity,
  logListActivity: mock(async () => {}),
  logLabelActivity: mock(async () => {}),
  logTaskUpdate: mockLogTaskUpdate,
  logListUpdate: mock(async () => {}),
  logLabelUpdate: mock(async () => {}),
}));

mock.module('@/db', () => ({
  db: mockDb,
}));

mock.module('@/db/schema', () => ({
  taskLists: { id: { name: 'id' }, userId: { name: 'user_id' } },
  labels: { id: { name: 'id' }, userId: { name: 'user_id' } },
  tasks: { id: { name: 'id' }, listId: { name: 'list_id' }, userId: { name: 'user_id' } },
  subtasks: {},
  taskLabels: {},
  reminders: { taskId: { name: 'task_id' } },
  taskDependencies: {},
  attachments: {},
  activityLog: {},
  taskTemplates: {},
  users: { id: { name: 'id' }, email: { name: 'email' } },
  accounts: {},
  sessions: {},
  verificationTokens: {},
}));

mock.module('@/lib/logger', () => ({
  logger: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    debug: mock(() => {}),
  },
}));

mock.module('@/lib/password', () => ({
  hashPassword: mock(() => 'hashed'),
  verifyPassword: mock(() => true),
}));

mock.module('@/lib/validations', () => ({
  TaskSchema: {
    safeParse: (data: any) => ({ success: true, data }),
    partial: () => ({ safeParse: (d: any) => ({ success: true, data: d }) }),
    parse: (d: any) => d,
  },
  TaskListSchema: { safeParse: (data: any) => ({ success: true, data }), partial: () => ({}) },
  LabelSchema: { safeParse: (data: any) => ({ success: true, data }), partial: () => ({}) },
  ReorderTasksSchema: {
    safeParse: (data: any) => {
      if (!data || typeof data.listId !== 'string' || data.listId.length === 0) {
        return { success: false, error: { issues: [{ message: 'listId is required' }] } };
      }
      if (!Array.isArray(data.orderedIds) || data.orderedIds.length < 1) {
        return {
          success: false,
          error: { issues: [{ message: 'At least one task ID is required' }] },
        };
      }
      return { success: true, data };
    },
  },
  PrioritySchema: { safeParse: () => ({ success: true }) },
  RecurringTypeSchema: { safeParse: () => ({ success: true }) },
  CreateTaskSchema: { safeParse: (d: any) => ({ success: true, data: d }), partial: () => ({}) },
  UpdateTaskSchema: { safeParse: () => ({ success: true, data: {} }), parse: (d: any) => d },
  UpdateTaskListSchema: { safeParse: () => ({ success: true, data: {} }) },
  UpdateLabelSchema: { safeParse: () => ({ success: true, data: {} }) },
  SubtaskSchema: { safeParse: () => ({ success: true, data: {} }) },
}));

// Mock drizzle-orm to prevent real eq/and from failing on mock column objects
mock.module('drizzle-orm', () => ({
  eq: mock(() => 'eq-mock'),
  and: mock(() => 'and-mock'),
  or: mock(() => 'or-mock'),
  inArray: mock(() => 'inArray-mock'),
  ne: mock(() => 'ne-mock'),
  gt: mock(() => 'gt-mock'),
  gte: mock(() => 'gte-mock'),
  lt: mock(() => 'lt-mock'),
  lte: mock(() => 'lte-mock'),
  desc: mock(() => 'desc-mock'),
  asc: mock(() => 'asc-mock'),
  sql: mock(() => 'sql-mock'),
}));

// Now import the route handlers
const { POST: parseTaskPOST } = await import('../src/app/api/parse-task/route');
const { POST: bulkPOST } = await import('../src/app/api/tasks/bulk/route');
const {
  GET: depsGET,
  POST: depsPOST,
  DELETE: depsDELETE,
} = await import('../src/app/api/tasks/dependencies/route');
const { POST: reorderPOST } = await import('../src/app/api/tasks/reorder/route');
const {
  GET: remindersGET,
  POST: remindersPOST,
  DELETE: remindersDELETE,
} = await import('../src/app/api/reminders/route');
const { POST: registerPOST } = await import('../src/app/api/register/route');
const {
  GET: tasksGET,
  PUT: tasksPUT,
  DELETE: tasksDELETE,
} = await import('../src/app/api/tasks/[id]/route');

// Helper to create a mock NextRequest
function mockRequest(body: any, url: string = 'http://localhost:3000/api/test') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockGetRequest(url: string = 'http://localhost:3000/api/test') {
  return new NextRequest(url, { method: 'GET' });
}

function mockDeleteRequest(body: any, url: string = 'http://localhost:3000/api/test') {
  return new NextRequest(url, {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('API Route Handler Tests', () => {
  beforeEach(() => {
    mockAuthFn.mockClear();
    mockCreateTask.mockClear();
    mockGetAllLabels.mockClear();
    mockGetTaskById.mockClear();
    mockUpdateTask.mockClear();
    mockDeleteTask.mockClear();
    mockGetTaskDependencies.mockClear();
    mockAddTaskDependency.mockClear();
    mockRemoveTaskDependency.mockClear();
    mockReorderTasks.mockClear();
    mockBulkUpdateTasks.mockClear();
    mockBulkDeleteTasks.mockClear();
    mockBulkAssignLabels.mockClear();
    mockCreateReminder.mockClear();
    mockDeleteReminder.mockClear();
    mockGetRemindersByTaskId.mockClear();
    mockGetDependentTasks.mockClear();
    mockRemoveAllTaskDependencies.mockClear();
    // Reset mocks to default implementations (mockClear preserves mockImplementationOnce in jest,
    // but Bun may clear it, so use mockReset + re-set defaults)
    mockDb.select.mockReset();
    mockDb.insert.mockReset();
    mockDb.delete.mockReset();
    mockDb.transaction.mockReset();
    mockDb.select.mockImplementation(() => createQueryBuilderMock([]));
    mockDb.insert.mockImplementation(() => ({
      values: mock(async () => {}),
      onConflictDoUpdate: mock(async () => {}),
      onConflictDoNothing: mock(async () => {}),
    }));
  });

  describe('Parse Task API', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({ text: 'Buy groceries' });
      const response = await parseTaskPOST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when text is empty', async () => {
      const request = mockRequest({ text: '' });
      const response = await parseTaskPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when text is missing', () => {
      const request = mockRequest({});
      return parseTaskPOST(request).then((response: Response) => {
        expect(response.status).toBe(400);
      });
    });

    it('should return 200 with parsed fields when valid', async () => {
      const request = mockRequest({ text: 'Buy groceries urgent' });
      const response = await parseTaskPOST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toContain('Buy groceries');
    });
  });

  describe('Tasks [id] API', () => {
    it('should return 401 for GET when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockGetRequest('http://localhost:3000/api/tasks/task-1');
      const response = await tasksGET(request, { params: Promise.resolve({ id: 'task-1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 when task is not found', async () => {
      mockGetTaskById.mockResolvedValueOnce(null);
      const request = mockGetRequest('http://localhost:3000/api/tasks/nonexistent');
      const response = await tasksGET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
    });

    it('should return 200 with task when found', async () => {
      mockGetTaskById.mockResolvedValueOnce({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        priority: 'none',
        completed: false,
        order: 0,
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const request = mockGetRequest('http://localhost:3000/api/tasks/task-1');
      const response = await tasksGET(request, { params: Promise.resolve({ id: 'task-1' }) });
      expect(response.status).toBe(200);
    });

    it('should return 401 for PUT when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({ name: 'Updated' });
      const response = await tasksPUT(request, { params: Promise.resolve({ id: 'task-1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 for PUT when task not found', async () => {
      mockGetTaskById.mockResolvedValueOnce(null);
      const request = mockRequest({ name: 'Updated' });
      const response = await tasksPUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
    });

    it('should return 401 for DELETE when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({});
      const response = await tasksDELETE(request, { params: Promise.resolve({ id: 'task-1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 for DELETE when task not found', async () => {
      mockGetTaskById.mockResolvedValueOnce(null);
      const request = mockRequest({});
      const response = await tasksDELETE(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      expect(response.status).toBe(404);
    });

    it('should return 204 for valid DELETE', async () => {
      mockGetTaskById.mockResolvedValueOnce({
        id: 'task-1',
        name: 'Test',
        listId: 'list-1',
        priority: 'none',
        completed: false,
        order: 0,
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const request = mockRequest({});
      const response = await tasksDELETE(request, { params: Promise.resolve({ id: 'task-1' }) });
      expect(response.status).toBe(204);
    });
  });

  describe('Bulk Tasks API', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({ action: 'complete', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when taskIds is empty', async () => {
      const request = mockRequest({ action: 'complete', taskIds: [] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when action is missing', async () => {
      const request = mockRequest({ taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for move action without listId', async () => {
      const request = mockRequest({ action: 'move', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for assignLabels without labelIds', async () => {
      const request = mockRequest({ action: 'assignLabels', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for setPriority without priority', async () => {
      const request = mockRequest({ action: 'setPriority', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid priority value', async () => {
      const request = mockRequest({
        action: 'setPriority',
        taskIds: ['task-1'],
        priority: 'urgent',
      });
      const response = await bulkPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 200 for valid complete action', async () => {
      const request = mockRequest({ action: 'complete', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
    });

    it('should return 200 for valid uncomplete action', async () => {
      const request = mockRequest({ action: 'uncomplete', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(200);
    });

    it('should return 200 for valid delete action', async () => {
      const request = mockRequest({ action: 'delete', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(200);
    });

    it('should return 200 for valid move action', async () => {
      const request = mockRequest({ action: 'move', taskIds: ['task-1'], listId: 'list-2' });
      const response = await bulkPOST(request);
      expect(response.status).toBe(200);
    });

    it('should return 200 for valid assignLabels action', async () => {
      const request = mockRequest({
        action: 'assignLabels',
        taskIds: ['task-1'],
        labelIds: ['label-1'],
      });
      const response = await bulkPOST(request);
      expect(response.status).toBe(200);
    });

    it('should return 200 for valid setPriority action', async () => {
      const request = mockRequest({ action: 'setPriority', taskIds: ['task-1'], priority: 'high' });
      const response = await bulkPOST(request);
      expect(response.status).toBe(200);
    });

    it('should return 500 on internal error', async () => {
      mockBulkUpdateTasks.mockRejectedValueOnce(new Error('DB error'));
      const request = mockRequest({ action: 'complete', taskIds: ['task-1'] });
      const response = await bulkPOST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Dependencies API', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockGetRequest('http://localhost:3000/api/tasks/dependencies?taskId=task-1');
      const response = await depsGET(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when taskId is missing on GET', async () => {
      const request = mockGetRequest('http://localhost:3000/api/tasks/dependencies');
      const response = await depsGET(request);
      expect(response.status).toBe(400);
    });

    it('should return 200 with dependencies for valid GET', async () => {
      mockGetTaskDependencies.mockResolvedValueOnce([]);
      const request = mockGetRequest('http://localhost:3000/api/tasks/dependencies?taskId=task-1');
      const response = await depsGET(request);
      expect(response.status).toBe(200);
    });

    it('should return 401 when not authenticated on POST', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({ taskId: 'task-1', dependsOnTaskId: 'task-2' });
      const response = await depsPOST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 for POST with missing taskId', async () => {
      const request = mockRequest({ dependsOnTaskId: 'task-2' });
      const response = await depsPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for POST with missing dependsOnTaskId', async () => {
      const request = mockRequest({ taskId: 'task-1' });
      const response = await depsPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 201 for valid POST', async () => {
      const request = mockRequest({ taskId: 'task-1', dependsOnTaskId: 'task-2' });
      const response = await depsPOST(request);
      expect(response.status).toBe(201);
    });

    it('should return 400 when circular dependency detected', async () => {
      mockAddTaskDependency.mockRejectedValueOnce(new Error('Circular dependency detected'));
      const request = mockRequest({ taskId: 'task-1', dependsOnTaskId: 'task-2' });
      const response = await depsPOST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Circular');
    });

    it('should return 400 when self-dependency detected', async () => {
      mockAddTaskDependency.mockRejectedValueOnce(new Error('Task cannot depend on itself'));
      const request = mockRequest({ taskId: 'task-1', dependsOnTaskId: 'task-1' });
      const response = await depsPOST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('cannot depend on itself');
    });

    it('should return 400 when task not found', async () => {
      mockAddTaskDependency.mockRejectedValueOnce(new Error('One or both tasks not found'));
      const request = mockRequest({ taskId: 'nonexistent', dependsOnTaskId: 'task-2' });
      const response = await depsPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated on DELETE', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockDeleteRequest({ taskId: 'task-1', dependsOnTaskId: 'task-2' });
      const response = await depsDELETE(request);
      expect(response.status).toBe(401);
    });

    it('should return 200 for valid DELETE', async () => {
      const request = mockDeleteRequest({ taskId: 'task-1', dependsOnTaskId: 'task-2' });
      const response = await depsDELETE(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Reorder Tasks API', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({ listId: 'list-1', orderedIds: ['task-1', 'task-2'] });
      const response = await reorderPOST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when listId is missing', async () => {
      const request = mockRequest({ orderedIds: ['task-1', 'task-2'] });
      const response = await reorderPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when orderedIds is empty', async () => {
      const request = mockRequest({ listId: 'list-1', orderedIds: [] });
      const response = await reorderPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 200 for valid reorder', async () => {
      const request = mockRequest({ listId: 'list-1', orderedIds: ['task-1', 'task-2', 'task-3'] });
      const response = await reorderPOST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Reminders API', () => {
    it('should return 401 for GET when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockGetRequest('http://localhost:3000/api/reminders?taskId=task-1');
      const response = await remindersGET(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when taskId is missing on GET', async () => {
      const request = mockGetRequest('http://localhost:3000/api/reminders');
      const response = await remindersGET(request);
      expect(response.status).toBe(400);
    });

    it('should return 200 with reminders for valid GET', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([{ id: 'task-1' }]));
      mockGetRemindersByTaskId.mockResolvedValueOnce([new Date('2024-01-15T14:30:00Z')]);
      const request = mockGetRequest('http://localhost:3000/api/reminders?taskId=task-1');
      const response = await remindersGET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
    });

    it('should return 401 for POST when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockRequest({ taskId: 'task-1', reminderTime: '2024-01-15T14:30:00Z' });
      const response = await remindersPOST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when taskId is missing on POST', async () => {
      const request = mockRequest({ reminderTime: '2024-01-15T14:30:00Z' });
      const response = await remindersPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when reminderTime is missing on POST', async () => {
      const request = mockRequest({ taskId: 'task-1' });
      const response = await remindersPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 201 for valid POST', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([{ id: 'task-1' }]));
      const request = mockRequest({ taskId: 'task-1', reminderTime: '2024-01-15T14:30:00Z' });
      const response = await remindersPOST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 401 for DELETE when not authenticated', async () => {
      mockAuthFn.mockImplementationOnce(async () => null);
      const request = mockDeleteRequest({ taskId: 'task-1', reminderTime: '2024-01-15T14:30:00Z' });
      const response = await remindersDELETE(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when taskId is missing on DELETE', async () => {
      const request = mockDeleteRequest({ reminderTime: '2024-01-15T14:30:00Z' });
      const response = await remindersDELETE(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when reminderTime is missing on DELETE', async () => {
      const request = mockDeleteRequest({ taskId: 'task-1' });
      const response = await remindersDELETE(request);
      expect(response.status).toBe(400);
    });

    it('should return 200 for valid DELETE', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([{ id: 'task-1' }]));
      const request = mockDeleteRequest({ taskId: 'task-1', reminderTime: '2024-01-15T14:30:00Z' });
      const response = await remindersDELETE(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Register API', () => {
    it('should return 400 when name is missing', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([]));
      const request = mockRequest({ email: 'test@example.com', password: 'password123' });
      const response = await registerPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when email is missing', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([]));
      const request = mockRequest({ name: 'Test', password: 'password123' });
      const response = await registerPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when password is too short', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([]));
      const request = mockRequest({ name: 'Test', email: 'test@example.com', password: '123' });
      const response = await registerPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when email is invalid', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([]));
      const request = mockRequest({ name: 'Test', email: 'not-an-email', password: 'password123' });
      const response = await registerPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when name exceeds max length', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([]));
      const request = mockRequest({
        name: 'a'.repeat(101),
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await registerPOST(request);
      expect(response.status).toBe(400);
    });

    it('should return 409 when user already exists', async () => {
      mockDb.select.mockImplementationOnce(() =>
        createQueryBuilderMock([{ id: 'existing', email: 'test@example.com' }])
      );
      const request = mockRequest({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await registerPOST(request);
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should return 201 for valid registration', async () => {
      mockDb.select.mockImplementationOnce(() => createQueryBuilderMock([]));
      const request = mockRequest({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      });
      const response = await registerPOST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain('successfully');
    });
  });
});

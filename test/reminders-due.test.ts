/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, mock } from 'bun:test';
import { NextRequest } from 'next/server';

// Mock the auth module — returns null (unauthenticated) by default
const mockAuthFn = mock(async () => null);

// Mock db with a chainable query builder
function createDueRemindersResult(rows: any[] = []) {
  const chainable = {
    from: mock(() => chainable),
    where: mock(() => chainable),
    orderBy: mock(() => chainable),
    innerJoin: mock(() => chainable),
  };
  (chainable as any).then = (resolve: any, reject?: any) =>
    Promise.resolve(rows).then(resolve, reject);
  return chainable;
}

const mockDb = {
  select: mock(() => createDueRemindersResult([])),
};

mock.module('@/lib/auth', () => ({ auth: mockAuthFn }));
mock.module('@/db', () => ({ db: mockDb }));
mock.module('@/db/schema', () => ({
  taskLists: { id: { name: 'id' }, userId: { name: 'user_id' } },
  labels: { id: { name: 'id' }, userId: { name: 'user_id' } },
  tasks: { id: { name: 'id' }, listId: { name: 'list_id' }, userId: { name: 'user_id' }, name: { name: 'name' }, priority: { name: 'priority' }, deadline: { name: 'deadline' } },
  subtasks: {},
  taskLabels: {},
  reminders: { id: { name: 'id' }, taskId: { name: 'task_id' }, reminderTime: { name: 'reminder_time' } },
  taskDependencies: {},
  activityLog: {},
  attachments: {},
  taskTemplates: {},
  users: { id: { name: 'id' }, email: { name: 'email' } },
  accounts: {},
  sessions: {},
  verificationTokens: {},
}));
mock.module('@/lib/logger', () => ({
  logger: { info: mock(() => {}), error: mock(() => {}), warn: mock(() => {}), debug: mock(() => {}) },
}));
mock.module('drizzle-orm', () => ({
  eq: mock(() => 'eq-mock'),
  and: mock(() => 'and-mock'),
  gte: mock(() => 'gte-mock'),
  lt: mock(() => 'lt-mock'),
  inArray: mock(() => 'inArray-mock'),
  asc: mock(() => 'asc-mock'),
  desc: mock(() => 'desc-mock'),
  or: mock(() => 'or-mock'),
  ne: mock(() => 'ne-mock'),
  gt: mock(() => 'gt-mock'),
  lte: mock(() => 'lte-mock'),
  sql: mock(() => 'sql-mock'),
}));

// Import route handler AFTER mocks are set up
const { GET } = await import('../src/app/api/reminders/due/route');

function mockGetRequest(url: string) {
  return new NextRequest(url, { method: 'GET' });
}

describe('Reminders Due API', () => {
  it('should return 401 when not authenticated', async () => {
    mockAuthFn.mockReset();
    mockAuthFn.mockResolvedValue(null);

    const response = await GET(mockGetRequest('http://localhost:3000/api/reminders/due'));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 401 when session has no user id', async () => {
    mockAuthFn.mockReset();
    mockAuthFn.mockResolvedValue({ user: {} });

    const response = await GET(mockGetRequest('http://localhost:3000/api/reminders/due'));
    expect(response.status).toBe(401);
  });

  it('should return 200 with empty array when no reminders are due', async () => {
    mockAuthFn.mockReset();
    mockAuthFn.mockResolvedValue({ user: { id: 'user-1' } });

    mockDb.select.mockReset();
    mockDb.select.mockReturnValue(createDueRemindersResult([]));

    const response = await GET(mockGetRequest('http://localhost:3000/api/reminders/due'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it('should return 200 with due reminders data', async () => {
    mockAuthFn.mockReset();
    mockAuthFn.mockResolvedValue({ user: { id: 'user-1' } });

    const reminderRows = [
      {
        reminderId: 'reminder-1',
        taskId: 'task-1',
        reminderTime: new Date('2026-10-11T10:00:00Z'),
        taskName: 'Buy groceries',
        taskPriority: 'high',
        taskDeadline: new Date('2026-10-11T12:00:00Z'),
      },
      {
        reminderId: 'reminder-2',
        taskId: 'task-2',
        reminderTime: new Date('2026-10-11T11:00:00Z'),
        taskName: 'Call client',
        taskPriority: 'medium',
        taskDeadline: null,
      },
    ];

    mockDb.select.mockReset();
    mockDb.select.mockReturnValue(createDueRemindersResult(reminderRows));

    const response = await GET(mockGetRequest('http://localhost:3000/api/reminders/due'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({
      reminderId: 'reminder-1',
      taskId: 'task-1',
      taskName: 'Buy groceries',
      taskPriority: 'high',
    });
    expect(body[1].taskName).toBe('Call client');
    expect(body[1].taskDeadline).toBeNull();
  });

  it('should accept a "since" query parameter', async () => {
    mockAuthFn.mockReset();
    mockAuthFn.mockResolvedValue({ user: { id: 'user-1' } });

    mockDb.select.mockReset();
    mockDb.select.mockReturnValue(createDueRemindersResult([]));

    const since = '2026-10-11T09:00:00Z';
    const response = await GET(
      mockGetRequest(`http://localhost:3000/api/reminders/due?since=${encodeURIComponent(since)}`)
    );
    expect(response.status).toBe(200);
    // Verify select was called (query was executed)
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('should return 500 on database error', async () => {
    mockAuthFn.mockReset();
    mockAuthFn.mockResolvedValue({ user: { id: 'user-1' } });

    mockDb.select.mockReset();
    mockDb.select.mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const response = await GET(mockGetRequest('http://localhost:3000/api/reminders/due'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to fetch reminders');
  });
});

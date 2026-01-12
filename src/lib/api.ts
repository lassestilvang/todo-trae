import { getDatabase } from './database';
import { Task, TaskList, Label, Subtask, ActivityLog } from '@/types';
import { logger } from './logger';

// Task List operations
interface TaskListRow {
  id: string;
  name: string;
  color: string;
  emoji: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export function getAllLists(): TaskList[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM task_lists ORDER BY is_default DESC, name ASC');
  const results = stmt.all() as TaskListRow[];
  return results.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export function getListById(id: string): TaskList | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM task_lists WHERE id = ?');
  const row = stmt.get(id) as TaskListRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function createList(list: Omit<TaskList, 'createdAt' | 'updatedAt'>): TaskList {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO task_lists (id, name, color, emoji, is_default)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(list.id, list.name, list.color, list.emoji, list.isDefault ? 1 : 0);
    logger.info('Task list created', { listId: list.id, name: list.name });
    return getListById(list.id)!;
  } catch (error) {
    logger.error('Failed to create task list', { error, list });
    throw error;
  }
}

export function updateList(id: string, updates: Partial<TaskList>): TaskList {
  const db = getDatabase();
  
  const mappedUpdates: Record<string, string | number> = {};
  if (updates.name !== undefined) mappedUpdates.name = updates.name;
  if (updates.color !== undefined) mappedUpdates.color = updates.color;
  if (updates.emoji !== undefined) mappedUpdates.emoji = updates.emoji;
  if (updates.isDefault !== undefined) mappedUpdates.is_default = updates.isDefault ? 1 : 0;

  const keys = Object.keys(mappedUpdates);
  if (keys.length === 0) return getListById(id)!;

  const setClause = keys.map(key => `"${key}" = ?`).join(', ');
  const values = [...Object.values(mappedUpdates), new Date().toISOString(), id];

  const stmt = db.prepare(`UPDATE task_lists SET ${setClause}, updated_at = ? WHERE id = ?`);
  stmt.run(...values);
  return getListById(id)!;
}

export function deleteList(id: string): void {
  const db = getDatabase();
  try {
    const stmt = db.prepare('DELETE FROM task_lists WHERE id = ?');
    stmt.run(id);
    logger.info('Task list deleted', { listId: id });
  } catch (error) {
    logger.error('Failed to delete task list', { error, listId: id });
    throw error;
  }
}

// Label operations
interface LabelRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export function getAllLabels(): Label[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM labels ORDER BY name ASC');
  const results = stmt.all() as LabelRow[];
  return results.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export function getLabelById(id: string): Label | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM labels WHERE id = ?');
  const row = stmt.get(id) as LabelRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function createLabel(label: Omit<Label, 'createdAt' | 'updatedAt'>): Label {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO labels (id, name, color, icon)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(label.id, label.name, label.color, label.icon);
  return getLabelById(label.id)!;
}

export function updateLabel(id: string, updates: Partial<Label>): Label {
  const db = getDatabase();
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];

  const stmt = db.prepare(`UPDATE labels SET ${setClause}, updated_at = ? WHERE id = ?`);
  stmt.run(...values);
  return getLabelById(id)!;
}

export function deleteLabel(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM labels WHERE id = ?');
  stmt.run(id);
}

// Task operations
export function getAllTasks(limit?: number, offset?: number): Task[] {
  const db = getDatabase();
  let query = `
    SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors, GROUP_CONCAT(l.icon) as label_icons
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    GROUP BY t.id
    ORDER BY t.completed ASC, t."order" ASC, t.created_at DESC
  `;

  if (limit !== undefined) {
    query += ` LIMIT ${limit}`;
    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }
  }

  const stmt = db.prepare(query);
  const results = stmt.all() as Record<string, string | number | null>[];
  return results.map((row) => {
    const labels = row.label_ids
      ? String(row.label_ids).split(',').map((id: string, index: number) => ({
          id,
          name: String(row.label_names).split(',')[index],
          color: String(row.label_colors).split(',')[index],
          icon: String(row.label_icons).split(',')[index],
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      : [];

    const task: Task = {
      id: String(row.id),
      listId: String(row.list_id),
      name: String(row.name),
      description: row.description ? String(row.description) : undefined,
      date: row.date ? new Date(String(row.date)) : undefined,
      deadline: row.deadline ? new Date(String(row.deadline)) : undefined,
      reminders: [],
      estimate: row.estimate ? String(row.estimate) : undefined,
      actualTime: row.actual_time ? String(row.actual_time) : undefined,
      priority: String(row.priority) as Task['priority'],
      completed: Boolean(row.completed),
      completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined,
      recurring: row.recurring ? (String(row.recurring) as Task['recurring']) : undefined,
      recurringEndDate: row.recurring_end_date ? new Date(String(row.recurring_end_date)) : undefined,
      parentTaskId: row.parent_task_id ? String(row.parent_task_id) : undefined,
      order: Number(row.order),
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
      labels,
    };

    return task;
  });
}

export function getTasksByListId(listId: string, limit?: number, offset?: number): Task[] {
  const db = getDatabase();
  let query = `
    SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors, GROUP_CONCAT(l.icon) as label_icons
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    WHERE t.list_id = ? AND t.parent_task_id IS NULL
    GROUP BY t.id
    ORDER BY t.completed ASC, t."order" ASC, t.created_at DESC
  `;

  if (limit !== undefined) {
    query += ` LIMIT ${limit}`;
    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }
  }

  const stmt = db.prepare(query);
  const results = stmt.all(listId) as Record<string, string | number | null>[];
  return results.map((row) => {
    const labels = row.label_ids
      ? String(row.label_ids).split(',').map((id: string, index: number) => ({
          id,
          name: String(row.label_names).split(',')[index],
          color: String(row.label_colors).split(',')[index],
          icon: String(row.label_icons).split(',')[index],
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      : [];

    const task: Task = {
      id: String(row.id),
      listId: String(row.list_id),
      name: String(row.name),
      description: row.description ? String(row.description) : undefined,
      date: row.date ? new Date(String(row.date)) : undefined,
      deadline: row.deadline ? new Date(String(row.deadline)) : undefined,
      reminders: [],
      estimate: row.estimate ? String(row.estimate) : undefined,
      actualTime: row.actual_time ? String(row.actual_time) : undefined,
      priority: String(row.priority) as Task['priority'],
      completed: Boolean(row.completed),
      completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined,
      recurring: row.recurring ? (String(row.recurring) as Task['recurring']) : undefined,
      recurringEndDate: row.recurring_end_date ? new Date(String(row.recurring_end_date)) : undefined,
      parentTaskId: row.parent_task_id ? String(row.parent_task_id) : undefined,
      order: Number(row.order),
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
      labels,
    };

    return task;
  });
}

export function getTaskById(id: string): Task | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors, GROUP_CONCAT(l.icon) as label_icons
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    WHERE t.id = ?
    GROUP BY t.id
  `);

  const row = stmt.get(id) as Record<string, string | number | null> | undefined;
  if (!row) return null;

  const labels = row.label_ids
    ? String(row.label_ids).split(',').map((id: string, index: number) => ({
        id,
        name: String(row.label_names).split(',')[index],
        color: String(row.label_colors).split(',')[index],
        icon: String(row.label_icons).split(',')[index],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    : [];

  const task: Task = {
    id: String(row.id),
    listId: String(row.list_id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    date: row.date ? new Date(String(row.date)) : undefined,
    deadline: row.deadline ? new Date(String(row.deadline)) : undefined,
    reminders: [],
    estimate: row.estimate ? String(row.estimate) : undefined,
    actualTime: row.actual_time ? String(row.actual_time) : undefined,
    priority: String(row.priority) as Task['priority'],
    completed: Boolean(row.completed),
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined,
    recurring: row.recurring ? (String(row.recurring) as Task['recurring']) : undefined,
    recurringEndDate: row.recurring_end_date ? new Date(String(row.recurring_end_date)) : undefined,
    parentTaskId: row.parent_task_id ? String(row.parent_task_id) : undefined,
    order: Number(row.order),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    labels,
  };

  return task;
}

export function createTask(task: Omit<Task, 'createdAt' | 'updatedAt' | 'subtasks' | 'attachments'> & { labelIds?: string[] }): Task {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO tasks (id, list_id, name, description, date, deadline, estimate, actual_time, priority, completed, recurring, recurring_end_date, parent_task_id, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    task.id,
    task.listId,
    task.name,
    task.description || null,
    task.date instanceof Date ? task.date.toISOString() : (task.date || null),
    task.deadline instanceof Date ? task.deadline.toISOString() : (task.deadline || null),
    task.estimate || null,
    task.actualTime || null,
    task.priority,
    task.completed ? 1 : 0,
    task.recurring || null,
    task.recurringEndDate instanceof Date ? task.recurringEndDate.toISOString() : (task.recurringEndDate || null),
    task.parentTaskId || null,
    task.order || 0
  );

  const labelIds = task.labelIds || (task.labels as Label[])?.map(l => l.id) || [];
  if (labelIds.length > 0) {
    const labelStmt = db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)');
    for (const labelId of labelIds) {
      labelStmt.run(task.id, labelId);
    }
  }

  return getTaskById(task.id)!;
}

export function updateTask(id: string, updates: Partial<Task> & { labelIds?: string[] }): Task {
  const db = getDatabase();

  const fieldMapping: Record<string, string> = {
    listId: 'list_id',
    completedAt: 'completed_at',
    recurringEndDate: 'recurring_end_date',
    parentTaskId: 'parent_task_id',
    actualTime: 'actual_time',
    order: '"order"',
  };

  const setClause = Object.keys(updates)
    .filter(key => !['labels', 'labelIds', 'id', 'reminders', 'createdAt', 'updatedAt'].includes(key))
    .map(key => `${fieldMapping[key] || key} = ?`)
    .join(', ');

  const values = Object.entries(updates)
    .filter(([key]) => !['labels', 'labelIds', 'id', 'reminders', 'createdAt', 'updatedAt'].includes(key))
    .map(([, value]) => {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value ?? null;
    });

  if (setClause) {
    const stmt = db.prepare(`UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`);
    stmt.run(...values, new Date().toISOString(), id);
  }

  const labelIds = updates.labelIds || updates.labels?.map(l => l.id);
  if (labelIds) {
    const deleteStmt = db.prepare('DELETE FROM task_labels WHERE task_id = ?');
    deleteStmt.run(id);

    if (labelIds.length > 0) {
      const labelStmt = db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)');
      for (const labelId of labelIds) {
        labelStmt.run(id, labelId);
      }
    }
  }

  return getTaskById(id)!;
}

export function deleteTask(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
}

export function toggleTaskComplete(id: string): Task {
  const task = getTaskById(id);
  if (!task) throw new Error('Task not found');

  const updates = {
    completed: !task.completed,
    completedAt: !task.completed ? new Date() : undefined,
  };

  return updateTask(id, updates);
}

// Subtask operations
export function getSubtasksByTaskId(taskId: string): Subtask[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY "order" ASC');
  return stmt.all(taskId) as Subtask[];
}

export function createSubtask(subtask: Omit<Subtask, 'createdAt' | 'updatedAt'>): Subtask {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO subtasks (id, task_id, name, completed, "order")
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(subtask.id, subtask.taskId, subtask.name, subtask.completed, subtask.order);
  return getSubtaskById(subtask.id)!;
}

export function getSubtaskById(id: string): Subtask | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM subtasks WHERE id = ?');
  return stmt.get(id) as Subtask | null;
}

export function updateSubtask(id: string, updates: Partial<Subtask>): Subtask {
  const db = getDatabase();
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];

  const stmt = db.prepare(`UPDATE subtasks SET ${setClause}, updated_at = ? WHERE id = ?`);
  stmt.run(...values);
  return getSubtaskById(id)!;
}

export function deleteSubtask(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
  stmt.run(id);
}

// Activity log operations
export function getAllActivityLogs(limit?: number, offset?: number): ActivityLog[] {
  const db = getDatabase();
  let query = 'SELECT * FROM activity_log ORDER BY created_at DESC';
  
  if (limit !== undefined) {
    query += ` LIMIT ${limit}`;
    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }
  }

  const stmt = db.prepare(query);
  return stmt.all() as ActivityLog[];
}

export function getActivityLogByTaskId(taskId: string, limit?: number, offset?: number): ActivityLog[] {
  const db = getDatabase();
  let query = 'SELECT * FROM activity_log WHERE task_id = ? ORDER BY created_at DESC';
  
  if (limit !== undefined) {
    query += ` LIMIT ${limit}`;
    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }
  }

  const stmt = db.prepare(query);
  return stmt.all(taskId) as ActivityLog[];
}

export function createActivityLog(log: Omit<ActivityLog, 'createdAt'>): ActivityLog {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO activity_log (id, task_id, list_id, label_id, action, field, old_value, new_value, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    log.id, 
    log.taskId || null, 
    log.listId || null, 
    log.labelId || null, 
    log.action, 
    log.field || null, 
    log.oldValue || null, 
    log.newValue || null, 
    log.userId || null
  );
  return { ...log, createdAt: new Date() };
}

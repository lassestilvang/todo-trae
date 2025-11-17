import { getDatabase } from './database';
import { Task, TaskList, Label, Subtask, Attachment, ActivityLog } from '@/types';

// Task List operations
export function getAllLists(): TaskList[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM task_lists ORDER BY is_default DESC, name ASC');
  return stmt.all() as TaskList[];
}

export function getListById(id: string): TaskList | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM task_lists WHERE id = ?');
  return stmt.get(id) as TaskList | null;
}

export function createList(list: Omit<TaskList, 'createdAt' | 'updatedAt'>): TaskList {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO task_lists (id, name, color, emoji, is_default)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(list.id, list.name, list.color, list.emoji, list.isDefault);
  return getListById(list.id)!;
}

export function updateList(id: string, updates: Partial<TaskList>): TaskList {
  const db = getDatabase();
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];

  const stmt = db.prepare(`UPDATE task_lists SET ${setClause}, updated_at = ? WHERE id = ?`);
  stmt.run(...values);
  return getListById(id)!;
}

export function deleteList(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM task_lists WHERE id = ?');
  stmt.run(id);
}

// Label operations
export function getAllLabels(): Label[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM labels ORDER BY name ASC');
  return stmt.all() as Label[];
}

export function getLabelById(id: string): Label | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM labels WHERE id = ?');
  return stmt.get(id) as Label | null;
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
export function getAllTasks(): Task[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors, GROUP_CONCAT(l.icon) as label_icons
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    GROUP BY t.id
    ORDER BY t."order" ASC, t.created_at ASC
  `);

  const results = stmt.all() as Record<string, string | number | null>[];
  return results.map(row => ({
    ...row,
    date: row.date ? new Date(String(row.date)) : undefined,
    deadline: row.deadline ? new Date(String(row.deadline)) : undefined,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    recurringEndDate: row.recurring_end_date ? new Date(String(row.recurring_end_date)) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    labels: row.label_ids ? String(row.label_ids).split(',').map((id: string, index: number) => ({
      id,
      name: String(row.label_names).split(',')[index],
      color: String(row.label_colors).split(',')[index],
      icon: String(row.label_icons).split(',')[index],
      createdAt: new Date(),
      updatedAt: new Date()
    })) : []
  }));
}

export function getTasksByListId(listId: string): Task[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT t.*, GROUP_CONCAT(l.id) as label_ids, GROUP_CONCAT(l.name) as label_names,
           GROUP_CONCAT(l.color) as label_colors, GROUP_CONCAT(l.icon) as label_icons
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    WHERE t.list_id = ? AND t.parent_task_id IS NULL
    GROUP BY t.id
    ORDER BY t."order" ASC, t.created_at ASC
  `);

  const results = stmt.all(listId) as Record<string, string | number | null>[];
  return results.map(row => ({
    ...row,
    date: row.date ? new Date(String(row.date)) : undefined,
    deadline: row.deadline ? new Date(String(row.deadline)) : undefined,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    recurringEndDate: row.recurring_end_date ? new Date(String(row.recurring_end_date)) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    labels: row.label_ids ? String(row.label_ids).split(',').map((id: string, index: number) => ({
      id,
      name: String(row.label_names).split(',')[index],
      color: String(row.label_colors).split(',')[index],
      icon: String(row.label_icons).split(',')[index],
      createdAt: new Date(),
      updatedAt: new Date()
    })) : []
  }));
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

  return {
    ...row,
    date: row.date ? new Date(String(row.date)) : undefined,
    deadline: row.deadline ? new Date(String(row.deadline)) : undefined,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    recurringEndDate: row.recurring_end_date ? new Date(String(row.recurring_end_date)) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    labels: row.label_ids ? String(row.label_ids).split(',').map((id: string, index: number) => ({
      id,
      name: String(row.label_names).split(',')[index],
      color: String(row.label_colors).split(',')[index],
      icon: String(row.label_icons).split(',')[index],
      createdAt: new Date(),
      updatedAt: new Date()
    })) : []
  };
}

export function createTask(task: Omit<Task, 'createdAt' | 'updatedAt' | 'subtasks' | 'attachments'>): Task {
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
    task.date?.toISOString() || null,
    task.deadline?.toISOString() || null,
    task.estimate || null,
    task.actualTime || null,
    task.priority,
    task.completed,
    task.recurring || null,
    task.recurringEndDate?.toISOString() || null,
    task.parentTaskId || null,
    task.order
  );

  if (task.labels && task.labels.length > 0) {
    const labelStmt = db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)');
    for (const label of task.labels) {
      labelStmt.run(task.id, label.id);
    }
  }

  return getTaskById(task.id)!;
}

export function updateTask(id: string, updates: Partial<Task>): Task {
  const db = getDatabase();

  const fieldMapping: Record<string, string> = {
    listId: 'list_id',
    completedAt: 'completed_at',
    recurringEndDate: 'recurring_end_date',
    parentTaskId: 'parent_task_id',
  };

  const setClause = Object.keys(updates)
    .filter(key => key !== 'labels' && key !== 'id')
    .map(key => `${fieldMapping[key] || key} = ?`)
    .join(', ');

  const values = Object.entries(updates)
    .filter(([key]) => key !== 'labels' && key !== 'id')
    .map(([_, value]) => (value instanceof Date ? value.toISOString() : value));

  if (setClause) {
    const stmt = db.prepare(`UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`);
    stmt.run(...values, new Date().toISOString(), id);
  }

  if (updates.labels) {
    const deleteStmt = db.prepare('DELETE FROM task_labels WHERE task_id = ?');
    deleteStmt.run(id);

    if (updates.labels.length > 0) {
      const labelStmt = db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)');
      for (const label of updates.labels) {
        labelStmt.run(id, label.id);
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
    completedAt: !task.completed ? new Date() : null,
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
export function getActivityLogByTaskId(taskId: string): ActivityLog[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM activity_log WHERE task_id = ? ORDER BY created_at DESC');
  return stmt.all(taskId) as ActivityLog[];
}

export function createActivityLog(log: Omit<ActivityLog, 'createdAt'>): ActivityLog {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO activity_log (id, task_id, action, field, old_value, new_value, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(log.id, log.taskId, log.action, log.field || null, log.oldValue || null, log.newValue || null, log.userId || null);
  return { ...log, createdAt: new Date() };
}
declare const Bun: unknown;
let isBunEnv = false;
try { isBunEnv = typeof Bun !== 'undefined'; } catch { isBunEnv = false; }
let BunSqlite: unknown;
let BetterSqlite3: unknown;
try { BunSqlite = isBunEnv ? require('bun:sqlite').Database : null; } catch { BunSqlite = null; }
try { BetterSqlite3 = require('better-sqlite3'); } catch { BetterSqlite3 = null; }
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

interface SQLStatement {
  run: (...args: unknown[]) => unknown;
  get: (...args: unknown[]) => unknown;
  all: (...args: unknown[]) => unknown;
}

interface SQLDatabase {
  prepare: (sql: string) => SQLStatement;
  exec: (sql: string) => void;
  close: () => void;
}

let db: SQLDatabase | null = null;

export function getDatabase(): SQLDatabase {
  if (!db) {
    const dbPath = join(process.cwd(), 'data', 'planner.db');
    
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    const Ctor = (BunSqlite as { new (path: string): SQLDatabase } | null) || (BetterSqlite3 as { new (path: string): SQLDatabase } | null);
    db = new (Ctor as { new (path: string): SQLDatabase })(dbPath);
    initializeDatabase();
  }
  
  return db;
}

function initializeDatabase() {
  if (!db) return;

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  db.exec(`
    -- Task Lists
    CREATE TABLE IF NOT EXISTS task_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      emoji TEXT NOT NULL DEFAULT '📋',
      is_default BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Labels
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6B7280',
      icon TEXT NOT NULL DEFAULT '🏷️',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date DATETIME,
      deadline DATETIME,
      estimate TEXT,
      actual_time TEXT,
      priority TEXT CHECK(priority IN ('high', 'medium', 'low', 'none')) DEFAULT 'none',
      completed BOOLEAN DEFAULT FALSE,
      completed_at DATETIME,
      recurring TEXT CHECK(recurring IN ('daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom')),
      recurring_end_date DATETIME,
      parent_task_id TEXT,
      "order" INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Subtasks
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      "order" INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Task Labels (many-to-many)
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );

    -- Reminders
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      reminder_time DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Attachments
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Activity Log
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      field TEXT,
      old_value TEXT,
      new_value TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
    CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_task_id ON activity_log(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
  `);

  // Insert default data
  const defaultListExists = db.prepare('SELECT COUNT(*) as count FROM task_lists WHERE is_default = TRUE').get() as { count: number };
  
  if (defaultListExists.count === 0) {
    db.prepare(`
      INSERT INTO task_lists (id, name, color, emoji, is_default)
      VALUES (?, 'Inbox', '#EF4444', '📥', TRUE)
    `).run('default-inbox');

    // Insert some default labels
    const defaultLabels = [
      { id: 'label-urgent', name: 'Urgent', color: '#DC2626', icon: '🔥' },
      { id: 'label-important', name: 'Important', color: '#F59E0B', icon: '⭐' },
      { id: 'label-personal', name: 'Personal', color: '#10B981', icon: '🏠' },
      { id: 'label-work', name: 'Work', color: '#3B82F6', icon: '💼' },
      { id: 'label-learning', name: 'Learning', color: '#8B5CF6', icon: '📚' },
    ];

    const insertLabel = db.prepare('INSERT INTO labels (id, name, color, icon) VALUES (?, ?, ?, ?)');
    for (const label of defaultLabels) {
      insertLabel.run(label.id, label.name, label.color, label.icon);
    }
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
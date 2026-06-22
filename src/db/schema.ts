import { pgTable, text, timestamp, boolean, integer, primaryKey, pgEnum, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low', 'none']);
export const recurringEnum = pgEnum('recurring', ['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom']);

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  password: text('password'), // Optional for Credentials provider
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const taskLists = pgTable('task_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('#3B82F6').notNull(),
  emoji: text('emoji').default('📋').notNull(),
  isDefault: boolean('is_default').default(false),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const labels = pgTable('labels', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#6B7280').notNull(),
  icon: text('icon').default('🏷️').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => taskLists.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }),
  deadline: timestamp('deadline', { withTimezone: true }),
  estimate: text('estimate'),
  actualTime: text('actual_time'),
  priority: priorityEnum('priority').default('none'),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  recurring: recurringEnum('recurring'),
  recurringEndDate: timestamp('recurring_end_date', { withTimezone: true }),
  parentTaskId: text('parent_task_id'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  parentTaskFk: foreignKey({
    columns: [table.parentTaskId],
    foreignColumns: [table.id],
    name: 'tasks_parent_task_id_fk'
  }).onDelete('cascade'),
  idxTasksListId: index('idx_tasks_list_id').on(table.listId),
  idxTasksDate: index('idx_tasks_date').on(table.date),
  idxTasksDeadline: index('idx_tasks_deadline').on(table.deadline),
  idxTasksCompleted: index('idx_tasks_completed').on(table.completed),
  idxTasksParentId: index('idx_tasks_parent_id').on(table.parentTaskId),
}));

export const subtasks = pgTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  completed: boolean('completed').default(false),
  order: integer('order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxSubtasksTaskId: index('idx_subtasks_task_id').on(table.taskId),
}));

export const taskTemplates = pgTable('task_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  priority: priorityEnum('priority').default('none'),
  estimate: text('estimate'),
  listId: text('list_id').references(() => taskLists.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const taskLabels = pgTable('task_labels', {
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.labelId] }),
  idxTaskLabelsTaskId: index('idx_task_labels_task_id').on(table.taskId),
  idxTaskLabelsLabelId: index('idx_task_labels_label_id').on(table.labelId),
}));

export const reminders = pgTable('reminders', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxRemindersTaskId: index('idx_reminders_task_id').on(table.taskId),
  idxRemindersTime: index('idx_reminders_time').on(table.reminderTime),
}));

export const attachments = pgTable('attachments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxAttachmentsTaskId: index('idx_attachments_task_id').on(table.taskId),
}));

export const activityLog = pgTable('activity_log', {
  id: text('id').primaryKey(),
  taskId: text('task_id'),
  listId: text('list_id'),
  labelId: text('label_id'),
  action: text('action').notNull(),
  field: text('field'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxActivityLogTaskId: index('idx_activity_log_task_id').on(table.taskId),
  idxActivityLogListId: index('idx_activity_log_list_id').on(table.listId),
  idxActivityLogLabelId: index('idx_activity_log_label_id').on(table.labelId),
  idxActivityLogCreatedAt: index('idx_activity_log_created_at').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  taskLists: many(taskLists),
  tasks: many(tasks),
  templates: many(taskTemplates),
  labels: many(labels),
}));

export const taskListsRelations = relations(taskLists, ({ one, many }) => ({
  tasks: many(tasks),
  user: one(users, {
    fields: [taskLists.userId],
    references: [users.id],
  }),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  taskLabels: many(taskLabels),
  user: one(users, {
    fields: [labels.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  list: one(taskLists, {
    fields: [tasks.listId],
    references: [taskLists.id],
  }),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  subtasks: many(subtasks),
  attachments: many(attachments),
  reminders: many(reminders),
  taskLabels: many(taskLabels),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'subtasks',
  }),
  childTasks: many(tasks, {
    relationName: 'subtasks',
  }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  task: one(tasks, {
    fields: [reminders.taskId],
    references: [tasks.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({ one }) => ({
  user: one(users, {
    fields: [taskTemplates.userId],
    references: [users.id],
  }),
  list: one(taskLists, {
    fields: [taskTemplates.listId],
    references: [taskLists.id],
  }),
}));

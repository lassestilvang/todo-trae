import { z } from 'zod';

export const PrioritySchema = z.enum(['high', 'medium', 'low', 'none']);
export const RecurringTypeSchema = z.enum(['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom']);

export const LabelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  icon: z.string().min(1).optional(),
});

export const TaskListSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  emoji: z.string().min(1),
  isDefault: z.boolean(),
});

export const SubtaskSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  name: z.string().min(1).max(255),
  completed: z.boolean(),
  order: z.number().int().nonnegative(),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  listId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  reminders: z.array(z.coerce.date()).default([]),
  estimate: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  actualTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority: PrioritySchema.default('none'),
  completed: z.boolean().default(false),
  completedAt: z.coerce.date().optional(),
  recurring: RecurringTypeSchema.optional(),
  recurringEndDate: z.coerce.date().optional(),
  parentTaskId: z.string().uuid().optional(),
  order: z.number().int().nonnegative(),
  labelIds: z.array(z.string().uuid()).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CreateTaskSchema = TaskSchema.partial({
  id: true,
  order: true,
});

export const UpdateTaskSchema = TaskSchema.partial();
export const UpdateTaskListSchema = TaskListSchema.partial();
export const UpdateLabelSchema = LabelSchema.partial();

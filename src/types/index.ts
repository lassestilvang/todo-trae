export type Priority = 'high' | 'medium' | 'low' | 'none';
export type RecurringType = 'daily' | 'weekly' | 'weekday' | 'monthly' | 'yearly' | 'custom';
export type ViewType = 'today' | 'next7days' | 'upcoming' | 'all';

export interface Label {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  emoji: string;
  isDefault: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  taskId: string;
  name: string;
  completed: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string | null;
  priority: 'high' | 'medium' | 'low' | 'none';
  estimate?: string | null;
  listId?: string | null;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  listId: string;
  userId?: string;
  name: string;
  description?: string;
  date?: Date;
  deadline?: Date;
  reminders: Date[];
  estimate?: string; // HH:mm format
  actualTime?: string; // HH:mm format
  priority: Priority;
  completed: boolean;
  completedAt?: Date;
  recurring?: RecurringType;
  recurringEndDate?: Date;
  parentTaskId?: string; // For subtasks
  order: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  subtasks?: Subtask[];
  attachments?: Attachment[];
  labels?: Label[];
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  listId?: string;
  labelId?: string;
  action: 'created' | 'updated' | 'completed' | 'deleted' | 'moved';
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  createdAt: Date;
}

export interface SearchResult {
  task: Task;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    indices: Array<[number, number]>;
  }>;
}
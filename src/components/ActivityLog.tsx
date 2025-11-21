'use client';

import { useTaskStore } from '@/stores/taskStore';
import type { ActivityLog as ActivityLogType, Task as TaskType } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { History, Plus, Edit3, CheckCircle, Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ActivityLogProps {
  task: TaskType;
}

export function ActivityLog({ task }: ActivityLogProps) {
  const { activityLogs } = useTaskStore();
  const taskLogs = activityLogs.filter(log => log.taskId === task.id);

  const getActionIcon = (action: ActivityLogType['action']) => {
    switch (action) {
      case 'created': return <Plus className="w-4 h-4 text-green-500" />;
      case 'updated': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'deleted': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'moved': return <Move className="w-4 h-4 text-yellow-500" />;
      default: return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionDescription = (log: ActivityLogType) => {
    switch (log.action) {
      case 'created':
        return 'Task created';
      case 'completed':
        return log.newValue === 'true' ? 'Task completed' : 'Task marked as incomplete';
      case 'deleted':
        return 'Task deleted';
      case 'moved':
        return 'Task moved to another list';
      case 'updated':
        if (log.field) {
          const fieldName = log.field.charAt(0).toUpperCase() + log.field.slice(1);
          return `${fieldName} updated`;
        }
        return 'Task updated';
      default:
        return 'Task modified';
    }
  };

  const formatFieldValue = (field: string, value: string) => {
    if (field === 'date' || field === 'deadline' || field === 'completedAt') {
      try {
        const date = new Date(value);
        return format(date, 'MMM d, yyyy HH:mm');
      } catch {
        return value;
      }
    }
    if (field === 'priority') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (field === 'completed') {
      return value === 'true' ? 'Completed' : 'Incomplete';
    }
    return value;
  };

  if (taskLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {taskLogs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 mt-0.5">
            {getActionIcon(log.action)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {getActionDescription(log)}
              </p>
              <time className="text-xs text-muted-foreground" title={format(log.createdAt, 'PPpp')}>
                {formatDistanceToNow(log.createdAt, { addSuffix: true })}
              </time>
            </div>
            
            {log.field && (
              <div className="mt-1 text-xs text-muted-foreground">
                {log.oldValue && (
                  <span className="line-through">{formatFieldValue(log.field, log.oldValue)}</span>
                )}
                {log.oldValue && log.newValue && ' → '}
                {log.newValue && (
                  <span className="text-foreground">{formatFieldValue(log.field, log.newValue)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

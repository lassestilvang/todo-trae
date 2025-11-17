'use client';

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Task as TaskType } from '@/types';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { 
  Circle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Flag,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Repeat,
  Paperclip,
  ListTodo
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TaskProps {
  task: TaskType;
}

export function Task({ task }: TaskProps) {
  const { toggleTaskComplete, subtasks, attachments } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  
  // Get task's subtasks and attachments
  const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
  const taskAttachments = attachments.filter(a => a.taskId === task.id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    const taskDate = new Date(date);
    if (isToday(taskDate)) return 'Today';
    if (isTomorrow(taskDate)) return 'Tomorrow';
    if (isPast(taskDate)) return format(taskDate, 'MMM d');
    return format(taskDate, 'MMM d');
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !task.completed;

  return (
    <div
      className={`group border rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${
        task.completed ? 'bg-muted/50 border-border' : 'bg-card/80 border-border hover:border-primary/50'
      } ${isOverdue ? 'border-red-500/50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleTaskComplete(task.id)}
          className="mt-0.5 flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`font-medium tracking-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.name}
              </h3>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                {task.date && (
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted ${
                    isOverdue ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(task.date)}</span>
                  </div>
                )}
                
                {task.deadline && (
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted ${
                    isOverdue ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(task.deadline), 'HH:mm')}</span>
                  </div>
                )}
                
                {task.priority !== 'none' && (
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted ${getPriorityColor(task.priority)}`}>
                    <Flag className="w-3 h-3" />
                    <span className="capitalize">{task.priority}</span>
                  </div>
                )}

                {task.labels && task.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.icon}
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                {task.recurring && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-blue-500">
                    <Repeat className="w-3 h-3" />
                    <span className="capitalize">{task.recurring}</span>
                  </div>
                )}

                {taskAttachments.length > 0 && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    <Paperclip className="w-3 h-3" />
                    <span>{taskAttachments.length}</span>
                  </div>
                )}

                {taskSubtasks.length > 0 && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    <ListTodo className="w-3 h-3" />
                    <span>{taskSubtasks.filter(s => s.completed).length}/{taskSubtasks.length}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {taskSubtasks.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>{taskSubtasks.length} subtasks ({taskSubtasks.filter(s => s.completed).length} completed)</span>
              </button>
              
              {expanded && (
                <div className="mt-2 space-y-1 ml-4">
                  {taskSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <button className="flex-shrink-0">
                        {subtask.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <span className={subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                        {subtask.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
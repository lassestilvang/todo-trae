'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { Task as TaskType } from '@/types';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { 
  Circle, 
  CheckCircle2, 
  Calendar, 
  Flag,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Repeat,
  Paperclip,
  ListTodo
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TaskForm } from './TaskForm';
import { emitTaskUpdate } from '@/lib/socket-client';

interface TaskProps {
  task: TaskType;
}

export function Task({ task }: TaskProps) {
  const { toggleTaskComplete, subtasks, attachments } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  
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
    return format(taskDate, 'MMM d');
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !task.completed;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed, completedAt: !task.completed ? new Date() : null }),
      });
      if (!response.ok) throw new Error('Failed to toggle completion');
      const updatedTask = await response.json();
      toggleTaskComplete(task.id);
      emitTaskUpdate(task.listId, 'update', updatedTask);
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div
        onClick={() => setEditFormOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setEditFormOpen(true);
          }
        }}
        tabIndex={0}
        role="button"
        data-cursor="hover"
        aria-label={`Task: ${task.name}`}
        className={`group glass-card rounded-xl p-5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all ${
          task.completed ? 'opacity-60' : ''
        } ${isOverdue ? 'border-red-500/50' : ''}`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggleComplete}
            className="mt-0.5 flex-shrink-0"
            aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
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
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {task.date && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(task.date)}</span>
                    </div>
                  )}

                  {task.priority !== 'none' && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      <Flag className="w-3 h-3 fill-current" />
                      <span className="capitalize">{task.priority}</span>
                    </div>
                  )}

                  {task.recurring && (
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Repeat className="w-3 h-3" />
                      <span className="capitalize">{task.recurring}</span>
                    </div>
                  )}

                  {taskAttachments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Paperclip className="w-3 h-3" />
                      <span>{taskAttachments.length}</span>
                    </div>
                  )}

                  {taskSubtasks.length > 0 && (
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <ListTodo className="w-3 h-3" />
                      <span>{taskSubtasks.filter(s => s.completed).length}/{taskSubtasks.length}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" aria-label="Task options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {taskSubtasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  aria-expanded={expanded}
                  aria-controls={`subtasks-${task.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-sm"
                >
                  {expanded ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>Subtasks ({taskSubtasks.filter(s => s.completed).length}/{taskSubtasks.length})</span>
                </button>
                
                {expanded && (
                  <ul id={`subtasks-${task.id}`} className="mt-3 space-y-2 ml-1" role="list">
                    {taskSubtasks.map((subtask) => (
                      <li key={subtask.id} className="flex items-center gap-3 group/subtask" role="listitem">
                        <div className={`w-1 h-1 rounded-full ${subtask.completed ? 'bg-muted' : 'bg-primary/40'}`} aria-hidden="true" />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground/80'}`}>
                          {subtask.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskForm 
        open={editFormOpen} 
        onOpenChange={setEditFormOpen} 
        task={task} 
      />
    </motion.div>
  );
}

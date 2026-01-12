'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { TaskList, Label, Priority, Subtask, Attachment, Task } from '@/types';
import { format } from 'date-fns';
import { Plus, Calendar, Clock, Flag, Hash, Repeat, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { SubtaskManager } from '@/components/SubtaskManager';
import { AttachmentManager } from '@/components/AttachmentManager';
import { RecurringTaskSelector } from '@/components/RecurringTaskSelector';
import { TimeTracker } from '@/components/TimeTracker';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  listId?: string;
}

export function TaskForm({ open, onOpenChange, task, listId }: TaskFormProps) {
  const { lists, labels, subtasks, attachments, addTask, updateTask, deleteTask } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    listId: task?.listId || listId || lists.find(l => l.isDefault)?.id || '',
    date: task?.date ? format(new Date(task.date), 'yyyy-MM-dd') : '',
    time: task?.date ? format(new Date(task.date), 'HH:mm') : '',
    deadline: task?.deadline ? format(new Date(task.deadline), 'HH:mm') : '',
    priority: task?.priority || 'none' as Priority,
    estimate: task?.estimate || '',
    actualTime: task?.actualTime || '',
    labels: task?.labels?.map((l: Label) => l.id) || [] as string[],
    recurring: task?.recurring,
    recurringEndDate: task?.recurringEndDate ? format(new Date(task.recurringEndDate), 'yyyy-MM-dd') : '',
  });

  const priorityColors: Record<Priority, string> = {
    none: 'bg-muted/50 text-muted-foreground',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const priorityIcons: Record<Priority, React.ReactNode> = {
    none: <Flag className="w-3.5 h-3.5" />,
    low: <Flag className="w-3.5 h-3.5 fill-current" />,
    medium: <Flag className="w-3.5 h-3.5 fill-current" />,
    high: <Flag className="w-3.5 h-3.5 fill-current" />,
  };

  // Reset form when task changes or lists load
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        listId: task.listId,
        date: task.date ? format(new Date(task.date), 'yyyy-MM-dd') : '',
        time: task.date ? format(new Date(task.date), 'HH:mm') : '',
        deadline: task.deadline ? format(new Date(task.deadline), 'HH:mm') : '',
        priority: task.priority,
        estimate: task.estimate || '',
        actualTime: task.actualTime || '',
        labels: task.labels?.map((l: Label) => l.id) || [],
        recurring: task.recurring,
        recurringEndDate: task.recurringEndDate ? format(new Date(task.recurringEndDate), 'yyyy-MM-dd') : '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        description: '',
        listId: prev.listId || listId || lists.find(l => l.isDefault)?.id || (lists.length > 0 ? lists[0].id : ''),
        date: '',
        time: '',
        deadline: '',
        priority: 'none',
        estimate: '',
        actualTime: '',
        labels: [],
        recurring: undefined,
        recurringEndDate: '',
      }));
    }
  }, [task, listId, lists]);

  // Get current task's subtasks and attachments
  const currentSubtasks = task ? subtasks.filter(s => s.taskId === task.id) : [];
  const currentAttachments = task ? attachments.filter(a => a.taskId === task.id) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    if (!formData.listId) {
      toast.error('Please select a list for the task');
      return;
    }

    const taskData = {
      name: formData.name,
      description: formData.description || undefined,
      listId: formData.listId,
      date: formData.date ? new Date(`${formData.date}T${formData.time || '00:00'}`) : undefined,
      deadline: formData.date && formData.deadline ? new Date(`${formData.date}T${formData.deadline}`) : undefined,
      priority: formData.priority,
      estimate: formData.estimate || undefined,
      actualTime: formData.actualTime || undefined,
      labelIds: formData.labels,
      completed: task?.completed || false,
      order: task?.order || 0,
      id: task?.id || crypto.randomUUID(),
      reminders: task?.reminders || [],
      recurring: formData.recurring,
      recurringEndDate: formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined,
      parentTaskId: task?.parentTaskId,
    };

    try {
      if (task) {
        // API call
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error('Failed to update task');
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
        toast.success('Task updated');
      } else {
        // API call
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error('Failed to create task');
        const newTask = await response.json();
        addTask(newTask);
        toast.success('Task created');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      deleteTask(task.id);
      toast.success('Task deleted');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border/30 bg-background/80 backdrop-blur-2xl">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
              {task ? 'Edit Task' : 'Create Task'}
            </DialogTitle>
            {task && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                onClick={handleDelete}
                aria-label="Delete task"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </Button>
            )}
          </DialogHeader>
          
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="flex bg-muted/20 p-1 rounded-2xl mb-6 relative">
              <motion.div
                className="absolute inset-y-1 rounded-xl bg-background shadow-sm border border-border/10"
                initial={false}
                animate={{
                  x: activeTab === 'basic' ? 0 : '100%',
                  width: 'calc(50% - 4px)',
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 ${
                  activeTab === 'basic' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-selected={activeTab === 'basic'}
                role="tab"
              >
                Basic Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 ${
                  activeTab === 'advanced' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-selected={activeTab === 'advanced'}
                role="tab"
              >
                Advanced
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'basic' ? (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label htmlFor="task-name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Task Name</label>
                      <Input
                        id="task-name"
                        placeholder="What needs to be done?"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 text-lg font-medium bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl"
                        autoFocus
                        aria-required="true"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="task-description" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Description</label>
                      <Textarea
                        id="task-description"
                        placeholder="Add more details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[120px] bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl resize-none py-3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="task-list" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          List
                        </label>
                        <Select
                          id="task-list"
                          value={formData.listId}
                          onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
                          className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                        >
                          <option value="" disabled>Select a list</option>
                          {lists.map((l) => (
                            <option key={l.id} value={l.id}>{l.emoji} {l.name}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                          <Flag className="w-3 h-3" />
                          Priority
                        </label>
                        <div className="flex gap-2 p-1 bg-muted/20 rounded-xl border border-border/10" role="radiogroup" aria-label="Task priority">
                          {(['none', 'low', 'medium', 'high'] as Priority[]).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormData({ ...formData, priority: p })}
                              className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all border ${
                                formData.priority === p 
                                  ? `${priorityColors[p]} border-current shadow-sm scale-[1.02]` 
                                  : 'text-muted-foreground/60 border-transparent hover:bg-background/40'
                              }`}
                              aria-checked={formData.priority === p}
                              role="radio"
                              title={`${p.charAt(0).toUpperCase() + p.slice(1)} priority`}
                            >
                              {priorityIcons[p]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="task-date" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Date
                        </label>
                        <Input
                          id="task-date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="task-time" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Time
                        </label>
                        <Input
                          id="task-time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                          disabled={!formData.date}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Labels</label>
                      <div className="flex flex-wrap gap-2 p-1">
                        {labels.map(label => (
                          <motion.button
                            key={label.id}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const newLabels = formData.labels.includes(label.id)
                                ? formData.labels.filter(id => id !== label.id)
                                : [...formData.labels, label.id];
                              setFormData({ ...formData, labels: newLabels });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              formData.labels.includes(label.id)
                                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                : 'bg-background/40 text-muted-foreground border-border/40 hover:bg-muted/60'
                            }`}
                            aria-pressed={formData.labels.includes(label.id)}
                          >
                            {label.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-6 rounded-2xl border-border/20">
                      <RecurringTaskSelector
                        value={formData.recurring}
                        endDate={formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined}
                        onChange={(type, endDate) => setFormData({
                          ...formData,
                          recurring: type,
                          recurringEndDate: endDate ? format(endDate, 'yyyy-MM-dd') : ''
                        })}
                      />
                    </div>

                    {task && (
                      <div className="glass-card p-6 rounded-2xl border-border/20">
                        <TimeTracker
                          taskId={task.id}
                          estimate={formData.estimate}
                          actualTime={formData.actualTime}
                          onTimeUpdate={(actualTime) => setFormData({ ...formData, actualTime })}
                        />
                      </div>
                    )}

                    {task && (
                      <div className="glass-card p-6 rounded-2xl border-border/20">
                        <SubtaskManager
                          taskId={task.id}
                          subtasks={currentSubtasks}
                        />
                      </div>
                    )}

                    {task && (
                      <div className="glass-card p-6 rounded-2xl border-border/20">
                        <AttachmentManager
                          taskId={task.id}
                          attachments={currentAttachments}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-border/20 bg-muted/5 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="px-6 rounded-xl hover:bg-muted/40 font-semibold"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={(e) => {
                const form = (e.currentTarget as HTMLButtonElement).form;
                if (form) form.requestSubmit();
                else handleSubmit(e as unknown as React.FormEvent);
              }}
              className="px-8 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

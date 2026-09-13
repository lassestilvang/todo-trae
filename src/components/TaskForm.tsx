'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useTemplateStore } from '@/stores/templateStore';
import { Label, Priority, Task, TaskTemplate } from '@/types';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Flag,
  Hash,
  Trash2,
  Copy,
  Bell,
  X,
  Link,
  Unlink,
  Sparkles,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { SubtaskManager } from '@/components/SubtaskManager';
import { AttachmentManager } from '@/components/AttachmentManager';
import { RecurringTaskSelector } from '@/components/RecurringTaskSelector';
import { TimeTracker } from '@/components/TimeTracker';
import { ActivityLog } from '@/components/ActivityLog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { emitTaskUpdate } from '@/lib/socket-client';
import { logger } from '@/lib/logger';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  listId?: string;
}

export function TaskForm({ open, onOpenChange, task, listId }: TaskFormProps) {
  const { lists, labels, subtasks, attachments, addTask, updateTask, deleteTask } = useTaskStore();
  const { templates, fetchTemplates, addTemplate } = useTemplateStore();
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'activity'>('basic');

  const initialFormData = task
    ? {
        name: task.name,
        description: task.description || '',
        listId: task.listId,
        date: task.date ? format(new Date(task.date), 'yyyy-MM-dd') : '',
        time: task.date ? format(new Date(task.date), 'HH:mm') : '',
        deadlineDate: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
        deadline: task.deadline ? format(new Date(task.deadline), 'HH:mm') : '',
        priority: task.priority,
        estimate: task.estimate || '',
        actualTime: task.actualTime || '',
        labels: task.labels?.map((l: Label) => l.id) || [],
        recurring: task.recurring,
        recurringEndDate: task.recurringEndDate
          ? format(new Date(task.recurringEndDate), 'yyyy-MM-dd')
          : '',
        reminderDate: '',
        reminderTime: '',
        dependencyTaskId: '',
      }
    : ({
        name: '',
        description: '',
        listId: listId || lists.find((l) => l.isDefault)?.id || '',
        date: '',
        time: '',
        deadlineDate: '',
        deadline: '',
        priority: 'none' as Priority,
        estimate: '',
        actualTime: '',
        labels: [] as string[],
        recurring: undefined,
        recurringEndDate: '',
        reminderDate: '',
        reminderTime: '',
        dependencyTaskId: '',
      } as const);

  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleApplyTemplate = (template: TaskTemplate) => {
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      description: template.description || '',
      priority: template.priority,
      estimate: template.estimate || '',
      listId: template.listId || prev.listId,
    }));
    toast.success('Template applied!');
  };

  const handleSaveAsTemplate = async () => {
    if (!formData.name) {
      toast.error('Task name is required to save as template');
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priority: formData.priority,
          estimate: formData.estimate,
          listId: formData.listId,
        }),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        addTemplate(newTemplate);
        toast.success('Template saved!');
      }
    } catch {
      toast.error('Failed to save template');
    }
  };

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

  // Reset form when task changes — handled via lazy useState initialization
  // and key-based remount in parent components

  // Get current task's subtasks and attachments
  const currentSubtasks = task ? subtasks.filter((s) => s.taskId === task.id) : [];
  const currentAttachments = task ? attachments.filter((a) => a.taskId === task.id) : [];

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
      deadline:
        formData.deadlineDate && formData.deadline
          ? new Date(`${formData.deadlineDate}T${formData.deadline}`)
          : undefined,
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
        emitTaskUpdate(updatedTask.listId, 'update', updatedTask);
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
        emitTaskUpdate(newTask.listId, 'add', newTask);
        toast.success('Task created');
      }
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving task', { error });
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
      emitTaskUpdate(task.listId, 'delete', task);
      toast.success('Task deleted');
      onOpenChange(false);
    } catch (error) {
      logger.error('Error deleting task', { error });
      toast.error('Failed to delete task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border/30 bg-background/80 backdrop-blur-2xl">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                {task ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {task
                  ? 'Update task details and settings'
                  : 'Fill in the details to create a new task'}
              </DialogDescription>
            </div>
            {!task && templates.length > 0 && (
              <Select
                value=""
                onChange={(e) => {
                  const template = templates.find((t) => t.id === e.target.value);
                  if (template) handleApplyTemplate(template);
                }}
                className="w-48 h-8 text-xs bg-background/40 backdrop-blur-md border-border/30 rounded-xl cursor-pointer"
              >
                <option value="" disabled>
                  Apply template...
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
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
                  x: activeTab === 'basic' ? 0 : activeTab === 'advanced' ? '100%' : '200%',
                  width: 'calc(33.333% - 4px)',
                }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 ${
                  activeTab === 'basic'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
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
                  activeTab === 'advanced'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-selected={activeTab === 'advanced'}
                role="tab"
              >
                Advanced
              </button>
              {task && (
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 ${
                    activeTab === 'activity'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-selected={activeTab === 'activity'}
                  role="tab"
                >
                  Activity
                </button>
              )}
            </div>

            <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
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
                      <label
                        htmlFor="task-name"
                        className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center justify-between"
                      >
                        <span>Task Name</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const input = prompt(
                              'Type a task in natural language.\n\nExamples:\n• "Buy milk #shopping tomorrow at 3pm"\n• "Submit report #work by Friday deadline"\n• "Call mom in 2 days important"'
                            );
                            if (!input) return;
                            try {
                              const response = await fetch('/api/parse-task', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: input }),
                              });
                              if (!response.ok) throw new Error('Failed to parse');
                              const parsed = await response.json();
                              setFormData((prev) => ({
                                ...prev,
                                name: parsed.name,
                                description: parsed.description || prev.description,
                                priority: parsed.priority || prev.priority,
                                labels: parsed.labelIds.length ? parsed.labelIds : prev.labels,
                                deadlineDate: parsed.deadline
                                  ? format(new Date(parsed.deadline), 'yyyy-MM-dd')
                                  : prev.deadlineDate,
                                deadline: parsed.deadline
                                  ? format(new Date(parsed.deadline), 'HH:mm')
                                  : prev.deadline,
                                estimate: parsed.estimate || prev.estimate,
                              }));
                              toast.success('Task parsed from natural language');
                            } catch {
                              toast.error('Failed to parse natural language');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium flex items-center gap-1"
                          aria-label="Parse natural language"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Parse
                        </button>
                      </label>
                      <Input
                        id="task-name"
                        placeholder="What needs to be done?"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 text-lg font-medium bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl"
                        autoFocus
                        aria-required="true"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: Type naturally like &quot;Buy milk #shopping tomorrow at 3pm
                        urgent&quot; — click &quot;AI Parse&quot; to parse it automatically.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="task-description"
                        className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1"
                      >
                        Description
                      </label>
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
                        <label
                          htmlFor="task-list"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"
                        >
                          <Hash className="w-3 h-3" />
                          List
                        </label>
                        <Select
                          id="task-list"
                          value={formData.listId}
                          onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
                          className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                        >
                          <option value="" disabled>
                            Select a list
                          </option>
                          {lists.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.emoji} {l.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                          <Flag className="w-3 h-3" />
                          Priority
                        </label>
                        <div
                          className="flex gap-2 p-1 bg-muted/20 rounded-xl border border-border/10"
                          role="radiogroup"
                          aria-label="Task priority"
                        >
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
                        <label
                          htmlFor="task-date"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"
                        >
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
                        <label
                          htmlFor="task-time"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"
                        >
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
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                        Labels
                      </label>
                      <div className="flex flex-wrap gap-2 p-1">
                        {labels.map((label) => (
                          <motion.button
                            key={label.id}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const newLabels = formData.labels.includes(label.id)
                                ? formData.labels.filter((id) => id !== label.id)
                                : [...formData.labels, label.id];
                              setFormData({ ...formData, labels: newLabels });
                            }}
                            style={{
                              borderColor: label.color,
                              color: formData.labels.includes(label.id) ? undefined : label.color,
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
                ) : activeTab === 'advanced' ? (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-6 rounded-2xl border-border/20">
                      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Time Estimate
                      </h3>
                      <Input
                        id="task-estimate"
                        type="text"
                        placeholder="HH:MM"
                        value={formData.estimate}
                        onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                        className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11 font-mono"
                      />
                    </div>

                    <div className="glass-card p-6 rounded-2xl border-border/20">
                      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Deadline
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label
                            htmlFor="task-deadline-date"
                            className="text-xs text-muted-foreground"
                          >
                            Date
                          </label>
                          <Input
                            id="task-deadline-date"
                            type="date"
                            value={formData.deadlineDate}
                            onChange={(e) =>
                              setFormData({ ...formData, deadlineDate: e.target.value })
                            }
                            className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="task-deadline-time"
                            className="text-xs text-muted-foreground"
                          >
                            Time
                          </label>
                          <Input
                            id="task-deadline-time"
                            type="time"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            disabled={!formData.deadlineDate}
                            className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reminders */}
                    <div className="glass-card p-6 rounded-2xl border-border/20">
                      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Bell className="w-3 h-3" />
                        Reminders
                      </h3>
                      {task && task.reminders && task.reminders.length > 0 ? (
                        <div className="space-y-2 mb-3">
                          {task.reminders.map((reminder, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-xl bg-background/30"
                            >
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(reminder), 'PPpp')}
                              </span>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await fetch('/api/reminders', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      taskId: task.id,
                                      reminderTime: reminder.toISOString(),
                                    }),
                                  });
                                  // Refresh the task data
                                  const updated = await fetch(`/api/tasks/${task.id}`);
                                  const updatedTask = await updated.json();
                                  updateTask(task.id, updatedTask);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                aria-label={`Remove reminder at ${format(new Date(reminder), 'PPpp')}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label
                            htmlFor="task-reminder-date"
                            className="text-xs text-muted-foreground"
                          >
                            Date
                          </label>
                          <Input
                            id="task-reminder-date"
                            type="date"
                            value={formData.reminderDate}
                            onChange={(e) =>
                              setFormData({ ...formData, reminderDate: e.target.value })
                            }
                            className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="task-reminder-time"
                            className="text-xs text-muted-foreground"
                          >
                            Time
                          </label>
                          <Input
                            id="task-reminder-time"
                            type="time"
                            value={formData.reminderTime}
                            onChange={(e) =>
                              setFormData({ ...formData, reminderTime: e.target.value })
                            }
                            disabled={!formData.reminderDate}
                            className="bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                          />
                        </div>
                      </div>

                      {formData.reminderDate && formData.reminderTime && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-semibold"
                          onClick={async (e) => {
                            e.preventDefault();
                            if (!task) return;
                            const reminderDateTime = new Date(
                              `${formData.reminderDate}T${formData.reminderTime}`
                            );
                            try {
                              await fetch('/api/reminders', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  taskId: task.id,
                                  reminderTime: reminderDateTime.toISOString(),
                                }),
                              });
                              // Refresh task data to get updated reminders
                              const updated = await fetch(`/api/tasks/${task.id}`);
                              const updatedTask = await updated.json();
                              updateTask(task.id, updatedTask);
                              setFormData({ ...formData, reminderDate: '', reminderTime: '' });
                              toast.success('Reminder added');
                            } catch {
                              toast.error('Failed to add reminder');
                            }
                          }}
                        >
                          Add Reminder
                        </Button>
                      )}
                      {!task && formData.reminderDate && formData.reminderTime && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: Reminders can be added after task creation.
                        </p>
                      )}
                    </div>

                    {/* Dependencies */}
                    {task && (
                      <div className="glass-card p-6 rounded-2xl border-border/20">
                        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Link className="w-3 h-3" />
                          Dependencies
                        </h3>
                        {task.dependencies && task.dependencies.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {task.dependencies.map((dep) => (
                              <div
                                key={dep.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-background/30"
                              >
                                <span className="text-sm text-muted-foreground">
                                  Depends on:{' '}
                                  <span className="text-foreground font-medium">
                                    {dep.dependsOnTaskId}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await fetch('/api/tasks/dependencies', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          taskId: task.id,
                                          dependsOnTaskId: dep.dependsOnTaskId,
                                        }),
                                      });
                                      const updated = await fetch(`/api/tasks/${task.id}`);
                                      const updatedTask = await updated.json();
                                      updateTask(task.id, updatedTask);
                                      toast.success('Dependency removed');
                                    } catch {
                                      toast.error('Failed to remove dependency');
                                    }
                                  }}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  aria-label="Remove dependency"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-3">No dependencies set.</p>
                        )}

                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={formData.dependencyTaskId}
                            onChange={(e) =>
                              setFormData({ ...formData, dependencyTaskId: e.target.value })
                            }
                            placeholder="Task ID to depend on"
                            className="flex-1 bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl h-11"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!task || !formData.dependencyTaskId.trim()) return;
                              try {
                                const response = await fetch('/api/tasks/dependencies', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    taskId: task.id,
                                    dependsOnTaskId: formData.dependencyTaskId.trim(),
                                  }),
                                });
                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Failed to add dependency');
                                }
                                const updated = await fetch(`/api/tasks/${task.id}`);
                                const updatedTask = await updated.json();
                                updateTask(task.id, updatedTask);
                                setFormData({ ...formData, dependencyTaskId: '' });
                                toast.success('Dependency added');
                              } catch (error) {
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : 'Failed to add dependency'
                                );
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="glass-card p-6 rounded-2xl border-border/20">
                      <RecurringTaskSelector
                        value={formData.recurring}
                        endDate={
                          formData.recurringEndDate
                            ? new Date(formData.recurringEndDate)
                            : undefined
                        }
                        onChange={(type, endDate) =>
                          setFormData({
                            ...formData,
                            recurring: type,
                            recurringEndDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
                          })
                        }
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
                        <SubtaskManager taskId={task.id} subtasks={currentSubtasks} />
                      </div>
                    )}

                    {task && (
                      <div className="glass-card p-6 rounded-2xl border-border/20">
                        <AttachmentManager taskId={task.id} attachments={currentAttachments} />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-6 rounded-2xl border-border/20">
                      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History className="w-3 h-3" />
                        Activity History
                      </h3>
                      {task && <ActivityLog task={task} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-border/20 bg-muted/5 flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="px-4 rounded-xl hover:bg-muted/40 font-semibold border-border/30"
              onClick={handleSaveAsTemplate}
            >
              <Copy className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="px-6 rounded-xl hover:bg-muted/40 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="task-form"
                className="px-8 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {task ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

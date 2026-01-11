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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          {task && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </DialogHeader>
        
        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Basic
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <>
              <div>
                <Input
                  placeholder="Task name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-lg"
                  autoFocus
                />
              </div>

              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  >
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Estimate</label>
                  <Input
                    type="time"
                    value={formData.estimate}
                    onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                    placeholder="HH:mm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">List</label>
                <Select
                  value={formData.listId}
                  onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.emoji} {list.name}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Recurring Task */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Recurrence
                </label>
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

              {/* Time Tracking */}
              {task && (
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time Tracking
                  </label>
                  <TimeTracker
                    taskId={task.id}
                    estimate={formData.estimate}
                    actualTime={formData.actualTime}
                    onTimeUpdate={(actualTime) => setFormData({ ...formData, actualTime })}
                  />
                </div>
              )}

              {/* Subtasks */}
              {task && (
                <div>
                  <SubtaskManager
                    taskId={task.id}
                    subtasks={currentSubtasks}
                  />
                </div>
              )}

              {/* Attachments */}
              {task && (
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </label>
                  <AttachmentManager
                    taskId={task.id}
                    attachments={currentAttachments}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update' : 'Add'} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

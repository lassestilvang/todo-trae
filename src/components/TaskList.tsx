'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import dynamic from 'next/dynamic';
const TaskForm = dynamic(() => import('@/components/TaskForm').then(m => m.TaskForm), { ssr: false });
import { Task as TaskType, ViewType } from '@/types';
import { Task } from '@/components/Task';
import { TaskHeader } from '@/components/TaskHeader';
import { startOfDay, addDays, isToday, isWithinInterval } from 'date-fns';
import { Plus } from 'lucide-react';

export function TaskList() {
  const tasks = useTaskStore(s => s.tasks);
  const selectedListId = useTaskStore(s => s.selectedListId);
  const selectedView = useTaskStore(s => s.selectedView);
  const searchQuery = useTaskStore(s => s.searchQuery);
  const showCompleted = useTaskStore(s => s.showCompleted);
  const selectedLabelIds = useTaskStore(s => s.selectedLabelIds);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by list
    if (selectedListId) {
      filtered = filtered.filter(task => task.listId === selectedListId);
    }

    // Filter by view
    if (selectedView !== 'all' && !selectedListId) {
      const today = startOfDay(new Date());
      
      switch (selectedView) {
        case 'today':
          filtered = filtered.filter(task => 
            task.date && isToday(new Date(task.date))
          );
          break;
          
        case 'next7days':
          const nextWeek = addDays(today, 7);
          filtered = filtered.filter(task => {
            if (!task.date) return false;
            const taskDate = startOfDay(new Date(task.date));
            return isWithinInterval(taskDate, { start: today, end: nextWeek });
          });
          break;
          
        case 'upcoming':
          filtered = filtered.filter(task => 
            task.date && new Date(task.date) >= today
          );
          break;
      }
    }

    // Filter by selected tags
    if (selectedLabelIds && selectedLabelIds.length > 0) {
      filtered = filtered.filter(task => {
        const ids = (task.labels || []).map(l => l.id);
        return selectedLabelIds.some(id => ids.includes(id));
      });
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Search functionality
    if (deferredQuery.trim()) {
      // Lazy-load fuse.js only when searching
      try {
        const Fuse = require('fuse.js');
        const fuse = new Fuse(filtered, {
          keys: ['name', 'description'],
          threshold: 0.3,
          includeScore: true,
        });
        const searchResults = fuse.search(deferredQuery);
        filtered = searchResults.map((result: any) => result.item);
      } catch {}
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Sort by date
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      
      // Tasks with dates come before tasks without dates
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, selectedListId, selectedView, deferredQuery, showCompleted, selectedLabelIds]);

  const getViewTitle = () => {
    if (selectedListId) {
      const list = tasks.find(task => task.listId === selectedListId);
      return list ? 'List Tasks' : 'Inbox';
    }
    
    switch (selectedView) {
      case 'today': return 'Today';
      case 'next7days': return 'Next 7 Days';
      case 'upcoming': return 'Upcoming';
      case 'all': return 'All Tasks';
      default: return 'Tasks';
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        <TaskHeader title={getViewTitle()} taskCount={filteredTasks.length} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <Task key={task.id} task={task} />
              ))}
            </div>
            
            <button
              onClick={() => setTaskFormOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md border border-border hover:bg-accent/50 transition-colors mt-4"
              aria-label="Add task"
            >
              <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center">
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Add task</span>
            </button>
          </div>
        </div>
      </div>

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        listId={selectedListId || undefined}
      />
    </>
  );
}
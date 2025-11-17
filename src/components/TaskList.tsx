'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { TaskForm } from '@/components/TaskForm';
import { Task as TaskType, ViewType } from '@/types';
import { Task } from '@/components/Task';
import { TaskHeader } from '@/components/TaskHeader';
import { startOfDay, addDays, isToday, isWithinInterval } from 'date-fns';
import Fuse from 'fuse.js';
import { Plus } from 'lucide-react';

export function TaskList() {
  const { tasks, selectedListId, selectedView, searchQuery, showCompleted } = useTaskStore();
  const [taskFormOpen, setTaskFormOpen] = useState(false);

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

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Search functionality
    if (searchQuery.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ['name', 'description'],
        threshold: 0.3,
        includeScore: true,
      });
      
      const searchResults = fuse.search(searchQuery);
      filtered = searchResults.map(result => result.item);
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
  }, [tasks, selectedListId, selectedView, searchQuery, showCompleted]);

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
            {/* Quick tips */}
            {filteredTasks.length === 0 && (
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-100 to-fuchsia-100 dark:from-slate-800 dark:to-indigo-900 border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      💡
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">
                        Yeah. Think of one simple habit to start… Add it as a recurring task 📅
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        For example, type: Read 30 pages every evening at 8PM. Run two miles every 3 days at 6PM.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-100 to-fuchsia-100 dark:from-slate-800 dark:to-indigo-900 border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      💡
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">
                        Helpful hint: Set yourself up for success by taking just 15 minutes to plan the week ahead 📅
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We&apos;re here to help: Start with this project template, watch this video, or read the full guide.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <Task key={task.id} task={task} />
              ))}
            </div>
            
            {/* Add task button */}
            <button
              onClick={() => setTaskFormOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors mt-4"
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
'use client';

import { useMemo, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { logger } from '@/lib/logger';
import { TaskForm } from '@/components/TaskForm';
import { Task } from '@/components/Task';
import { TaskHeader } from '@/components/TaskHeader';
import { startOfDay, addDays, isToday, isWithinInterval } from 'date-fns';
import Fuse from 'fuse.js';
import { Plus, GripVertical, CheckSquare, Square } from 'lucide-react';
import { BulkOperationsBar } from '@/components/BulkOperationsBar';

import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable wrapper for Task component
function SortableTask({ task }: { task: import('@/types').Task }) {
  const { selectedTaskIds, selectTask, deselectTask, isTaskSelected } = useTaskStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = isTaskSelected(task.id);
  const showCheckbox = Array.from(selectedTaskIds).length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group"
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
        {showCheckbox && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isSelected) {
                deselectTask(task.id);
              } else {
                selectTask(task.id);
              }
            }}
            className={`p-0.5 rounded transition-colors ${
              isSelected
                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/50'
            }`}
            aria-label={isSelected ? 'Deselect task' : 'Select task'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        )}
        <div
          {...listeners}
          className="p-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Drag handle"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      <AnimatePresence mode="popLayout">
        <Task task={task} />
      </AnimatePresence>
    </div>
  );
}

export function TaskList() {
  const { tasks, labels, lists, selectedListId, selectedLabelId, selectedView, searchQuery, showCompleted, setSelectedLabelId, reorderTasks, selectedTaskIds, clearSelection } = useTaskStore();
  const { isTaskFormOpen: taskFormOpen, setTaskFormOpen: setTaskFormOpen } = useUIStore();

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by list
    if (selectedListId) {
      filtered = filtered.filter(task => task.listId === selectedListId);
    }

    // Filter by label
    if (selectedLabelId) {
      filtered = filtered.filter(task => {
        const labelIds = task.labels?.map(l => l.id) || [];
        return labelIds.includes(selectedLabelId);
      });
    }

    // Filter by view
    if (selectedView !== 'all' && !selectedListId && !selectedLabelId) {
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
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Sort by creation date (newest first)
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [tasks, selectedView, selectedListId, searchQuery, showCompleted]);

  const activeTaskCount = useMemo(() => {
    return filteredTasks.filter(task => !task.completed).length;
  }, [filteredTasks]);

  const getViewTitle = () => {
    if (selectedListId) {
      const list = lists.find(l => l.id === selectedListId);
      return list ? list.name : 'List';
    }

    switch (selectedView) {
      case 'today': return 'Today';
      case 'next7days': return 'Next 7 Days';
      case 'upcoming': return 'Upcoming';
      case 'all': return 'All Tasks';
      default: return 'Tasks';
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
      const newIndex = filteredTasks.findIndex(t => t.id === over!.id);
      const newOrder = arrayMove(
        filteredTasks.map(t => t.id),
        oldIndex,
        newIndex
      );

      const targetListId = selectedListId || (filteredTasks[0]?.listId) || '';
      reorderTasks(targetListId, newOrder);

      // Persist reorder to API
      try {
        await fetch('/api/tasks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listId: targetListId, orderedIds: newOrder }),
        });
      } catch (error) {
        logger.error('Failed to persist task reorder', { error });
      }
    }
  }, [filteredTasks, reorderTasks, selectedListId]);

  return (
    <>
      <div className="flex-1 flex flex-col h-full">
        <TaskHeader title={getViewTitle()} taskCount={activeTaskCount} />

        <div className="flex-1 min-h-0 overflow-y-auto">
          {selectedTaskIds.size > 0 && (
            <BulkOperationsBar
              listId={selectedListId}
              labels={labels.map(l => ({ id: l.id, name: l.name, color: l.color }))}
              lists={lists.map(l => ({ id: l.id, name: l.name, color: l.color }))}
              onBulkAction={clearSelection}
            />
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTasks.length === 0 ? (
                <div className="px-6 pt-6 pb-2" role="complementary" aria-label="Tips">
                  {/* Quick tips */}
                  <div className="space-y-4 mb-6">
                    <div className="glass-card rounded-xl p-5" role="note">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold" aria-hidden="true">
                          💡
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground mb-1">
                            Yeah. Think of one simple habit to start… Add it as a recurring task 📕
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            For example, type: Read 30 pages every evening at 8PM. Run two miles every 3 days at 6PM.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-5" role="note">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold" aria-hidden="true">
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

                  <div className="px-6 pb-6">
                    {/* Add task button */}
                    <button
                      onClick={() => setTaskFormOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      aria-label="Create New Task"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center" aria-hidden="true">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground font-medium">Create Task</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-2" role="list" aria-label="Tasks">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="px-4 py-1" role="listitem">
                      <SortableTask task={task} />
                    </div>
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>

        {filteredTasks.length > 0 && (
          <div className="px-6 pb-6">
            {/* Add task button */}
            <button
              onClick={() => setTaskFormOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Create New Task"
            >
              <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center" aria-hidden="true">
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground font-medium">Create Task</span>
            </button>
          </div>
        )}
      </div>

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        listId={selectedListId || undefined}
      />
    </>
  );
}
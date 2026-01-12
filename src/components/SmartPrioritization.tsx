'use client';

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { suggestTopTasks } from '@/lib/ai';
import { Sparkles, CheckCircle2, Calendar, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { format } from 'date-fns';

export function SmartPrioritization() {
  const { tasks } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);

  const topTasks = suggestTopTasks(tasks);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary rounded-xl"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Smart Prioritize</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Smart Suggestions
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Based on deadlines, priority, and history, here are your top 3 tasks to focus on today.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {topTasks.length > 0 ? (
            topTasks.map((task, index) => (
              <div 
                key={task.id} 
                className="group relative flex flex-col gap-2 p-4 rounded-2xl bg-accent/30 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg">
                  {index + 1}
                </div>
                
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {task.name}
                  </h3>
                  <div className={`shrink-0 ${getPriorityColor(task.priority || 'none')}`}>
                    <Flag className="w-4 h-4 fill-current" />
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1">
                  {task.deadline && (
                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-red-500/80 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.deadline), 'MMM d')}
                    </div>
                  )}
                  {task.date && (
                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.date), 'MMM d')}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks to prioritize right now!</p>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <Button 
            className="w-full rounded-xl" 
            onClick={() => setIsOpen(false)}
          >
            I&apos;m on it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

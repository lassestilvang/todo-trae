'use client';

import { useTaskStore } from '@/stores/taskStore';
import { MoreHorizontal, MessageCircle, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SmartPrioritization } from '@/components/SmartPrioritization';
import { FocusMode } from '@/components/FocusMode';

interface TaskHeaderProps {
  title: string;
  taskCount: number;
}

export function TaskHeader({ title, taskCount }: TaskHeaderProps) {
  const { showCompleted, setShowCompleted } = useTaskStore();

  return (
    <div className="sticky top-0 z-10 border-b border-border/30 bg-background/40 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            {title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{taskCount} active tasks</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FocusMode />
          <SmartPrioritization />
          
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-accent/50 transition-all" aria-label="Messages">
            <MessageCircle className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-accent/50 transition-all" aria-label="View options">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-accent/50 transition-all" aria-label="More options">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="px-8 pb-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="peer h-4 w-4 rounded border-border/50 bg-background/50 text-primary transition-all focus:ring-0 focus:ring-offset-0 accent-primary"
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Show completed tasks
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
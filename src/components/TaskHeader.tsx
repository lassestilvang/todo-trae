'use client';

import { useTaskStore } from '@/stores/taskStore';
import { MoreHorizontal, MessageCircle, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TaskHeaderProps {
  title: string;
  taskCount: number;
}

export function TaskHeader({ title, taskCount }: TaskHeaderProps) {
  const { showCompleted, setShowCompleted } = useTaskStore();

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{taskCount} tasks</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 rounded-xl">
            <MessageCircle className="w-4 h-4" />
            <span className="ml-1 text-xs">1</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="h-8 rounded-xl">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="h-8 rounded-xl">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="px-6 pb-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            <span className="text-muted-foreground">Show completed tasks</span>
          </label>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import {
  MoreHorizontal,
  MessageCircle,
  Grid3X3,
  Layers,
  List,
  Calendar,
  Eye,
  EyeClosed,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { SmartPrioritization } from '@/components/SmartPrioritization';
import { FocusMode } from '@/components/FocusMode';

interface TaskHeaderProps {
  title: string;
  taskCount: number;
}

export function TaskHeader({ title, taskCount }: TaskHeaderProps) {
  const router = useRouter();
  const { showCompleted, setShowCompleted, showCompletedOnly, setShowCompletedOnly, activityLogs } =
    useTaskStore();

  // Get recent activity (last 5 logs)
  const recentActivity = activityLogs.slice(0, 5);

  return (
    <div className="sticky top-0 z-10 border-b border-border/30 bg-background/40 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            {title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {taskCount} active tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FocusMode />
          <SmartPrioritization />

          {/* Messages / Activity feed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-accent/50 transition-all"
                aria-label="Messages"
              >
                <MessageCircle className="w-4 h-4" />
                {recentActivity.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[8px] flex items-center justify-center">
                    {recentActivity.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">
                Recent Activity
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentActivity.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  No recent activity
                </DropdownMenuItem>
              ) : (
                recentActivity.map((log) => (
                  <DropdownMenuItem
                    key={log.id}
                    className="flex flex-col items-start gap-1 py-2 cursor-default"
                  >
                    <span className="text-xs text-foreground">
                      {log.taskId ? `Task ${log.action}` : `List ${log.action}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.createdAt || new Date()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-accent/50 transition-all"
                aria-label="View options"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>View Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
                <span>{showCompleted ? 'Hide' : 'Show'} Completed</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{showCompletedOnly ? 'Show all' : 'Show completed only'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Date</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span>Priority</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <List className="w-4 h-4 text-muted-foreground" />
                <span>List</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-accent/50 transition-all"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => router.push('/analytics')}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => router.push('/api-docs')}
              >
                <HelpCircle className="w-4 h-4" />
                <span>API Docs</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-8 pb-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor="show-completed"
            className="flex items-center gap-2 text-sm cursor-pointer group"
          >
            <div className="relative flex items-center">
              <input
                id="show-completed"
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Notification {
  id: string;
  taskId: string;
  taskName: string;
  reminderTime: Date;
  taskPriority: string;
}

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const fetchDueReminders = useCallback(async () => {
    try {
      const response = await fetch(`/api/reminders/due?since=${lastCheck.toISOString()}`);
      if (!response.ok) return;

      const dueReminders: Array<{
        reminderId: string;
        taskId: string;
        reminderTime: string;
        taskName: string;
        taskPriority: string;
        taskDeadline?: string;
      }> = await response.json();

      dueReminders.forEach((r) => {
        const existing = notifications.find((n) => n.id === r.reminderId);
        if (!existing) {
          const notification: Notification = {
            id: r.reminderId,
            taskId: r.taskId,
            taskName: r.taskName,
            reminderTime: new Date(r.reminderTime),
            taskPriority: r.taskPriority,
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 20));

          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Task Reminder', {
              body: r.taskName,
              icon: '/favicon.ico',
              tag: `reminder-${r.reminderId}`,
            });
          }

          toast.info(`Reminder: ${r.taskName}`, {
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to task — would need to open task form
                router.push(`/?task=${r.taskId}`);
              },
            },
          });
        }
      });
    } catch (error) {
      logger.error('Failed to fetch due reminders', { error });
    } finally {
      setLastCheck(new Date());
    }
  }, [notifications, lastCheck, router]);

  // Poll for reminders every 30 seconds
  useEffect(() => {
    fetchDueReminders();
    const interval = setInterval(fetchDueReminders, 30_000);
    return () => clearInterval(interval);
  }, [fetchDueReminders]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-blue-500',
    none: 'text-muted-foreground',
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-xl hover:bg-accent/50 transition-all relative"
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse"
            aria-label={`${notifications.length} unread notifications`}
          >
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-end pt-16 pr-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="glass-card border border-border/30 rounded-2xl shadow-xl w-80 max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear all"
                  >
                    Clear all
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notifications"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b border-border/10 last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Clock
                        className={`w-4 h-4 mt-0.5 ${priorityColors[notification.taskPriority as keyof typeof priorityColors] || priorityColors.none}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.taskName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reminder at{' '}
                          {notification.reminderTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

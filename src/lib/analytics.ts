import { db } from '@/db';
import { tasks, taskLists, labels, taskLabels, activityLog } from '@/db/schema';
import { eq, and, gte, sql, desc, asc } from 'drizzle-orm';
import { subDays, startOfDay, format } from 'date-fns';

export async function getAnalyticsData(userId: string) {
  const now = new Date();
  const thirtyDaysAgo = subDays(startOfDay(now), 30);

  // 1. Summary Metrics
  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 2. Productivity Trend (Last 30 days)
  const recentTasks = await db.select().from(tasks).where(
    and(
      eq(tasks.userId, userId),
      gte(tasks.createdAt, thirtyDaysAgo)
    )
  );

  const recentActivity = await db.select().from(activityLog).where(
    and(
      eq(activityLog.userId, userId),
      gte(activityLog.createdAt, thirtyDaysAgo)
    )
  );

  const trendMap = new Map<string, { date: string; completed: number; created: number }>();
  
  // Initialize last 30 days
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(now, i), 'yyyy-MM-dd');
    trendMap.set(date, { date, completed: 0, created: 0 });
  }

  recentTasks.forEach(task => {
    const date = format(task.createdAt!, 'yyyy-MM-dd');
    if (trendMap.has(date)) {
      trendMap.get(date)!.created++;
    }
  });

  allTasks.forEach(task => {
    if (task.completed && task.completedAt && task.completedAt >= thirtyDaysAgo) {
      const date = format(task.completedAt, 'yyyy-MM-dd');
      if (trendMap.has(date)) {
        trendMap.get(date)!.completed++;
      }
    }
  });

  const productivityTrend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 3. Tasks by List
  const lists = await db.select().from(taskLists).where(eq(taskLists.userId, userId));
  const tasksByList = lists.map(list => {
    const count = allTasks.filter(t => t.listId === list.id).length;
    return {
      name: list.name,
      count,
      color: list.color
    };
  }).filter(l => l.count > 0);

  // 4. Tasks by Label
  const allLabels = await db.select().from(labels).where(eq(labels.userId, userId));
  const allTaskLabels = await db.select().from(taskLabels);
  
  const tasksByLabel = allLabels.map(label => {
    const taskIds = allTaskLabels.filter(tl => tl.labelId === label.id).map(tl => tl.taskId);
    const count = allTasks.filter(t => taskIds.includes(t.id)).length;
    return {
      name: label.name,
      count,
      color: label.color
    };
  }).filter(l => l.count > 0);

  // 5. Time Spent by List
  const timeSpentByList = lists.map(list => {
    const listTasks = allTasks.filter(t => t.listId === list.id);
    const totalMinutes = listTasks.reduce((acc, task) => {
      if (!task.actualTime) return acc;
      const parts = task.actualTime.split(':');
      let minutes = 0;
      if (parts.length === 2) {
        minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        minutes = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        minutes = Math.floor(minutes / 60);
      }
      return acc + minutes;
    }, 0);
    return {
      name: list.name,
      minutes: totalMinutes,
      color: list.color
    };
  }).filter(l => l.minutes > 0);

  return {
    summary: {
      totalTasks,
      completedTasks,
      completionRate,
      activeTasks,
    },
    productivityTrend,
    tasksByList,
    tasksByLabel,
    timeSpentByList,
  };
}

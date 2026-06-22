import { Task } from '@/types';
import { differenceInDays, isBefore, startOfToday } from 'date-fns';

export function suggestTopTasks(tasks: Task[], count: number = 3): Task[] {
  const uncompletedTasks = tasks.filter((task) => !task.completed);
  const today = startOfToday();

  const scoredTasks = uncompletedTasks.map((task) => {
    let score = 0;

    // 1. Priority Score
    switch (task.priority) {
      case 'high':
        score += 100;
        break;
      case 'medium':
        score += 50;
        break;
      case 'low':
        score += 20;
        break;
      default:
        score += 0;
    }

    // 2. Deadline Score
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const daysUntilDeadline = differenceInDays(deadlineDate, today);

      if (daysUntilDeadline < 0) {
        // Overdue tasks get a huge boost
        score += 200;
      } else if (daysUntilDeadline === 0) {
        // Due today
        score += 150;
      } else if (daysUntilDeadline <= 3) {
        // Due soon
        score += 80;
      } else if (daysUntilDeadline <= 7) {
        // Due this week
        score += 40;
      }
    }

    // 3. Date (Scheduled) Score
    if (task.date) {
      const scheduledDate = new Date(task.date);
      if (isBefore(scheduledDate, today) || differenceInDays(scheduledDate, today) === 0) {
        // Scheduled for today or earlier
        score += 50;
      }
    }

    // 4. Recurrence Score
    if (task.recurring) {
      score += 10;
    }

    return { ...task, aiScore: score };
  });

  // Sort by score descending and take the top N
  return scoredTasks
    .sort((a, b) => (b as Task & { aiScore: number }).aiScore - (a as Task & { aiScore: number }).aiScore)
    .slice(0, count);
}

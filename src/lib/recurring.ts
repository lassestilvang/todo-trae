import { RecurringType } from '@/types';

/**
 * Calculate the next date for a recurring task based on its recurrence type.
 * Pure function — no DB access required.
 */
export function calculateNextRecurringDate(
  date: Date | undefined,
  deadline: Date | undefined,
  recurring: RecurringType | undefined,
  recurringEndDate?: Date | undefined
): Date | null {
  void recurringEndDate;
  const baseDate = date || deadline;
  if (!baseDate) return null;

  const d = new Date(baseDate);
  if (!recurring) return null;

  switch (recurring) {
    case 'daily':
      return addDaysToDate(d, 1);
    case 'weekly':
      return addDaysToDate(d, 7);
    case 'weekday': {
      // If Friday (5), skip to Monday (+3 days)
      if (d.getDay() === 5) return addDaysToDate(d, 3);
      // If Saturday (6), skip to Monday (+2 days)
      if (d.getDay() === 6) return addDaysToDate(d, 2);
      return addDaysToDate(d, 1);
    }
    case 'monthly':
      return addMonthsToDate(d, 1);
    case 'yearly':
      return addMonthsToDate(d, 12);
    default:
      return null;
  }
}

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

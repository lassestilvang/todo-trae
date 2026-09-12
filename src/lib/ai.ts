import { Task, Priority } from '@/types';
import { differenceInDays, isBefore, startOfToday, addDays, setHours, setMinutes } from 'date-fns';
import { logger } from '@/lib/logger';

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

  // Sort by score descending, then by creation date (newest first) for tie-breaking
  return scoredTasks
    .sort((a, b) => {
      const scoreDiff =
        (b as Task & { aiScore: number }).aiScore - (a as Task & { aiScore: number }).aiScore;
      if (scoreDiff !== 0) return scoreDiff;
      // Tie-break: newer tasks first
      // createdAt may be a string from the API/DB, not a Date object
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, count);
}

export interface ParsedTaskInput {
  name: string;
  description?: string;
  date?: Date;
  deadline?: Date;
  estimate?: string;
  priority: Priority;
  labelIds: string[];
}

interface ParseOptions {
  availableLabels?: { id: string; name: string }[];
  availableLists?: { id: string; name: string }[];
  defaultPriority?: Priority;
  defaultListId?: string;
}

// Natural language date patterns
const DATE_PATTERNS: { regex: RegExp; getValue: (match: RegExpMatchArray) => number }[] = [
  { regex: /today/i, getValue: () => 0 },
  { regex: /tomorrow/i, getValue: () => 1 },
  { regex: /in (\d+)\s*day/i, getValue: (m) => parseInt(m[1], 10) },
  { regex: /in (\d+)\s*week/i, getValue: (m) => parseInt(m[1], 10) * 7 },
  {
    regex: /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)/i,
    getValue: (m) => getNextWeekdayOffset(m[1]),
  },
  {
    regex: /on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|friday)/i,
    getValue: (m) => getNextWeekdayOffset(m[1]),
  },
  {
    regex: /this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    getValue: (m) => {
      const day = m[1].toLowerCase();
      return (
        WEEKDAY_OFFSETS[day] -
        WEEKDAY_OFFSETS[new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()]
      );
    },
  },
  {
    regex: /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    getValue: (m) => getNextWeekdayOffset(m[1]),
  },
  { regex: /in (\d+)\s*hour/i, getValue: (m) => -parseInt(m[1], 10) / 24 }, // Special: time-only, not date offset
];

const WEEKDAY_OFFSETS: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function getNextWeekdayOffset(weekday: string): number {
  const day = weekday.toLowerCase();
  const today = new Date();
  const todayDay = today.getDay() || 7; // Convert Sunday (0) to 7
  const targetDay = WEEKDAY_OFFSETS[day];
  let offset = targetDay - todayDay;
  if (offset <= 0) offset += 7; // Next occurrence
  return offset;
}

// Time pattern: "at 3pm", "at 14:30", "at 3:30pm"
const TIME_REGEX = /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*(tomorrow|today|in\s+\d+\s*day)?/i;

// Priority keywords
const PRIORITY_KEYWORDS: { regex: RegExp; priority: Priority }[] = [
  { regex: /urgent|asap|critical/i, priority: 'high' },
  { regex: /\bhigh\s+priority\b/i, priority: 'high' },
  { regex: /\bimportant\b/i, priority: 'medium' },
  { regex: /\bmedium\s+priority\b/i, priority: 'medium' },
  { regex: /\blow\s+priority\b/i, priority: 'low' },
];

// Estimate patterns: "30 min", "2 hours", "1h 30m"
const ESTIMATE_REGEX = /(\d+)\s*(min|minutes?|hrs?|hours?)\b/i;

// Label pattern: #label-name
const LABEL_REGEX = /#([\w-]+)/g;

// Deadline indicator: "by", "due", "deadline"
// Only captures up to 2 words after the keyword to avoid consuming other parsed entities
const DEADLINE_REGEX = /\b(by|due|deadline|ddl)\s+(\w+(?:\s+\w+)?)/i;

/**
 * Parses natural language input into structured task fields.
 * Example: "Buy milk @grocery #shopping tomorrow at 3pm" →
 *   { name: "Buy milk @grocery", labelIds: ["shopping"], date: new Date("tomorrow 15:00"), priority: "none" }
 */
export function parseNaturalLanguage(input: string, options: ParseOptions = {}): ParsedTaskInput {
  let text = input.trim();
  const labelIds: string[] = [];
  const labelNames: string[] = [];

  // Extract labels (#tag)
  let labelMatch;
  while ((labelMatch = LABEL_REGEX.exec(text)) !== null) {
    labelNames.push(labelMatch[1]);
    text = text.replace(labelMatch[0], '').trim();
    LABEL_REGEX.lastIndex = 0; // Reset after replace
  }

  // Match labels to available labels (case-insensitive)
  if (options.availableLabels && labelNames.length > 0) {
    for (const labelName of labelNames) {
      const match = options.availableLabels.find(
        (l) => l.name.toLowerCase() === labelName.toLowerCase()
      );
      if (match) {
        labelIds.push(match.id);
      }
    }
  }

  // Extract time
  let parsedTime: { hours: number; minutes: number } | null = null;
  const timeMatch = text.match(TIME_REGEX);
  if (timeMatch) {
    const hours24 = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();
    let hours = hours24;
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    parsedTime = { hours, minutes };
    text = text.replace(timeMatch[0], '').trim();
  }

  // Extract deadline first (before general date to avoid conflicts)
  let deadline: Date | undefined;
  const dlMatch = text.match(DEADLINE_REGEX);
  if (dlMatch) {
    const deadlineText = dlMatch[2];
    const deadlineDate = parseDateExpression(deadlineText, parsedTime);
    if (deadlineDate) {
      deadline = deadlineDate;
      text = text.replace(dlMatch[0], '').trim();
    }
  }

  // Extract scheduled date/time
  let date: Date | undefined;

  // Check for date expressions
  const dateResult = parseDateExpression(text, parsedTime);
  if (dateResult) {
    if (deadline) {
      date = dateResult;
    } else {
      deadline = dateResult;
    }
    // Remove the matched date text from input
    for (const pattern of DATE_PATTERNS) {
      const m = text.match(pattern.regex);
      if (m) {
        text = text.replace(m[0], '').trim();
        break;
      }
    }
    // Also remove time expression if it was part of the date
    if (timeMatch && !deadline) {
      // Already removed
    }
  }

  // If we extracted a time but no date, set date to today
  if (!date && !deadline && parsedTime) {
    deadline = setMinutes(setHours(new Date(), parsedTime.hours), parsedTime.minutes);
  }

  // Extract estimate
  let estimate: string | undefined;
  const estMatch = text.match(ESTIMATE_REGEX);
  if (estMatch) {
    const value = parseInt(estMatch[1], 10);
    const unit = estMatch[2].toLowerCase();
    if (unit.startsWith('min') || unit.startsWith('minute')) {
      estimate = `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    } else {
      const totalMinutes = value * 60;
      estimate = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    }
    text = text.replace(estMatch[0], '').trim();
  }

  // Extract priority
  let priority: Priority = options.defaultPriority || 'none';
  for (const { regex, priority: p } of PRIORITY_KEYWORDS) {
    if (text.match(regex)) {
      priority = p;
      text = text.replace(regex, '').trim();
      break;
    }
  }

  // Clean up the remaining text
  const name = text.replace(/\s+/g, ' ').trim();

  // If we found labels but didn't match to available labels, keep the names in description
  const description =
    labelNames.length > 0 && labelNames.length !== labelIds.length
      ? `Labels: ${labelNames.join(', ')}`
      : undefined;

  logger.debug('Natural language parsed', {
    name,
    priority,
    labelIds,
    date: date?.toISOString(),
    deadline: deadline?.toISOString(),
  });

  return {
    name: name || 'Untitled task',
    description,
    date,
    deadline,
    estimate,
    priority,
    labelIds,
  };
}

function parseDateExpression(
  text: string,
  parsedTime: { hours: number; minutes: number } | null
): Date | null {
  // Try each date pattern
  for (const pattern of DATE_PATTERNS) {
    if (pattern.regex.test(text)) {
      const result = pattern.getValue(text.match(pattern.regex)!);
      let date: Date;

      if (result < 0) {
        // Time-only offset (special case for "in N hours")
        return null;
      }

      date = addDays(startOfToday(), result);

      // Guard against invalid dates (e.g., NaN from unsupported weekday like "week"/"month")
      if (isNaN(date.getTime())) {
        return null;
      }

      if (parsedTime) {
        date = setMinutes(setHours(date, parsedTime.hours), parsedTime.minutes);
      }

      return date;
    }
  }

  // Try explicit date format: "on 2024-12-25" or "on Dec 25"
  const explicitDateMatch = text.match(
    /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})\b/i
  );
  if (explicitDateMatch) {
    try {
      const parsed = new Date(explicitDateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        let date = new Date(parsed);
        if (parsedTime) {
          date = setMinutes(setHours(date, parsedTime.hours), parsedTime.minutes);
        }
        return date;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}

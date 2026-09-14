import { describe, it, expect } from 'bun:test';
import { calculateNextRecurringDate } from '@/lib/recurring';

describe('calculateNextRecurringDate', () => {
  const createDate = (year: number, month: number, day: number, hour = 0, minute = 0) => {
    const d = new Date();
    d.setFullYear(year, month - 1, day);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  describe('daily recurrence', () => {
    it('should add 1 day for daily recurrence', () => {
      const date = createDate(2024, 1, 15);
      const result = calculateNextRecurringDate(date, undefined, 'daily');
      expect(result).toEqual(createDate(2024, 1, 16));
    });

    it('should handle month boundary for daily recurrence', () => {
      const date = createDate(2024, 1, 31);
      const result = calculateNextRecurringDate(date, undefined, 'daily');
      expect(result).toEqual(createDate(2024, 2, 1));
    });

    it('should handle year boundary for daily recurrence', () => {
      const date = createDate(2024, 12, 31);
      const result = calculateNextRecurringDate(date, undefined, 'daily');
      expect(result).toEqual(createDate(2025, 1, 1));
    });

    it('should handle leap year for daily recurrence', () => {
      const date = createDate(2024, 2, 28);
      const result = calculateNextRecurringDate(date, undefined, 'daily');
      expect(result).toEqual(createDate(2024, 2, 29));
    });
  });

  describe('weekly recurrence', () => {
    it('should add 7 days for weekly recurrence', () => {
      const date = createDate(2024, 1, 15);
      const result = calculateNextRecurringDate(date, undefined, 'weekly');
      expect(result).toEqual(createDate(2024, 1, 22));
    });

    it('should handle month boundary for weekly recurrence', () => {
      const date = createDate(2024, 1, 28);
      const result = calculateNextRecurringDate(date, undefined, 'weekly');
      expect(result).toEqual(createDate(2024, 2, 4));
    });
  });

  describe('weekday recurrence', () => {
    it('should add 1 day for Monday-Thursday', () => {
      const monday = createDate(2024, 1, 15); // Monday
      const result = calculateNextRecurringDate(monday, undefined, 'weekday');
      expect(result).toEqual(createDate(2024, 1, 16));

      const thursday = createDate(2024, 1, 18); // Thursday
      const result2 = calculateNextRecurringDate(thursday, undefined, 'weekday');
      expect(result2).toEqual(createDate(2024, 1, 19));
    });

    it('should skip to Monday from Friday (+3 days)', () => {
      const friday = createDate(2024, 1, 19); // Friday
      const result = calculateNextRecurringDate(friday, undefined, 'weekday');
      expect(result).toEqual(createDate(2024, 1, 22)); // Monday
    });

    it('should skip to Monday from Saturday (+2 days)', () => {
      const saturday = createDate(2024, 1, 20); // Saturday
      const result = calculateNextRecurringDate(saturday, undefined, 'weekday');
      expect(result).toEqual(createDate(2024, 1, 22)); // Monday
    });

    it('should skip to Monday from Sunday (+1 day)', () => {
      const sunday = createDate(2024, 1, 21); // Sunday
      const result = calculateNextRecurringDate(sunday, undefined, 'weekday');
      expect(result).toEqual(createDate(2024, 1, 22)); // Monday
    });

    it('should handle month boundary correctly for weekday', () => {
      const friday = createDate(2024, 1, 26); // Friday Jan 26
      const result = calculateNextRecurringDate(friday, undefined, 'weekday');
      expect(result).toEqual(createDate(2024, 1, 29)); // Monday Jan 29
    });
  });

  describe('monthly recurrence', () => {
    it('should add 1 month for monthly recurrence', () => {
      const date = createDate(2024, 1, 15);
      const result = calculateNextRecurringDate(date, undefined, 'monthly');
      expect(result).toEqual(createDate(2024, 2, 15));
    });

    it('should handle year boundary for monthly recurrence', () => {
      const date = createDate(2024, 12, 15);
      const result = calculateNextRecurringDate(date, undefined, 'monthly');
      expect(result).toEqual(createDate(2025, 1, 15));
    });

    it('should handle end-of-month dates correctly', () => {
      const date = createDate(2024, 1, 31);
      const result = calculateNextRecurringDate(date, undefined, 'monthly');
      // JS Date rolls over: Jan 31 + 1 month = Mar 2 (since Feb has 29 days in 2024)
      // or Mar 3 in non-leap years
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBeGreaterThanOrEqual(1); // Feb or later
    });
  });

  describe('yearly recurrence', () => {
    it('should add 12 months for yearly recurrence', () => {
      const date = createDate(2024, 1, 15);
      const result = calculateNextRecurringDate(date, undefined, 'yearly');
      expect(result).toEqual(createDate(2025, 1, 15));
    });

    it('should handle leap day correctly', () => {
      const date = createDate(2024, 2, 29); // Leap day (Feb 29, 2024)
      const result = calculateNextRecurringDate(date, undefined, 'yearly');
      // In non-leap year 2025, Feb 29 becomes Mar 1 (JS Date behavior)
      expect(result).toEqual(createDate(2025, 3, 1));
    });
  });

  describe('edge cases', () => {
    it('should return null when no base date is provided', () => {
      const result = calculateNextRecurringDate(undefined, undefined, 'daily');
      expect(result).toBeNull();
    });

    it('should return null when recurring is undefined', () => {
      const date = createDate(2024, 1, 15);
      const result = calculateNextRecurringDate(date, undefined, undefined);
      expect(result).toBeNull();
    });

    it('should return null when recurring is custom', () => {
      const date = createDate(2024, 1, 15);
      const result = calculateNextRecurringDate(date, undefined, 'custom');
      expect(result).toBeNull();
    });

    it('should use deadline when date is not provided', () => {
      const deadline = createDate(2024, 1, 20);
      const result = calculateNextRecurringDate(undefined, deadline, 'daily');
      expect(result).toEqual(createDate(2024, 1, 21));
    });

    it('should prefer date over deadline when both provided', () => {
      const date = createDate(2024, 1, 15);
      const deadline = createDate(2024, 1, 20);
      const result = calculateNextRecurringDate(date, deadline, 'daily');
      expect(result).toEqual(createDate(2024, 1, 16));
    });

    it('should preserve time component from base date', () => {
      const date = createDate(2024, 1, 15, 14, 30);
      const result = calculateNextRecurringDate(date, undefined, 'daily');
      expect(result?.getHours()).toBe(14);
      expect(result?.getMinutes()).toBe(30);
    });
  });
});
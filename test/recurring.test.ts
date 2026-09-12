import { describe, expect, test } from 'bun:test';
import { calculateNextRecurringDate } from '@/lib/recurring';
import { RecurringType } from '@/types';

describe('calculateNextRecurringDate', () => {
  test('returns null when no date or deadline', () => {
    expect(calculateNextRecurringDate(undefined, undefined, 'daily')).toBeNull();
  });

  test('returns null when no recurring type', () => {
    expect(
      calculateNextRecurringDate(new Date('2026-06-01T10:00:00Z'), undefined, undefined)
    ).toBeNull();
  });

  test('daily recurrence adds 1 day', () => {
    const result = calculateNextRecurringDate(new Date('2026-06-01T09:00:00Z'), undefined, 'daily');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2026-06-02T09:00:00.000Z');
  });

  test('weekly recurrence adds 7 days', () => {
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T08:00:00Z'),
      undefined,
      'weekly'
    );
    expect(result!.toISOString()).toBe('2026-06-08T08:00:00.000Z');
  });

  test('weekday recurrence on Monday adds 1 day', () => {
    // 2026-06-01 is a Monday
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T10:00:00Z'),
      undefined,
      'weekday'
    );
    expect(result!.toISOString()).toBe('2026-06-02T10:00:00.000Z');
  });

  test('weekday recurrence on Friday skips to Monday (+3 days)', () => {
    // 2026-06-05 is a Friday
    const result = calculateNextRecurringDate(
      new Date('2026-06-05T10:00:00Z'),
      undefined,
      'weekday'
    );
    expect(result!.toISOString()).toBe('2026-06-08T10:00:00.000Z');
  });

  test('weekday recurrence on Saturday skips to Monday (+2 days)', () => {
    // 2026-06-06 is a Saturday
    const result = calculateNextRecurringDate(
      new Date('2026-06-06T10:00:00Z'),
      undefined,
      'weekday'
    );
    expect(result!.toISOString()).toBe('2026-06-08T10:00:00.000Z');
  });

  test('weekday recurrence on Sunday adds 1 day', () => {
    // 2026-06-07 is a Sunday
    const result = calculateNextRecurringDate(
      new Date('2026-06-07T10:00:00Z'),
      undefined,
      'weekday'
    );
    expect(result!.toISOString()).toBe('2026-06-08T10:00:00.000Z');
  });

  test('monthly recurrence adds 1 month', () => {
    const result = calculateNextRecurringDate(
      new Date('2026-03-15T10:00:00Z'),
      undefined,
      'monthly'
    );
    expect(result!.toISOString()).toBe('2026-04-15T10:00:00.000Z');
  });

  test('monthly recurrence handles year boundary', () => {
    const result = calculateNextRecurringDate(
      new Date('2026-12-15T10:00:00Z'),
      undefined,
      'monthly'
    );
    expect(result!.toISOString()).toBe('2027-01-15T10:00:00.000Z');
  });

  test('yearly recurrence adds 12 months', () => {
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T14:30:00Z'),
      undefined,
      'yearly'
    );
    expect(result!.toISOString()).toBe('2027-06-01T14:30:00.000Z');
  });

  test('falls back to deadline when date is not set', () => {
    const result = calculateNextRecurringDate(undefined, new Date('2026-06-01T12:00:00Z'), 'daily');
    expect(result!.toISOString()).toBe('2026-06-02T12:00:00.000Z');
  });

  test('prefers date over deadline when both are set', () => {
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T09:00:00Z'),
      new Date('2026-06-05T09:00:00Z'),
      'daily'
    );
    expect(result!.toISOString()).toBe('2026-06-02T09:00:00.000Z');
  });

  test('returns null for unknown recurrence type', () => {
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T10:00:00Z'),
      undefined,
      'custom' as RecurringType
    );
    expect(result).toBeNull();
  });

  test('respects recurring end date boundary', () => {
    // Next date is exactly at the recurring end date — should be allowed
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T10:00:00Z'),
      undefined,
      'daily',
      new Date('2026-06-02T10:00:00Z')
    );
    expect(result!.toISOString()).toBe('2026-06-02T10:00:00.000Z');
  });

  test('returns next date even when recurringEndDate is in the past', () => {
    // The function itself doesn't check recurringEndDate — that's the caller's job
    // This documents the expected behavior
    const result = calculateNextRecurringDate(
      new Date('2026-06-01T10:00:00Z'),
      undefined,
      'daily',
      new Date('2025-01-01T00:00:00Z')
    );
    expect(result!.toISOString()).toBe('2026-06-02T10:00:00.000Z');
  });
});

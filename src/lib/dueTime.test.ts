import { describe, expect, it } from 'vitest';
import { dueLabel, formatDueTime, isPast } from './dueTime';

describe('formatDueTime', () => {
  it('returns null for null input', () => {
    expect(formatDueTime(null)).toBeNull();
  });

  it('formats on-the-hour times without minutes', () => {
    expect(formatDueTime('14:00')).toBe('2pm');
  });

  it('formats half-past times with minutes', () => {
    expect(formatDueTime('14:30')).toBe('2:30pm');
  });

  it('formats midnight as 12am', () => {
    expect(formatDueTime('00:00')).toBe('12am');
  });

  it('formats noon as 12pm', () => {
    expect(formatDueTime('12:00')).toBe('12pm');
  });

  it('handles seconds-suffixed times', () => {
    expect(formatDueTime('09:05:00')).toBe('9:05am');
  });
});

describe('isPast', () => {
  it('returns false for null', () => {
    expect(isPast(null)).toBe(false);
  });

  it('returns false when due time is later than now', () => {
    const now = new Date(2026, 0, 1, 13, 0);
    expect(isPast('14:00', now)).toBe(false);
  });

  it('returns true when due time equals now (boundary)', () => {
    const now = new Date(2026, 0, 1, 14, 0);
    expect(isPast('14:00', now)).toBe(true);
  });

  it('returns true when due time is earlier than now', () => {
    const now = new Date(2026, 0, 1, 15, 0);
    expect(isPast('14:00', now)).toBe(true);
  });
});

describe('dueLabel', () => {
  it('returns null when no due time is set', () => {
    expect(dueLabel(null)).toBeNull();
  });

  it('returns the plain label when the time has not passed', () => {
    const now = new Date(2026, 0, 1, 10, 0);
    expect(dueLabel('14:00', now)).toBe('2pm');
  });

  it('prefixes with "was" once the time has passed', () => {
    const now = new Date(2026, 0, 1, 15, 0);
    expect(dueLabel('14:00', now)).toBe('was 2pm');
  });
});

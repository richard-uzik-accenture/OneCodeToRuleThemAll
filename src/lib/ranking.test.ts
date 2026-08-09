import { describe, expect, it } from 'vitest';
import { rankBetween, renumber } from './ranking';

describe('rankBetween', () => {
  it('returns 0 for an empty list (both neighbors null)', () => {
    expect(rankBetween(null, null)).toBe(0);
  });

  it('returns after - 1 when inserting before everything', () => {
    expect(rankBetween(null, 10)).toBe(9);
  });

  it('returns before + 1 when inserting after everything', () => {
    expect(rankBetween(10, null)).toBe(11);
  });

  it('returns the midpoint when inserting between two ranks', () => {
    expect(rankBetween(10, 20)).toBe(15);
  });

  it('handles adjacent integer ranks without colliding', () => {
    const result = rankBetween(10, 11);
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(11);
  });
});

describe('renumber', () => {
  it('produces evenly spaced integer ranks for the given count', () => {
    expect(renumber(4)).toEqual([0, 1, 2, 3]);
  });

  it('returns an empty array for zero items', () => {
    expect(renumber(0)).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { startCompare, narrow, type CompareState } from './compare';

describe('startCompare', () => {
  it('returns null for an empty list (skip the mechanic)', () => {
    expect(startCompare(0)).toBeNull();
  });

  it('returns null for a single-item list (skip the mechanic)', () => {
    expect(startCompare(1)).toBeNull();
  });

  it('returns the midpoint candidate for a 15-item list', () => {
    expect(startCompare(15)).toEqual({ low: 0, high: 15, candidateIndex: 7 });
  });
});

describe('narrow', () => {
  it('resolves a 15-item list to index 0 in exactly 4 shown comparisons when the new task always wins', () => {
    let state = startCompare(15) as CompareState;
    const shownCandidates = [state.candidateIndex];
    let result = narrow(state, true);
    while (!('done' in result)) {
      shownCandidates.push(result.candidateIndex);
      state = result;
      result = narrow(state, true);
    }
    expect(shownCandidates).toEqual([7, 3, 1, 0]);
    expect(result).toEqual({ done: true, insertIndex: 0 });
  });

  it('resolves a 15-item list to the bottom in exactly 4 shown comparisons when the new task always loses', () => {
    let state = startCompare(15) as CompareState;
    const shownCandidates = [state.candidateIndex];
    let result = narrow(state, false);
    while (!('done' in result)) {
      shownCandidates.push(result.candidateIndex);
      state = result;
      result = narrow(state, false);
    }
    expect(shownCandidates).toEqual([7, 11, 13, 14]);
    expect(result).toEqual({ done: true, insertIndex: 15 });
  });

  it('places a task in the middle correctly for a mixed sequence on a 7-item list', () => {
    // list indices 0..6, true = new task more urgent than candidate
    let state = startCompare(7) as CompareState; // candidateIndex 3
    let result = narrow(state, true); // more urgent than index 3 -> search [0,3)
    expect(result).toEqual({ low: 0, high: 3, candidateIndex: 1 });
    result = narrow(result as CompareState, false); // less urgent than index 1 -> search [2,3)
    expect(result).toEqual({ low: 2, high: 3, candidateIndex: 2 });
    result = narrow(result as CompareState, true); // more urgent than index 2 -> search [2,2)
    expect(result).toEqual({ done: true, insertIndex: 2 });
  });
});

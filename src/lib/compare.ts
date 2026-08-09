export interface CompareState {
  low: number;
  high: number;
  candidateIndex: number;
}

export type CompareResult = CompareState | { done: true; insertIndex: number };

function computeState(low: number, high: number): CompareResult {
  if (low >= high) return { done: true, insertIndex: low };
  const candidateIndex = Math.floor((low + high) / 2);
  return { low, high, candidateIndex };
}

/** Starts a compare-insertion search over a list of the given length. Returns null when the mechanic should be skipped (0 or 1 existing tasks) — PRODUCT.md's explicit edge case. */
export function startCompare(length: number): CompareState | null {
  if (length <= 1) return null;
  const result = computeState(0, length);
  return 'done' in result ? null : result;
}

/** newTaskWon = true means the new task is MORE urgent than the current candidate. */
export function narrow(state: CompareState, newTaskWon: boolean): CompareResult {
  const { low, high, candidateIndex } = state;
  return newTaskWon ? computeState(low, candidateIndex) : computeState(candidateIndex + 1, high);
}

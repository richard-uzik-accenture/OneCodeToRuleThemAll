/**
 * Computes a rank value that sorts strictly between `before` and `after`.
 * Pass `null` for a missing neighbor (inserting at the very top or bottom).
 */
export function rankBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0;
  if (before === null) return (after as number) - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}

/** Evenly spaced integer ranks for `count` items, in order. Used to defragment ranks after a full manual reorder. */
export function renumber(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

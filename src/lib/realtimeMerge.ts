import type { Task } from './tasks';

/** Merges an incoming realtime row into the current active-task list: upserts by id, sorted by rank, or removes the row if it's no longer active. */
export function upsertActiveTask(tasks: Task[], row: Task): Task[] {
  const withoutRow = tasks.filter((t) => t.id !== row.id);
  if (row.status !== 'active') return withoutRow;

  const insertIndex = withoutRow.findIndex((t) => t.rank > row.rank);
  const index = insertIndex === -1 ? withoutRow.length : insertIndex;
  const next = [...withoutRow];
  next.splice(index, 0, row);
  return next;
}

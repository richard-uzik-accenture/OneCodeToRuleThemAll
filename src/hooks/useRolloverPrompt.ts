import { useMemo, useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

export function useRolloverPrompt(tasks: Task[]) {
  const [dismissed, setDismissed] = useState(false);

  const hasLeftovers = useMemo(() => getLeftoverTasks(tasks).length > 0, [tasks]);

  return { hasLeftovers, dismissed, dismiss: () => setDismissed(true) };
}

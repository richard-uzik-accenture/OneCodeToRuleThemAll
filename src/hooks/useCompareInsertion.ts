import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { startCompare, narrow, type CompareState } from '../lib/compare';

interface UseCompareInsertionArgs {
  tasks: Task[];
  onInsert: (title: string, index: number) => Promise<void>;
}

export function useCompareInsertion({ tasks, onInsert }: UseCompareInsertionArgs) {
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [state, setState] = useState<CompareState | null>(null);

  function begin(title: string) {
    const initial = startCompare(tasks.length);
    if (!initial) {
      onInsert(title, tasks.length); // 0-1 existing tasks: skip the mechanic entirely
      return;
    }
    setPendingTitle(title);
    setState(initial);
  }

  function decide(newTaskWon: boolean) {
    if (!state || pendingTitle === null) return;
    const result = narrow(state, newTaskWon);
    if ('done' in result) {
      onInsert(pendingTitle, result.insertIndex);
      setPendingTitle(null);
      setState(null);
    } else {
      setState(result);
    }
  }

  const candidate = state ? tasks[state.candidateIndex] : null;

  return { pendingTitle, candidate, active: pendingTitle !== null, begin, decide };
}

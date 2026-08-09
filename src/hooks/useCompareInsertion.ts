import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { startCompare, narrow, type CompareState } from '../lib/compare';

interface UseCompareInsertionArgs {
  tasks: Task[];
  onInsert: (title: string, index: number) => Promise<void>;
}

const PLACED_CONFIRMATION_MS = 900;

export function useCompareInsertion({ tasks, onInsert }: UseCompareInsertionArgs) {
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [state, setState] = useState<CompareState | null>(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);
  const [placedAt, setPlacedAt] = useState<{ title: string; index: number } | null>(null);

  function begin(title: string) {
    const initial = startCompare(tasks.length);
    if (!initial) {
      onInsert(title, tasks.length);
      return;
    }
    setPendingTitle(title);
    setState(initial);
    setTotalSteps(Math.ceil(Math.log2(tasks.length + 1)));
    setStepsDone(0);
  }

  function decide(newTaskWon: boolean) {
    if (!state || pendingTitle === null) return;
    const result = narrow(state, newTaskWon);
    setStepsDone((n) => n + 1);
    if ('done' in result) {
      onInsert(pendingTitle, result.insertIndex);
      setPlacedAt({ title: pendingTitle, index: result.insertIndex });
      setPendingTitle(null);
      setState(null);
      window.setTimeout(() => setPlacedAt(null), PLACED_CONFIRMATION_MS);
    } else {
      setState(result);
    }
  }

  const candidate = state ? tasks[state.candidateIndex] : null;

  return {
    pendingTitle,
    candidate,
    active: pendingTitle !== null,
    placedAt,
    progress: { done: stepsDone, total: totalSteps },
    begin,
    decide,
  };
}

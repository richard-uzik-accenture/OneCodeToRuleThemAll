import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { startCompare, narrow, type CompareState } from '../lib/compare';

interface UseCompareInsertionArgs {
  tasks: Task[];
  onInsert: (title: string, index: number, tags?: string[]) => Promise<void>;
}

const PLACED_CONFIRMATION_MS = 900;

export function useCompareInsertion({ tasks, onInsert }: UseCompareInsertionArgs) {
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [state, setState] = useState<CompareState | null>(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);
  const [placedAt, setPlacedAt] = useState<{ title: string; index: number } | null>(null);

  function begin(title: string, tags: string[] = []) {
    const initial = startCompare(tasks.length);
    if (!initial) {
      onInsert(title, tasks.length, tags);
      return;
    }
    setPendingTitle(title);
    setPendingTags(tags);
    setState(initial);
    setTotalSteps(Math.ceil(Math.log2(tasks.length + 1)));
    setStepsDone(0);
  }

  function decide(newTaskWon: boolean) {
    if (!state || pendingTitle === null) return;
    const result = narrow(state, newTaskWon);
    setStepsDone((n) => n + 1);
    if ('done' in result) {
      onInsert(pendingTitle, result.insertIndex, pendingTags);
      setPlacedAt({ title: pendingTitle, index: result.insertIndex });
      setPendingTitle(null);
      setPendingTags([]);
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

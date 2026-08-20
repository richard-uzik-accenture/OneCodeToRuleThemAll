import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

type Step = 'idle' | 'leftover' | 'braindump' | 'merge';

interface UseMorningFlowArgs {
  tasks: Task[];
  keepLeftover: (id: string) => Promise<boolean>;
  dropTask: (id: string) => Promise<boolean>;
  addTask: (title: string) => Promise<void>;
}

export function useMorningFlow({ tasks, keepLeftover, dropTask, addTask }: UseMorningFlowArgs) {
  const [step, setStep] = useState<Step>('idle');
  const [queue, setQueue] = useState<Task[]>([]);
  const [leftoverError, setLeftoverError] = useState<string | null>(null);

  function start() {
    const leftovers = getLeftoverTasks(tasks);
    setQueue(leftovers);
    setStep(leftovers.length > 0 ? 'leftover' : 'braindump');
  }

  async function resolveLeftover(keep: boolean) {
    const [current, ...rest] = queue;
    if (!current) return;
    setLeftoverError(null);
    const ok = keep ? await keepLeftover(current.id) : await dropTask(current.id);
    if (!ok) {
      setLeftoverError(keep ? "couldn't keep that task — try again" : "couldn't let that go — try again");
      return;
    }
    setQueue(rest);
    if (rest.length === 0) setStep('braindump');
  }

  function finishBrainDump() {
    setStep('merge');
  }

  function finishMerge() {
    setStep('idle');
  }

  function close() {
    setStep('idle');
  }

  return {
    step,
    active: step !== 'idle',
    currentLeftover: queue[0] ?? null,
    remaining: queue.length,
    leftoverError,
    start,
    resolveLeftover,
    addBrainDumpTask: addTask,
    finishBrainDump,
    finishMerge,
    close,
  };
}

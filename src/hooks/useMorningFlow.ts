import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

type Step = 'idle' | 'leftover' | 'braindump' | 'merge';

interface UseMorningFlowArgs {
  tasks: Task[];
  keepLeftover: (id: string) => Promise<void>;
  dropTask: (id: string) => Promise<void>;
  addTask: (title: string) => Promise<void>;
}

export function useMorningFlow({ tasks, keepLeftover, dropTask, addTask }: UseMorningFlowArgs) {
  const [step, setStep] = useState<Step>('idle');
  const [queue, setQueue] = useState<Task[]>([]);

  function start() {
    const leftovers = getLeftoverTasks(tasks);
    setQueue(leftovers);
    setStep(leftovers.length > 0 ? 'leftover' : 'braindump');
  }

  async function resolveLeftover(keep: boolean) {
    const [current, ...rest] = queue;
    if (!current) return;
    if (keep) await keepLeftover(current.id);
    else await dropTask(current.id);
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
    start,
    resolveLeftover,
    addBrainDumpTask: addTask,
    finishBrainDump,
    finishMerge,
    close,
  };
}

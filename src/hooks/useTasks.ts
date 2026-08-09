import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listActiveTasks, createTask, type Task } from '../lib/tasks';
import { rankBetween } from '../lib/ranking';

export function useTasks() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const data = await listActiveTasks();
    setTasks(data);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addTask(title: string) {
    if (!session) return;
    const lastRank = tasks.length > 0 ? tasks[tasks.length - 1].rank : null;
    const rank = rankBetween(lastRank, null);
    const created = await createTask(session.user.id, title, rank);
    setTasks((prev) => [...prev, created]);
  }

  return { tasks, loading, addTask, reload };
}

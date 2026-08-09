import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listActiveTasks, createTask, updateTaskStatus, updateTaskRanks, markTriaged, type Task } from '../lib/tasks';
import { rankBetween, renumber } from '../lib/ranking';
import { upsertActiveTask } from '../lib/realtimeMerge';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`tasks-changes-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return; // the app never deletes rows, only changes status
          setTasks((prev) => upsertActiveTask(prev, payload.new as Task));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  async function addTask(title: string) {
    if (!session) return;
    const lastRank = tasks.length > 0 ? tasks[tasks.length - 1].rank : null;
    const rank = rankBetween(lastRank, null);
    const created = await createTask(session.user.id, title, rank);
    setTasks((prev) => [...prev, created]);
  }

  async function insertTaskAtIndex(title: string, index: number) {
    if (!session) return;
    const before = index > 0 ? tasks[index - 1].rank : null;
    const after = index < tasks.length ? tasks[index].rank : null;
    const rank = rankBetween(before, after);
    const created = await createTask(session.user.id, title, rank);
    setTasks((prev) => {
      const next = [...prev];
      next.splice(index, 0, created);
      return next;
    });
  }

  async function completeTask(id: string) {
    await updateTaskStatus(id, 'done');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function dropTask(id: string) {
    await updateTaskStatus(id, 'dropped');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function reorderTasks(newOrder: Task[]) {
    setTasks(newOrder);
  }

  async function commitReorder() {
    const ranks = renumber(tasks.length);
    await updateTaskRanks(tasks.map((t, i) => ({ id: t.id, rank: ranks[i] })));
  }

  async function keepLeftover(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    await markTriaged(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, last_triaged_on: today } : t)));
  }

  return { tasks, loading, addTask, insertTaskAtIndex, completeTask, dropTask, reorderTasks, commitReorder, keepLeftover, reload };
}

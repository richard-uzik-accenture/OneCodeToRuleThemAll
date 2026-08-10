import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listActiveTasks, createTask, updateTask, updateTaskStatus, updateTaskRanks, markTriaged, type Task } from '../lib/tasks';
import { rankBetween, renumber } from '../lib/ranking';
import { upsertActiveTask } from '../lib/realtimeMerge';
import { supabase } from '../lib/supabase';
import { DEV_MODE, mockTasksApi } from '../lib/devMock';

export function useTasks() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const data = DEV_MODE ? await mockTasksApi.list() : await listActiveTasks();
    setTasks(data);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!session || DEV_MODE) return;

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

  async function addTask(title: string, tags: string[] = []) {
    if (!session) return;
    const lastRank = tasks.length > 0 ? tasks[tasks.length - 1].rank : null;
    const rank = rankBetween(lastRank, null);
    try {
      const created = DEV_MODE
        ? await mockTasksApi.create(session.user.id, title, rank, tags)
        : await createTask(session.user.id, title, rank, tags);
      setTasks((prev) => [...prev, created]);
    } catch {
      setError("couldn't add that task — try again");
    }
  }

  async function insertTaskAtIndex(title: string, index: number, tags: string[] = []) {
    if (!session) return;
    const before = index > 0 ? tasks[index - 1].rank : null;
    const after = index < tasks.length ? tasks[index].rank : null;
    const rank = rankBetween(before, after);
    try {
      const created = DEV_MODE
        ? await mockTasksApi.create(session.user.id, title, rank, tags)
        : await createTask(session.user.id, title, rank, tags);
      setTasks((prev) => {
        const next = [...prev];
        next.splice(index, 0, created);
        return next;
      });
    } catch {
      setError("couldn't place that task — try again");
    }
  }

  async function completeTask(id: string) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await (DEV_MODE ? mockTasksApi.updateStatus(id, 'done') : updateTaskStatus(id, 'done'));
    } catch {
      setTasks(previous);
      setError("couldn't mark that settled — try again");
    }
  }

  async function editTask(id: string, patch: { title?: string; tags?: string[]; due_time?: string | null }) {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await (DEV_MODE ? mockTasksApi.update(id, patch) : updateTask(id, patch));
    } catch {
      setTasks(previous);
      setError("couldn't save that edit — try again");
    }
  }

  async function dropTask(id: string) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await (DEV_MODE ? mockTasksApi.updateStatus(id, 'dropped') : updateTaskStatus(id, 'dropped'));
    } catch {
      setTasks(previous);
      setError("couldn't let that go — try again");
    }
  }

  function reorderTasks(newOrder: Task[]) {
    setTasks(newOrder);
  }

  async function commitReorder() {
    const ranks = renumber(tasks.length);
    const updates = tasks.map((t, i) => ({ id: t.id, rank: ranks[i] }));
    try {
      await (DEV_MODE ? mockTasksApi.updateRanks(updates) : updateTaskRanks(updates));
    } catch {
      setError("couldn't save the new order — try again");
    }
  }

  async function keepLeftover(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, last_triaged_on: today } : t)));
    try {
      await (DEV_MODE ? mockTasksApi.markTriaged(id) : markTriaged(id));
    } catch {
      setTasks(previous);
      setError("couldn't keep that task — try again");
    }
  }

  return {
    tasks, loading, error, dismissError: () => setError(null),
    addTask, insertTaskAtIndex, completeTask, editTask, dropTask, reorderTasks, commitReorder, keepLeftover, reload,
  };
}

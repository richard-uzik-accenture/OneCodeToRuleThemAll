import { supabase } from './supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  status: 'active' | 'done' | 'dropped';
  rank: number;
  created_at: string;
  completed_at: string | null;
  last_triaged_on: string; // ISO date, e.g. "2026-08-09"
  tags: string[];
  due_time: string | null; // "HH:MM" / "HH:MM:SS", null if unset
}

/** All active tasks for the signed-in user, ordered most-urgent-first. */
export async function listActiveTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('rank', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

/** Creates a task at the given rank. Callers compute the rank (top-level list append, or via the compare mechanic). */
export async function createTask(userId: string, title: string, rank: number, tags: string[] = []): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, rank, status: 'active', tags })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  const patch: Partial<Task> = { status };
  if (status === 'done') patch.completed_at = new Date().toISOString();
  const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
  if (error) throw error;
}

export async function updateTask(
  taskId: string,
  patch: { title?: string; tags?: string[]; due_time?: string | null },
): Promise<void> {
  const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
  if (error) throw error;
}

export async function updateTaskRank(taskId: string, rank: number): Promise<void> {
  const { error } = await supabase.from('tasks').update({ rank }).eq('id', taskId);
  if (error) throw error;
}

/** Bulk rank update used after a full manual reorder (Phase 5). */
export async function updateTaskRanks(updates: { id: string; rank: number }[]): Promise<void> {
  await Promise.all(updates.map((u) => updateTaskRank(u.id, u.rank)));
}

export async function markTriaged(taskId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('tasks').update({ last_triaged_on: today }).eq('id', taskId);
  if (error) throw error;
}

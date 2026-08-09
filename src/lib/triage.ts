import type { Task } from './tasks';

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isLeftover(task: Task, today: string = todayISO()): boolean {
  return task.last_triaged_on < today;
}

export function getLeftoverTasks(tasks: Task[], today: string = todayISO()): Task[] {
  return tasks.filter((t) => isLeftover(t, today));
}

import type { Task } from '../lib/tasks';

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
}

export function TaskRow({ task, onComplete, onDrop }: TaskRowProps) {
  return (
    <div className="task-row">
      <span className="rank" aria-hidden="true" />
      <button aria-label="mark settled" onClick={() => onComplete(task.id)} className="check" />
      <span className="title">{task.title}</span>
      <button aria-label="let it go" onClick={() => onDrop(task.id)} className="close">×</button>
    </div>
  );
}

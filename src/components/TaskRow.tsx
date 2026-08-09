import type { Task } from '../lib/tasks';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 14,
        background: 'var(--sand)',
        color: 'var(--graphite)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {task.title}
    </div>
  );
}

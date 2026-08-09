import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)', padding: 18 }}>
        nothing on the list yet — add your first task below.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, paddingBottom: 96 }}>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}

import { AnimatePresence, Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
  onEdit?: (task: Task) => void;
  dimmed?: boolean;
}

export function TaskList({ tasks, onComplete, onDrop, onReorder, onReorderCommit, onEdit, dimmed }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={tasks}
      onReorder={onReorder}
      className={dimmed ? 'task-list task-list-dimmed' : 'task-list'}
    >
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDrop={onDrop}
            onReorderCommit={onReorderCommit}
            onEdit={onEdit}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

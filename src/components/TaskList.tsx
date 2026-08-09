import { AnimatePresence, Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
}

export function TaskList({ tasks, onComplete, onDrop, onReorder, onReorderCommit }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
  }

  return (
    <Reorder.Group as="div" axis="y" values={tasks} onReorder={onReorder} className="task-list">
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDrop={onDrop}
            onReorderCommit={onReorderCommit}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

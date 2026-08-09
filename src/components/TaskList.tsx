import { AnimatePresence, motion } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
}

export function TaskList({ tasks, onComplete, onDrop }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
  }

  return (
    <div className="task-list">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={false}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <TaskRow task={task} onComplete={onComplete} onDrop={onDrop} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

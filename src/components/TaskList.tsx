import { AnimatePresence, Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { TaskRow } from './TaskRow';
import { EmptyState } from './EmptyState';

interface TaskListEmptyState {
  headline: string;
  supportingText?: string;
  action?: { label: string; onClick: () => void };
}

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
  onEdit?: (task: Task) => void;
  dimmed?: boolean;
  emptyState?: TaskListEmptyState;
  failedRowId?: string | null;
}

const DEFAULT_EMPTY_STATE: TaskListEmptyState = { headline: 'nothing on the list yet — tap + to add your first task.' };

export function TaskList({ tasks, onComplete, onDrop, onReorder, onReorderCommit, onEdit, dimmed, emptyState, failedRowId }: TaskListProps) {
  if (tasks.length === 0) {
    const { headline, supportingText, action } = emptyState ?? DEFAULT_EMPTY_STATE;
    return <EmptyState headline={headline} supportingText={supportingText} action={action} />;
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
            failed={task.id === failedRowId}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

import { Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { useLongPressDrag } from '../hooks/useLongPressDrag';

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorderCommit: () => void;
}

export function TaskRow({ task, onComplete, onDrop, onReorderCommit }: TaskRowProps) {
  const { dragControls, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useLongPressDrag();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onReorderCommit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="task-row"
      style={{ touchAction: 'pan-y' }}
    >
      <span className="rank" aria-hidden="true" />
      <button aria-label="mark settled" onClick={() => onComplete(task.id)} className="check" />
      <span className="title">{task.title}</span>
      <button aria-label="let it go" onClick={() => onDrop(task.id)} className="close">×</button>
    </Reorder.Item>
  );
}

import { Reorder } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { useLongPressDrag } from '../hooks/useLongPressDrag';
import { Check } from './icons/Check';
import { Close } from './icons/Close';

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
      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 } }}
      style={{ touchAction: 'pan-y' }}
    >
      <span className="rank" aria-hidden="true" />
      <button aria-label="mark settled" onClick={() => onComplete(task.id)} className="check">
        <Check width={12} height={12} />
      </button>
      <span className="title">{task.title}</span>
      <button aria-label="let it go" onClick={() => onDrop(task.id)} className="close">
        <Close width={14} height={14} />
      </button>
    </Reorder.Item>
  );
}

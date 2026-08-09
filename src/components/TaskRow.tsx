import { motion, Reorder } from 'framer-motion';
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

const LONG_PRESS_MS = 350;

export function TaskRow({ task, onComplete, onDrop, onReorderCommit }: TaskRowProps) {
  const { dragControls, charging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useLongPressDrag();

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
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{
        opacity: 1,
        height: 'auto',
        marginBottom: 8,
        scale: charging ? 0.98 : 1,
        backgroundColor: charging ? 'var(--haze)' : 'var(--mist)',
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 24px -10px rgba(23, 19, 53, 0.35)' }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
        opacity: { duration: 0.2 },
        height: { duration: 0.2 },
        marginBottom: { duration: 0.2 },
        scale: { duration: LONG_PRESS_MS / 1000 },
        backgroundColor: { duration: LONG_PRESS_MS / 1000 },
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <span className="rank" aria-hidden="true" />
      <motion.button
        aria-label="mark settled"
        onClick={() => onComplete(task.id)}
        className="check"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
      >
        <Check width={12} height={12} />
      </motion.button>
      <span className="title">{task.title}</span>
      <motion.button
        aria-label="let it go"
        onClick={() => onDrop(task.id)}
        className="close"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
      >
        <Close width={14} height={14} />
      </motion.button>
    </Reorder.Item>
  );
}

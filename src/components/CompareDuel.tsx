import { motion, type PanInfo } from 'framer-motion';
import type { Task } from '../lib/tasks';

interface CompareDuelProps {
  candidate: Task;
  newTaskTitle: string;
  progress: { done: number; total: number };
  onDecide: (newTaskWon: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 80;

export function CompareDuel({ candidate, newTaskTitle, progress, onDecide }: CompareDuelProps) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD_PX) onDecide(true);
    else if (info.offset.x < -SWIPE_THRESHOLD_PX) onDecide(false);
  }

  return (
    <div className="duel-overlay">
      <div className="duel-headline">
        <div className="duel-kicker">new task landed</div>
        <h2 className="duel-question">
          more urgent than<br />
          <span className="ref-title">"{candidate.title}"</span>?
        </h2>
      </div>

      <motion.div
        className="swipe-card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        transition={{ duration: 0.175 }}
      >
        <div className="label">just added — drag me</div>
        <div className="title">{newTaskTitle}</div>
      </motion.div>

      <div className="swipe-hints">
        <button className="swipe-hint less" onClick={() => onDecide(false)}>← no, later</button>
        <button className="swipe-hint more" onClick={() => onDecide(true)}>yes, sooner →</button>
      </div>

      <div className="duel-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

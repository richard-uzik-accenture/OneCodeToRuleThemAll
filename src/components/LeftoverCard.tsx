import { motion, type PanInfo } from 'framer-motion';
import { decideSwipe } from '../lib/swipe';
import type { Task } from '../lib/tasks';

interface LeftoverCardProps {
  task: Task;
  remaining: number;
  onResolve: (keep: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 100;

export function LeftoverCard({ task, remaining, onResolve }: LeftoverCardProps) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    const decision = decideSwipe(info.offset.x, info.velocity.x, SWIPE_THRESHOLD_PX);
    if (decision === 1) onResolve(true);
    else if (decision === -1) onResolve(false);
  }

  return (
    <div className="leftover-shell">
      <div>
        <p className="leftover-kicker">still open · {remaining} left</p>
        <motion.div
          className="leftover-card"
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.03, boxShadow: '0 24px 44px -16px rgba(23, 19, 53, 0.3)' }}
        >
          {task.title}
        </motion.div>
        <div className="leftover-actions">
          <button className="leftover-hint drop" onClick={() => onResolve(false)}>← let it go</button>
          <button className="leftover-hint keep" onClick={() => onResolve(true)}>keep →</button>
        </div>
      </div>
    </div>
  );
}

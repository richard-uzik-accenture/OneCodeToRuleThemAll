import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useLayoutEffect, useState } from 'react';
import type { Task } from '../lib/tasks';

interface CompareDuelProps {
  candidate: Task;
  newTaskTitle: string;
  progress: { done: number; total: number };
  onDecide: (newTaskWon: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 80;
const EXIT_DISTANCE_PX = 420;
const EXIT_DURATION_S = 0.175;

export function CompareDuel({ candidate, newTaskTitle, progress, onDecide }: CompareDuelProps) {
  const [exitDirection, setExitDirection] = useState<1 | -1 | null>(null);

  // This component instance is reused across comparisons — only `candidate`
  // changes. Reset the committed-exit state for each new comparison so the
  // draggable card reappears (otherwise it stays hidden after the first swipe).
  useLayoutEffect(() => {
    setExitDirection(null);
  }, [candidate.id]);

  function commit(newTaskWon: boolean) {
    setExitDirection(newTaskWon ? 1 : -1);
    window.setTimeout(() => onDecide(newTaskWon), EXIT_DURATION_S * 1000);
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD_PX) commit(true);
    else if (info.offset.x < -SWIPE_THRESHOLD_PX) commit(false);
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

      <div className="swipe-card-slot">
        <AnimatePresence>
          {exitDirection === null && (
            <motion.div
              key={candidate.id}
              className="swipe-card"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              whileDrag={{ scale: 1.03, boxShadow: '0 24px 44px -16px rgba(23, 19, 53, 0.3)' }}
              transition={{ duration: EXIT_DURATION_S }}
            >
              <div className="label">just added — drag me</div>
              <div className="title">{newTaskTitle}</div>
            </motion.div>
          )}
        </AnimatePresence>
        {exitDirection !== null && (
          <motion.div
            className="swipe-card swipe-card-committed"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 0, x: exitDirection * EXIT_DISTANCE_PX }}
            transition={{ duration: EXIT_DURATION_S, ease: 'easeIn' }}
          >
            <div className="label">just added — drag me</div>
            <div className="title">{newTaskTitle}</div>
          </motion.div>
        )}
      </div>

      <div className="swipe-hints">
        <button className="swipe-hint less" onClick={() => commit(false)}>← no, later</button>
        <button className="swipe-hint more" onClick={() => commit(true)}>yes, sooner →</button>
      </div>

      <div className="duel-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

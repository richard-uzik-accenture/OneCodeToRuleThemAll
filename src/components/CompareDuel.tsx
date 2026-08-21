import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { decideSwipeDirection, planDuelFling } from '../lib/swipe';
import { reflowSpring } from '../lib/transitions';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { Task } from '../lib/tasks';

interface CompareDuelProps {
  candidate: Task;
  newTaskTitle: string;
  progress: { done: number; total: number };
  onDecide: (newTaskWon: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 80;
/** How many remaining comparisons are drawn as peeking cards behind the live one. */
const MAX_GHOSTS = 2;

type CommitFn = (direction: 1 | -1, velocityX?: number, velocityY?: number) => void;

export function CompareDuel({ candidate, newTaskTitle, progress, onDecide }: CompareDuelProps) {
  const reducedMotion = useReducedMotion();
  // The action buttons live outside the card, so the live card publishes its
  // commit function here — pressing a button plays the same fling as a swipe.
  const commitRef = useRef<CommitFn | null>(null);

  const ghosts = Math.min(Math.max(progress.total - progress.done - 1, 0), MAX_GHOSTS);

  return (
    <motion.div
      className="duel-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: reflowSpring }}
      exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
    >
      <h2 className="duel-question">
        more urgent than <span className="ref-title">"{candidate.title}"</span>?
      </h2>

      <div className="duel-stage">
        <div className="duel-stack">
          {Array.from({ length: ghosts }, (_, i) => (
            <motion.div
              key={`ghost-${i}`}
              className="duel-ghost"
              animate={{ scale: 1 - 0.04 * (i + 1), y: 10 * (i + 1) }}
              transition={reducedMotion ? { duration: 0 } : reflowSpring}
            />
          ))}

          {/* Keyed per comparison: every card is a fresh instance owning its own
              drag position, so a committed card can never leave a stale offset
              behind for the next one. */}
          <DuelCard
            key={`${candidate.id}:${progress.done}`}
            title={newTaskTitle}
            reducedMotion={reducedMotion}
            commitRef={commitRef}
            onResolved={onDecide}
          />
        </div>
      </div>

      <div className="duel-actions">
        <button className="duel-action later" onClick={() => commitRef.current?.(-1)}>← later</button>
        <button className="duel-action sooner" onClick={() => commitRef.current?.(1)}>sooner →</button>
      </div>

      <div className="duel-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
        ))}
      </div>
    </motion.div>
  );
}

interface DuelCardProps {
  title: string;
  reducedMotion: boolean;
  commitRef: RefObject<CommitFn | null>;
  onResolved: (newTaskWon: boolean) => void;
}

function DuelCard({ title, reducedMotion, commitRef, onResolved }: DuelCardProps) {
  // Drag position lives in motion values, never React state: the card tracks the
  // finger on the compositor without re-rendering per frame.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const committed = useRef(false);

  const rotate = useTransform(x, [-300, 0, 300], reducedMotion ? [0, 0, 0] : [-16, 0, 16], { clamp: true });
  const soonerOpacity = useTransform(x, [40, 130], [0, 1], { clamp: true });
  const laterOpacity = useTransform(x, [-130, -40], [1, 0], { clamp: true });

  function commit(direction: 1 | -1, velocityX = 0, velocityY = 0) {
    if (committed.current) return;
    committed.current = true;

    const plan = planDuelFling(direction, velocityX, window.innerWidth, reducedMotion);
    if (plan.haptic) navigator.vibrate?.(10); // branding.md §6: light haptic on commit

    const ease: [number, number, number, number] = [0.32, 0.72, 0, 1];
    animate(y, y.get() + velocityY * 0.1, { duration: plan.duration, ease });
    animate(x, plan.direction * plan.distance, {
      duration: plan.duration,
      ease,
      onComplete: () => onResolved(plan.direction === 1),
    });
  }

  useLayoutEffect(() => {
    commitRef.current = commit;
  });

  function handleDragEnd(_event: unknown, info: PanInfo) {
    const direction = decideSwipeDirection(info.offset.x, info.velocity.x, SWIPE_THRESHOLD_PX);
    if (direction !== null) {
      commit(direction, info.velocity.x, info.velocity.y);
      return;
    }
    // Under threshold: hand the release velocity to the spring so the snap-back
    // continues the gesture instead of restarting from a dead stop.
    const spring = { type: 'spring' as const, stiffness: 520, damping: 34 };
    animate(x, 0, { ...spring, velocity: info.velocity.x });
    animate(y, 0, { ...spring, velocity: info.velocity.y });
  }

  return (
    <motion.div
      className="duel-card"
      drag
      dragMomentum={false}
      style={{ x, y, rotate }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
      whileDrag={{ scale: 1.03 }}
    >
      <motion.span className="duel-stamp sooner" style={{ opacity: soonerOpacity }} aria-hidden>
        sooner
      </motion.span>
      <motion.span className="duel-stamp later" style={{ opacity: laterOpacity }} aria-hidden>
        later
      </motion.span>

      <div className="duel-card-title">{title}</div>
      <div className="duel-card-meta">just added</div>
    </motion.div>
  );
}

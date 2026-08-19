import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task } from '../lib/tasks';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { stepVariants } from '../lib/transitions';
import { LeftoverCard } from './LeftoverCard';
import { BrainDump } from './BrainDump';
import { TaskList } from './TaskList';

interface MorningFlowProps {
  step: 'leftover' | 'braindump' | 'merge';
  currentLeftover: Task | null;
  remaining: number;
  tasks: Task[];
  keptCount: number;
  leftoverError: string | null;
  onResolveLeftover: (keep: boolean) => void;
  onAddBrainDumpTask: (title: string) => void;
  onFinishBrainDump: () => void;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
  onFinishMerge: () => void;
  onClose: () => void;
}

const STEP_ORDER = ['leftover', 'braindump', 'merge'] as const;

export function MorningFlow(props: MorningFlowProps) {
  const { step, currentLeftover, onClose } = props;
  const stepIndex = STEP_ORDER.indexOf(step);
  const reducedMotion = useReducedMotion();

  // Defensive: 'leftover' step should always have a currentLeftover
  // (useMorningFlow only enters this step when the queue is non-empty). If
  // that invariant is ever violated, close the flow rather than stranding
  // the user on a blank step with no way forward.
  useEffect(() => {
    if (step === 'leftover' && !currentLeftover) onClose();
  }, [step, currentLeftover, onClose]);

  return (
    <div className="flow-shell">
      <div className="flow-header">
        <span className="flow-kicker">start my day</span>
        <button className="flow-exit" onClick={props.onClose}>close</button>
      </div>
      <div className="flow-steps">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className={`flow-step ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          className="flow-step-body"
          variants={reducedMotion ? undefined : stepVariants}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {step === 'leftover' && props.currentLeftover && (
            <div className="leftover-step">
              {props.leftoverError && <p className="leftover-error" role="alert">{props.leftoverError}</p>}
              <LeftoverCard
                key={`${props.currentLeftover.id}-${props.leftoverError ?? 'ok'}`}
                task={props.currentLeftover}
                remaining={props.remaining}
                onResolve={props.onResolveLeftover}
              />
            </div>
          )}
          {step === 'braindump' && <BrainDump onAdd={props.onAddBrainDumpTask} onDone={props.onFinishBrainDump} />}
          {step === 'merge' && (
            <div className="flow-merge">
              <h2 className="merge-title">one list for today</h2>
              <p className="merge-sub">drag into the order that matches today.</p>
              {props.keptCount > 0 && <div className="merge-section-label">kept from yesterday</div>}
              <TaskList
                tasks={props.tasks}
                onComplete={props.onComplete}
                onDrop={props.onDrop}
                onReorder={props.onReorder}
                onReorderCommit={props.onReorderCommit}
                emptyState={{
                  headline: 'nothing carried over, nothing new',
                  supportingText: 'a clean slate — head into today empty-handed, or go back and add something.',
                }}
              />
              <button className="merge-cta" onClick={props.onFinishMerge}>start the day</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

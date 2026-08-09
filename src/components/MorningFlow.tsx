import type { Task } from '../lib/tasks';
import { LeftoverCard } from './LeftoverCard';
import { BrainDump } from './BrainDump';
import { TaskList } from './TaskList';

interface MorningFlowProps {
  step: 'leftover' | 'braindump' | 'merge';
  currentLeftover: Task | null;
  remaining: number;
  tasks: Task[];
  keptCount: number;
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
  const { step } = props;
  const stepIndex = STEP_ORDER.indexOf(step);

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

      {step === 'leftover' && props.currentLeftover && (
        <LeftoverCard task={props.currentLeftover} remaining={props.remaining} onResolve={props.onResolveLeftover} />
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
          />
          <button className="merge-cta" onClick={props.onFinishMerge}>start the day</button>
        </div>
      )}
    </div>
  );
}

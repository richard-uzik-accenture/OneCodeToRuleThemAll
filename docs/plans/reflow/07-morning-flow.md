# Phase 7: Morning "Start My Day" Flow

> Depends on: Phase 6 (compare duel; brain-dump reuses plain `addTask`, merge reuses Phase 5's drag). Read `docs/plans/reflow/00-overview.md`.

**Goal of this phase:** the three-phase morning ritual from `idea.md` — leftover triage (swipe keep/drop), brain dump (flat capture, no ranking), and merge (one drag pass over the combined list) — as a single full-screen flow, manually triggered by a "start my day" button. Automatic triggering on an actual day boundary is Phase 8; this phase builds the flow itself and you trigger it by hand to test it.

## Files

- Create: `src/lib/triage.ts`
- Create: `src/lib/triage.test.ts`
- Modify: `src/hooks/useTasks.ts` — add `keepLeftover`
- Create: `src/hooks/useMorningFlow.ts`
- Create: `src/components/LeftoverCard.tsx`
- Create: `src/components/BrainDump.tsx`
- Create: `src/components/MorningFlow.tsx`
- Modify: `src/pages/Today.tsx` — add the "start my day" trigger and render `MorningFlow` when active

## Task 1: Leftover detection

**Interfaces:**
- Produces: `todayISO(): string`, `isLeftover(task: Task, today?: string): boolean`, `getLeftoverTasks(tasks: Task[], today?: string): Task[]` — consumed by `useMorningFlow.ts` now, and by `08-auto-rollover.md` to decide whether to auto-prompt.

A task is a leftover once its `last_triaged_on` is strictly before today — it was active yesterday (or earlier) and was never confirmed today.

- [ ] **Step 1: Write the failing tests** — `src/lib/triage.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { isLeftover, getLeftoverTasks } from './triage';
import type { Task } from './tasks';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'id',
    user_id: 'user',
    title: 'task',
    note: null,
    status: 'active',
    rank: 0,
    created_at: '2026-08-01T00:00:00.000Z',
    completed_at: null,
    last_triaged_on: '2026-08-01',
    ...overrides,
  };
}

describe('isLeftover', () => {
  it('is true when last_triaged_on is before today', () => {
    expect(isLeftover(makeTask({ last_triaged_on: '2026-08-08' }), '2026-08-09')).toBe(true);
  });

  it('is false when last_triaged_on is today', () => {
    expect(isLeftover(makeTask({ last_triaged_on: '2026-08-09' }), '2026-08-09')).toBe(false);
  });

  it('is false when last_triaged_on is in the future (clock skew safety)', () => {
    expect(isLeftover(makeTask({ last_triaged_on: '2026-08-10' }), '2026-08-09')).toBe(false);
  });
});

describe('getLeftoverTasks', () => {
  it('filters a mixed list down to only the leftovers', () => {
    const tasks = [
      makeTask({ id: '1', last_triaged_on: '2026-08-07' }),
      makeTask({ id: '2', last_triaged_on: '2026-08-09' }),
      makeTask({ id: '3', last_triaged_on: '2026-08-08' }),
    ];
    const result = getLeftoverTasks(tasks, '2026-08-09');
    expect(result.map((t) => t.id)).toEqual(['1', '3']);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './triage'`.

- [ ] **Step 3: Write the implementation** — `src/lib/triage.ts`

```ts
import type { Task } from './tasks';

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isLeftover(task: Task, today: string = todayISO()): boolean {
  return task.last_triaged_on < today;
}

export function getLeftoverTasks(tasks: Task[], today: string = todayISO()): Task[] {
  return tasks.filter((t) => isLeftover(t, today));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests including `ranking.ts` and `compare.ts` from earlier phases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/triage.ts src/lib/triage.test.ts
git commit -m "feat: leftover detection with tests"
```

## Task 2: `keepLeftover` on `useTasks`

**Interfaces:**
- Produces (added to the existing hook — nothing from Phases 3–6 changes): `keepLeftover: (id: string) => Promise<void>`.

- [ ] **Step 1: Modify `src/hooks/useTasks.ts`** — add:

```ts
  async function keepLeftover(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    await markTriaged(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, last_triaged_on: today } : t)));
  }
```

Update the import to include `markTriaged`: `import { listActiveTasks, createTask, updateTaskStatus, updateTaskRanks, markTriaged, type Task } from '../lib/tasks';`. Add `keepLeftover` to the returned object.

Dropping a leftover reuses the existing `dropTask` from Phase 4 — no new function needed for that side of the decision.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: keep-leftover action"
```

## Task 3: `useMorningFlow` orchestration hook

**Interfaces:**
- Consumes: `getLeftoverTasks` from `src/lib/triage.ts`.
- Produces: `{ step: 'idle' | 'leftover' | 'braindump' | 'merge', active: boolean, currentLeftover: Task | null, remaining: number, start: () => void, resolveLeftover: (keep: boolean) => Promise<void>, addBrainDumpTask: (title: string) => Promise<void>, finishBrainDump: () => void, finishMerge: () => void }`, consumed by `Today.tsx`.

- [ ] **Step 1: Write `src/hooks/useMorningFlow.ts`**

```ts
import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

type Step = 'idle' | 'leftover' | 'braindump' | 'merge';

interface UseMorningFlowArgs {
  tasks: Task[];
  keepLeftover: (id: string) => Promise<void>;
  dropTask: (id: string) => Promise<void>;
  addTask: (title: string) => Promise<void>;
}

export function useMorningFlow({ tasks, keepLeftover, dropTask, addTask }: UseMorningFlowArgs) {
  const [step, setStep] = useState<Step>('idle');
  const [queue, setQueue] = useState<Task[]>([]);

  function start() {
    const leftovers = getLeftoverTasks(tasks);
    setQueue(leftovers);
    setStep(leftovers.length > 0 ? 'leftover' : 'braindump');
  }

  async function resolveLeftover(keep: boolean) {
    const [current, ...rest] = queue;
    if (!current) return;
    if (keep) await keepLeftover(current.id);
    else await dropTask(current.id);
    setQueue(rest);
    if (rest.length === 0) setStep('braindump');
  }

  function finishBrainDump() {
    setStep('merge');
  }

  function finishMerge() {
    setStep('idle');
  }

  return {
    step,
    active: step !== 'idle',
    currentLeftover: queue[0] ?? null,
    remaining: queue.length,
    start,
    resolveLeftover,
    addBrainDumpTask: addTask,
    finishBrainDump,
    finishMerge,
  };
}
```

Starting directly on `'braindump'` when there are zero leftovers avoids showing an empty triage screen — the flow always has *something* to do (there's always a brain-dump step), so `active` alone is enough to decide whether to render the full-screen flow.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMorningFlow.ts
git commit -m "feat: morning flow orchestration hook"
```

## Task 4: `LeftoverCard`

Reuses the same `drag="x"` swipe pattern as `CompareDuel.tsx` (Phase 6), applied to a single full card instead of an inline duel — swipe right = keep, left = drop, with tap buttons as the non-swipe alternative. Copy follows branding.md's tone table: "still open," not "overdue."

- [ ] **Step 1: Write `src/components/LeftoverCard.tsx`**

```tsx
import { motion, type PanInfo } from 'framer-motion';
import type { Task } from '../lib/tasks';

interface LeftoverCardProps {
  task: Task;
  remaining: number;
  onResolve: (keep: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 100;

export function LeftoverCard({ task, remaining, onResolve }: LeftoverCardProps) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD_PX) onResolve(true);
    else if (info.offset.x < -SWIPE_THRESHOLD_PX) onResolve(false);
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', padding: 24 }}>
      <div>
        <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          still open · {remaining} left
        </p>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
          style={{
            padding: 24,
            borderRadius: 18,
            background: 'var(--sand)',
            color: 'var(--graphite)',
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            minWidth: 260,
            textAlign: 'center',
            cursor: 'grab',
          }}
        >
          {task.title}
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, width: 260 }}>
          <button
            onClick={() => onResolve(false)}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            ← let it go
          </button>
          <button
            onClick={() => onResolve(true)}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            keep →
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LeftoverCard.tsx
git commit -m "feat: leftover triage card"
```

## Task 5: `BrainDump`

- [ ] **Step 1: Write `src/components/BrainDump.tsx`**

```tsx
import { useState, type FormEvent } from 'react';

interface BrainDumpProps {
  onAdd: (title: string) => void;
  onDone: () => void;
}

export function BrainDump({ onAdd, onDone }: BrainDumpProps) {
  const [value, setValue] = useState('');
  const [entries, setEntries] = useState<string[]>([]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setEntries((prev) => [...prev, title]);
    setValue('');
  }

  return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
        what's new today? add as many as you want, in any order — you'll sort them next.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="add a task"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid var(--silt)',
            background: 'var(--sand)',
          }}
        />
        <button
          type="submit"
          style={{ padding: '10px 18px', borderRadius: 999, border: 'none', background: 'var(--petrol)', color: 'var(--paper)' }}
        >
          add
        </button>
      </form>
      <ul style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
        {entries.map((title, i) => (
          <li key={i} style={{ padding: '8px 0', color: 'var(--graphite)' }}>
            {title}
          </li>
        ))}
      </ul>
      <button
        onClick={onDone}
        style={{
          marginTop: 16,
          padding: '10px 18px',
          borderRadius: 999,
          border: 'none',
          background: 'var(--petrol)',
          color: 'var(--paper)',
        }}
      >
        done adding — sort the day
      </button>
    </div>
  );
}
```

`entries` here is a local, display-only echo of what's been typed (so you can see your brain-dump list as you build it) — the actual persisted tasks are created immediately on each `onAdd` call via the real `addTask`, appended at the current bottom of the list, same as any other append.

- [ ] **Step 2: Commit**

```bash
git add src/components/BrainDump.tsx
git commit -m "feat: brain-dump capture step"
```

## Task 6: `MorningFlow` orchestrator and wiring

**Interfaces:**
- `MorningFlow` consumes: `step`, `currentLeftover`, `remaining`, `tasks`, `onResolveLeftover`, `onAddBrainDumpTask`, `onFinishBrainDump`, `onComplete`, `onDrop`, `onReorder`, `onReorderCommit`, `onFinishMerge`.

- [ ] **Step 1: Write `src/components/MorningFlow.tsx`**

```tsx
import type { Task } from '../lib/tasks';
import { LeftoverCard } from './LeftoverCard';
import { BrainDump } from './BrainDump';
import { TaskList } from './TaskList';

interface MorningFlowProps {
  step: 'leftover' | 'braindump' | 'merge';
  currentLeftover: Task | null;
  remaining: number;
  tasks: Task[];
  onResolveLeftover: (keep: boolean) => void;
  onAddBrainDumpTask: (title: string) => void;
  onFinishBrainDump: () => void;
  onComplete: (id: string) => void;
  onDrop: (id: string) => void;
  onReorder: (newOrder: Task[]) => void;
  onReorderCommit: () => void;
  onFinishMerge: () => void;
}

export function MorningFlow(props: MorningFlowProps) {
  const { step } = props;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 10, overflowY: 'auto' }}>
      <p
        style={{
          padding: '16px 24px 0',
          fontFamily: 'var(--font-display)',
          color: 'var(--petrol)',
          textTransform: 'lowercase',
        }}
      >
        start my day
      </p>
      {step === 'leftover' && props.currentLeftover && (
        <LeftoverCard task={props.currentLeftover} remaining={props.remaining} onResolve={props.onResolveLeftover} />
      )}
      {step === 'braindump' && <BrainDump onAdd={props.onAddBrainDumpTask} onDone={props.onFinishBrainDump} />}
      {step === 'merge' && (
        <div style={{ padding: 24 }}>
          <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)' }}>
            drag into the order that matches today.
          </p>
          <TaskList
            tasks={props.tasks}
            onComplete={props.onComplete}
            onDrop={props.onDrop}
            onReorder={props.onReorder}
            onReorderCommit={props.onReorderCommit}
          />
          <button
            onClick={props.onFinishMerge}
            style={{
              position: 'fixed',
              left: 24,
              right: 24,
              bottom: 24,
              padding: '14px 18px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--petrol)',
              color: 'var(--paper)',
            }}
          >
            start the day
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify `src/pages/Today.tsx`** to add the trigger and render the flow

```tsx
import { useTasks } from '../hooks/useTasks';
import { useCompareInsertion } from '../hooks/useCompareInsertion';
import { useMorningFlow } from '../hooks/useMorningFlow';
import { TaskList } from '../components/TaskList';
import { AddBar } from '../components/AddBar';
import { CompareDuel } from '../components/CompareDuel';
import { MorningFlow } from '../components/MorningFlow';

export function Today() {
  const {
    tasks,
    loading,
    addTask,
    completeTask,
    dropTask,
    reorderTasks,
    commitReorder,
    insertTaskAtIndex,
    keepLeftover,
  } = useTasks();

  const { pendingTitle, candidate, active: compareActive, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  const morning = useMorningFlow({ tasks, keepLeftover, dropTask, addTask });

  if (loading) return null;

  if (morning.active) {
    return (
      <MorningFlow
        step={morning.step as 'leftover' | 'braindump' | 'merge'}
        currentLeftover={morning.currentLeftover}
        remaining={morning.remaining}
        tasks={tasks}
        onResolveLeftover={morning.resolveLeftover}
        onAddBrainDumpTask={morning.addBrainDumpTask}
        onFinishBrainDump={morning.finishBrainDump}
        onComplete={completeTask}
        onDrop={dropTask}
        onReorder={reorderTasks}
        onReorderCommit={commitReorder}
        onFinishMerge={morning.finishMerge}
      />
    );
  }

  return (
    <div>
      <TaskList
        tasks={tasks}
        onComplete={completeTask}
        onDrop={dropTask}
        onReorder={reorderTasks}
        onReorderCommit={commitReorder}
        dimmed={compareActive}
      />
      {compareActive && candidate && pendingTitle && (
        <CompareDuel candidate={candidate} newTaskTitle={pendingTitle} onDecide={decide} />
      )}
      <AddBar onAdd={begin} disabled={compareActive} />
      <button
        onClick={morning.start}
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          color: 'var(--stone)',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}
      >
        start my day
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Test it yourself**

First simulate a leftover: in the Supabase Table Editor, pick an existing active task and set its `last_triaged_on` to yesterday's date (e.g. if today is `2026-08-09`, set it to `2026-08-08`).

Run `npm run dev`, sign in, click "start my day" (top right). Confirm:
1. The leftover task appears as a full-screen swipeable card reading "still open · 1 left".
2. Swiping it right (or tapping "keep →") advances to the brain-dump screen; check Supabase — its `last_triaged_on` is now today's date and it's still `status: 'active'`.
3. Repeat the simulation, but this time swipe/tap left ("let it go") — confirm in Supabase the task's `status` became `'dropped'`.
4. On the brain-dump screen, add 2-3 new task titles — each appears in the running list below the input immediately.
5. Click "done adding — sort the day" — you land on the merge screen showing the full current list (kept leftover at top if you kept one, new brain-dump tasks below).
6. Drag to reorder them, then click "start the day" — you're back on the normal Today view with the final order.
7. Refresh — the order and every status change from this flow persisted.

- [ ] **Step 4: Commit**

```bash
git add src/components/MorningFlow.tsx src/pages/Today.tsx
git commit -m "feat: wire up the morning start-my-day flow"
```

## Phase 7 done when

Clicking "start my day" walks you through leftover triage (swipe/tap keep or drop), brain dump (flat capture), and merge (drag to final order), each step's changes persist, and you land back on the normal Today view when finished.

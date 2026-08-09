# Phase 6: The Compare Duel

> Depends on: Phase 5 (reflow/layout animation established via `Reorder.Item`). Read `docs/plans/reflow/00-overview.md`.

**Goal of this phase:** the signature mechanic. Adding a task while 2+ tasks already exist triggers a binary-search "duel" — the new task compared against the list's midpoint, narrowing until its exact rank is found — instead of a plain append. This is the one place amber and the fast (150–200ms) decisive motion appear, per branding.md.

This is the highest-risk logic in the whole app (idea.md flags several of its edge cases as explicitly undecided), so unlike most other phases, the core algorithm gets real test-first treatment before any UI is built.

## Files

- Create: `src/lib/compare.ts`
- Create: `src/lib/compare.test.ts`
- Modify: `src/hooks/useTasks.ts` — add `insertTaskAtIndex`
- Create: `src/hooks/useCompareInsertion.ts`
- Create: `src/components/CompareDuel.tsx`
- Modify: `src/components/TaskList.tsx` — add a `dimmed` prop
- Modify: `src/components/AddBar.tsx` — add a `disabled` prop
- Modify: `src/pages/Today.tsx` — wire the duel in

`[OPEN DECISION]` markers apply to this whole phase — three compare-mechanic edge cases are explicitly undecided in `PRODUCT.md`: a confirmation (or not) when a task lands at the very top/bottom, cancel/skip mid-compare, and a "similar/tie" third option. This phase ships the simplest defensible behavior for each (silent placement, no cancel button, binary-only — no tie option) so the mechanic is usable end to end; `11-open-decisions.md` tracks revisiting them.

## Task 1: The binary-search compare algorithm

**Interfaces:**
- Produces: `startCompare(length: number): CompareState | null`, `narrow(state: CompareState, newTaskWon: boolean): CompareState | { done: true; insertIndex: number }`, the `CompareState` type — consumed by `useCompareInsertion.ts`.

The algorithm is a standard binary insertion search over index positions `[0, length]`. `low`/`high` bound the still-possible insertion index (as a half-open range `[low, high)`); `candidateIndex` (the midpoint) is the task shown to the user. `newTaskWon: true` means the new task is **more urgent** than the candidate, which rules out every insertion index after the candidate.

- [ ] **Step 1: Write the failing tests** — `src/lib/compare.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { startCompare, narrow, type CompareState } from './compare';

describe('startCompare', () => {
  it('returns null for an empty list (skip the mechanic)', () => {
    expect(startCompare(0)).toBeNull();
  });

  it('returns null for a single-item list (skip the mechanic)', () => {
    expect(startCompare(1)).toBeNull();
  });

  it('returns the midpoint candidate for a 15-item list', () => {
    expect(startCompare(15)).toEqual({ low: 0, high: 15, candidateIndex: 7 });
  });
});

describe('narrow', () => {
  it('resolves a 15-item list to index 0 in exactly 4 shown comparisons when the new task always wins', () => {
    let state = startCompare(15) as CompareState;
    const shownCandidates = [state.candidateIndex];
    let result = narrow(state, true);
    while (!('done' in result)) {
      shownCandidates.push(result.candidateIndex);
      state = result;
      result = narrow(state, true);
    }
    expect(shownCandidates).toEqual([7, 3, 1, 0]);
    expect(result).toEqual({ done: true, insertIndex: 0 });
  });

  it('resolves a 15-item list to the bottom in exactly 4 shown comparisons when the new task always loses', () => {
    let state = startCompare(15) as CompareState;
    const shownCandidates = [state.candidateIndex];
    let result = narrow(state, false);
    while (!('done' in result)) {
      shownCandidates.push(result.candidateIndex);
      state = result;
      result = narrow(state, false);
    }
    expect(shownCandidates).toEqual([7, 11, 13, 14]);
    expect(result).toEqual({ done: true, insertIndex: 15 });
  });

  it('places a task in the middle correctly for a mixed sequence on a 7-item list', () => {
    // list indices 0..6, true = new task more urgent than candidate
    let state = startCompare(7) as CompareState; // candidateIndex 3
    let result = narrow(state, true); // more urgent than index 3 -> search [0,3)
    expect(result).toEqual({ low: 0, high: 3, candidateIndex: 1 });
    result = narrow(result as CompareState, false); // less urgent than index 1 -> search [2,3)
    expect(result).toEqual({ low: 2, high: 3, candidateIndex: 2 });
    result = narrow(result as CompareState, true); // more urgent than index 2 -> search [2,2)
    expect(result).toEqual({ done: true, insertIndex: 2 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './compare'`.

- [ ] **Step 3: Write the implementation** — `src/lib/compare.ts`

```ts
export interface CompareState {
  low: number;
  high: number;
  candidateIndex: number;
}

export type CompareResult = CompareState | { done: true; insertIndex: number };

function computeState(low: number, high: number): CompareResult {
  if (low >= high) return { done: true, insertIndex: low };
  const candidateIndex = Math.floor((low + high) / 2);
  return { low, high, candidateIndex };
}

/** Starts a compare-insertion search over a list of the given length. Returns null when the mechanic should be skipped (0 or 1 existing tasks) — PRODUCT.md's explicit edge case. */
export function startCompare(length: number): CompareState | null {
  if (length <= 1) return null;
  const result = computeState(0, length);
  return 'done' in result ? null : result;
}

/** newTaskWon = true means the new task is MORE urgent than the current candidate. */
export function narrow(state: CompareState, newTaskWon: boolean): CompareResult {
  const { low, high, candidateIndex } = state;
  return newTaskWon ? computeState(low, candidateIndex) : computeState(candidateIndex + 1, high);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all `compare.ts` tests plus the existing `ranking.ts` tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/compare.ts src/lib/compare.test.ts
git commit -m "feat: binary-search compare algorithm with tests"
```

## Task 2: `insertTaskAtIndex` on `useTasks`

**Interfaces:**
- Produces (added to the existing hook — every function from Phases 3–5 is unchanged): `insertTaskAtIndex: (title: string, index: number) => Promise<void>`.

- [ ] **Step 1: Modify `src/hooks/useTasks.ts`** — add:

```ts
  async function insertTaskAtIndex(title: string, index: number) {
    if (!session) return;
    const before = index > 0 ? tasks[index - 1].rank : null;
    const after = index < tasks.length ? tasks[index].rank : null;
    const rank = rankBetween(before, after);
    const created = await createTask(session.user.id, title, rank);
    setTasks((prev) => {
      const next = [...prev];
      next.splice(index, 0, created);
      return next;
    });
  }
```

Add `insertTaskAtIndex` to the returned object. Note: `addTask` (plain append, from Phase 3) is **kept, not replaced** — `07-morning-flow.md`'s brain-dump phase needs append-only capture with no compare mechanic, per idea.md ("capture only, no ranking" during brain dump).

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: insert task at a specific index"
```

## Task 3: `useCompareInsertion` orchestration hook

**Interfaces:**
- Consumes: `startCompare`, `narrow` from `src/lib/compare.ts`.
- Produces: `{ pendingTitle: string | null, candidate: Task | null, active: boolean, begin: (title: string) => void, decide: (newTaskWon: boolean) => void }`, consumed by `Today.tsx`.

- [ ] **Step 1: Write `src/hooks/useCompareInsertion.ts`**

```ts
import { useState } from 'react';
import type { Task } from '../lib/tasks';
import { startCompare, narrow, type CompareState } from '../lib/compare';

interface UseCompareInsertionArgs {
  tasks: Task[];
  onInsert: (title: string, index: number) => Promise<void>;
}

export function useCompareInsertion({ tasks, onInsert }: UseCompareInsertionArgs) {
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [state, setState] = useState<CompareState | null>(null);

  function begin(title: string) {
    const initial = startCompare(tasks.length);
    if (!initial) {
      onInsert(title, tasks.length); // 0-1 existing tasks: skip the mechanic entirely
      return;
    }
    setPendingTitle(title);
    setState(initial);
  }

  function decide(newTaskWon: boolean) {
    if (!state || pendingTitle === null) return;
    const result = narrow(state, newTaskWon);
    if ('done' in result) {
      onInsert(pendingTitle, result.insertIndex);
      setPendingTitle(null);
      setState(null);
    } else {
      setState(result);
    }
  }

  const candidate = state ? tasks[state.candidateIndex] : null;

  return { pendingTitle, candidate, active: pendingTitle !== null, begin, decide };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCompareInsertion.ts
git commit -m "feat: compare-insertion orchestration hook"
```

## Task 4: `CompareDuel` UI and wiring

**Interfaces:**
- `CompareDuel` consumes: `candidate: Task`, `newTaskTitle: string`, `onDecide: (newTaskWon: boolean) => void`.
- `TaskList` consumes (added prop): `dimmed?: boolean`.
- `AddBar` consumes (added prop): `disabled?: boolean`.

- [ ] **Step 1: Write `src/components/CompareDuel.tsx`**

```tsx
import { motion, type PanInfo } from 'framer-motion';
import type { Task } from '../lib/tasks';

interface CompareDuelProps {
  candidate: Task;
  newTaskTitle: string;
  onDecide: (newTaskWon: boolean) => void;
}

const SWIPE_THRESHOLD_PX = 80;

export function CompareDuel({ candidate, newTaskTitle, onDecide }: CompareDuelProps) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD_PX) onDecide(true);
    else if (info.offset.x < -SWIPE_THRESHOLD_PX) onDecide(false);
  }

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 76, padding: '0 12px' }}>
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: 'var(--paper)',
          border: '2px solid var(--signal-amber)',
        }}
      >
        <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-body)', color: 'var(--stone)' }}>
          which first?
        </p>
        <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-body)', color: 'var(--graphite)' }}>
          {candidate.title}
        </p>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
          transition={{ duration: 0.175 }}
          style={{
            padding: '14px 18px',
            borderRadius: 14,
            background: 'var(--amber-wash)',
            color: 'var(--graphite)',
            fontFamily: 'var(--font-body)',
            cursor: 'grab',
          }}
        >
          {newTaskTitle}
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <button
            onClick={() => onDecide(false)}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            ← "{candidate.title}" first
          </button>
          <button
            onClick={() => onDecide(true)}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            "{newTaskTitle}" first →
          </button>
        </div>
      </div>
    </div>
  );
}
```

The tap buttons exist alongside the swipe gesture because a mouse-only desktop user shouldn't be forced to drag — both commit the same `onDecide` call.

- [ ] **Step 2: Modify `src/components/TaskList.tsx`** to accept `dimmed`

Add `dimmed?: boolean` to `TaskListProps`, and wrap the returned `Reorder.Group` in a div that applies it:

```tsx
export function TaskList({ tasks, onComplete, onDrop, onReorder, onReorderCommit, dimmed }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-body)', padding: 18 }}>
        nothing on the list yet — add your first task below.
      </p>
    );
  }

  return (
    <div style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 0.2s ease', pointerEvents: dimmed ? 'none' : 'auto' }}>
      <Reorder.Group
        as="div"
        axis="y"
        values={tasks}
        onReorder={onReorder}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, paddingBottom: 96 }}
      >
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onComplete={onComplete} onDrop={onDrop} onReorderCommit={onReorderCommit} />
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
```

(Add `dimmed?: boolean;` to the `TaskListProps` interface above it.)

- [ ] **Step 3: Modify `src/components/AddBar.tsx`** to accept `disabled`

```tsx
import { useState, type FormEvent } from 'react';

interface AddBarProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddBar({ onAdd, disabled }: AddBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title || disabled) return;
    onAdd(title);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        gap: 8,
        padding: 12,
        background: 'var(--paper)',
        borderTop: '1px solid var(--silt)',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="what needs doing?"
        disabled={disabled}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 999,
          border: '1px solid var(--silt)',
          background: 'var(--sand)',
          color: 'var(--graphite)',
          fontFamily: 'var(--font-body)',
        }}
      />
      <button
        type="submit"
        disabled={disabled}
        style={{
          padding: '10px 18px',
          borderRadius: 999,
          border: 'none',
          background: 'var(--petrol)',
          color: 'var(--paper)',
          fontFamily: 'var(--font-body)',
        }}
      >
        add
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Modify `src/pages/Today.tsx`** to wire the duel in

```tsx
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useCompareInsertion } from '../hooks/useCompareInsertion';
import { TaskList } from '../components/TaskList';
import { AddBar } from '../components/AddBar';
import { CompareDuel } from '../components/CompareDuel';

export function Today() {
  const { tasks, loading, completeTask, dropTask, reorderTasks, commitReorder, insertTaskAtIndex } = useTasks();
  const { signOut } = useAuth();
  const { pendingTitle, candidate, active, begin, decide } = useCompareInsertion({
    tasks,
    onInsert: insertTaskAtIndex,
  });

  if (loading) return null;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
        <span style={{ fontFamily: 'var(--font-display)', textTransform: 'lowercase', color: 'var(--petrol)' }}>
          reflow
        </span>
        <button
          onClick={signOut}
          style={{ background: 'none', border: 'none', color: 'var(--stone)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
        >
          sign out
        </button>
      </header>
      <TaskList
        tasks={tasks}
        onComplete={completeTask}
        onDrop={dropTask}
        onReorder={reorderTasks}
        onReorderCommit={commitReorder}
        dimmed={active}
      />
      {active && candidate && pendingTitle && (
        <CompareDuel candidate={candidate} newTaskTitle={pendingTitle} onDecide={decide} />
      )}
      <AddBar onAdd={begin} disabled={active} />
    </div>
  );
}
```

- [ ] **Step 5: Test it yourself**

Run `npm run dev` with 0 tasks. Confirm:
1. Adding the 1st and 2nd tasks append directly — no duel appears (0-1 task skip case).
2. Adding a 3rd task **does** trigger the duel: the list dims, an amber-bordered card appears above the bar showing "which first?", the existing candidate's title, and the new task's title in a draggable amber-wash card.
3. Dragging the new-task card right (or tapping the right-hand "first" button) and confirming the outcome: with only 3 tasks total, one decision should resolve it — the new task lands in the list, the duel closes, the list undims.
4. Add a 4th, 5th, 6th task, each time deliberately picking the new task as more urgent every time — confirm it always ends up at the very top after enough duels.
5. Refresh the page — confirm the final order persisted.
6. In the Supabase Table Editor, spot-check that inserted ranks sit strictly between their neighbors' ranks.

- [ ] **Step 6: Commit**

```bash
git add src/components/CompareDuel.tsx src/components/TaskList.tsx src/components/AddBar.tsx src/pages/Today.tsx
git commit -m "feat: wire up the compare duel"
```

## Phase 6 done when

Adding a task to a list of 2+ triggers the duel, `npm test` passes the full compare-algorithm test suite, swiping or tapping resolves it, the task lands at the mathematically correct position, and the list dims/undims around the duel per the structural brief.

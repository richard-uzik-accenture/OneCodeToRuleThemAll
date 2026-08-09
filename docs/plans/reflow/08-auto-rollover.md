# Phase 8: Automatic Rollover Detection

> Depends on: Phase 7 (morning flow works when manually triggered). Read `docs/plans/reflow/00-overview.md`.

**Goal of this phase:** stop relying on manually clicking "start my day." When the app loads and leftovers exist (from `isLeftover`/`getLeftoverTasks`, Phase 7), show a calm, dismissible prompt instead of the plain button — never force-navigate into the flow, since you might open the app mid-task and not be ready to triage yet. "Nothing silently falls off" (a `PRODUCT.md` principle) is satisfied by the prompt reappearing every time the app loads with leftovers still untriaged, not by forcing the flow.

## Files

- Create: `src/hooks/useRolloverPrompt.ts`
- Modify: `src/pages/Today.tsx` — replace the plain "start my day" button with the conditional prompt

## Task 1: `useRolloverPrompt` hook

**Interfaces:**
- Consumes: `getLeftoverTasks` from `src/lib/triage.ts` (Phase 7).
- Produces: `{ hasLeftovers: boolean, dismissed: boolean, dismiss: () => void }`, consumed by `Today.tsx`.

- [ ] **Step 1: Write `src/hooks/useRolloverPrompt.ts`**

```ts
import { useMemo, useState } from 'react';
import type { Task } from '../lib/tasks';
import { getLeftoverTasks } from '../lib/triage';

export function useRolloverPrompt(tasks: Task[]) {
  const [dismissed, setDismissed] = useState(false);

  const hasLeftovers = useMemo(() => getLeftoverTasks(tasks).length > 0, [tasks]);

  return { hasLeftovers, dismissed, dismiss: () => setDismissed(true) };
}
```

`dismissed` is deliberately local, in-memory state — it resets on every reload. That's the point: a genuine new day (or just reopening the app tomorrow) should prompt again, but dismissing the banner shouldn't need a persisted "don't ask me again" flag. Recomputing `hasLeftovers` from `tasks` on every render (rather than once at mount) means finishing the morning flow makes the banner disappear immediately, without a page reload.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useRolloverPrompt.ts
git commit -m "feat: rollover prompt detection hook"
```

## Task 2: Wire the prompt into `Today.tsx`

- [ ] **Step 1: Modify `src/pages/Today.tsx`**

Add the import and hook call:

```tsx
import { useRolloverPrompt } from '../hooks/useRolloverPrompt';
```

```tsx
  const rollover = useRolloverPrompt(tasks);
```

Replace the existing fixed-position "start my day" text button at the bottom of the component with:

```tsx
      {rollover.hasLeftovers && !rollover.dismissed ? (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            borderRadius: 999,
            background: 'var(--sand)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <button
            onClick={morning.start}
            style={{ background: 'none', border: 'none', color: 'var(--petrol)', cursor: 'pointer', fontWeight: 600 }}
          >
            still open from before — start my day?
          </button>
          <button
            onClick={rollover.dismiss}
            style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
          >
            not now
          </button>
        </div>
      ) : (
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
      )}
```

The plain button never disappears — even with no leftovers, or after dismissing the prompt, you can still start the flow manually (Phase 7's brain-dump-only path handles the zero-leftover case).

- [ ] **Step 2: Test it yourself**

Simulate a leftover again (Supabase Table Editor, set an active task's `last_triaged_on` to yesterday), then:
1. Reload the app — confirm the sand-colored banner appears at the top reading "still open from before — start my day?" instead of the plain text button.
2. Click "not now" — the banner disappears, replaced by the plain "start my day" button; the leftover task is untouched in Supabase (still yesterday's `last_triaged_on`, still active).
3. Reload again — confirm the banner reappears (dismissal doesn't persist across reloads).
4. This time click the banner itself, complete the morning flow (Phase 7's steps) — confirm that once you return to the normal Today view, the banner is gone (no leftovers remain), without needing a reload.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Today.tsx
git commit -m "feat: auto-prompt the morning flow when leftovers exist"
```

## Phase 8 done when

Opening the app with untriaged leftovers shows the calm banner prompt (not a forced redirect), dismissing it works for the current session, and it clears itself the moment the morning flow resolves every leftover.

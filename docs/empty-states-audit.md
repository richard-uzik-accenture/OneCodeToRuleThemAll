# Empty-state audit

Every place in the app that renders a list, section, or screen which can have
zero items. Ordered by priority: no handling today first, high-traffic
screens first.

---

## 1. Today screen — initial load (blank screen)

**File:** [src/pages/Today.tsx:35](src/pages/Today.tsx#L35)

```tsx
if (loading) return null;
```

**Condition:** `loading === true` — true on first mount, and again on every
`reload()` call.

**Current state:** No handling. The entire screen — rail, header, everything —
disappears and shows nothing until tasks finish fetching. This is the
highest-traffic screen in the app (it's the whole app), and this state fires
on every single visit.

**Type:** loading.

**Recommendation:**
- Headline: none — a loading state shouldn't use empty-state copy, it should
  read as "in progress," not "no data." Show a lightweight skeleton of the
  shell (rail + a few placeholder task rows) instead of `null`, so the layout
  doesn't pop in after a delay.
- Supporting text: none.
- Call to action: none.

---

## 2. Rail "up next" glance — nothing queued

**File:** [src/pages/Today.tsx:80-85](src/pages/Today.tsx#L80-L85)

```tsx
{tasks.length > 0 && (
  <div className="rail-glance">
    <span className="rail-glance-label">up next</span>
    <span className="rail-glance-task">{tasks[0].title}</span>
  </div>
)}
```

**Condition:** `tasks.length === 0`.

**Current state:** No handling — the block is omitted entirely, leaving a gap
in the rail with no indication of why.

**Type:** first-use (never added a task) or cleared/completed (finished
everything for the day).

**Recommendation:**
- Headline: "up next" (keep the label, drop the value)
- Supporting text: "nothing queued"
- Call to action: none — the rail isn't where tasks get added; leave the
  add-task FAB as the action surface.

---

## 3. Morning flow merge step — empty list, no FAB on screen

**File:** [src/components/MorningFlow.tsx:68-74](src/components/MorningFlow.tsx#L68-L74), reusing [src/components/TaskList.tsx:16-18](src/components/TaskList.tsx#L16-L18)

```tsx
<TaskList
  tasks={props.tasks}
  onComplete={props.onComplete}
  onDrop={props.onDrop}
  onReorder={props.onReorder}
  onReorderCommit={props.onReorderCommit}
/>
```

```tsx
if (tasks.length === 0) {
  return <p className="empty-state">nothing on the list yet — tap + to add your first task.</p>;
}
```

**Condition:** `props.tasks.length === 0` inside the `'merge'` step — meaning
the user dropped every leftover from yesterday and added nothing during brain
dump.

**Current state:** Present but wrong. `TaskList`'s empty-state message tells
the user to "tap + to add your first task," but the morning-flow overlay has
no `+` FAB anywhere on screen — that control only exists on the main Today
screen underneath. The only real next step (the "start the day" button) isn't
mentioned.

**Type:** cleared/completed (user actively cleared their plate during the
flow, not a first-time user).

**Recommendation:**
- Headline: "nothing carried over, nothing new"
- Supporting text: "a clean slate — head into today empty-handed, or go back and add something."
- Call to action: point at the existing `start the day` button rather than a
  nonexistent `+`. This requires `TaskList` to accept an overridable
  empty-state message (see shared-component recommendation below), since the
  Today-screen usage and the merge-step usage need different copy from the
  same component.

---

## 4. Brain dump — no entries added yet

**File:** [src/components/BrainDump.tsx:34-38](src/components/BrainDump.tsx#L34-L38)

```tsx
<ul className="braindump-list">
  {entries.map((title, i) => (
    <li key={i} className="braindump-entry">{title}</li>
  ))}
</ul>
```

**Condition:** `entries.length === 0` — true on every mount, since `entries`
is local state seeded to `[]` (line 10) each time the brain-dump step opens.

**Current state:** No handling. Renders an empty `<ul>` with no visual
feedback before the user's first entry — just the input and the sub-copy
above it.

**Type:** first-use (guaranteed at the start of every morning-flow brain-dump
step).

**Recommendation:**
- Headline: none needed as a separate block — this is a transient, guaranteed
  state, not a dead end.
- Supporting text: a quiet placeholder under the input, e.g. "nothing added
  yet" in muted styling, so the list area isn't a hard visual gap between the
  form and the "done adding" button.
- Call to action: none — the input above is already the action.

---

## 5. Morning flow leftover step — defensive gap if `currentLeftover` is null

**File:** [src/components/MorningFlow.tsx:54-61](src/components/MorningFlow.tsx#L54-L61)

```tsx
{step === 'leftover' && props.currentLeftover && (
  <LeftoverCard
    key={props.currentLeftover.id}
    task={props.currentLeftover}
    remaining={props.remaining}
    onResolve={props.onResolveLeftover}
  />
)}
```

**Condition:** `step === 'leftover'` while `props.currentLeftover` is `null`.
Not currently reachable — [useMorningFlow.ts](src/hooks/useMorningFlow.ts)
only sets `step` to `'leftover'` when `leftovers.length > 0`, and
`currentLeftover` is `queue[0] ?? null`. But there's no fallback if that
invariant is ever violated (e.g. a future change introduces a race).

**Current state:** No handling. Would render a blank `flow-step-body` — no
card, no way to advance or close except the "close" button in the header.

**Type:** defensive gap, not a real user-facing empty state today.

**Recommendation:** Not a copy problem — a robustness recommendation. Add a
fallback branch that advances to the next step (or closes the flow) if this
combination is ever hit, so the flow can't strand the user on a blank screen.

---

## 6. CompareDuel — zero-length progress

**File:** [src/components/CompareDuel.tsx:69-73](src/components/CompareDuel.tsx#L69-L73)

```tsx
<div className="duel-progress">
  {Array.from({ length: progress.total }, (_, i) => (
    <span key={i} className={`dot ${i < progress.done ? 'done' : i === progress.done ? 'active' : ''}`} />
  ))}
</div>
```

**Condition:** `progress.total === 0`.

**Current state:** No internal guard — would render an empty `<div>` with no
dots. Not currently reachable: `CompareDuel` only mounts when
`useCompareInsertion` has already skipped the 0/1-task case (documented in
[src/lib/compare.ts](src/lib/compare.ts) as an explicit product edge case), so
`progress.total` is always ≥ 1 in practice.

**Type:** defensive gap, not a real user-facing empty state today.

**Recommendation:** Not a copy problem. Optionally add an internal guard so
the component doesn't silently trust the caller, but low priority given it's
unreachable today.

---

## 7. Tag suggestions dropdown — no matches

**File:** [src/components/TagInput.tsx:87-104](src/components/TagInput.tsx#L87-L104)

```tsx
const suggestions = suggestTags(known, query, value);
const showSuggestions = query.length > 0 && suggestions.length > 0;
...
{showSuggestions && (
  <ul className="tag-suggest" id="tag-suggest-listbox" role="listbox" aria-live="polite">
    {suggestions.map((tag, i) => ( ... ))}
  </ul>
)}
```

**Condition:** `query.length > 0 && suggestions.length === 0` — user typed a
tag query that matches no known tags.

**Current state:** Handled by omission — the dropdown just doesn't appear.
Not broken, but gives no feedback distinguishing "no tags match" from "no
known tags exist yet."

**Type:** no-results.

**Recommendation (low priority, cosmetic):**
- Headline: none — inline, not a full empty state.
- Supporting text: a single muted row, "no matching tags — press enter to add
  as new."
- Call to action: implicit (pressing enter already creates the tag).

---

## 8. Today screen — bare zero counts

**File:** [src/pages/Today.tsx:78](src/pages/Today.tsx#L78), [94](src/pages/Today.tsx#L94), [126](src/pages/Today.tsx#L126)

```tsx
<span className="count">{tasks.length} today</span>
...
<span className="count-chip">{tasks.length} today</span>
...
<p className="list-sub">{tasks.length} thing{tasks.length === 1 ? '' : 's'}, in order.</p>
```

**Condition:** `tasks.length === 0`.

**Current state:** Technically correct — renders "0 today" / "0 things, in
order." — but reads as a bare number rather than a deliberate empty moment,
especially next to item 3's actual empty-state message right below it.

**Type:** first-use / cleared-completed.

**Recommendation (optional polish, not a structural gap):** When
`tasks.length === 0` and the day has existing completed tasks (a genuine
"cleared/completed" zero-inbox moment vs. a brand-new account), consider
swapping "0 today" for something like "all clear" as a small celebratory
touch. Low priority — the existing `TaskList` empty-state message (item 3
above) already carries the main messaging load here.

---

## Already handled correctly (no action needed)

Included for completeness — these are legitimate empty conditions that are
already handled well:

- **[useMorningFlow.ts](src/hooks/useMorningFlow.ts) leftover-step skip** —
  when there are no leftover tasks from a previous day
  (`leftovers.length > 0` is false), the flow skips straight to brain dump
  instead of showing an empty leftover screen.
- **[useMorningFlow.ts](src/hooks/useMorningFlow.ts) leftover-queue
  exhaustion** — resolving the last leftover (`rest.length === 0`)
  transitions to the next step automatically.
- **[useRolloverPrompt.ts](src/hooks/useRolloverPrompt.ts) /
  Today.tsx:117-124** — the "still open from before" banner only renders when
  `hasLeftovers` is true; correctly hidden otherwise.
- **[useCompareInsertion.ts](src/hooks/useCompareInsertion.ts) + [lib/compare.ts](src/lib/compare.ts)**
  — the compare-duel mechanic is explicitly skipped for 0 or 1 existing
  tasks, documented in `compare.ts` as a deliberate product decision, and
  falls back to direct insertion.
- **[TagInput.tsx](src/components/TagInput.tsx) empty tag list** — when a
  task has no tags yet, the input's own placeholder ("add a tag") communicates
  the empty state without a separate element.
- **Today.tsx error banner** ([src/pages/Today.tsx:102-116](src/pages/Today.tsx#L102-L116))
  — correctly guarded on `error` truthiness, with dismiss action.

---

## Shared component recommendation

Build one small `EmptyState` component rather than continuing to hand-roll
this per screen. Today there's a single ad hoc pattern — the `.empty-state`
CSS class ([src/styles/global.css:245](src/styles/global.css#L245)) applied
only inside `TaskList` — and items 1, 2, 3/4, and 6 above all need the same
shape: a headline, an optional one-line supporting sentence, and an optional
call-to-action button. Building it once avoids four slightly-different inline
implementations and fixes the copy-mismatch bug in item 3/4 directly, since
`TaskList` could accept an `emptyState` override prop instead of hardcoding
its message.

Suggested shape:

```tsx
interface EmptyStateProps {
  headline: string;
  supportingText?: string;
  action?: { label: string; onClick: () => void };
}
```

Place it in `src/components/` alongside the existing UI pieces (e.g.
`EmptyState.tsx`), styled off the existing `.empty-state` class rather than
introducing new tokens.

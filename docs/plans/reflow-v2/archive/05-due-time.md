# Feature E — Optional due time

**Complaint:** sometimes a task needs a remembered due time. It should **not** appear in the morning flow or leftover flow — only on the today view, via edit.

**Goal:** an optional due-time field, editable only from the today-view edit modal, shown as a quiet mono time chip on the row. When the time passes, it shifts to a neutral `was 2pm` marker — no coral, no badge, no reorder, no guilt (honors the no-"overdue" brand rule).

> Depends on the shared foundations in [00-overview.md](00-overview.md) and the `TaskModal` from Feature B.

## Data model

Migration `0002_task_fields.sql` adds `due_time time` (nullable). `Task.due_time: string | null` (ISO `"14:00"` / `"14:00:00"`). `updateTask` accepts `due_time`; passing `null` clears it.

Deliberately **not** in `addTask`/`insertTaskAtIndex`/brain-dump — a task is born without a due time and only gains one via edit, exactly as `features.md` requires. This also keeps the compare/capture path unchanged.

## Time formatting (pure, unit-tested)

`src/lib/dueTime.ts`:
```ts
export function formatDueTime(due: string | null): string | null   // "14:00" -> "2pm" / "2:30pm"; null -> null
export function isPast(due: string | null, now = new Date()): boolean  // compares against today's clock
export function dueLabel(due: string | null, now = new Date()): string | null  // "2pm" or "was 2pm"
```
`src/lib/dueTime.test.ts`: on-the-hour vs. half-past formatting, midnight/noon edge cases, `isPast` around the boundary, `dueLabel` prefix flip. Uses an injected `now` so tests are deterministic.

## Edit modal field

In `TaskModal` (edit mode only): a due-time row — a native `<input type="time">` (best mobile picker + free a11y) with a "clear" affordance and a "no time" default. Label: "due time (optional)". Mono font for the value to match the `ranks/times/durations` typographic rule in `branding.md`.

## Row display

`TaskRow` renders `dueLabel(task.due_time)` as a mono chip when present:
- Upcoming: `--dusk` text, `--mist` chip — `2pm`.
- Passed: quieter `--haze`-toned text, same chip — `was 2pm`. No color escalation, **no coral**, position unchanged.
- Absent: nothing.

Re-evaluate `isPast` on a light interval (e.g. a 60s tick already cheap for a personal list) or on focus/visibility change so a chip flips to `was` without a reload — but never reorders the list.

## Styling

- `.due-chip` — `--font-mono`, tabular figures, ~11px, pill, `--mist` bg. `.due-chip.past` swaps text to a quieter tone only.
- Sits alongside tag chips in the row's meta line; both are subordinate to the title.

## Brand check

- No "overdue," no red, no coral, no count, no sort change. "was 2pm" is neutral past-tense, matching the tone table ("still open," not "overdue").

## Deliverables checklist

- [x] Migration column + type + `updateTask` wiring (shared foundation).
- [x] `dueTime.ts` + `dueTime.test.ts` (tests first).
- [x] Edit-modal time field (edit mode only; absent in add mode and every morning/leftover surface).
- [x] Row chip with upcoming/passed states; no reordering; reduced-motion safe (chip flip is a color change, not motion).

## Test it yourself

1. Edit a task, set `14:00`, save → `2pm` chip on the row. Confirm no due-time field appears in the **add** modal, the brain dump, or the leftover flow.
2. Set a time already in the past (or mock `now`) → chip reads `was 2pm`, no color/position change.
3. Clear the time → chip disappears. `npm test` — `dueTime.test.ts` passes.

# Phase 03 — Rail "up next" empty state

Source: audit item 2. Depends on [01-shared-empty-state-component.md](01-shared-empty-state-component.md).

## Problem

[src/pages/Today.tsx:80-85](../../../src/pages/Today.tsx#L80-L85) omits
the rail-glance block entirely when `tasks.length === 0`, leaving a gap
in the rail with no explanation.

## Work

- When `tasks.length === 0`, render the rail-glance block with:
  - Headline: `"up next"` (keep the existing label)
  - Supporting text: `"nothing queued"`
  - No action (rail isn't the add-task surface).
- Use the `EmptyState` component from phase 01, or inline the two lines
  if using the full component feels heavier than warranted for this
  small a slot — use judgment, but stay consistent with how phase 04
  ends up wiring it.

## How to manually verify

- Clear all tasks for the day (complete/drop everything) and confirm the
  rail shows "up next / nothing queued" instead of a gap.
- Add a task and confirm the rail reverts to showing the real next task.

## Deliverables

- [x] Rail shows "up next / nothing queued" when `tasks.length === 0`.
- [x] Rail reverts correctly once a task exists.
- [x] Manually confirmed both states.

## Notes

Inlined directly (reused existing `.rail-glance-label`/`.rail-glance-task`
classes) rather than routing through the `EmptyState` component — this is
a two-line micro-slot with no action, not a section.

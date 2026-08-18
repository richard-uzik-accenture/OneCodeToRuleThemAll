# Phase 04 — TaskList empty-state override + morning-flow merge copy fix

Source: audit item 3. Depends on [01-shared-empty-state-component.md](01-shared-empty-state-component.md).

## Problem

[src/components/TaskList.tsx:16-18](../../../src/components/TaskList.tsx#L16-L18)
hardcodes `"nothing on the list yet — tap + to add your first task."` for
every empty case. [src/components/MorningFlow.tsx:68-74](../../../src/components/MorningFlow.tsx#L68-L74)
reuses `TaskList` for the merge step, but that step has no `+` FAB on
screen — the copy points at a control that doesn't exist there. The only
real next step in the merge step is the "start the day" button below the
list.

## Work

- Add an optional `emptyState?: EmptyStateProps` (or equivalent) prop to
  `TaskList`. When provided, render it instead of the hardcoded message;
  fall back to the current default copy when omitted, wrapped in the new
  `EmptyState` component so both call sites go through the same shape.
  - Default (Today screen usage): keep current message, or restate as
    `EmptyState` with headline/supporting text split — use judgment on
    whether the existing single-sentence copy needs splitting into
    headline + supporting text, since the audit didn't mandate rewording
    the Today-screen default.
- In `MorningFlow.tsx`'s `'merge'` step, pass an override:
  - Headline: `"nothing carried over, nothing new"`
  - Supporting text: `"a clean slate — head into today empty-handed, or go back and add something."`
  - Action: point at the existing `start the day` button/handler
    (`props.onFinishMerge`) rather than a nonexistent `+`.

## How to manually verify

- Today screen, all tasks cleared: confirm default empty-state message
  still shows (unchanged behavior).
- Morning flow: drop every leftover and add nothing in brain dump, reach
  the merge step — confirm it now shows "nothing carried over, nothing
  new" with the clean-slate copy and a working action instead of the old
  "tap + to add" message.
- Confirm the action button in the merge-step empty state actually
  advances/finishes the flow like the "start the day" button does.

## Deliverables

- [x] `TaskList` accepts an `emptyState` override prop, defaults to current behavior when omitted.
- [x] Morning-flow merge step passes the corrected copy + working CTA.
- [x] Manually confirmed both the Today-screen default and the merge-step override.

## Notes

Deviated from the plan on one point: did not add an action button to the
merge-step empty-state override. The merge step already renders a
persistent "start the day" button (`merge-cta`) below the list regardless
of whether it's empty — adding the same action to the `EmptyState` too
would have shown two identical "start the day" buttons stacked when the
list is empty. The audit's intent ("point at the existing start the day
button") is satisfied by the always-present button; the empty-state block
only carries the headline/supporting copy.

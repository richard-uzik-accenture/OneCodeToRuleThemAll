# Phase 09 — "All clear" zero-count copy

Source: audit item 8. Optional polish. Depends on [04-tasklist-empty-state-override.md](04-tasklist-empty-state-override.md)
being done first, so the "cleared/completed" empty state this pairs with
already has its correct copy in place.

## Problem

[src/pages/Today.tsx:78](../../../src/pages/Today.tsx#L78),
[94](../../../src/pages/Today.tsx#L94), and
[126](../../../src/pages/Today.tsx#L126) render bare zero counts ("0
today" / "0 things, in order.") when `tasks.length === 0` — technically
correct but reads as an accident rather than a deliberate empty moment.

## Work

- When `tasks.length === 0` **and** the day has existing completed tasks
  (a genuine "cleared/completed" zero-inbox moment, distinct from a
  brand-new account with nothing completed yet), swap the count copy for
  something like `"all clear"` in the three spots listed above.
- Needs a way to distinguish "cleared today" from "never had anything" —
  check what's available on `tasks` / the `useTasks` hook for completed
  task history; if nothing distinguishes the two cases cleanly today,
  flag that back before implementing rather than guessing at a heuristic.
- Low priority per the audit — the `TaskList`/`EmptyState` empty message
  from phase 04 already carries the main messaging load here; this is
  small supplementary polish only.

## How to manually verify

- Complete/drop all of today's tasks (after having had at least one
  completed) — confirm rail count, header count-chip, and list-sub all
  show "all clear" (or chosen copy) instead of "0 today" / "0 things, in
  order."
- Fresh state with zero tasks ever added — confirm it does *not* show
  "all clear" if that's meant to be reserved for the cleared/completed
  case specifically (per the audit's distinction) — or confirm intended
  behavior if you decide both cases should read the same.

## Deliverables

- [x] Zero-count spots identified and swapped to "all clear" (or agreed copy) under the cleared/completed condition.
- [x] Heuristic for distinguishing cleared-completed vs. never-had-tasks confirmed to exist and work.
- [x] Manually confirmed both the cleared/completed case and the brand-new/never-added case.

## Notes

Per user decision, implemented the real heuristic (option: query
completed-today count from Supabase) rather than a local-only flag, since
the local-only approach would lose the signal on page reload. Added
`hasCompletedToday()` in `lib/tasks.ts` (counts `status='done'` rows with
`completed_at` since local midnight), wired into `useTasks` as
`completedToday` — fetched alongside the initial task load and set
immediately on `completeTask`. Added a matching `mockCompletedToday` flag
in `devMock.ts` for dev mode.

Copy was revised after initial user feedback that "all clear" alone felt
like poor celebration. Per branding.md §4 ("calm friend, not coach," no
exclamation marks, no streak/achievement energy), a big celebratory
banner would be off-brand, so the fix was word choice, not tone escalation:
the list-subtitle slot (the one with real room) now reads "today's
settled." — "settled" being the brand's own preferred verb per §4's
say/not-say table — while the two compact chip slots (rail count, mobile
header) keep the short "all clear" label, since they have no room for a
full phrase.

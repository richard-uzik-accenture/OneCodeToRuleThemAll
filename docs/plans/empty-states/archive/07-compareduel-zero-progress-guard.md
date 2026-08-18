# Phase 07 — CompareDuel zero-progress guard

Source: audit item 6. Low priority, optional robustness fix.

## Problem

[src/components/CompareDuel.tsx:69-73](../../../src/components/CompareDuel.tsx#L69-L73)
has no guard for `progress.total === 0` — would render an empty
progress-dot `<div>`. Not reachable today: `CompareDuel` only mounts when
`useCompareInsertion` has already skipped the 0/1-task case (a documented,
deliberate product decision in [src/lib/compare.ts](../../../src/lib/compare.ts)).

## Work

- Optional: add an internal guard in `CompareDuel` so it doesn't silently
  trust the caller — e.g. render nothing or a minimal fallback if
  `progress.total === 0`. Given this is unreachable today and explicitly
  low priority in the audit, keep the change minimal or skip it if you'd
  rather not spend a task slot on it.

## How to manually verify

- Not reachable through normal UI flow. If you add the guard, verify at
  the code level that it handles `progress.total === 0` sanely (no crash,
  no visibly broken render) — force the prop value temporarily if you want
  a visual check, then remove the forcing code.

## Deliverables

- [x] Decision made: guard added, or explicitly skipped as not worth it.
- [x] If added, manually confirmed it doesn't break the normal (≥1) rendering path.

## Notes

Skipped, per user decision. The invariant is already enforced one layer up
in `compare.ts`'s `startCompare` (returns `null` for `length <= 1`,
explicitly documented as PRODUCT.md's edge case) and `Today.tsx` only
mounts `CompareDuel` when `active && candidate && pendingTitle`. A
redundant guard here would be defensive padding for genuinely unreachable
code, not worth a task cycle. No code changes made.

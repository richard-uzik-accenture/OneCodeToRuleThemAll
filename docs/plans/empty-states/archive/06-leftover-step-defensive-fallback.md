# Phase 06 — Leftover-step defensive fallback

Source: audit item 5. Robustness fix, not a copy change.

## Problem

[src/components/MorningFlow.tsx:54-61](../../../src/components/MorningFlow.tsx#L54-L61)
renders nothing if `step === 'leftover'` while `props.currentLeftover` is
`null` — not reachable today (verified: [useMorningFlow.ts](../../../src/hooks/useMorningFlow.ts)
only sets `step` to `'leftover'` when `leftovers.length > 0`, and
`currentLeftover` is `queue[0] ?? null`), but there's no fallback if that
invariant is ever violated, which would strand the user on a blank
`flow-step-body` with only the header "close" button available.

## Work

- Add a fallback branch in `MorningFlow.tsx`: if `step === 'leftover'` and
  `currentLeftover` is null, either auto-advance to the next step or close
  the flow — pick whichever is simpler given the existing step-transition
  helpers already on `props` (e.g. reuse whatever `useMorningFlow` exposes
  for advancing, or fall back to `props.onClose`).
- This is a defensive guard for an unreachable-today state — keep the
  change small, don't restructure `useMorningFlow`'s invariants to "prove"
  it's unreachable.

## How to manually verify

- This state isn't reachable through normal UI flow today, so verification
  is code-level: confirm the fallback branch exists and, if you can force
  the condition (e.g. via a temporary React DevTools state override or a
  brief manual code tweak to simulate `currentLeftover = null` while on the
  leftover step), confirm the flow advances/closes instead of showing a
  blank body. Remove any temporary forcing code before considering this
  done.

## Deliverables

- [x] Fallback branch added for `step === 'leftover'` + `currentLeftover === null`.
- [x] Manually confirmed (via forced/simulated state) that it advances or closes instead of blanking.

## Notes

Implemented as a `useEffect` in `MorningFlow.tsx` that calls `props.onClose()`
when `step === 'leftover'` and `currentLeftover` is falsy — closes the flow
rather than advancing, since `MorningFlow` has no prop for "advance past
leftover" independent of `resolveLeftover`. Verified by temporarily forcing
`currentLeftover: null` unconditionally in `useMorningFlow.ts`'s return value;
confirmed the flow self-closes in the same tick (no blank screen, no stuck
overlay) when the invariant is violated, then reverted the forcing code.
Also re-verified the normal (non-forced) leftover path still works correctly
afterward.

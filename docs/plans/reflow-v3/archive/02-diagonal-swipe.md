# Phase 02 — Allow diagonal / curved "lazy" swipes

## The issue (from `features.md`)

> swiping does not work good enough, make it possible to swipe diagonals. The problem is that if you swipe with mouse or finger, you have to move in horizontal lines, but this is not how people hold their phones. With a thumb you tend to go in curved lines. Is it possible to allow swiping in non-straight lines for both directions to allow lazy swiping?

## What's actually happening

Both swipe surfaces constrain the drag to a single horizontal axis:

- `src/components/CompareDuel.tsx:51` — `drag="x"`
- `src/components/LeftoverCard.tsx:24` — `drag="x"`

With `drag="x"`, framer-motion **locks the pointer to the x-axis**: the card only follows horizontal pointer movement and ignores vertical movement entirely. A curved thumb arc (which has real vertical travel) feels like it's "fighting" the card because the vertical component is dropped and the horizontal component of a diagonal flick is smaller than a straight one — so a lazy diagonal swipe often fails to cross the horizontal threshold.

Both handlers already **decide** purely on `info.offset.x`:

- `CompareDuel.handleDragEnd`: `info.offset.x > 80` / `< -80`
- `LeftoverCard.handleDragEnd`: `info.offset.x > 100` / `< -100`

So the *decision* logic is already axis-correct. The only problem is the *movement* constraint. The fix is to let the card move freely in 2D (follow the thumb's real curved path) while still deciding on horizontal displacement.

## The fix

For **both** cards, change `drag="x"` → `drag` (free 2D drag) and adjust `dragConstraints` so the card returns to origin. Keep deciding on `offset.x`. Concretely:

- `drag` (unconstrained axis).
- `dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}` with `dragElastic={0.6}` — the card follows the finger elastically in all directions and springs back to center on release, exactly as it does today horizontally, but now it doesn't reject the vertical component of a curved swipe.
- Decision stays on `info.offset.x` with the same thresholds. **Do not** add a vertical decision — the product vocabulary is strictly left/right binary; vertical travel is only there so the gesture feels natural, it must not mean anything.

Because the decision is horizontal-only, a mostly-vertical drag with little horizontal travel correctly does nothing (returns to center) — which is the desired "that wasn't a real left/right swipe" behaviour.

### Optional refinement (include it — it directly serves "lazy swiping")

To make lazy diagonal flicks register even when the *ending offset* is small (a fast curved flick that snaps back), also honour **velocity** at drag end, matching common swipe-card UX:

```
const SWIPE_VELOCITY = 500; // px/s
function decideFrom(info: PanInfo): 1 | -1 | null {
  const past = (v: number) => Math.abs(v) > SWIPE_THRESHOLD_PX;
  const fast = (v: number) => Math.abs(v) > SWIPE_VELOCITY;
  if (info.offset.x > SWIPE_THRESHOLD_PX || (info.velocity.x > SWIPE_VELOCITY && info.offset.x > 0)) return 1;
  if (info.offset.x < -SWIPE_THRESHOLD_PX || (info.velocity.x < -SWIPE_VELOCITY && info.offset.x < 0)) return -1;
  return null;
}
```

This means a quick lazy flick that only travels ~50px but moves fast still commits. Apply the same helper shape to both cards (thresholds differ: 80 for the duel, 100 for leftovers — keep those as-is).

## Deliverables

- [x] `CompareDuel.tsx`: change `drag="x"` → `drag`, extend `dragConstraints` to lock all four sides (`{ left:0, right:0, top:0, bottom:0 }`), keep `dragElastic={0.6}`.
- [x] `CompareDuel.tsx`: decide via a small helper that uses `offset.x` **and** `velocity.x` (threshold 80, velocity 500). Preserve existing `commit(true/false)` calls and exit animation.
- [x] `LeftoverCard.tsx`: same two changes (threshold 100, velocity 500), preserving `onResolve(true/false)`.
- [x] Keep `touch-action: none` on `.swipe-card` and `.leftover-card` (already set in `global.css`) — free drag needs the browser to *not* claim vertical pan, so this must stay.
- [x] Confirm the exit animation direction is still driven by the horizontal decision (left card flies left, right flies right) — no change to `EXIT_DISTANCE_PX` logic.

## Explicitly out of scope

- No change to thresholds' left/right meaning, the progress dots, hint buttons, or copy.
- No vertical semantics — up/down never decides anything.
- Do **not** touch the task-list long-press reorder drag (`useLongPressDrag` / `TaskRow`). That is `pan-y` and is a different gesture; it is phase 05's territory.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`. The dev mock should surface a compare duel (add a task when ≥2 exist) and, if leftovers are seeded, a leftover card.
2. In DevTools device toolbar (touch emulation on), **or** on a real phone:
   - Swipe the compare card in a **curved diagonal arc** up-and-right → it should follow your finger's arc and commit as "sooner".
   - Same arc down-and-left → commits as "later".
   - A quick short diagonal **flick** right → commits (velocity path).
   - A mostly-vertical drag with almost no horizontal travel → card springs back, **no** decision (correct).
3. Repeat all four on the leftover card (keep / let it go).
4. Regression: the hint buttons (`← no, later` / `yes, sooner →`) still commit; the exit animation still flies the correct direction; reduced-motion users are unaffected (no new animation added).

## Risk / atomicity note

Touches only two presentational swipe components; no data, hooks, or shared state. If reverted, behaviour returns to horizontal-only. The velocity helper is pure and can carry a tiny Vitest unit test if you extract `decideFrom(offset, velocity, threshold)` into a shared `src/lib/swipe.ts` — optional but recommended, since it's the only new logic in the phase.

# Phase 01 — Swipe physics: resistance, axis, armed threshold, momentum

Fixes audit findings **1, 2, 3, 4, 5, 9**. This is the phase that actually
addresses "the swiping doesn't feel smooth on mobile." It is purely about feel —
no colour, no layout, no new elements. It ships and is judged on its own.

## What's wrong today

`src/components/CompareDuel.tsx`, the `DuelCard` component:

```tsx
<motion.div
  className="duel-card"
  drag                       // ← no dragElastic, no dragConstraints, no axis
  dragMomentum={false}
  style={{ x, y, rotate }}
  ...
  whileDrag={{ scale: 1.03 }}
/>
```

1. **Weightless (finding 1).** A bare `drag` prop tracks the pointer 1:1, in both
   axes, unbounded. The card can be dragged 800px off-screen and just sits there.
   Nothing tells the thumb a threshold exists until it has already been crossed.
   Progressive resistance is what is perceived as quality in a swipe deck; its
   absence is the single biggest cause of the "amateur" feeling.
2. **Vertical is fully free (finding 2).** This is a horizontal decision, but `y`
   has as much freedom as `x`. A slightly diagonal thumb flick sends the card
   wandering upward, and because `.duel-card` sets `touch-action: none`
   (`global.css:616`) the browser's own scroll arbitration is gone, so a misread
   gesture has nowhere to go. Reads as "loose", not "responsive".
3. **Invisible threshold (finding 3).** Stamps ramp `40→130px`
   (`CompareDuel.tsx:93-94`) but commit fires at `SWIPE_THRESHOLD_PX = 80`. At the
   exact moment the card would commit the stamps are at ~45% opacity and nothing
   else changes. The user learns the threshold by *failing* to cross it.
4. **Tween exit (finding 4).** `commit()` animates on a fixed bezier with a
   duration clamped to 0.16–0.30s. Modulating duration by speed is a good
   instinct, but a tween re-imposes its own easing on top of the velocity you
   already had — the card decelerates on exit no matter how hard it was thrown.
5. **Inert ghosts (finding 5).** `.duel-ghost` elements animate only when the
   `ghosts` *count* changes. The stack never reacts to the drag, so it reads as a
   background image rather than physical objects.
6. **Twitch commit (finding 9).** `decideSwipe` commits on velocity with only
   `offsetX > 0` as a guard, so a fast 5px graze commits an **irreversible**
   ranking decision — there is no undo on this screen.

## The fix

### A. Resistance and axis (findings 1, 2)

Constrain the drag to a zero-size box and let elasticity do the work:

```tsx
const dragConstraintsRef = useRef<HTMLDivElement>(null); // the .duel-stack element

<motion.div
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
  dragElastic={{ left: 0.55, right: 0.55, top: 0.15, bottom: 0.15 }}
  dragDirectionLock
  dragMomentum={false}
  ...
/>
```

- `dragConstraints` as a zero box + `dragElastic` gives framer-motion's built-in
  rubber-band: near-1:1 close to centre, increasingly lagging as you pull away.
  `0.55` on x keeps the card clearly followable while making the threshold
  *palpable*; `0.15` on y makes vertical travel possible but visibly discouraged.
- `dragDirectionLock` resolves the axis after a few px of intent, which kills the
  diagonal-wander problem without banning diagonal thumb paths outright.

> **Do not** switch to `drag="x"`. reflow-v3 phase 02 deliberately made swipe
> accept diagonal/curved "lazy" thumb paths; `drag` + direction-lock + tight
> vertical elastic preserves that while removing the wander. Re-read
> `docs/plans/reflow-v3/archive/02-diagonal-swipe.md` before touching this if it
> has been archived.

### B. The armed state (finding 3) — the highest-value change

Make the commit point *visible and felt* before it fires. Add a latched armed
direction derived from `x`:

```tsx
const [armed, setArmed] = useState<0 | 1 | -1>(0);

useMotionValueEvent(x, 'change', (latest) => {
  const next = Math.abs(latest) >= SWIPE_THRESHOLD_PX ? (latest > 0 ? 1 : -1) : 0;
  setArmed((prev) => {
    if (prev === next) return prev;
    if (next !== 0) navigator.vibrate?.(8); // fires once per crossing, not per frame
    return next;
  });
});
```

Latching on the state setter is what keeps the haptic to **one tick per
crossing** — this must not fire per animation frame.

Then align the visual ramp to the threshold so the signal is complete exactly when
the decision is:

```tsx
// was [40, 130] → [0, 1]; the ramp must finish AT the threshold, not past it
const soonerOpacity = useTransform(x, [20, SWIPE_THRESHOLD_PX], [0, 1], { clamp: true });
const laterOpacity  = useTransform(x, [-SWIPE_THRESHOLD_PX, -20], [1, 0], { clamp: true });
```

Phase 02 dresses the armed state (border colour, label pop). Phase 01 only needs
to prove the state exists and the haptic tick lands at the right moment — a
temporary `outline` is acceptable to verify it, but remove it before the phase is
marked done.

### C. Momentum-continuous exit (finding 4)

Replace the tween in `commit()` with a velocity-seeded spring so the exit
*continues* the gesture:

```tsx
const exitVelocity = Math.abs(velocityX) < 600 ? direction * 1200 : velocityX;

animate(x, direction * (window.innerWidth + 240), {
  type: 'spring',
  velocity: exitVelocity,
  stiffness: 260,
  damping: 32,
  restDelta: 20,          // don't spend frames settling on an off-screen target
  onComplete: () => onResolved(direction === 1),
});
```

- The `< 600` floor is what makes the **button** path (which passes no velocity)
  still fling properly rather than crawling.
- `restDelta: 20` matters: the target is off-screen, so without it the spring
  burns frames resolving sub-pixel precision nobody can see, delaying
  `onResolved`.
- Keep the reduced-motion path as a near-instant tween — see E.

### D. Live ghost stack (finding 5)

Derive the ghosts from the live card's `x` instead of only its count. The live
card owns `x`, so lift `x` into `CompareDuel` (or pass a shared motion value down)
and drive each ghost with `useTransform`:

```tsx
const progress = useTransform(x, (v) => Math.min(1, Math.abs(v) / SWIPE_THRESHOLD_PX));
// per ghost i (0 = nearest):
const scale = useTransform(progress, [0, 1], [1 - 0.04 * (i + 1), 1 - 0.04 * i]);
const yOff  = useTransform(progress, [0, 1], [10 * (i + 1), 10 * i]);
```

The nearest ghost rises toward the live card's resting position as you drag, so
the deck breathes with the gesture. Two lines, disproportionate payoff.

> **Restructure note:** `x` currently lives inside `DuelCard`. Hoisting it to
> `CompareDuel` and passing it in is the cleanest route and keeps the per-comparison
> `key` remount behaviour intact — but the motion value must then be **reset to 0**
> when the comparison changes, or a committed card leaves a stale offset for the
> next one (the existing `key={...}` comment at `CompareDuel.tsx:51-53` exists
> precisely to prevent this). Reset it in the same effect that clears `armed`.

### E. Reduced motion

`useReducedMotion` already gates rotation and duration. Extend it consistently:

- Elastic/direction-lock stay on (they are *behaviour*, not decoration).
- The exit becomes a short tween (~0.1s), not a spring.
- Ghost transforms collapse to their static values.
- The armed haptic still fires — it is feedback, not motion.

### F. The twitch guard (finding 9)

`src/lib/swipe.ts` — require real travel alongside velocity:

```ts
const SWIPE_VELOCITY_PX_S = 500;
const MIN_VELOCITY_TRAVEL_PX = 24;

export function decideSwipe(offsetX: number, velocityX: number, thresholdPx: number): 1 | -1 | null {
  if (offsetX > thresholdPx) return 1;
  if (offsetX < -thresholdPx) return -1;
  if (velocityX > SWIPE_VELOCITY_PX_S && offsetX > MIN_VELOCITY_TRAVEL_PX) return 1;
  if (velocityX < -SWIPE_VELOCITY_PX_S && offsetX < -MIN_VELOCITY_TRAVEL_PX) return -1;
  return null;
}
```

The current version already requires velocity and offset to share a *sign*, but it
accepts any non-zero offset — so intent is inferred from direction alone, with no
evidence the user actually moved the card. Requiring a minimum travel on the
matching side makes direction and intent agree by construction.

## Deliverables

- [ ] `swipe.ts`: add `MIN_VELOCITY_TRAVEL_PX = 24` and restructure `decideSwipe`
      so the velocity branches require travel on the matching side.
- [ ] **New** `src/lib/swipe.test.ts` covering: past-threshold both directions;
      under-threshold no-commit; fast flick with ≥24px travel commits; fast flick
      with 5px travel does **not** commit; velocity and offset disagreeing in sign
      does not commit; exact-threshold boundary behaviour.
- [ ] `CompareDuel.tsx`: add `dragConstraints` (zero box), `dragElastic`
      (`0.55` x / `0.15` y) and `dragDirectionLock`.
- [ ] `CompareDuel.tsx`: hoist `x` to `CompareDuel` (or otherwise share it), and
      reset it to `0` on comparison change so no stale offset survives a commit.
- [ ] `CompareDuel.tsx`: add the latched `armed` state with a single
      `navigator.vibrate(8)` per threshold crossing.
- [ ] `CompareDuel.tsx`: re-map `soonerOpacity`/`laterOpacity` to finish at
      `SWIPE_THRESHOLD_PX`, not at 130px.
- [ ] `CompareDuel.tsx`: replace the tween exit in `commit()` with a
      velocity-seeded spring incl. the `< 600` floor for the button path and
      `restDelta`.
- [ ] `CompareDuel.tsx`: drive `.duel-ghost` scale/y from drag progress via
      `useTransform`.
- [ ] Thread `reducedMotion` through every new animated value (exit tween, ghost
      transforms); confirm a decision is still completable with reduced motion on.
- [ ] Remove any temporary debug styling used to verify the armed state.
- [ ] `npm run test` and `npm run lint` pass.
- [ ] Verified on a real phone (`npm run dev -- --host`) — not DevTools emulation.

## Explicitly out of scope

- No colour, shadow, ground or label changes — that is phase 02. If the armed
  state needs a visual to be verifiable, use a throwaway outline and delete it.
- Do not change `SWIPE_THRESHOLD_PX` (80) or `MAX_GHOSTS` (2) without a real-device
  reason; 80px is a sane thumb distance and re-tuning it invalidates the audit.
- Do not touch `compare.ts` / `useCompareInsertion.ts` — the binary-search
  ranking maths and step accounting are correct and unrelated.
- Do not add an undo affordance. Finding 9 is fixed by not firing on a twitch;
  an undo mechanic is a product decision, not a polish fix.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev -- --host`, open the Network URL on a phone.
2. Add a task with `+` so the duel opens with ≥4 seeded tasks (multi-step compare).
3. **Resistance:** drag slowly right. The card should follow closely near centre
   and visibly lag behind your thumb past ~40px. It must feel like it is pulling
   back, and it must never be draggable to an arbitrary distance.
4. **Armed threshold:** drag slowly past ~80px. You should feel **one** short
   haptic tick at the crossing, and the decision signal should be at full
   strength there — not still fading in. Drag back under, then over again: exactly
   one tick per crossing, never a buzz.
5. **Axis:** flick diagonally (a natural lazy thumb arc). The card must commit
   horizontally and barely deviate vertically — but the diagonal gesture must
   still *work*, not be rejected.
6. **Momentum:** hard-flick vs. slow-push-past-threshold. The hard flick must
   leave noticeably faster and further; the slow push must still read as
   deliberate. They must not look the same.
7. **Ghost stack:** while dragging, watch the card behind — it should rise and
   scale up as you approach the threshold, and settle back if you release short.
8. **Twitch guard (finding 9):** graze the card fast with ~5px of travel. Nothing
   must commit. Repeat several times.
9. **Buttons:** tap `← later` and `sooner →`. Each must play the same fling as a
   swipe (this is the `< 600` velocity floor), and commit exactly once.
10. **Reduced motion:** enable it at OS level. The duel must still be completable,
    the card must not rotate, and the exit must be near-instant.
11. Regression: complete a full multi-step insertion and confirm the task lands at
    the right rank, `placed as #n today` appears, and the progress dots advance.

## Risk / atomicity note

Confined to `CompareDuel.tsx` and `swipe.ts` (+ its new test). The only structural
change is hoisting `x`, which carries a real regression risk — a stale drag offset
leaking into the next comparison. That risk is exactly what the existing
`key={candidate.id}:${progress.done}` remount guards against, so **verify step 11
specifically**: run several consecutive comparisons and confirm each new card
starts perfectly centred.

Phase ships alone and is independently valuable: if 02/03 are never built, this
still fixes most of the reported problem.

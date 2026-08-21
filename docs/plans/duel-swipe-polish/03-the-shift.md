# Phase 03 — "The shift": the bar-stack that reorders under your thumb

This is the phase that makes the chosen direction *itself*. Everything before it
was correction; this adds the idea.

The card carries the logo's own three-bar stack, and **the middle bar shifts as
you drag** — the mark performs the exact mechanic the screen is asking about. At
the moment of decision, the thing you are looking at is a ranked list with one row
actively moving past the others, which is the literal definition of the brand mark
(`branding.md` §1: *"reads as a list in the act of reordering"*).

**Depends on phases 01 and 02** — bar travel is a function of the drag progress
value from 01, and bar colour latches to the armed direction from 01. Building it
on the un-fixed physics would tie a precise animation to a card that does not
track the thumb properly.

## Reference

Variant **C** in the audit artifact demonstrates the intended behaviour — drag it
before implementing:
<https://claude.ai/code/artifact/10a2211b-7ddf-4fd8-ab33-6ae9ef78e40f>

## The concept

Above the task title, three rounded bars — the mark's own geometry:

```
   ▬▬▬▬▬▬        top bar     (still)
  ▬▬▬▬▬▬▬▬       middle bar  (the task being placed — moves with your thumb)
   ▬▬▬▬▬▬        bottom bar  (still)
```

- The **middle bar is the task being ranked**. It translates horizontally with the
  drag, widens slightly as the decision firms up, and takes the decision colour
  when armed.
- The **outer bars are the existing list** — they drift very slightly the *opposite*
  way (~14% of the middle bar's travel), which reads as the list making room. They
  never take colour.
- At rest the stack is inert (`branding.md` §6: *"nothing moves unless you move
  it"* — no idle animation, no pulsing).

This is why C was worth choosing over A: it is the one direction that could not
belong to any other product.

## The fix

### A. The bar-stack element

Add a small presentational component — `src/components/DuelBars.tsx` — or an inline
block inside `DuelCard`. Prefer a component: it keeps `CompareDuel.tsx`, which
phase 01 already grew, from getting harder to read.

Geometry follows the mark (`branding.md` §1 / `icons/Mark.tsx`), not arbitrary
values:

- Three bars, `border-radius` fully rounded (the mark uses `rx=10` on a `20`-tall
  bar — i.e. pill).
- Outer bars narrower than the middle one at rest, so the middle reads as the
  active row even before it moves.
- Resting colour `--haze`; the stack must be quiet enough that the **title stays
  the primary element on the card**.

```tsx
interface DuelBarsProps {
  progress: MotionValue<number>;   // 0→1, from phase 01
  direction: MotionValue<number>;  // -1→1 signed travel
  armed: 0 | 1 | -1;
  reducedMotion: boolean;
}
```

### B. Motion

Driven entirely by motion values — **no React re-render per frame**, matching the
existing comment at `CompareDuel.tsx:87-89`:

| Element | Transform | Range |
|---|---|---|
| Middle bar | `translateX` | `direction × 16px` |
| Middle bar | `width` | `+10px` from rest → armed |
| Outer bars | `translateX` | `direction × -2.2px` (≈14%, opposite) |
| Middle bar | `background` | `--haze` → decision colour when armed |

Use `useTransform` on the shared progress/`x` values from phase 01. Do **not**
introduce a second source of truth for drag position.

### C. Colour discipline

- Middle bar armed **sooner** → `--signal-coral`. Armed **later** → `--violet`.
- Un-armed but moving → a neutral mid-tone (between `--haze` and `--dusk`) so
  there is a sense of "warming up" without spending coral early.
- **Coral only at the decision** (`branding.md` §2) — the bar may not be coral at
  rest, and only one bar is ever coloured.
- No red/green pair, ever.

### D. Reduced motion

Bars do not translate. They still take the decision colour when armed, so the
signal survives; the movement does not.

### E. Accessibility

The stack is decorative — it restates the drag state, it does not carry unique
information. Mark it `aria-hidden`. The accessible path to a decision remains the
`← later` / `sooner →` buttons, unchanged.

## Deliverables

- [ ] `src/components/DuelBars.tsx`: three-bar stack, geometry derived from the
      mark (pill radius, middle bar wider), resting colour `--haze`.
- [ ] Bar styles in `global.css` alongside the other `.duel-*` rules.
- [ ] Middle bar: `translateX` and `width` driven by phase 01's motion values via
      `useTransform` — no per-frame React state.
- [ ] Outer bars: counter-drift at ~14% of the middle bar's travel.
- [ ] Middle bar colour latches to `armed` (coral = sooner, violet = later);
      neutral mid-tone while moving un-armed; `--haze` at rest.
- [ ] `DuelBars` rendered inside `DuelCard` above the title, `aria-hidden`.
- [ ] Confirm the title remains the visually dominant element on the card — if the
      bars compete, reduce their contrast, not the title's.
- [ ] Reduced motion: no translation, colour still changes.
- [ ] Verify the card's vertical composition still fits the smallest supported
      viewport without the title wrapping badly (`.duel-stack` is
      `height: min(38vh, 280px)`) — check a long task title on a small phone.
- [ ] `npm run lint` passes; `npm run test` still green.
- [ ] Verified on a real phone.

## Explicitly out of scope

- The bars are **decorative and derived** — they must not become a second input.
  No tapping/dragging the bars directly.
- Do not animate the bars at rest, on mount, or on card entry (`branding.md` §6).
- Do not apply this stack anywhere else in the app (task rows, morning flow,
  leftovers). It is a decision-moment device; reusing it everywhere would do to the
  mark exactly what over-using coral would do to the accent.
- Do not revisit phase 01 physics values or phase 02 colours to accommodate the
  bars.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev -- --host`, open on a phone, add a task.
2. **At rest:** the stack is still and quiet. Nothing pulses. The title is clearly
   the main thing on the card.
3. **Drag right slowly:** the middle bar tracks your thumb, the outer bars drift
   slightly left, and at the threshold the middle bar snaps to coral as the haptic
   tick fires. All three signals — bar colour, label, border — must land on the
   *same* frame as the tick.
4. **Drag left:** same, in violet.
5. **Release short:** everything returns to rest with the card's spring-back — the
   bars must not lag behind the card or settle at a different time.
6. **Watch for competition:** at full drag, check the card does not look busy —
   bars, label, border and shadow are all signalling at once. If it reads as noisy,
   the bars are too strong; reduce them.
7. **Long title:** seed a task with a long title and confirm the card still
   composes on a small viewport.
8. **Reduced motion:** bars hold still, colour still communicates the decision.
9. Regression: full insertion flow completes and ranks correctly.

## Risk / atomicity note

Purely additive and self-contained — a new decorative component reading existing
motion values. Nothing depends on it, so it can be reverted alone if it does not
land.

The real risk is **visual noise**, not breakage: by this phase the card is
signalling the same decision four ways at once. Deliverable 7 ("confirm the title
remains dominant") and test step 6 exist specifically to catch that, and the
correct response is to quiet the bars rather than to remove the phase-02 signals
that are doing accessible work.

# Phase 02 — Card presence: ground, elevation, and decision labels

Fixes audit findings **6, 7, 8**. Phase 01 fixed the hand; this fixes the eye.
It makes the card read as an *object sitting on a surface* rather than a bordered
div, and replaces the borrowed Tinder stamps with marks from the project's own
icon system.

**Depends on phase 01** — the armed state and the threshold-aligned opacity ramp
introduced there are what the label and border treatments below hook into.

## What's wrong today

### Finding 6 — the card is the same colour as the screen behind it

```css
.duel-screen { background: var(--paper); }   /* global.css:553 */
.duel-card   { background: var(--paper); }   /* global.css:612 */
```

Paper on paper, separated only by a 1px `--haze` hairline and a very soft shadow.
The card has no presence — this is the main reason it looks plain in a still
screenshot.

Direction **C ("the shift")** keeps the **light** ground — the dark ink-violet
field was option B and was **not** chosen. So the separation must come from
recessing the ground instead:

```css
.duel-screen { background: var(--mist); }   /* was --paper */
.duel-card   { background: var(--paper); }  /* unchanged — now the only paper surface */
```

`--mist` (`#F0EEF5`) is already the token for raised/divider surfaces; using it as
the duel ground inverts the relationship so the card is the lit thing. The ghosts
stay paper-on-mist too, which is what makes the stack read as a stack.

### Finding 7 — one flat shadow at one elevation

```css
box-shadow: 0 22px 44px -20px rgba(23, 19, 53, 0.34);   /* global.css:614 */
```

A single wide shadow with no contact layer. And `whileDrag={{ scale: 1.03 }}`
scales the card without changing its shadow at all, so the lift reads as a zoom
glitch rather than the card leaving the surface.

### Finding 8 — the stamps are borrowed, not designed

```css
.duel-stamp { border: 2.5px solid currentColor; ... }
.duel-stamp.sooner { transform: rotate(-11deg); }
.duel-stamp.later  { transform: rotate(11deg); }
```

The rotated outline badge is the single most recognisable Tinder cliché, and it is
the one element on this screen that does not come from the project's own icon
system. `branding.md` §5 says every mark should be constructible from the two
atoms — the rounded bar (*a task*) and the chevron (*the verb*). The stamps ignore
that completely.

## The fix

### A. Recess the ground (finding 6)

- `.duel-screen` background → `var(--mist)`.
- `.duel-card` stays `var(--paper)`; keep the `--haze` hairline (it still does work
  against mist, just less of it).
- Check `.duel-action` buttons, which are currently `background: var(--paper)` on
  a paper ground — on mist they will now read as raised pills, which is correct;
  confirm they do not fight the card for attention.
- Check `.placed-confirmation` (rendered right after the duel closes) still reads
  correctly against the new ground.

### B. Two-layer, lift-responsive elevation (finding 7)

Resting state — a tight contact shadow plus a wide ambient one:

```css
.duel-card {
  box-shadow:
    0 3px 8px -6px rgba(23, 19, 53, 0.16),
    0 18px 40px -18px rgba(23, 19, 53, 0.30);
}
```

Then make elevation respond to both **lift** and **travel**. Since phase 01
already exposes drag progress as a motion value, drive the shadow from it rather
than hardcoding a `whileDrag` shadow:

```tsx
const shadow = useTransform(progress, [0, 1], [
  '0 3px 8px -6px rgba(23,19,53,0.16), 0 18px 40px -18px rgba(23,19,53,0.30)',
  '0 9px 20px -6px rgba(23,19,53,0.26), 0 42px 76px -18px rgba(23,19,53,0.48)',
]);
```

> **Perf note:** animating `box-shadow` is not compositor-accelerated. If this
> costs frames on a mid-range Android during the drag, switch to a stacked
> pseudo-element (or a sibling `motion.div`) whose **opacity** is animated instead
> — opacity is cheap and visually equivalent here. Measure before optimising, but
> treat a dropped-frame regression as a blocker: phase 01's whole point was smooth.

Keep `whileDrag={{ scale: 1.03 }}` — with the shadow now spreading, the scale
finally reads as a lift.

### C. Chevron decision labels (finding 8)

Replace `.duel-stamp` with labels built from the mark's own geometry, set in the
product's lowercase voice, **un-rotated**:

```
‹ later                                        sooner ›
```

- The chevron is the icon system's "verb" atom: 24px grid, **1.75px stroke**,
  round caps and joins (`branding.md` §5). Reuse `src/components/icons/ChevronLeft.tsx`
  and mirror it for the right side rather than hand-rolling new path data.
- Colours stay **coral = sooner**, **violet = later** (`branding.md` §2 — never a
  red/green pair).
- Type: `--font-mono`, lowercase, matching the existing `letter-spacing: 0.04em`.
  The mono is deliberate — `branding.md` §3 reserves it for "precision where
  precision is the point", and the decision is exactly that.
- **Motion:** each label slides in from its own edge as you drag toward it, driven
  by the phase-01 opacity ramp so it reaches full strength exactly at the
  threshold. On `armed`, it locks to full opacity with a slight scale pop
  (~1.06) — this is the visual half of the armed signal whose haptic half phase 01
  already built.

### D. Dress the armed state (completes finding 3)

With `armed` available from phase 01:

- Card border takes the decision colour — `--signal-coral` when armed sooner,
  `--violet` when armed later — replacing the `--haze` hairline for that moment.
- Return to `--haze` the instant it disarms.
- **No glow, no gradient.** `branding.md`'s exception clause scopes the pointer-
  reactive edge light to pre-login surfaces only and names the compare/duel as
  explicitly excluded. A border colour change is the whole effect.

## Deliverables

- [ ] `global.css`: `.duel-screen` background → `var(--mist)`.
- [ ] `global.css`: `.duel-card` resting `box-shadow` → two-layer (contact +
      ambient).
- [ ] `global.css`: verify `.duel-ghost` still reads as a stack against mist;
      adjust its shadow/border only if it now disappears.
- [ ] `global.css`: confirm `.duel-action` pills and `.placed-confirmation` still
      read correctly on the new ground.
- [ ] `CompareDuel.tsx`: drive card elevation from drag progress (or the
      opacity-animated stand-in if `box-shadow` costs frames — record which was
      used and why).
- [ ] `CompareDuel.tsx` + `global.css`: replace `.duel-stamp` markup and styles
      with chevron-led `‹ later` / `sooner ›` labels; delete the rotated-badge CSS
      (`global.css:637-652`) entirely rather than leaving it dead.
- [ ] Reuse/mirror `icons/ChevronLeft.tsx` for the label chevrons — do not
      hand-author new path data or add an icon library.
- [ ] `CompareDuel.tsx`: apply the armed border colour (coral/violet) and the
      label scale pop; revert cleanly on disarm.
- [ ] Confirm `aria-hidden` is retained on the decorative labels and that the
      `← later` / `sooner →` buttons remain the accessible path to a decision.
- [ ] Reduced-motion: labels appear without sliding; no scale pop; colours still
      change.
- [ ] `npm run lint` passes; `npm run test` still green.
- [ ] Verified on a real phone in daylight — the mist/paper separation is subtle
      and must be checked on a real screen, not a colour-managed desktop monitor.

## Explicitly out of scope

- **Do not implement option B (ink-violet ground).** It was the recommended
  option but **C was chosen**; a dark duel screen is a different direction, not a
  refinement of this one.
- No bar-stack on the card yet — that is phase 03.
- Do not add glow, gradient, or `BorderGlow` to this screen (`branding.md`,
  exception clause).
- Do not restyle `.duel-question`, `.duel-progress` dots, or the action pills
  beyond confirming they still read on the new ground.
- Do not change any physics values from phase 01.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev -- --host`, open on a phone, add a task.
2. **Presence:** at rest, the card must read as sitting *above* the screen. Compare
   against `git stash`-ing the change — the difference should be obvious, not
   subtle-to-the-point-of-pointless.
3. **Lift:** press and hold without moving. The shadow should deepen and spread as
   the card scales; it must read as picking something up.
4. **Travel:** drag toward the threshold and watch the shadow continue to grow —
   the card visibly leaves the surface as it goes.
5. **Labels:** drag right — `sooner ›` slides in from the left edge in coral and is
   at full strength exactly when the haptic tick fires. Drag left — `‹ later` in
   violet. Never both at once.
6. **Armed border:** at the threshold the card's hairline takes the decision
   colour; release short and it returns to `--haze` immediately.
7. **Frame rate:** with DevTools Performance recording on a throttled CPU, drag
   continuously for ~5s. No sustained dropped frames. If the shadow animation is
   the cause, switch to the opacity stand-in per the perf note.
8. **Reduced motion:** labels still communicate the decision without sliding.
9. Regression: the full insertion flow still completes and ranks correctly.

## Risk / atomicity note

Mostly CSS plus one markup swap, so low logic risk — but the ground change touches
the whole duel screen's colour relationships, so every element on it needs a
glance, not just the card. The `box-shadow` animation is the one real performance
risk; the opacity stand-in is a known-good fallback and choosing it is not a
failure.

Phase 02 is visually coherent on its own: if phase 03 is never built, the screen
is still finished and on-brand.

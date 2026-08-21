# Duel swipe polish — physics, then "the shift"

Rebuilds how the compare duel's card **feels** in the hand, then re-dresses it as
option **C — "the shift"**: the card carries the logo's own bar-stack, and the bars
physically reorder as you drag, so the mark performs the mechanic it describes.

## Source of the work

Forensic audit of `CompareDuel.tsx`, `swipe.ts` and the `.duel-*` block of
`global.css` (2026-08-20). Nine findings, ranked by contribution to the reported
"cards are plain, not modern, very amateur" feeling. The audit's own verdict:
**the cards are fine — the physics are what feel amateur.** Findings 1–5 are
about the hand, 6–8 about the eye, 9 is a small correctness bug.

Direction **C** was chosen over A (quiet paper) and B (ink field).

## The findings, mapped to phases

| # | Sev | Finding | Phase |
|---|---|---|---|
| 1 | feel | Card is weightless — `drag` with no `dragElastic`/`dragConstraints` | 01 |
| 2 | feel | Vertical drag fully free, fights the page and the browser | 01 |
| 3 | feel | Threshold invisible until it fires (stamps only ~45% at commit) | 01 |
| 4 | feel | Fling exit is a tween — hard flick ≈ slow push | 01 |
| 5 | feel | Ghost cards are inert scenery | 01 |
| 9 | feel | Velocity commit can fire on a 5px twitch | 01 |
| 6 | look | Card is the same colour as the screen behind it | 02 |
| 7 | look | One flat shadow at one elevation, never responding to lift | 02 |
| 8 | look | Rotated outline stamps are borrowed (Tinder), not from the icon system | 02 |
| — | — | The bar-stack that reorders as you drag (option C's actual identity) | 03 |

## Phases

| # | Phase | Plan file | Type |
|---|---|---|---|
| 01 | Swipe physics — resistance, axis, armed threshold, momentum, live stack | [01-swipe-physics.md](01-swipe-physics.md) | interaction |
| 02 | Card presence — ground, two-layer shadow, chevron decision labels | [02-card-presence.md](02-card-presence.md) | visual |
| 03 | "The shift" — the bar-stack that reorders under your thumb | [03-the-shift.md](03-the-shift.md) | visual/motion |

## Order is a dependency chain, not a suggestion

**01 → 02 → 03.** Unlike reflow-v3, these are *not* independent:

- **02 needs 01.** The chevron decision labels (finding 8) are driven by the
  armed-threshold state that phase 01 introduces. Building them first means
  building them twice.
- **03 needs 01.** The bars reorder as a function of normalized drag progress and
  latch to the armed direction — both created in 01.
- **01 ships alone and is worth shipping alone.** If 02/03 are ever dropped, phase
  01 still fixes most of the reported problem. Land and verify it on a real phone
  before starting 02.

## Global constraints (inherited, still binding)

- **Coral only at the decision.** The duel is one of the three sanctioned coral
  moments (`branding.md` §2). Coral may appear on the *armed* state and the sooner
  side — never as a resting fill, never on both sides, never as a gradient or glow
  on a light surface.
- **No red/green pair.** The two sides stay **coral (sooner) vs violet (later)**.
- **"Fast to decide"** (`branding.md` §6): the compare is the 150–200ms moment.
  Nothing added here may make committing feel slower than it does today.
- **Light haptic on commit** stays a single `navigator.vibrate(10)`. Phase 01 adds
  exactly one more haptic — an 8ms tick when the threshold arms — and no more.
- **No glow.** `BorderGlow` is scoped pre-login only and `branding.md`'s exception
  clause explicitly forbids extending it to the compare/duel.
- **Icon system** (`branding.md` §5): new marks are built from the two atoms — the
  rounded bar (*a task*) and the chevron (*the verb*) — on a 24px grid, 1.75px
  stroke, round caps.
- **`useReducedMotion` is threaded through every new animated surface.** Reduced
  motion must still be able to complete a decision.

## Verification contract

Each phase ends with **"Test it yourself"** runnable under `VITE_DEV_MODE=true`
(no Supabase needed). Because this is a touch-feel problem, every phase requires a
pass on a **real phone** via `npm run dev -- --host` — DevTools touch emulation
does not reproduce thumb resistance or haptics and is not sufficient sign-off.

Pure logic (`swipe.ts`'s commit rule) gets a Vitest test. Everything else is a
gesture check.

## Reference

The audited prototypes — all three directions, live and draggable, running the
corrected physics — are at:
<https://claude.ai/code/artifact/10a2211b-7ddf-4fd8-ab33-6ae9ef78e40f>

Phase 03's bar behaviour is demonstrated by variant **C** on that page; drag it to
see the intended reorder before implementing.

## Done convention (from CLAUDE.md §5)

A phase is done when every `- [ ]` in its file is checked. Move completed files to
`docs/plans/duel-swipe-polish/archive/`. Archive `00-overview.md` once all phases
are done.

---
target: whole app (Landing, Auth, Today + morning flow + compare duel)
total_score: 19
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 2
timestamp: 2026-08-09T23-07-52Z
slug: e-app-landing-auth-today-morning-flow-compare-duel
---
Method: dual-agent (A: ad51a80b86abbdef3 · B: ad49b256de402936d)
⚠️ Assessment B partial degradation: no browser automation tool was available this session, and Today/MorningFlow/CompareDuel sit behind a live Supabase auth gate with no dev-bypass, so B could not screenshot or interact live — it substituted exhaustive source-grep evidence per its documented fallback path. Assessment A's own browser attempt hit the same wall; its findings are also source-grounded. Treat all findings below as code-verified, not visually confirmed live — high confidence, since both assessments independently converged on identical facts (0 hover/active states outside Landing/Auth, 0 framer-motion micro-interaction props anywhere in `src/`), but no live screenshot exists yet.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | **1/4** | Complete/drop/add/reorder-commit mutate state with zero transitional feedback anywhere outside Landing/Auth. |
| 2 | Match Between System and Real World | 3/4 | Brand voice copy ("let it go," "still open," "settled") matches the mental model well. |
| 3 | User Control and Freedom | 2/4 | No undo for drop or complete; both read as permanent, instant removals. |
| 4 | Consistency and Standards | 2/4 | Same swipe gesture uses different copy/iconography in LeftoverCard vs CompareDuel; check/close icons have no shared state styling. |
| 5 | Error Prevention | 2/4 | Drop is one tap/swipe with no confirmation; Auth has only basic required-field validation. |
| 6 | Recognition Rather Than Recall | 3/4 | Step indicator and duel progress dots are effective recognition aids. |
| 7 | Flexibility and Efficiency of Use | 2/4 | One keyboard shortcut (FAB); no undo, no list keyboard nav, no bulk actions. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Reads as under-filled, not restrained — literal empty regions on desktop rail and duel/flow overlays. |
| 9 | Error Recovery | 2/4 | Auth errors get brand-voice copy but no field-level indication or icon. |
| 10 | Help and Documentation | n/a | Single-user personal tool; not applicable. |

**Total: 19/36 (renormalized to 9 scored heuristics) — 53% → Acceptable band**, trending toward Poor on heuristic 1 specifically, which is the crux of the user's complaint.

## Design Specificity Verdict

**LLM assessment**: Token-level specificity is real and executed faithfully — ink-violet palette, coral confined correctly to decision moments, lowercase wordmark, tabular mono for ranks, and especially copy voice ("let it go," "settled," "which first?") all match `branding.md` without drifting into generic SaaS language. But specificity stops at tokens. Composition, state design, and motion choreography — the parts of the brand doc that describe *how the app should feel to operate*, not just how it should look — were not carried through. The result is a correctly-skinned generic list app: the paint is bespoke, the behavior underneath is a bare CRUD list.

**Deterministic scan**: `detect.mjs --json src public` returned clean (exit 0, `[]`). This is expected and not reassuring — the detector checks HTML/CSS rule-engine patterns (contrast, banned gradients, generic slop patterns), not React runtime interaction state, so it has nothing to say about missing hover/active/exit-animation coverage. Assessment B's source-grep is the real signal here: **16 distinct interactive classes across the app have zero hover/active/focus/transition CSS treatment** (`.check`, `.close`, `.fab`, `.modal-cancel`, `.modal-submit`, `.leftover-hint`, `.braindump-add`, `.braindump-done`, `.swipe-hint`, `.flow-exit`, `.merge-cta`, `.rollover-prompt`, `.rollover-dismiss`, `.rail-action`, `.rail-signout`, `.auth-switch`), versus **4 classes that do** (`.landing-cta`, `.auth-back`, `.auth-input`, `.auth-submit`) — all four confined to Landing/Auth. Framer-motion is a dependency; grep found **zero** occurrences of `whileHover`/`whileTap`/`whileFocus`/`animate`/`initial`/`exit` anywhere in `src/`. The two `transition=` props that do exist (`TaskRow.tsx:28`, `CompareDuel.tsx:35`) govern layout-spring and drag-duration physics only, not press/hover/removal feedback. This proves the pattern was known (Landing/Auth) and simply not propagated to the app's actual daily-use surface.

**Visual overlays**: Not available this run — no browser automation tool was exposed in this session, and the app's core screens (Today, MorningFlow, CompareDuel) sit behind a live Supabase auth gate with no dev-bypass or mock session, so neither assessment could render or interact with them live. All findings are source-code-verified (file:line evidence), not screenshot-confirmed. Both assessments converged independently on identical facts despite running in isolation, which is strong corroboration, but you should expect the actual visual severity to be at least as bad as described, likely worse once seen live (missing animation reads worse in motion than in a code diff).

## Overall Impression

The mechanics, IA, and brand tokens are genuinely well done — this isn't a case of bad decisions, it's a case of unfinished execution. Every interaction the user named (clicks, drags, swipes, checking off, the "x") independently confirmed to have **zero** visual feedback treatment outside the marketing/auth shell. The single biggest opportunity: the app already imports framer-motion and already uses it correctly for layout physics (drag, reorder spring) — the gap isn't tooling, it's that `whileTap`/`whileHover`/`exit` variants were never added to the actual task-list interactions, and CSS state pseudo-classes stop existing past the Auth screen. This is a well-scoped, mechanical fix, not a redesign.

## What's Working

1. **The compare-duel's information architecture** — `CompareDuel`/`useCompareInsertion` isolates exactly one decision at a time with progress dots giving genuine "almost there" signal. This is the one place composition and mechanic reinforce each other.
2. **Copy voice execution** — "let it go," "still open," "which first?," "settled" — every string matches the brand doc's tone table with zero drift into generic SaaS language ("Delete", "Task completed!"). Real craft, just invisible without motion to deliver it.
3. **Mono rank/date typography on desktop** — the one place typography does semantic work (precision signaling) rather than decoration, matching the brand doc's stated principle directly.

## Priority Issues

**[P0] Core list interactions give zero feedback — validates the "weak feedback" complaint at its most-repeated surface.**
Why it matters: `.check` and `.close` (every task, every day) have no hover/active/focus-visible state anywhere in `global.css`; `completeTask`/`dropTask` remove rows from state synchronously and `TaskRow` never declares `exit`/`initial`/`animate` props despite being wrapped in `AnimatePresence` — so the row just vanishes on next render. This directly contradicts the brand doc's own spec ("soft fade and collapse, never a shake") and gives no payoff for "settled."
Fix: add `whileHover`/`whileTap` scale or background-shift (150-200ms) to `.check`/`.close`/`.fab`; give `TaskRow` real `initial`/`exit` variants (`opacity`, `height`, `marginBottom`) so `AnimatePresence` has something to animate; add `:focus-visible` outlines everywhere (currently none exist on any icon button in the app).
Suggested command: `/impeccable polish`

**[P0] The compare duel — the app's signature mechanic — has no commit/resolution feedback.**
Why it matters: brand doc explicitly calls this "the one high-energy moment," reserves coral-in-motion exclusively for it, and specifies a light haptic-adjacent pulse on commit. None of that exists: the overlay just stops rendering when a decision resolves, no card-exit-in-swipe-direction, no coral flash, no "placed as #N" confirmation when the comparison loop ends. For the one moment the brand deliberately allows to feel decisive, it currently resolves as silently as everything else.
Fix: animate the swipe-card's exit in the committed direction with a brief coral-tinted trail (150-200ms per the doc's own timing spec); on final placement, show a brief confirmation state before returning to the list.
Suggested command: `/impeccable animate`

**[P1] Desktop layout has literal unfilled voids, not intentional breathing room.**
Why it matters: `.today-rail` (240px) is mostly a `flex:1` spacer with two text links — an empty sidebar, not composed restraint. The centered `240px + 560px` grid leaves large untouched margins on wide viewports with no visual anchoring. `.duel-overlay` is `position: fixed; inset: 0` and fully occludes the list beneath it rather than dimming through it, producing a soft gradient void with nothing connecting it to the content it's interrupting. This is what "reads as unfinished, not clean" concretely looks like.
Fix: either give the rail a purposeful module (e.g. a compact "today at a glance" summary) or narrow it; let the duel/flow overlays dim the list through a scrim instead of fully occluding it so the empty space reads as focus-mode rather than a void.
Suggested command: `/impeccable layout`

**[P1] No pending/error feedback on any async mutation — correctness risk, not just polish.**
Why it matters: `completeTask`, `dropTask`, `commitReorder`, `addTask`, `insertTaskAtIndex`, `keepLeftover` all call Supabase with no try/catch and no failure surfacing; local state updates optimistically regardless of server result. On the flaky mobile connections this multi-device tool explicitly targets, a failed action will look like it worked, then silently diverge on reload.
Fix: wrap mutations in try/catch; roll back local state and show a brief inline error on failure. The optimistic pattern itself is right and matches "fast to decide" — silent failure is the actual defect.
Suggested command: `/impeccable harden`

**[P2] Drag-and-drop has no pickup/hold affordance.**
Why it matters: this is exactly the "dragging... has no visual feedback" complaint. `Reorder.Item` has no `whileDrag` scale/shadow lift; the 350ms long-press-to-drag timer on touch gives zero visual charging cue during the hold window, so users can't tell whether their press registered before the item suddenly starts moving.
Fix: add `whileDrag={{ scale: 1.02, boxShadow: ... }}`; add a subtle press-progress ring/pulse keyed to the long-press timer.
Suggested command: `/impeccable delight`

## Persona Red Flags

**Alex (power user, daily heavy use)**: No undo on drop/complete means a mis-swipe during a 15-item leftover triage has no recovery except manual re-entry — this directly breaks the product principle "re-planning must be low-effort enough to survive real interruptions." Silent failure on network hiccups compounds daily for a user who touches this every morning.

**Casey (distracted, mobile, mid-interruption)**: The zero-feedback long-press-to-drag is the single highest-risk item for this persona — no charging cue means accidental drags or abandoned holds. The duel's silent resolution is also worse here: a hurried user swiping through 4 comparisons can't be sure a swipe registered before the next card appears, since there's no exit animation confirming direction.

**The interrupted planner (project-specific — mid-task, glancing at phone between meetings)**: This persona needs the highest confidence of all that an action landed, because they're context-switching rapidly and can't afford to double-check. Right now every core action (complete, drop, reorder, add) gives them nothing beyond "the item is now gone/present" — for a tool whose entire premise is staying usable *during* interruption, this persona is the one most directly harmed by the missing-feedback gap.

## Minor Observations

- `LeftoverCard` and `CompareDuel` duplicate near-identical swipe-drag logic with different magic-number thresholds (100px vs 80px) — worth unifying into a shared `SwipeCard` regardless of the feedback fix, and would let a rotate/tint-while-dragging effect (genuinely "Tinder-style," currently absent) be added once instead of twice.
- `.rail-signout` (haze-on-paper, ~1.3:1 contrast) likely fails WCAG AA text contrast (4.5:1 minimum) — worth a real contrast check.
- `Auth.tsx`'s error box uses `--coral-wash` background — a soft violation of "coral reserved strictly for decision moments," since Auth is not a compare/decision screen.
- The FAB's `+` is raw text glyph, not one of the app's own stroke-icon components (`Check`/`Close`/`Mark`/`ChevronLeft` exist) — inconsistent with the "stroke icons only" brand rule.
- Brain-dump entries have no edit/delete affordance once typed — a mistyped task has no fix path until the merge step.
- Zero `prefers-reduced-motion` handling anywhere — worth building in from the start as feedback/motion work is added, not bolted on after.
- Zero `aria-live` regions anywhere, including on the Auth error message — a screen-reader user gets no automatic notification of a new error.

## Questions to Consider

- The compare duel is the one screen your brand doc explicitly singles out for a different motion register (fast, coral, decisive) — does the rest of the app's calm/slow motion feel earn its restraint if the one moment meant to be different currently looks identical to everywhere else?
- If `AnimatePresence`/framer-motion were already reaching for the eventual pattern (it's imported, it's used for drag physics) — was skipping `exit`/`whileTap` a deliberate scope cut for launch, or just something that fell off the list once the mechanics worked?
- Given no undo exists anywhere, is "drop" currently reversible enough to match the brand's "relief, not deletion" framing — or does it need at least a brief undo window before the fix is complete?

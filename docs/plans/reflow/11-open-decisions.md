# Open Decisions

> This is not a build phase — nothing here has checkboxes or file paths to implement blind. It's the punch list `PRODUCT.md` flags as explicitly undecided, plus what each phase shipped as an interim default so the app is usable now. Revisit this after Phase 7-ish, once you've actually lived with the app for a few days — these are exactly the kind of thing that's obvious in use and guesswork on paper.

## 1. Task content model

**PRODUCT.md's question:** does a task carry just a title, or also a note/subtask/time estimate?

**Interim default (Phase 2):** the `tasks` table already has a nullable `note` column, but no phase's UI reads or writes it. Titles only, in practice.

**If you decide to add notes:** add a `note` field to `AddBar.tsx`'s form (probably an expandable second field, not a second always-visible input — the bottom bar's whole reason for existing is single-line speed) and to `TaskRow.tsx`'s display. Subtasks or time estimates are a bigger change — likely a new table (`task_notes` or `subtasks`) rather than another column, and worth a fresh mini-plan rather than a retrofit note here.

## 2. What "done" looks like

**PRODUCT.md's question:** does a completed task disappear immediately, or stay visible (crossed out) for the rest of the day?

**Interim default (Phase 4):** disappears immediately, via the same fade-and-collapse animation as dropping.

**If you decide it should stay crossed out:** this changes `useTasks.ts`'s `completeTask` — instead of removing the row from local state, it'd need to stay in `tasks` with a visual "done" style (strikethrough, dimmed) in `TaskRow.tsx`, and `listActiveTasks` in `src/lib/tasks.ts` would need a same-day cutoff for what counts as "still shown" vs. truly gone (done tasks from *previous* days shouldn't linger forever). This also touches Phase 7's merge step, which currently assumes the list it drags only contains genuinely open tasks.

## 3. Compare-mechanic edge cases

Three sub-decisions from `PRODUCT.md`, all currently shipped with the simplest workable default in Phase 6:

- **Confirmation when a task lands at the very top or bottom** (most/least urgent of everything). Interim: silent placement, no confirmation toast. If you want one, it's a small addition to `useCompareInsertion.ts`'s `decide()` — check whether `result.insertIndex` is `0` or `tasks.length` and surface a brief message before clearing `pendingTitle`.
- **Changing your mind mid-compare.** Interim: **there is no cancel/skip button** — once a duel starts (3+ tasks), you must resolve it. This is the one open decision most worth revisiting early; idea.md's own instinct was "likely a skip option that dumps the task at the bottom for manual placement later via drag." To add it: a "skip" affordance in `CompareDuel.tsx` calling a new `skip()` function in `useCompareInsertion.ts` that inserts at `tasks.length` (reusing the same path as the 0-1-task skip case) instead of continuing the search.
- **"About the same" / ties.** Interim: forced binary choice, no third option. Adding one means `compare.ts`'s `narrow()` needs a third branch (place adjacent to the candidate without continuing the search) — work out the exact adjacency semantics (immediately before? after? does it matter?) before touching the algorithm, since this is the one piece of logic in the app with real test coverage protecting it.

## 4. Confirm-email on sign-up

**Where this comes from:** `01-scaffold-and-auth.md` Task 4, added when the plan moved from a single hand-created account to a real public sign-up flow.

**Interim default (Phase 1):** "Confirm email" is off in Supabase Auth settings — signing up returns an immediately usable session, no email round-trip, no verification UI to build.

**Why it's flagged:** anyone can sign up with any email address right now, including one that isn't theirs, and start using the app unconfirmed. Fine while you're effectively the only real user; not fine once this is genuinely public.

**If you decide to turn confirmation on:** flip the Supabase setting, then `Auth.tsx`'s sign-up path needs a new state — after `signUp()` succeeds but before a session exists, show a "check your email" message instead of assuming the user lands straight in the app.

## 5. Parked for v2 (not part of this plan at all)

idea.md explicitly scopes "plan vs. actual" analytics (which days/meetings tend to blow up the plan, how consistently the plan holds) out of v1. Nothing in Phases 1-10 supports it, and no phase should be retrofitted to sneak it in — if you want it, it's a new plan built on top of a working v1, not a task squeezed into this one.

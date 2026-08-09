# Reflow — Implementation Plan Overview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Reflow, a personal interrupt-resilient day planner with a single priority-ranked task list, a binary-search "compare" mechanic for inserting new tasks reactively, and a three-phase morning triage flow — as a synced web app usable from phone and laptop.

**Architecture:** A React/Vite single-page app talks directly to Supabase (Postgres + Auth + Realtime) — no custom backend server. Row Level Security scopes every row to the signed-in user. All product logic that must be correct (rank math, the compare state machine, rollover/triage detection) lives in plain, unit-tested TypeScript functions with no framework dependency, called from thin React components.

**Architecture decisions (confirmed, don't re-derive or re-litigate mid-build):**
- **Platform:** browser-based web app only. No Android or iOS app, ever.
- **One app, total.** This React/Vite SPA is the entire application — there is no separate API server to build or maintain.
- **No separate API tier — deliberately, including after the app goes multi-user/public.** Supabase Postgres Row Level Security scopes every row to `auth.uid()` directly at the database, so per-user data isolation doesn't require a backend in front of it. Add a real API app later only if a need arises that RLS genuinely can't cover (e.g. signup rate-limiting/abuse prevention, outbound email, payments, server-only secrets) — not preemptively, and not just because the user base grows.
- **One database.** A single Supabase Postgres instance (the `public.tasks` table plus Supabase's own `auth` schema). No additional datastores.
- **Hosting:** frontend on Vercel; database, auth, and realtime on Supabase. No third hosting provider (e.g. no Railway/Fly.io) — there's no API app that would need one.
- **PWA-enabled:** the app is installable to a home screen (manifest + service worker), added in Phase 10 once the real app icons exist — see Phase 10, Task 6.
- **User flow (Phase 1):** a signed-out visitor lands on a public info page (`Landing.tsx`) — not straight on a login form. From there they choose to sign in or sign up (one combined `Auth.tsx` screen, mode-toggled). Once authenticated they land in the app itself. A sign-out control is reachable from inside the app at all times (the `Today` page header, from Phase 3 onward).

**Tech Stack:**
- React 18 + TypeScript + Vite
- `@supabase/supabase-js` (Postgres, Auth, Realtime) — the only data-access layer; the browser talks to Supabase directly, per the architecture decisions above
- Framer Motion — covers three needs with one dependency: the "reflow" spring reorder animation, drag-to-reorder (`Reorder.Group`/`Reorder.Item`), and swipe gestures (`drag="x"` + `onDragEnd`) for the compare duel and leftover triage
- `vite-plugin-pwa` — web app manifest + service worker for installability, added in Phase 10
- Vitest for unit tests of pure logic (ranking, compare state machine, rollover date logic)
- Deploy target: Vercel — first needed in Phase 9

## Why these plans read differently from a typical TDD plan

The `writing-plans` skill this was generated with defaults to strict TDD (failing test → implementation → passing test) for every step. That's the right call for a shared codebase with reviewers. This is a **solo personal project you'll test by using the app**, so the granularity is adjusted:

- Pure logic with real edge cases — rank math, the compare binary search, rollover/triage date detection — gets real Vitest unit tests, written first, because these are exactly the places idea.md flagged as risky ("still to decide" edge cases) and where a subtle bug is easy to miss by eye.
- UI/plumbing tasks (components, wiring, styling) skip formal test-first ceremony and instead end in a **"Test it yourself"** section: exact steps to run the app and confirm the phase works, by hand, in the browser.
- Every phase ends with something you can open in a browser and interact with. That's the "testable by user" contract the whole plan is built around.

## Global Constraints

These apply to every phase; don't re-derive them per task.

- **Brand system is locked** — see `branding.md` at the project root. Petrol/paper/amber palette, lowercase wordmark, amber used *only* at decision moments (the compare duel, the task being slotted, the single next action) — never on chrome, buttons, headers, badges. No red/green for compare states. No gradients, shadows, or glow on the logo mark.
- **Product mechanics are locked** — see `PRODUCT.md` and `idea.md`. Swipe = binary decisions only (keep/drop, urgency compare). Drag = reordering only. These two vocabularies never blur.
- **Explicitly undecided, do not invent mid-build** (flagged in `PRODUCT.md`, resolved in [11-open-decisions.md](11-open-decisions.md) before the affected phase, not silently guessed): task content model beyond title, exact "done" visual treatment, and three compare-mechanic edge cases (top/bottom placement confirmation, cancel/skip mid-compare, tie/"similar" option). Phases below implement the simplest defensible behavior for each and mark it `[OPEN DECISION]` in place — swap it out once 11-open-decisions.md is resolved.
- **Platform:** web only (no native apps), multi-device (phone + laptop), must sync, installable as a PWA (Phase 10).
- **Public sign-up is enabled from Phase 1 on.** You're the only real user today, but the product is meant to open up to anyone for free eventually — RLS already scopes every row by `user_id`, so there's no data-model rework needed when that happens. No admin/roles UI; every account just gets its own private task list.
- **Motion is a first-class citizen of correctness**, not a polish pass: branding.md specifies exact timing (reorder ~380ms spring near-zero overshoot; compare decision 150–200ms; drop = soft fade/collapse, never a shake or red flash). Treat a phase that visually works but animates wrong as incomplete, not done.

## Data Model (locked from Phase 2 onward — later phases only add columns, never redesign)

One table, `public.tasks`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users(id)`, RLS scope |
| `title` | `text` | required |
| `note` | `text` | nullable — reserved for [11-open-decisions.md](11-open-decisions.md) |
| `status` | `text` | `'active' \| 'done' \| 'dropped'` |
| `rank` | `double precision` | ordering key, see ranking algorithm below |
| `created_at` | `timestamptz` | default `now()` |
| `completed_at` | `timestamptz` | nullable |
| `last_triaged_on` | `date` | default `current_date`; drives leftover detection |

There is deliberately no `day` column. "Today's list" is just every `active` task; nothing resets at midnight. What changes daily is `last_triaged_on`, which flags a task as an untriaged leftover once it's in the past (see [08-auto-rollover.md](08-auto-rollover.md)).

**Ranking algorithm** (see [02-data-layer.md](02-data-layer.md) for the implementation and tests): a `double precision` "rank" column, ordered ascending = most urgent first. Inserting between two ranks takes their midpoint; inserting at an edge steps `±1` from the nearest rank. A full manual reorder (Phase 5) renumbers the whole list to clean integers, which is the plan's defragmentation strategy against float precision drift — simpler than string-based fractional indexing and sufficient at personal-list scale (a handful to ~20 rows).

## Phase Index

Each file is self-contained: open it in a fresh session, it has everything needed (file paths, schema, code, manual test steps) without re-reading the others, beyond this overview for shared context.

1. [01-scaffold-and-auth.md](01-scaffold-and-auth.md) — Vite/React/TS skeleton, Supabase project, sign-in screen
2. [02-data-layer.md](02-data-layer.md) — `tasks` table, RLS, ranking algorithm + tests, typed data-access functions
3. [03-ranked-list-ui.md](03-ranked-list-ui.md) — quick-add bar + read-only ranked list, styled to the brand
4. [04-done-and-drop.md](04-done-and-drop.md) — mark done, settle/fade-out animation
5. [05-drag-reorder.md](05-drag-reorder.md) — manual drag-to-reorder (mouse + true touch drag), rank renumbering
6. [06-compare-duel.md](06-compare-duel.md) — the binary-search compare mechanic, inline duel UI, reflow animation
7. [07-morning-flow.md](07-morning-flow.md) — leftover triage (swipe keep/drop), brain dump, drag-to-merge
8. [08-auto-rollover.md](08-auto-rollover.md) — detect a new day, auto-prompt the morning flow
9. [09-multi-device-sync.md](09-multi-device-sync.md) — Supabase Realtime subscription, two-device test, deploy
10. [10-brand-polish.md](10-brand-polish.md) — logo/favicon, tone-of-voice copy pass, icon set, motion audit, PWA manifest and installability
11. [11-open-decisions.md](11-open-decisions.md) — not a build phase; a punch list of product decisions to make before their dependent phases, with the interim default each phase ships with until then

## How to use these files for vibecoding

Work through them in order — each assumes the previous phases are done and running. Paste one phase file into a fresh coding session at a time; it names every file it touches, so a fresh session doesn't need the rest of the plan in context. After each phase, run its "Test it yourself" steps in the actual running app before moving on — don't stack unverified phases.

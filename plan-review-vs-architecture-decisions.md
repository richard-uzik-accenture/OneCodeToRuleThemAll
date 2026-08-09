# Plan Review: Architecture Decisions vs. `docs/plans/reflow/`

Reviewed against your 6 strict decisions and your wished tech stack. Source of the plan: `docs/plans/reflow/00-overview.md` plus phases 01, 02, 03, 05, 09, 10, 11 (read in full); phases 04, 06, 07, 08 not read line-by-line but the overview's "Architecture" section governs all of them and was grepped for contradictions (none found).

## Summary

The plan is internally consistent and well-executed *for the architecture it chose* — but that architecture is **not** the one you specified. It picked "React SPA talks directly to Supabase, no backend" instead of "frontend app + separate API app + database." Two of your six decisions are directly violated, one is a partial miss, and several tech-stack items are substituted with alternatives the plan considers equivalent but you didn't ask for.

| # | Your decision | Plan's actual choice | Verdict |
|---|---|---|---|
| 1 | Browser-based, no native apps | Vite/React SPA only, no Android/iOS | ✅ Compliant |
| 2 | 1 app serving frontend | One Vite/React SPA | ✅ Compliant |
| 3 | 1 app serving API | **Zero API apps** — frontend calls Supabase directly | ❌ **Violated** |
| 4 | 1 database | One Postgres DB (via Supabase) | ✅ Compliant |
| 5 | Frontend + API + DB hosted on Vercel & Supabase | Frontend → Vercel ✅, DB → Supabase ✅, **API → doesn't exist to host** | ⚠️ Partial — can't satisfy "API on Vercel" if there's no API |
| 6 | PWA enabled | **Not mentioned anywhere in the plan** — no manifest, no service worker, no install prompt, no offline handling | ❌ **Violated** |

---

## Finding 1 (blocking): No API layer exists

`00-overview.md` states outright:

> **Architecture:** A React/Vite single-page app talks directly to Supabase (Postgres + Auth + Realtime) — **no custom backend server.**

Every data operation (`src/lib/tasks.ts`) is a direct `supabase.from('tasks')...` call from the browser, authorized purely by Row Level Security and the anon key. There is no server-side app of any kind — not a Fastify service, not Vercel serverless/edge functions, not Supabase Edge Functions. "1 app serving api" isn't partially met, it's absent as a concept from the plan.

This is a legitimate, common pattern for small personal Supabase apps (it's *why* the plan's author chose it — less to build, less to host), but it is a different architecture from what you specified, not a variant of it. If you want a real API tier:

- You'd introduce a second app: e.g. Fastify (per your wishlist) deployed as its own service, or Vercel serverless/edge functions if you want to stay inside "just Vercel."
- The frontend would call your API instead of the Supabase client directly; your API would hold the Prisma client and talk to Postgres.
- Auth changes shape too: Supabase Auth would need to hand a verifiable session/JWT to your API, which would re-validate it per-request instead of relying on Postgres RLS as the sole authorization boundary.
- RLS becomes optional/defense-in-depth rather than the primary security mechanism — authorization logic moves into your API code.

This is the single biggest rewrite implied by reconciling the plan with your decisions — it touches Phase 1 (auth), Phase 2 (data layer), and every phase after it that calls `src/lib/tasks.ts`.

## Finding 2 (blocking): PWA is entirely unaddressed

I grepped the full plan tree for `pwa`, `manifest`, `service worker`, `workbox`, `installable`, `offline` — zero matches. Phase 10 ("Brand Polish") covers favicon, fonts, icons, motion, and tone-of-voice, but never touches a web app manifest, `vite-plugin-pwa`, a service worker, or an install prompt. As written, the app is a regular website, not a PWA — it won't be installable to a home screen or work offline.

To fix: add a task (likely in Phase 1 or Phase 10) to install `vite-plugin-pwa`, add `manifest.json` (using the existing `public/icon-192.png`/`icon-512.png` from Phase 10's Task 1), and decide a caching/offline strategy. Worth deciding explicitly: does "PWA enabled" for you mean just installability (manifest + icons), or real offline support (service worker caching, which is more involved given this app's realtime-sync nature)?

## Finding 3: Hosting doesn't match, as a consequence of Finding 1

Phase 9 deploys the frontend to Vercel and leaves the DB on Supabase — that part matches your decision. But "API hosted on Vercel" can't be evaluated because there's no API to place there. Note also that **your own wishlist contradicts your own hard requirement here**: you listed hosting as "Vercel (frontend) + Railway/Fly.io (API) + Supabase (DB)," but your strict decision says everything should be on Vercel + Supabase. If you do add an API tier, Vercel serverless/edge functions (not Railway/Fly) would be the way to satisfy decision #5.

## Finding 4: Tech stack substitutions (secondary to the above)

None of these break your six strict decisions, but they're real deviations from your stated wishlist that you should knowingly accept or reject:

- **Styling:** plan uses raw inline `style={{...}}` objects and hand-written CSS custom properties (`tokens.css`), not Tailwind. Everywhere — `AddBar.tsx`, `TaskRow.tsx`, `SignIn.tsx`, etc.
- **Drag-and-drop:** plan uses Framer Motion's `Reorder.Group`/`Reorder.Item` for drag-to-reorder (Phase 5), not dnd-kit. Framer Motion itself does match your list (also used for the compare-duel swipe and reflow spring), but it's covering the job you specified for dnd-kit.
- **Data fetching / caching:** no TanStack Query. State is plain `useState`/`useEffect` in a hand-written `useTasks` hook, kept in sync via a raw Supabase Realtime channel subscription with a custom merge function (`upsertActiveTask`). This is arguably reasonable at single-user scale, but it's a different pattern from what TanStack Query would give you (query caching, retries, invalidation).
- **Global state:** no Zustand. All state lives in component-local hooks; there's no cross-cutting client store because the app doesn't need one yet at this scope.
- **API validation:** no Zod anywhere — moot until an API layer exists to validate at (Zod's job here would be request validation at the API boundary; the plan currently validates nothing beyond a Postgres `check` constraint on `status`).
- **ORM:** no Prisma — again moot without an API layer; Supabase's client library is used as the sole data-access mechanism.
- **Ranking algorithm:** you asked for PostgreSQL with fractional/lexicographic ranking. The plan explicitly considered and rejected this — `00-overview.md` line 53:

  > A full manual reorder (Phase 5) renumbers the whole list to clean integers, which is the plan's defragmentation strategy against float precision drift — **simpler than string-based fractional indexing** and sufficient at personal-list scale (a handful to ~20 rows).

  It uses `double precision` numeric ranks with midpoint insertion (`rankBetween`) and periodic integer renumbering on full manual reorder, instead of string-based fractional/lexicographic keys (e.g. the `a0`, `a1`, `a1V` style used by Figma/Linear). Functionally this covers the same need (stable ordering, cheap inserts) and is a defensible simplification at this app's scale (~20 tasks/day) — but it is not what you specified, and you should decide if that simplification is acceptable or if you want the lexicographic scheme implemented as asked.

## What already matches well

- React + TypeScript + Vite: exact match.
- Framer Motion: exact match (and reused efficiently across three needs — reorder, swipe, spring).
- PostgreSQL as the database: match (via Supabase).
- Browser-only, no native apps: match.
- Single frontend app, single database: match.
- Vitest for pure-logic unit tests (ranking, compare state machine, rollover/realtime-merge logic): not something you specified either way, and a sound choice.

## Recommendation

Before continuing to build against this plan, resolve two things with the plan's author (or by re-generating affected phases):

1. **Decide if you actually want a separate API app**, or if "direct SPA → Supabase with RLS" is an acceptable interpretation of your decisions after all. If you do want the API tier, phases 01, 02, and every later phase that touches `src/lib/tasks.ts` need to be reworked around a Fastify (or Vercel Functions) service instead of a direct Supabase client in the browser — this is a structural change, not a small patch.
2. **Add PWA support explicitly** as a phase/task — it's currently a total gap, not a partial one.

The Tailwind/dnd-kit/TanStack Query/Zustand/Zod/Prisma/lexicographic-ranking deviations are lower-stakes — worth a conscious yes/no from you, but none of them violate your six hard constraints the way the missing API tier and missing PWA setup do.

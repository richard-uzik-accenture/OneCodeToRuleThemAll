# Error UX Fixes — Overview

Implements the fixes identified in [docs/error-ux-audit.md](../../error-ux-audit.md)
(2026-08-19). No toast component and no React `ErrorBoundary` exist anywhere in the
app today — all error UX currently runs through two hand-built elements: the
`error` banner in `src/pages/Today.tsx` and the `auth-error` paragraph in
`src/pages/Auth.tsx`.

## Testing model

Every task in every phase is manually tested by the user in the running app —
no automated test-writing is in scope here. Each task below states exactly what
to do in the browser and what you should observe. Check a task's box only after
you've done the manual test and seen the expected result.

## Current status (2026-08-19)

**Resume at Phase 3.** Phases 1-2 fully done and archived. Phase 3's code is
written (both tasks) but manual testing was interrupted mid-session — see the
"Status" section at the top of [03-error-message-quality.md](03-error-message-quality.md)
for exactly what's left to verify and how. Phase 4 not started.

## Phases

| Phase | File | What it does |
|---|---|---|
| 1 | archived | Fix silent failures in initial load, auth session check, sign-out, realtime sync — done |
| 2 | archived | Fix Morning Flow silently advancing on failure, reorder not rolling back, empty-title no-op — done |
| 3 | [03-error-message-quality.md](03-error-message-quality.md) | Stop leaking raw Supabase auth errors; keep task-mutation errors honest about retry-ability |
| 4 | [04-error-placement.md](04-error-placement.md) | Move task-scoped errors closer to the thing that failed (modal / row) instead of one shared page-top banner |

A phase is done when every checkbox in its file is checked; move it to `archive/`
at that point per the root `CLAUDE.md` convention.

## Out of scope

- Writing automated tests (Vitest) for any of this — verification is manual per
  the audit's request.
- Building a full toast/notification system — Phase 4 reuses/extends the existing
  banner pattern rather than introducing new UI infrastructure, unless a task
  says otherwise.
- The RLS/security audit and PROD migration gap noted in `devops-setup` — unrelated.

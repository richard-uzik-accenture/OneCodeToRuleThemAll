# Phase 3 — Error message quality

Fixes audit findings §2.1, §2.2 (`docs/error-ux-audit.md`) — raw backend errors
reaching the UI, and generic messages that overclaim retry will help.

## Status: done (2026-08-19)

Both tasks manually verified. During testing, also fixed a related bug: the
`Invalid login credentials` mapping said "that password doesn't match" even
when the email itself didn't match any account (Supabase deliberately doesn't
distinguish the two, to avoid leaking account existence) — copy corrected to
"that email or password doesn't match". Also found that `insertTaskAtIndex`
(not `addTask`) is the function actually exercised by the everyday add-task
FAB flow (it goes through Compare/Duel) — verified the server-error branch
there instead.

Error-message *styling* (color/background) was explored during testing —
tried an ink-violet treatment, then a muted-red `--error`/`--error-wash`
token exception to the brand's no-red rule — but rolled back to the original
neutral `--mist`/`--ink` styling per user decision. The only lasting styling
change: `.auth-error`'s background moved from `--mist` to `--haze` so it's
visually distinguishable from the `--mist` auth card behind it (pre-existing
contrast bug, unrelated to the red exploration).

## Tasks

- [x] **1. Unmapped Supabase auth errors no longer show raw backend text**
      File: `src/pages/Auth.tsx:13-20, 35-37`.
      Expand `KNOWN_ERRORS` to cover the realistic Supabase auth error set you
      can trigger (e.g. "Email not confirmed", weak/short password rejection,
      rate-limiting "For security purposes, you can only request this after
      N seconds"), AND add a fallback branch in `toBrandVoice` so anything
      still unrecognized maps to a generic-but-actionable message (e.g.
      "couldn't sign you in — check your details and try again") rather than
      passing `message` straight through.
      **Manual test:** trigger at least: (a) wrong password → known-mapped
      message still shows correctly, (b) sign up with an already-registered
      email → known-mapped message still shows correctly, (c) trigger an
      error NOT in your map (e.g. sign up with a very short/weak password if
      Supabase rejects it, or rapid repeated submits to trigger rate-limiting)
      → confirm you see a clean brand-voice message, not raw Supabase text
      like a stack trace, SQL detail, or an unformatted technical string.

- [x] **2. Task-mutation errors distinguish "try again might help" from "it won't"**
      File: `src/hooks/useTasks.ts` (all catch blocks: `addTask`,
      `insertTaskAtIndex`, `completeTask`, `editTask`, `dropTask`,
      `commitReorder`, `keepLeftover`).
      Where feasible, branch on the error (e.g. network/offline vs. a Supabase
      error response) so a connectivity failure says something like "check your
      connection and try again" while a server-side rejection says something
      that doesn't imply retrying alone will fix it. Use judgment on how much
      granularity is worth adding — the goal is not overclaiming "try again"
      when it can't help, not building a full error-taxonomy system.
      **Manual test:** (a) go offline (devtools) and try adding a task —
      confirm the message reads like a connectivity issue. (b) simulate a
      non-network failure if you can (e.g. block just the Supabase REST
      request with a 500 mock via devtools overrides, if available) — confirm
      the message doesn't claim "try again" will fix something that won't
      change on retry.

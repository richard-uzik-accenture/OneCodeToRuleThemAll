# Phase 3 — Error message quality

Fixes audit findings §2.1, §2.2 (`docs/error-ux-audit.md`) — raw backend errors
reaching the UI, and generic messages that overclaim retry will help.

## Status as of 2026-08-19 (paused mid-testing, resume here)

**Both tasks are implemented in code and build/lint clean, but NEITHER has been
manually confirmed working yet** — testing was interrupted. Do not check the boxes
below until you've actually run the manual tests and seen the expected result.

- **Task 1** (`src/pages/Auth.tsx`): code done, not yet manually tested at all.
- **Task 2** (`src/hooks/useTasks.ts`): code done. The "network failure" branch
  (offline → "check your connection") has NOT been tested. The "server-side
  failure" branch was mid-test via a temporary code injection (forced a fake
  error in `addTask`) when the session was paused — **the injection has already
  been reverted**, the file is back to clean committed state. To re-test the
  server-error branch, redo the temporary injection: in `src/hooks/useTasks.ts`,
  inside `addTask`'s `try` block, add `throw { code: '23505', message: 'TEST' };`
  as the first line, reload, click "add task" with any title, confirm the error
  banner says *"couldn't add that task — something went wrong on our end, try
  again in a bit"* (not the connection-check wording), then remove that line.

See `docs/error-ux-audit.md` §2.1/§2.2 for the original findings, and the
per-task manual test steps below for full detail.

## Tasks

- [ ] **1. Unmapped Supabase auth errors no longer show raw backend text**
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

- [ ] **2. Task-mutation errors distinguish "try again might help" from "it won't"**
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

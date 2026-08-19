# Phase 1 — Data load & session error handling

Fixes audit findings §1.1, §1.4, §1.5, §1.2 (`docs/error-ux-audit.md`) — all silent
failures around getting the app into a usable state or keeping it in sync.

## Tasks

- [x] **1. `useTasks.reload()` shows an error and stops the skeleton instead of hanging forever**
      File: `src/hooks/useTasks.ts:16-26`.
      Wrap the `Promise.all([...])` in try/catch, `setLoading(false)` in a
      `finally`, and on catch set the existing `error` state to something like
      `"couldn't load your tasks — check your connection and try again"`.
      **Manual test:** temporarily break the Supabase URL/key in `.env.local`
      (or turn off wifi), reload the app. Expect: the loading skeleton
      disappears and the error banner appears instead of an infinite skeleton.
      Restore the env/connection and confirm a normal reload still works.

- [x] **2. Realtime channel surfaces a "live updates paused" state on disconnect**
      File: `src/hooks/useTasks.ts:35-45`.
      Pass a status callback to `.subscribe()`; on `CHANNEL_ERROR`/`TIMED_OUT`,
      set a small piece of state (e.g. `realtimeStale`) surfaced somewhere
      visible (reuse the error banner or a subtle indicator — your call on
      exact placement, keep it non-blocking).
      **Manual test:** open the app on two devices/tabs signed into the same
      account. Kill network on one tab mid-session (devtools offline mode
      works). Expect: that tab shows some visible "live updates paused" (or
      equivalent) signal instead of silently going stale. Restore network and
      confirm the signal clears once reconnected.

- [x] **3. Auth session check failure doesn't hang `loading` forever**
      File: `src/hooks/useAuth.ts:13-16`.
      Add a `.catch()` to the `getSession()` call that sets `loading` to
      `false` and exposes some minimal failure indication (a new `sessionError`
      state is fine, or reuse a pattern consistent with the rest of the hook).
      **Manual test:** simulate a `getSession()` rejection (e.g. temporarily
      throw inside the `.then` or block the network request via devtools
      request blocking for the Supabase auth endpoint) and reload. Expect: the
      app doesn't hang on a loading state forever — it either shows the signed-
      out flow or a visible error, not a stuck spinner/blank screen.

- [x] **4. `signOut()` surfaces failures instead of discarding them**
      File: `src/hooks/useAuth.ts:35-41`.
      Capture the `{ error }` returned by `supabase.auth.signOut()` and, if
      present, surface it (reuse whatever pattern Task 3 established, or the
      existing `error` banner via a prop/callback — your call).
      **Manual test:** block the Supabase auth sign-out network request via
      devtools, click "sign out" in the app. Expect: some visible feedback
      that sign-out failed, instead of nothing happening with no explanation.
      Unblock the request and confirm a normal sign-out still works silently
      (no error shown on success).

## Extra fix found during testing

While testing Task 1, found that `useTasks`'s `reload`/realtime-channel effects
depended on the `session` object from `useAuth()`, and `onAuthStateChange` calls
`setSession(newSession)` with a fresh object reference on every auth event
(including harmless token-refresh events) — this recreated `reload` and re-fired
the load effect repeatedly, causing the skeleton and error banner to flicker/
oscillate instead of settling. Fixed by depending on the stable `session?.user.id`
string instead of the `session` object itself (`src/hooks/useTasks.ts`). Also added
`setError(null)` at the start of `reload()` so a fresh attempt doesn't show a stale
error alongside the skeleton.

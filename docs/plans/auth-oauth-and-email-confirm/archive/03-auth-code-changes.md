# Phase 03 — Auth code changes (I implement, you test)

Depends on Phase 01/02 being done enough to have real provider credentials in at
least the dev Supabase project — OAuth sign-in can't be verified end-to-end without
that, though the code can be written and typechecked first.

## What changes

### `src/hooks/useAuth.ts`

- [x] Added `signInWithGoogle()` and `signInWithGithub()` using
      `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })`
- [x] `signUp()` now returns `{ error, confirmationSent }` — `confirmationSent` is
      `!error && !data.session`, matching Supabase's null-session-on-pending-confirm
      behavior
- [x] DEV_MODE: both OAuth methods set the mock session directly and return
      `{ error: null }`, mirroring how `signOut` already special-cases `DEV_MODE`

### `src/pages/Auth.tsx`

- [x] Confirmation-pending state added — `confirmationSent` replaces the form with
      "check your email to confirm your account" (`.auth-confirmation`)
- [x] OAuth methods wired to buttons (buttons themselves built in Phase 04, done in
      the same pass since splitting them would have left the tree in a non-compiling
      intermediate state — `handleOAuth` was unused until the buttons existed)
- [x] OAuth errors flow through `toBrandVoice`/`KNOWN_ERRORS` unchanged; no new
      provider-specific error strings needed yet — add to `KNOWN_ERRORS` if Phase 05
      testing surfaces one

### `src/App.tsx`

- [x] No changes needed — confirmed `onAuthStateChange` picks up the session after
      redirect with no dedicated callback route.

## Explicitly not doing

- No new route/page for `/auth/callback` — Supabase's implicit/PKCE flow resolves on
  the existing origin without a dedicated callback route, per the client library's
  default behavior. Only add one if Phase 05 testing proves it's actually needed.

## Verify

- [x] `npm run test`, `npm run lint`, `tsc -b --noEmit` all pass
- [x] User confirmed: functionality works end to end — email confirmation state and
      OAuth redirect both function correctly on dev (project A)

Superseded by Phase 04, which folded in alongside this since the two couldn't be
tested independently without a broken intermediate build.

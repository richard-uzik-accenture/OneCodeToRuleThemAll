# Phase 02 — Today screen loading skeleton

Source: audit item 1.

## Problem

[src/pages/Today.tsx:35](../../../src/pages/Today.tsx#L35) does
`if (loading) return null;` — the entire screen (rail, header, everything)
disappears on first mount and on every `reload()`. Highest-traffic state
in the app.

## Work

- Replace `return null` with a lightweight skeleton: keep the rail/header
  shell visible, show a few placeholder task-row shapes where the list
  would be.
- No headline/supporting text/CTA — this is a loading state, not an
  empty state, per the audit's recommendation. Don't route this through
  `EmptyState`.
- Keep it simple — a handful of pulsing/static placeholder bars is
  enough, not a full shimmer animation system.

## How to manually verify

- Throttle network (or add a temporary artificial delay) and reload the
  Today screen — confirm the rail and a skeleton shape appear immediately
  instead of a blank screen.
- Confirm the skeleton disappears and real content pops in once tasks
  finish loading, with no layout jump.
- Trigger `reload()` (e.g. after completing/adding a task if that path
  re-triggers loading) and confirm it doesn't flash a jarring blank state.

## Deliverables

- [x] `loading === true` renders a shell skeleton instead of `null`.
- [x] No layout shift between skeleton and loaded state.
- [x] Manually confirmed on slow network / artificial delay.

## Notes

Scope grew during manual testing to also fix a second, stacked loading
gate one layer up: `App.tsx`'s own auth-session check was doing
`if (loading) return null`, causing a white flash before the Today
skeleton ever appeared. Fixed by having `App.tsx` render `Today`
optimistically while auth is still resolving (`useTasks` already no-ops
until `session` exists, so `Today`'s own skeleton naturally covers both
the auth check and the tasks fetch as one continuous loading state) —
this avoided a second `AnimatePresence` screen-swap with its own
enter/exit gap.

Also fixed, in scope as a font-swap flash noticed during the same
manual testing pass: `General Sans` (`tokens.css`) was only discovered
by the browser after CSS parsed, causing a visible fallback→real-font
jump on slow connections. Added `<link rel="preload">` for both
`.woff2` files in `index.html`.

Explicitly out of scope, left as-is per user decision: the white screen
that occurs before React mounts at all (JS bundle download/parse time
on a hard refresh) — this is normal SPA behavior outside what any
in-app loading state can fix; would require a static HTML shell in
`index.html`, which is new scope beyond this audit if ever wanted.


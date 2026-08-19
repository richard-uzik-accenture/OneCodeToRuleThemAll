# Phase 04 — Provider icons + button UI (I implement, you test)

No dependency on live OAuth credentials — this is pure UI and can be built/reviewed
with the buttons wired to Phase 03's methods (which may still be error-ing against
Supabase until Phase 01/02 land, that's fine for a visual check).

## What changes

### `src/components/icons/GoogleMark.tsx`, `src/components/icons/GithubMark.tsx`

- [x] Single-shade `currentColor` SVGs. Built using official path geometry (Google's
      standard 48×48 "G" glyph, GitHub's canonical 16×16 Octicon `mark-github` path)
      rather than hand-approximated curves — an initial hand-rounded version of both
      looked visibly rough/pixelated at the button's render size, replaced with exact
      published path data which stays crisp since SVG scales vector-perfect
  - Follows the existing icon file convention (`SVGProps<SVGSVGElement>`, spreads
    `...props`)
  - Documented exception to branding.md §5's "constructible from a bar + chevron +
    circle" rule, per `00-overview.md`
- [x] Rendered at 18×18 in the button — reads clearly at that size once using precise
      path data

### `src/pages/Auth.tsx` + `src/styles/global.css`

- [x] "continue with Google" / "continue with GitHub" buttons below the email form,
      separated by a lowercase "or" divider with `haze` hairlines
- [x] Outlined ghost button style — `paper` background, `haze` border, `ink` text,
      `mist` on hover. Not filled violet, not coral.
- [x] Order: email form, divider, Google, GitHub
- [x] No enter/exit animation added — static, consistent with "nothing moves unless
      you move it" (branding.md §6)
- [x] Disabled state while a redirect is in flight (`auth-oauth-button:disabled`,
      button label switches to "redirecting…")

### Follow-on fix: Landing page CTA wording

- [x] `src/pages/Landing.tsx`'s CTA read "sign in", and `Auth.tsx` defaults to a
      "sign in" mode — clicking through showed the same word twice, which read as
      broken/repetitive. Changed Landing's CTA to "get started" (accurate: it leads to
      either sign-in or sign-up, not sign-in specifically).

### Follow-on fix: sign-out had no loading feedback

- [x] `signOut()` in `src/hooks/useAuth.ts` awaits a network call with nothing
      disabling the button or showing feedback — on a slow connection it looked
      frozen/unresponsive. Added a `signingOut` flag: desktop rail button label
      swaps to "signing out…" and disables; mobile header icon button disables and
      spins (`@keyframes spin` in `global.css`, respects the existing
      `prefers-reduced-motion` global override).

### Follow-on fix: false "couldn't load your tasks" error right after sign-in

- [x] Root cause: `useAuth` seeded its initial session state from
      `supabase.auth.getSession()`, which reads local storage and can resolve
      *before* the Supabase client finishes validating/refreshing the token against
      the server. Right after sign-in this let `useTasks` fire its first fetch with
      a token the server would reject via RLS, surfacing a false load error even
      though the user was genuinely authenticated — explained why a hard reload
      "fixed" it (a fresh client re-validates before anything queries).
  - Fixed in `src/hooks/useAuth.ts`: `loading`/`session` now key off
    `onAuthStateChange` exclusively (its `INITIAL_SESSION` event only fires once
    the client has a real, settled session), with a 10s timeout fallback in case
    the listener never fires (e.g. fully offline). `Today`'s skeleton
    (`useTasks`'s own `loading`, already `true` by default) now correctly holds
    until auth has genuinely settled, then fills with content or shows a real
    error — matches "wait, skeleton, then fill-or-error" with no premature race.

## Known limitation, deferred (not part of this plan)

- The Google/GitHub OAuth consent screen shows the Supabase project's `*.supabase.co`
  domain in fine print (the app name shown as "reflow" is already correct, from the
  Phase 01 app registration). Fixing the domain requires a Supabase custom auth domain
  (paid plan + DNS), which the user explicitly deprioritized — revisit later if it
  becomes a real trust concern.

## Verify

- [x] `npm run test`, `npm run lint`, `tsc -b --noEmit` all pass after every change
      in this phase, including both follow-on fixes
- [x] User confirmed: icons crisp, Landing→Auth copy no longer duplicated, sign-out
      shows a proper loading state, and the post-sign-in false error no longer
      reproduces

Phase 04 complete — moving to Phase 05.

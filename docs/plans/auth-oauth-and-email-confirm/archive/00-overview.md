# Overview — Google/GitHub sign-up + required email confirmation

## Goal

Add Google and GitHub as sign-up/sign-in options alongside the existing email+password
flow, styled to match the reflow brand (minimal, single-shade provider marks — no
colored logos). Change email sign-up so a confirmation email is required before the
account can be used (currently disabled per the README setup step).

## Scope decisions (already made, don't re-litigate)

- **One OAuth app per provider, shared across all three environments.** One Google
  OAuth client and one GitHub OAuth App, each registered with both Supabase project
  callback URLs (project A for dev+quality, project B for prod) and, for Google, the
  three app origins (localhost, dev, quality, prod). Both providers support multiple
  redirect URIs per app, so one app per provider covers everything — done as of
  Phase 01.
- **Provider buttons are outlined ghost buttons**, not filled/colored — matches
  `auth-input` style (paper background, haze border), sits quietly below the email
  form. No coral (branding.md reserves coral for decision moments only).
- **Provider marks are single-shade (`currentColor`), not brand-colored.** These are
  an explicit exception to the "icons are constructible from a bar + chevron + circle"
  rule in branding.md §5 — third-party trademarks can't be redrawn from those atoms.
  They live in `src/components/icons/` alongside the other hand-written icons and
  follow the same file/prop conventions, but are their own thing.
- **Email confirmation becomes required** (reversing the current README step 3 "turn
  off Confirm email"). This needs a confirmation-sent state in the UI, since
  `signUp()` will no longer return an active session immediately.

## Phases

Each phase is independently shippable and independently testable by you. Move a phase
file to `archive/` once every checkbox in it is checked and you've confirmed it works.

| # | Phase | What it covers |
|---|---|---|
| 01 | [Provider app registration](01-provider-app-registration.md) | **You do this.** Register Google + GitHub OAuth apps, get client ID/secret pairs |
| 02 | [Supabase provider + email config](02-supabase-provider-config.md) | **You do this.** Enable providers in Supabase Auth settings, re-enable "Confirm email", set redirect URLs |
| 03 | [Auth code changes](03-auth-code-changes.md) | **I implement.** `useAuth` OAuth methods, callback handling, confirmation-pending UI state |
| 04 | [Provider mark icons + button UI](04-provider-icons-and-ui.md) | **I implement.** Monochrome Google/GitHub icons, button styling in `Auth.tsx` |
| 05 | [Verification across environments](05-verification.md) | **You do this.** Manual test matrix: email confirm required, Google sign-in, GitHub sign-in, on dev at minimum |

## Dependency order

01 and 02 must happen before 03 can be meaningfully tested (the code can be written
against 03 without live credentials, but sign-in won't work end-to-end until Supabase
has real provider secrets). 04 has no dependency on 01/02 and can happen anytime after
03's button hooks exist. 05 depends on everything before it.

## Out of scope

- Account linking UI (what happens if someone signs up with email `x@y.com` then later
  hits "continue with Google" using the same email) — Supabase's default behavior
  (auto-link by verified email) is accepted as-is, not customized.
- Password reset flow changes — untouched by this plan.
- Apple/Microsoft/other providers — not requested.

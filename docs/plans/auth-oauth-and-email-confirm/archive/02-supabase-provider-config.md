# Phase 02 — Supabase provider + email config (you do this)

Do this in **both** Supabase projects (project A = dev+quality, project B = prod) —
every checkbox twice, once per project, unless noted otherwise.

## Deliverables

- [x] **Authentication → Providers → Google** — enabled in both project A and
      project B with the shared Client ID/Secret from Phase 01
- [x] **Authentication → Providers → GitHub** — enabled in both project A and
      project B with the shared Client ID/Secret from Phase 01 (single app, per
      Phase 01's correction)
- [x] **Authentication → URL Configuration → Redirect URLs** — set in both projects:
  - Project A: Site URL `https://dev.usereflow.app`; redirect URLs
    `https://dev.usereflow.app/**`, `https://quality.usereflow.app/**`,
    `http://localhost:5173/**`
  - Project B: Site URL `https://usereflow.app`; redirect URL
    `https://usereflow.app/**`
- [x] **Authentication → Providers → Email → "Confirm email"** — turned **ON** in
      both projects. (User also enabled "require current password when updating" —
      unrelated security default, left as-is, no code changes needed for it.)

## Done

Both projects fully configured. Moving to Phase 03 (code changes).

## Note on email deliverability

Supabase's default built-in email sender is rate-limited and meant for
testing/low-volume — fine for dev/quality, but if prod signup volume grows you may
eventually want a custom SMTP provider (Authentication → Settings → SMTP Settings).
Not required for this plan; flagging so it's not a surprise later.

## What to hand back

Tell me once both projects have Google + GitHub enabled and "Confirm email" is on —
I'll move to Phase 03. If you deferred GitHub-on-prod per Phase 01's option 2, say so
and I'll scope Phase 03/05 to dev+quality only for GitHub.

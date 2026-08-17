# DevOps Setup — Overview

Finishes the three-environment pipeline described in the `devops-workflow` skill:
DEV/QUALITY/PROD, each a separate Vercel project with its own Supabase database,
promoted by **Octopus Deploy** from a single build produced on `main`.

## Current state (as of 2026-08-17) — pipeline is live and fully working

- Repo `richard-uzik-accenture/OneCodeToRuleThemAll` is **public**. `main` requires
  PRs to merge (0 required approvals — solo maintainer can't self-approve).
- Branches: `dev` and `main` exist, `feature/combat-screen-polish` (pre-dates `dev`)
  still needs retargeting — Phase 6. No `preprod` branch (intentional).
- Supabase: one project holds both DEV (`public` schema) and QUALITY (`preprod`
  schema, empty — data copy deferred), one separate project holds PROD. **PROD is
  missing migrations 0002/0003** (`tags`/`due_time` columns) — flagged, unfixed,
  not part of devops-setup.
- Vercel: three projects (DEV/QUALITY/PROD), domains set, git auto-deploy disabled,
  `VITE_SUPABASE_ANON_KEY` unmarked as "Sensitive" on all three (root-caused and
  fixed this session — see Phase 4).
- GitHub Actions (Phase 5, archived): every push to `main` builds via `vercel
  build`, packages, and creates a matching-numbered Octopus release with commit
  info in the release notes.
- **Octopus Deploy (Phase 4): the full promotion pipeline is built, tested, and
  has been used for a real production deployment.** `Approve Deployment` (Manual
  Intervention, scoped to `preprod`+`prod`, approver team "Space Managers") gates
  both environments; `dev` still auto-deploys. Verified live: a real release was
  approved through preprod and then prod, and `usereflow.app` is confirmed serving
  that exact build.
- **Version traceability solved**: package version, Octopus release number, and an
  in-app badge (bottom corner, `v0.0.16 · afb799e` format) all show the same
  number and short commit SHA — you can look at any environment's live site and
  know exactly which Octopus release and which GitHub commit it's running,
  without needing to open Octopus. See Phase 4 for the versioning scheme notes
  (deliberately manual minor-version bumps, no auto-bump).
- **Pre-launch follow-up, not urgent now**: do a real RLS/security audit across all
  Supabase tables before real users/payments — deliberately deferred, flagged in
  Phase 4's file so it isn't lost.

## What's left

1. **Nice-to-have, not yet built**: a way to approve preprod/prod deployments
   outside Octopus's own web UI (e.g. a phone notification or email with an
   approve action). Requested but not yet scoped/built — see Phase 4.
2. Phase 6: retarget `feature/combat-screen-polish` onto `dev`, update README to
   describe the branch model, archive Phase 4 once fully done.
3. Before real users/payments: the RLS/security audit noted above.
4. Optional cleanup: PROD's missing schema migrations (0002/0003) — unrelated bug
   found during this work, still open.

## Target state

```
feature/*  ─┐
fix/*       ├─▶  dev  ──(PR + review, human-only merge)──▶  main
docs/*      │
refactor/*  ─┘
                                                                │
                                                    push to main triggers
                                                                │
                                                                ▼
                                                    GitHub Actions: build,
                                                    package / push / create-release
                                                                │
                                                                ▼
                                              Octopus Deploy orchestrates one release:
                                              ├─ dev      (auto)
                                              ├─ preprod  (manual approval in Octopus)
                                              └─ prod     (manual approval in Octopus)
```

**This is now reality, not just a target** — confirmed working end-to-end this
session. Key departure from the older per-branch-per-Vercel-project model: there is
**no `preprod` git branch**. `main` is the only branch that produces a release;
preprod and prod are Octopus deployment targets for that same release. See the
`devops-workflow` skill for full rationale and guardrails.

## Phases

| Phase | File | What it does |
|---|---|---|
| 1 | archived | Create `dev`, protect `main` — done |
| 2 | [02-supabase-preprod.md](02-supabase-preprod.md) | Supabase schema for QUALITY — done except unrelated prod-migration gap |
| 3 | archived | Three Vercel projects, git auto-deploy disabled, env vars set — done |
| 4 | [04-octopus-setup.md](04-octopus-setup.md) | Octopus instance, project, environments, lifecycle, deploy steps, approvals — **pipeline fully working**, nice-to-have notification still open |
| 5 | archived | Build workflow on `main` that packages and hands off to Octopus — done |
| 6 | [06-close-the-loop.md](06-close-the-loop.md) | Retarget in-flight feature branch, update docs |

A phase is done when every checkbox in its file is checked; move it to `archive/` at
that point per the root `CLAUDE.md` convention.

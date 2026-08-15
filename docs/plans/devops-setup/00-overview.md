# DevOps Setup — Overview

Finishes the three-environment pipeline described in the `devops-workflow` skill:
DEV/QUALITY/PROD, each a separate Vercel project with its own Supabase database,
promoted by **Octopus Deploy** from a single build produced on `main`.

## Current state (as of 2026-08-15)

- Repo `richard-uzik-accenture/OneCodeToRuleThemAll` is **public** (needed for
  branch protection to enforce on the free GitHub plan). `main` requires PRs to
  merge (0 required approvals — solo maintainer can't self-approve).
- Branches: `dev` and `main` exist, `feature/combat-screen-polish` (pre-dates `dev`,
  still needs retargeting — Phase 6) is the only other one. No `preprod` branch
  (intentional — see skill).
- Supabase: one project holds both DEV (`public` schema) and QUALITY (`preprod`
  schema, empty — data copy deferred), one separate project holds PROD. **PROD is
  missing migrations 0002/0003** (`tags`/`due_time` columns) — flagged, unfixed.
- Vercel: three projects exist (DEV/QUALITY/PROD), domains set, git auto-deploy
  disabled ("Don't build anything"), env vars set on all three.
- GitHub Actions: **fully working** (Phase 5, archived) — every push to `main`
  builds, packages, and creates a real Octopus release.
- Octopus Cloud: instance, environments, lifecycle, project, variables, and the
  `Deploy to Vercel` step all exist and produce a viable release plan. **Currently
  blocked** on `npx: command not found` when actually deploying to `dev` — Octopus's
  worker has no Node.js preinstalled. Fix is written and ready to paste in, just not
  tested yet. See Phase 4's file.

## Resume here next session

1. Open Octopus's `reflow` project → Process → `Deploy to Vercel` step, replace the
   script with the Node-install-then-deploy version in Phase 4's file.
2. Deploy release `0.0.1` (or whatever's latest) to `dev` again, watch the log.
3. If it succeeds: open `dev.usereflow.app` in a browser and confirm the real app
   loads — that's the actual proof, not just Octopus saying "success."
4. If it fails again: it's likely Vercel auth/project-linking this time, not
   infrastructure — paste the new log.
5. Once `dev` deploys reliably: add Manual Intervention approval steps for
   `preprod`/`prod` (deliberately not done yet — see Phase 4 for exact steps).

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
                                                    octo pack / push / create-release
                                                                │
                                                                ▼
                                              Octopus Deploy orchestrates one release:
                                              ├─ dev      (auto)
                                              ├─ preprod  (manual approval in Octopus)
                                              └─ prod     (manual approval in Octopus)
```

Key departure from the older per-branch-per-Vercel-project model: there is **no
`preprod` git branch**. `main` is the only branch that produces a release; preprod and
prod are Octopus deployment targets for that same release, not separate branches or
separate CI triggers. See the `devops-workflow` skill for the full rationale and
guardrails — this plan is just the ordered steps to build it.

## Phases

| Phase | File | What it does |
|---|---|---|
| 1 | [01-branches.md](01-branches.md) | Create `dev`, protect `main`, retire the idea of a `preprod` branch |
| 2 | [02-supabase-preprod.md](02-supabase-preprod.md) | New Supabase project for QUALITY, schema applied |
| 3 | [03-vercel-projects.md](03-vercel-projects.md) | Three Vercel projects, git auto-deploy disabled, env vars set |
| 4 | [04-octopus-setup.md](04-octopus-setup.md) | Octopus instance, project, environments, lifecycle, deploy steps, approvals |
| 5 | archived | Build workflow on `main` that packages and hands off to Octopus — done |
| 6 | [06-close-the-loop.md](06-close-the-loop.md) | Dry-run the whole pipeline, retarget in-flight feature branch, update docs |

Work through phases in order — each depends on the previous one's outputs (e.g. Phase
5's workflow needs the Octopus API key from Phase 4). A phase is done when every
checkbox in its file is checked; move it to `archive/` at that point per the root
`CLAUDE.md` convention.

## Open question to resolve before Phase 4

Confirm whether `richard-uzik-accenture/OneCodeToRuleThemAll` is private, and if so,
whether it's on a plan that matters for any GitHub-side gating you still want (this
plan no longer relies on GitHub Environments + required reviewers for approvals —
Octopus's manual intervention step replaces that — but it's worth a sanity check that
nothing else in the repo assumes GitHub-side environment protection).

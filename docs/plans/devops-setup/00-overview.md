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
- Octopus Cloud: instance provisioned, environments/lifecycle/project/variables all
  built. **The Vercel deploy step is unfinished** — paused mid-configuration, see
  Phase 4's file for exact resume instructions.
- GitHub Actions: `.github/workflows/release.yml` exists, triggers on push to
  `main`, successfully builds+packages+pushes to Octopus. **Release creation
  currently fails** with a "no viable release plans" error — see Phase 5's file,
  likely caused by the same unfinished Octopus deploy step.

## Resume here next session

1. Finish Octopus's paused "Deploy to Vercel" step — Phase 4's file has the exact
   script and config to paste in.
2. Add the manual intervention approval steps for `preprod`/`prod` (also not done
   yet).
3. Re-trigger the GitHub Actions workflow (push to `main`, or `workflow_dispatch`)
   and see if the "no viable release plans" error clears.
4. If it does: watch the `dev` deploy actually happen, confirm `dev.usereflow.app`
   serves the real app. If it doesn't clear: check the `reflow` project's Channels
   page in Octopus.

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
| 5 | [05-github-actions.md](05-github-actions.md) | Build workflow on `main` that packages and hands off to Octopus |
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

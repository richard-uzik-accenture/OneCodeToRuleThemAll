# DevOps Setup — Overview

Finishes the three-environment pipeline described in the `devops-workflow` skill:
DEV/QUALITY/PROD, each a separate Vercel project with its own Supabase database,
promoted by **Octopus Deploy** from a single build produced on `main`.

## Current state (as of 2026-08-14)

- One Vercel project, currently deploying from `main`.
- One Supabase dev project, one Supabase prod project. No preprod/quality project.
- No `dev` branch. No GitHub Actions workflows. No Octopus instance.
- Repo: `richard-uzik-accenture/OneCodeToRuleThemAll`.

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

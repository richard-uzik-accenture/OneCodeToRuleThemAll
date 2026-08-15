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
- Octopus Cloud: **the whole pipeline works end-to-end** — a release deploys to
  `dev` successfully (Node install via nvm, package extraction, `vercel deploy
  --prebuilt` all succeed). `dev.usereflow.app` is live and serving the real app.
- **Open bug (app-level, not pipeline)**: logging in at `dev.usereflow.app` fails
  with `invalid API key` — Supabase rejecting the anon key the deployed build is
  using. Leading hypotheses documented in Phase 4's file; not yet diagnosed.

## Resume here next session

1. Debug the `invalid API key` login error on `dev.usereflow.app` — start with
   Phase 4's "Current blocker" section, which lists hypotheses in likely order
   (env vars not actually pulled during `vercel build` in CI being the top
   suspect, since Vite inlines env vars at build time and that build happens in
   GitHub Actions, not on Vercel's own infra).
2. Once login works and `dev` is fully green (pipeline *and* app behavior): add
   Manual Intervention approval steps for `preprod`/`prod` in Octopus (deliberately
   not done yet — see Phase 4 for exact steps).
3. Deploy to `preprod`, confirm the approval gate pauses correctly, verify
   `quality.usereflow.app` serves correctly using the `preprod` schema.
4. Only once genuinely ready: approve a real `prod` deploy (never as a test).
5. Then Phase 6: retarget `feature/combat-screen-polish`, update README, archive
   Phase 4 once its checklist is fully checked.

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

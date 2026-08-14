---
name: devops-workflow
description: Branching and deployment workflow for this repo — feature/dev/preprod/main branch flow, DEV/QUALITY/PROD Vercel environments, and GitHub Actions CI/CD with staged approvals. Use when merging branches, promoting code between environments, deploying, or setting up/checking the CI/CD pipeline and environment protection rules.
---

# DevOps Workflow

This describes the **target (wished-state)** branching and deployment model for this
repo. It may not match the current repo state yet — when asked to "align" or "set up"
part of this, diff the current repo/CI config against this document and propose the
gap, don't assume it already exists.

## Branching model

Branches, in promotion order:

```
feature/*  ─┐
fix/*       ├─▶  dev  ─▶  preprod  ─▶  main
docs/*      │
refactor/*  ─┘
```

- **Feature branches**: `type/short-description`
  - `type` ∈ `feature`, `fix`, `docs`, `refactor`
  - `short-description`: 2-4 words identifying the touched component (e.g.
    `feature/morning-flow-new-step`)
  - When work is driven by an implementation plan under `docs/plans/<plan-name>/`
    (see root `CLAUDE.md`), each **phase** of the plan gets its own feature branch.
- **`dev`** — source branch for the DEV deploy pipeline.
- **`preprod`** — source branch for the QUALITY deploy pipeline. Exists only because
  Vercel requires a distinct branch per project/environment; code on `preprod` is
  otherwise identical to what was last promoted from `dev`.
- **`main`** — source branch for the PROD deploy pipeline. Protected: no direct
  pushes, ever.

### Who can merge what

| Merge | Who | Confirmation |
|---|---|---|
| `feature/*` → `dev` | AI or human | AI must ask for explicit confirmation before merging |
| `dev` → `preprod` | AI or human | AI must ask for explicit confirmation before merging |
| `preprod` → `main` | **Human only** | AI must never do this merge, even if asked to "just do it" — refuse and explain, point the human at the merge |

Additional rules:
- Creating/pushing to a new `feature/*` (or `fix/*`, `docs/*`, `refactor/*`) branch
  needs **no confirmation** — that's normal AI-driven dev work.
- Never force-push. Never delete a branch without explicit confirmation, **except**:
  feature branches are configured (repo setting, set up manually by the human) to
  auto-delete on merge — that's expected and not something the AI needs to do or ask
  about.
- A merge into `dev` should have been reviewed/tested by a human before landing —
  don't treat "AI can merge" as "AI should merge unreviewed work."

This git-merge policy is independent from the GitHub Actions pipeline approval gates
below — merging into `preprod` does not itself deploy to QUALITY; it queues a pipeline
run that still needs its own approval (see below).

## Environments

| Env | Branch | Domain | Database | Purpose |
|---|---|---|---|---|
| DEV | `dev` | `dev.usereflow.app` | Separate Supabase dev project | See/test newly implemented features with sample/test data |
| QUALITY | `preprod` | `quality.usereflow.app` | Supabase quality project, daily dropped & reloaded from prod *(not yet implemented)* | See/test features with production-shaped data before prod |
| PROD | `main` | `usereflow.app` | Separate Supabase prod project | Live production |

Each environment is a **separate Vercel project** (not just an environment variable
split), because Vercel projects are what map to custom domains and each needs its own
production branch.

Deploy triggers per environment:
- **DEV** — push to `dev`, OR manual GitHub Actions dispatch, OR Vercel UI redeploy button.
- **QUALITY** — merge/push to `preprod`, OR manual GitHub Actions dispatch, OR Vercel UI redeploy button.
- **PROD** — manual GitHub Actions dispatch only, OR Vercel UI redeploy button (never a bare push trigger).

## CI/CD pipeline design

**One pipeline, staged, not one-pipeline-per-environment.** Every merge to `dev`
creates a single GitHub Actions workflow run with sequential jobs:

```
deploy-dev  ──▶  deploy-quality (needs: deploy-dev)  ──▶  deploy-prod (needs: deploy-quality)
(auto)            (human approval gate)                     (human approval gate)
```

This is implemented with **GitHub Environments + required reviewers**, not with
Azure-DevOps-style "pick which release to promote":
- `dev` job targets a GitHub Environment named `dev` with **no required reviewers** →
  deploys immediately on merge.
- `quality` job targets a GitHub Environment named `quality` with **required
  reviewers** (human only) → the workflow run pauses at this job and shows a "Review
  deployments" button until a human approves.
- `prod` job targets a GitHub Environment named `prod` with **required reviewers**
  (human only) → same pause/approve behavior.
- There is no per-environment separate release list to pick from like Azure DevOps;
  superseded/stale runs on the same branch are handled via a `concurrency:` group so a
  newer push cancels the older in-flight run instead of leaving multiple pending
  approvals.

Setup prerequisites (one-time, likely manual via GitHub UI or `gh api`, verify before
assuming already done):
1. Create GitHub Environments `dev`, `quality`, `prod` under repo Settings →
   Environments.
2. Add required reviewers (human accounts/team) to `quality` and `prod` only.
3. Optionally restrict each environment to deployments from its corresponding branch
   (`dev`/`preprod`/`main`).
4. Note: environment protection rules with required reviewers require the repo to be
   public, or private on GitHub Team/Enterprise — confirm the repo's plan before
   relying on this.

When asked to scaffold this, the AI may author/update
`.github/workflows/*.yml` and `vercel.json` to match this design — check what already
exists first and show the diff/plan before writing, per this repo's normal "surgical
changes" and "confirm before risky/hard-to-reverse actions" rules (root `CLAUDE.md`).
GitHub Environment creation and reviewer assignment itself typically requires repo
admin UI access; the AI can do this via `gh api` if authorized, but should confirm
first since it changes shared repo configuration.

## Guardrails summary

- Never merge `preprod` → `main`. That's human-only, no exceptions.
- Always ask for confirmation before merging `feature/*` → `dev` or `dev` →
  `preprod`.
- Never push directly to `main`.
- Never force-push or delete a branch without explicit confirmation (auto-delete of
  merged feature branches by GitHub itself is expected and needs no confirmation).
- Never trigger/approve a QUALITY or PROD deployment gate — those approvals are
  human-only by design (GitHub required reviewers enforce this technically; don't try
  to work around it via `gh api` or workflow_dispatch tricks).
- Treat any change to `.github/workflows/*`, environment protection rules, or
  `vercel.json` as infra changes — describe the change and confirm before applying.

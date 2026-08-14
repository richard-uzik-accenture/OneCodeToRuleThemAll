---
name: devops-workflow
description: Branching and deployment workflow for this repo — feature/dev/main branch flow, DEV/QUALITY/PROD Vercel environments orchestrated by Octopus Deploy, and the GitHub Actions build that hands releases to Octopus. Use when merging branches, promoting code between environments, deploying, or setting up/checking the CI/CD pipeline and Octopus project.
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
fix/*       ├─▶  dev  ──(PR + review)──▶  main
docs/*      │
refactor/*  ─┘
```

There is **no `preprod` branch**. Environment promotion (dev → preprod → prod) happens
entirely inside Octopus Deploy, from a single build produced on `main` — it is not
modeled as separate git branches. `main` is the only branch that produces a release.

- **Feature branches**: `type/short-description`
  - `type` ∈ `feature`, `fix`, `docs`, `refactor`
  - `short-description`: 2-4 words identifying the touched component (e.g.
    `feature/morning-flow-new-step`)
  - When work is driven by an implementation plan under `docs/plans/<plan-name>/`
    (see root `CLAUDE.md`), each **phase** of the plan gets its own feature branch.
- **`dev`** — integration branch. Feature branches land here first; this is also
  deployed live to the DEV environment so features can be seen/tested with sample
  data before they're promoted.
- **`main`** — source of truth. Protected: no direct pushes, ever. Every push to
  `main` triggers a GitHub Actions build that creates an Octopus release; that one
  release is what flows through dev → preprod → prod inside Octopus.

### Who can merge what

| Merge | Who | Confirmation |
|---|---|---|
| `feature/*` → `dev` | AI or human | AI must ask for explicit confirmation before merging |
| `dev` → `main` (via PR) | **Human only** | AI must never merge this PR, even if asked to "just do it" — refuse and explain, point the human at the merge. AI may open the PR. |

Additional rules:
- Creating/pushing to a new `feature/*` (or `fix/*`, `docs/*`, `refactor/*`) branch
  needs **no confirmation** — that's normal AI-driven dev work.
- Never force-push. Never delete a branch without explicit confirmation, **except**:
  feature branches are configured (repo setting, set up manually by the human) to
  auto-delete on merge — that's expected and not something the AI needs to do or ask
  about.
- A merge into `dev` should have been reviewed/tested by a human before landing —
  don't treat "AI can merge" as "AI should merge unreviewed work."
- The `dev` → `main` PR is where code review happens. Merging it is the trigger for a
  real release, so it carries the same weight the old `preprod` → `main` merge did —
  human-only, no exceptions.

This git-merge policy is independent of Octopus's own deployment approvals below —
merging `dev` → `main` only creates a release and auto-deploys it to the DEV
*environment* inside Octopus; promoting that same release to preprod/prod still needs
its own approval in Octopus.

## Environments

| Env | Deployed by | Domain | Database | Purpose |
|---|---|---|---|---|
| DEV | Octopus, auto on every release | `dev.usereflow.app` | Supabase project A, schema `dev` | See/test newly implemented features with sample/test data |
| QUALITY (preprod) | Octopus, manual approval | `quality.usereflow.app` | Supabase project A, schema `preprod`, daily dropped & reloaded from prod *(not yet implemented)* | See/test features with production-shaped data before prod |
| PROD | Octopus, manual approval | `usereflow.app` | Supabase project B, schema `public` | Live production |

DEV and QUALITY share one physical Supabase project (separate Postgres schemas, not
separate projects) — the free Supabase tier caps at 2 projects, so PROD gets its own
project and DEV+QUALITY split a second one by schema instead of getting a third.
Isolation is schema-level, not project-level: both schemas must be added to that
project's Settings → API → "Exposed schemas" allowlist, and the app selects its schema
via the Supabase client's `db.schema` option (env-var driven), not via a different
URL/key. Auth users are shared across DEV and QUALITY since Supabase Auth is
project-wide, not per-schema — acceptable since these hold test accounts, not real
user data. If either environment ever needs true physical isolation (e.g. this stops
being free-tier), split them into separate projects then; nothing else in this design
depends on the schema-sharing being permanent.

Each environment is a **separate Vercel project** (not just an environment variable
split), because Vercel projects are what map to custom domains. All three are deployed
from the *same build artifact* — Octopus targets each project's Vercel API/CLI
credentials per environment, it does not rely on Vercel's own git-branch-to-project
mapping. Vercel's automatic git deployments should be **disabled** on all three
projects once Octopus is wired up, so there is exactly one deploy path per
environment, not two racing ones.

Deploy triggers per environment, all orchestrated by Octopus after a release exists:
- **DEV** — automatic, as soon as the release is created.
- **QUALITY** — manual approval inside Octopus (human only).
- **PROD** — manual approval inside Octopus (human only), typically after verifying
  QUALITY.

## CI/CD pipeline design

**GitHub Actions builds and hands off; Octopus orchestrates the promotion.** These are
two separate systems with a narrow handoff between them — don't conflate "the
pipeline" as one GitHub Actions concept, since most of the promotion logic (dev →
preprod → prod, approvals) lives in Octopus, not in workflow YAML.

```
push to main
   └─▶ GitHub Actions: build
          └─▶ octo pack        (package build output)
          └─▶ octo push        (upload package to Octopus built-in repo)
          └─▶ octo create-release
                 └─▶ Octopus: deploy to dev        (auto)
                 └─▶ Octopus: deploy to preprod     (await approval in Octopus)
                 └─▶ Octopus: deploy to prod        (await approval in Octopus)
```

- GitHub Actions' job ends at `create-release`. It does not itself deploy to any
  environment or gate on approvals — that would duplicate what Octopus already does.
- Octopus owns: the environments (`dev`/`preprod`/`prod`), the lifecycle (which
  environments a release must pass through and in what order), the deploy step per
  environment (calling the Vercel API/CLI with that environment's project
  credentials, sourced from Octopus variable sets scoped per-environment), and the
  manual intervention/approval steps for preprod and prod.
- Approvals are **Octopus's built-in manual intervention step**, not GitHub
  Environments + required reviewers. GitHub Environments are not part of this
  pipeline's approval model anymore.

Setup prerequisites (one-time, verify before assuming already done):
1. An Octopus Deploy instance (Cloud or self-hosted) — does not exist yet, see the
   setup plan below.
2. An Octopus **project** with three environments (`dev`, `preprod`, `prod`) and a
   lifecycle enforcing that order, one for this app.
3. A deploy process/step template per environment that deploys the packaged build to
   that environment's Vercel project (via Vercel CLI or API), reading that
   environment's Supabase/Vercel credentials from Octopus-scoped variables.
4. Manual intervention steps attached to the preprod and prod deploy steps, restricted
   to the human's Octopus user/team.
5. An Octopus API key and server URL stored as **GitHub Actions secrets** (repo-level
   is fine here — Octopus itself is the approval boundary, not GitHub Environments).
6. `octopus.com/GitHubActions` actions (`create-release`, `push-package`, or the
   combined `octopusdeploy/push-package-action` / `deploy-release-action`) wired into
   `.github/workflows/*.yml` for the `main` push trigger.

When asked to scaffold this, the AI may author/update `.github/workflows/*.yml` to
match this design — check what already exists first and show the diff/plan before
writing, per this repo's normal "surgical changes" and "confirm before risky/hard-to-
reverse actions" rules (root `CLAUDE.md`). Creating the Octopus project, environments,
lifecycle, and deploy steps happens in the Octopus UI/API and typically needs the
human directly — the AI can help via Octopus's CLI/API if authorized, but should
confirm first since it's shared infrastructure configuration.

## Guardrails summary

- Never merge the `dev` → `main` PR. That's human-only, no exceptions — it's what
  creates a real release.
- Always ask for confirmation before merging `feature/*` → `dev`.
- Never push directly to `main`.
- Never force-push or delete a branch without explicit confirmation (auto-delete of
  merged feature branches by GitHub itself is expected and needs no confirmation).
- Never trigger/approve an Octopus preprod or prod deployment — those approvals are
  human-only by design (Octopus manual intervention enforces this technically; don't
  try to work around it via the Octopus API or CLI).
- Treat any change to `.github/workflows/*`, the Octopus project/environments/
  lifecycle/deploy process, or Vercel project settings as infra changes — describe the
  change and confirm before applying.

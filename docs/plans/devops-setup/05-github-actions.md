# Phase 5 — GitHub Actions build + Octopus handoff

GitHub Actions' job: build **once** on push to `main` using Vercel's own build
wrapper (so the output is a `vercel deploy --prebuilt`-compatible bundle, not just a
generic `vite build`), package it, and hand off to Octopus. It does not deploy to any
environment and does not gate on approvals — that's all Octopus (Phase 4), which then
runs `vercel deploy --prebuilt` against each environment's Vercel project using the
identical package, satisfying "build once, promote everywhere."

## Why `vercel build`, not `npm run build`

The Octopus deploy step (Phase 4f) runs `vercel deploy --prebuilt`, which expects a
`.vercel/output` directory in Vercel's own build-output format — not just the raw
`dist/` folder Vite produces. `vercel build` (Vercel CLI) wraps the normal Vite build
and produces that format. The workflow needs Vercel CLI installed and **linked to a
project** to run `vercel build` at all (it reads `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`
env vars or a `.vercel/project.json` to know how to build) — linking to the DEV
project's ID is fine, since the build output isn't project-specific until deploy time;
Octopus overwrites `.vercel/project.json` per environment right before deploying (see
Phase 4f's script).

## Deliverables

- [ ] Add these as **GitHub Actions repo secrets** (Settings → Secrets and variables
      → Actions):
      - `OCTOPUS_SERVER_URL` — the Octopus Cloud instance URL from Phase 4.
      - `OCTOPUS_API_KEY` — an Octopus API key for a service account (Octopus →
        profile → "My API Keys" → generate one; scope it to this project if Octopus
        supports scoped keys).
      - `VERCEL_TOKEN` — a Vercel token (can reuse the one already rotated into
        Octopus's `VercelToken` variable, or mint a separate one for CI — separate is
        slightly cleaner for revocation, but either works).
      - `VERCEL_ORG_ID` — the Team/Org ID (same value as Octopus's `VercelOrgId`).
      - `VERCEL_PROJECT_ID` — the **DEV** project's ID (used only to make `vercel
        build` runnable; irrelevant to which environment ends up deployed).
- [ ] Write `.github/workflows/release.yml`:
      - Trigger: `on: push` to `main`, plus `workflow_dispatch` for manual re-runs.
      - `concurrency:` group keyed on the ref, so a superseding push cancels a
        stale in-flight run instead of leaving two releases racing.
      - Steps:
        1. Checkout.
        2. `npm ci`.
        3. `npm install -g vercel` (or use `amondnet/vercel-action`'s bundled CLI).
        4. `vercel pull --yes --environment=production --token=$VERCEL_TOKEN` — links
           the checkout to the DEV project and pulls its env config, which
           `vercel build` needs present.
        5. `vercel build --prod --token=$VERCEL_TOKEN` — produces `.vercel/output/`.
        6. `OctopusDeploy/create-zip-package-action@v4` — zips `.vercel/output/`
           into a package named **`reflow`** (must match the package ID referenced
           in Octopus's deploy step from Phase 4f), version
           `1.0.${{ github.run_number }}`. **Not** `octo pack` — that's the legacy,
           deprecated Octopus CLI command (binary `octo`); this dedicated action is
           the modern equivalent and avoids needing any CLI installed at all. First
           attempt used `octo pack` via `install-octopus-cli-action`, which installs
           the *new* CLI (binary `octopus`, no `octo` command) — caused a `command not
           found` failure. Fixed by switching to this action.
        7. `OctopusDeploy/push-package-action@v4` — upload that package (referenced
           via the previous step's `package_file_path` output) to the Octopus
           built-in repository. Talks to the Octopus API directly, no CLI dependency.
        8. `OctopusDeploy/create-release-action@v4` — create the release in the
           `reflow` Octopus project, which triggers Octopus's lifecycle: auto-deploys
           to `dev`, waits for manual approval before `preprod`/`prod`. Also API-based,
           no CLI dependency.
      - Verified against the actual action READMEs (2026-08): push/create-release/
        create-zip-package actions read `OCTOPUS_URL`/`OCTOPUS_API_KEY` from job-level
        `env:`, not `with:` inputs — see the committed workflow for the exact shape.
- [ ] Verify: pushing to `main` produces a GitHub Actions run that ends in a new
      Octopus release, visible in the Octopus dashboard, with the `dev` deployment
      already underway automatically. Confirm the package Octopus received actually
      contains a working `.vercel/output` (deploy to dev succeeding is the real
      proof).

## Then, unblocks Phase 4f

Once this workflow has run at least once, a real `reflow` package exists in
Octopus's built-in repository — go back to the paused "Deploy to Vercel" step in the
Octopus project (Phase 4f) and finish adding the package reference; it can now
resolve the package ID.

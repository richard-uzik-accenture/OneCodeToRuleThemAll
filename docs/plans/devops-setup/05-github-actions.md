# Phase 5 — GitHub Actions build + Octopus handoff

GitHub Actions' only job in this model is: build on push to `main`, package, and hand
off to Octopus. It does not deploy to any environment and does not gate on approvals
— that's all Octopus, from Phase 4.

## Deliverables

- [ ] Add Octopus server URL and API key (from Phase 4) as GitHub Actions secrets.
      Repo-level secrets are fine here — Octopus's manual intervention steps are the
      approval boundary, not GitHub Environments.
- [ ] Write `.github/workflows/release.yml`:
      - Trigger: `on: push` to `main`, plus `workflow_dispatch` for manual re-runs.
      - Steps: checkout, install deps, `npm run build`, `octo pack` the build output,
        `octo push` to the Octopus built-in repository, `octo create-release`
        (use `octopusdeploy/push-package-action` + `octopusdeploy/create-release-action`,
        or the raw `octo` CLI — either is fine, prefer the official actions).
      - Add a `concurrency:` group keyed on `main` so a superseding push doesn't leave
        two builds racing to create releases.
- [ ] Verify: pushing to `main` produces a GitHub Actions run that ends in a new
      Octopus release, visible in the Octopus dashboard, with dev deployment already
      underway automatically.

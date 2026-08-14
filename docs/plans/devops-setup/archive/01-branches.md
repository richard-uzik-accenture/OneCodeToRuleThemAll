# Phase 1 — Branches

Only `dev` needs to be created. There is no `preprod` branch in this model — don't
create one.

## Deliverables

- [x] `dev` branch exists, in sync with `main`.
- [x] Repo made public (required for branch protection to actually enforce on this
      GitHub plan — private repos need Team/Enterprise for that).
- [x] `main` protected in GitHub Settings → Branches: require a pull request before
      merging. Required-approvals count set to 0 (not 1) — a solo maintainer can never
      approve their own PR, so a nonzero count would permanently block merging.
- [x] "Automatically delete head branches" enabled in Settings → General.
- [x] `preprod` branch deleted (local + remote) — no unique commits, purely a leftover
      from the earlier per-branch model this plan no longer uses.
- [x] First `dev` → `main` PR merged (#1), carrying the Octopus-model skill/plan docs
      themselves through the new flow as a dry run.

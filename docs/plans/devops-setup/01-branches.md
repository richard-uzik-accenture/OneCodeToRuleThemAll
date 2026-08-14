# Phase 1 — Branches

Only `dev` needs to be created. There is no `preprod` branch in this model — don't
create one.

## Deliverables

- [ ] Cut `dev` from `main`:
      `git checkout main && git pull && git checkout -b dev && git push -u origin dev`.
      Verify: `git branch -a` shows `origin/dev`, identical to `main` at this point.
- [ ] Protect `main` in GitHub Settings → Branches: require a pull request before
      merging, no direct pushes, require at least one approval.
      Verify: a direct `git push origin main` from a local branch is rejected.
- [ ] Turn on "Automatically delete head branches" in Settings → General, so feature
      branches disappear after merging into `dev`.
- [ ] If a `preprod` branch already exists from earlier exploration, confirm with the
      user before deleting it — don't delete branches that might hold work.

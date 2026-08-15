# Phase 4 — Octopus Deploy setup

**The deploy pipeline itself now works end-to-end.** Octopus successfully deployed a
release to `dev` via the `Deploy to Vercel` step — Node install, package extraction,
and `vercel deploy --prebuilt` all completed successfully. What's left is one real app
bug (`invalid API key` on login at `dev.usereflow.app`) that's a Supabase/env-var
config issue, not a pipeline issue — see "Current blocker" below — plus the
not-yet-started manual intervention approval steps.

## Deliverables

- [x] Provisioned Octopus Cloud (free Starter tier).
- [x] Created environments, in order: `dev`, `preprod`, `prod`.
- [x] Lifecycle: built-in **"Default Lifecycle"**, unmodified — its default
      conventions already enforce dev → preprod → prod ordering.
- [x] Created the Octopus project **`reflow`** (process/variables stored in Octopus,
      not Config-as-Code; deploy target type "Other").
- [x] Project variables added, one name per variable with environment-scoped rows
      (`VercelToken`, `VercelOrgId`, `VercelProjectId`, `SupabaseUrl`,
      `SupabaseAnonKey`, `SupabaseSchema` — see git history for the full table if
      needed).
- [x] Generated an Octopus API key for GitHub Actions (in the `OCTOPUS_API_KEY`
      GitHub secret).
- [x] `Deploy to Vercel` step: Run a Script, Bash, "Run once on a worker", Referenced
      Package `reflow`. Current working script (installs Node via `nvm` since the
      worker has no root/sudo, then runs `vercel deploy --prebuilt`):
      ```bash
      set -euo pipefail

      echo "Deploying package to Vercel project #{VercelProjectId} (environment: #{Octopus.Environment.Name})"

      if ! command -v npx >/dev/null 2>&1; then
        echo "Node.js not found on worker, installing via nvm (no root needed)..."
        export NVM_DIR="$HOME/.nvm"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
      fi

      PACKAGE_DIR="#{Octopus.Action.Package[reflow].ExtractedPath}"
      cd "$PACKAGE_DIR"

      mkdir -p .vercel
      cat > .vercel/project.json <<EOF
      {
        "projectId": "#{VercelProjectId}",
        "orgId": "#{VercelOrgId}"
      }
      EOF

      npx --yes vercel deploy --prebuilt --prod --token="#{VercelToken}" --yes
      ```
- [x] **Confirmed working**: a release deployed to `dev` successfully through this
      entire script — Node installed, package extracted, Vercel deploy succeeded.
- [ ] **Open bug**: `dev.usereflow.app` returns `invalid API key` on login attempt.
      See "Current blocker" below.
- [ ] Not started: manual intervention approval steps for `preprod`/`prod`.
      Deliberately deferred until the `dev` app bug above is fixed and login actually
      works — no point gating preprod/prod before dev is fully green end-to-end
      (pipeline *and* app behavior).

## Current blocker: `invalid API key` on `dev.usereflow.app`

The deploy succeeded (Octopus says success, site loads), but logging in fails with
an `invalid API key` error — this is Supabase rejecting the anon key the deployed
app is using, not an Octopus/pipeline problem.

**Not yet diagnosed — start here next session:**

Leading hypotheses, in likely order, to check:
1. **`vercel deploy --prebuilt` may not inject Vercel's dashboard-configured env
   vars the way a normal `vercel build`-on-Vercel's-infra deploy would.** Our GitHub
   Actions workflow runs `vercel build` *locally in CI*, which bakes `import.meta.env.
   VITE_SUPABASE_*` values into the built JS bundle at build time (Vite inlines env
   vars at build, not runtime). The `vercel pull --environment=production` step in
   the workflow is supposed to pull the DEV Vercel project's env vars before
   building — but confirm this actually happened by checking whether the build step
   in the most recent GitHub Actions run shows evidence of pulling real
   `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` values (check `.vercel/.env.
   production.local` presence/contents in the build logs, or add a debug echo).
2. **The DEV Vercel project's env vars themselves may be wrong/stale** — go to the
   DEV Vercel project → Settings → Environment Variables and manually verify
   `VITE_SUPABASE_ANON_KEY` matches the actual current anon key from the Supabase
   dashboard (Project Settings → Data API). Keys don't rotate on their own, but worth
   a direct check rather than assuming.
3. **Since `vercel build` bakes env vars in at CI build time, not deploy time**, the
   *same build* gets reused for whichever Vercel project's `VercelProjectId` the
   Octopus step targets. That's fine for DEV (since `VERCEL_PROJECT_ID` in the GitHub
   Actions secrets is already the DEV project), but worth double-checking there's no
   mismatch — confirm `VERCEL_PROJECT_ID` (GitHub secret, used for the `vercel pull`/
   `vercel build` steps) really is the DEV project's ID, matching what `VercelProjectId`
   in Octopus resolves to for the `dev` environment.
4. If all of the above check out, inspect the actual deployed bundle
   (`dev.usereflow.app`, browser dev tools → Network tab → find the failing
   Supabase request → check what URL/key it's actually sending) to see directly
   what value shipped, rather than reasoning about it further.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition runs for dev/preprod/prod, just with different variable values.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.
- Full debugging history (sudo/root dead-ends, the `.vercel/output` packaging bug,
  the release-snapshot gotcha) is preserved in git history on this file and in
  `.github/workflows/release.yml`'s commit messages — not repeated here now that
  those are resolved, to keep this file focused on what's still open.

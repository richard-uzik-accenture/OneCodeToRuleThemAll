# Phase 4 — Octopus Deploy setup

**The full pipeline now works end-to-end, including a working login.** GitHub
Actions builds and packages, Octopus deploys to `dev` via Vercel, and
`dev.usereflow.app` serves a real, working app. What's left: apply the same fix to
QUALITY/PROD's env vars, then add manual intervention approval steps for
`preprod`/`prod`.

## Deliverables

- [x] Provisioned Octopus Cloud (free Starter tier).
- [x] Created environments, in order: `dev`, `preprod`, `prod`.
- [x] Lifecycle: built-in **"Default Lifecycle"**, unmodified — its default
      conventions already enforce dev → preprod → prod ordering.
- [x] Created the Octopus project **`reflow`** (process/variables stored in Octopus,
      not Config-as-Code; deploy target type "Other").
- [x] Project variables added, one name per variable with environment-scoped rows
      (`VercelToken`, `VercelOrgId`, `VercelProjectId`, `SupabaseUrl`,
      `SupabaseAnonKey`, `SupabaseSchema`).
- [x] Generated an Octopus API key for GitHub Actions (in the `OCTOPUS_API_KEY`
      GitHub secret).
- [x] `Deploy to Vercel` step: Run a Script, Bash, "Run once on a worker", Referenced
      Package `reflow`. Working script (installs Node via `nvm` since the worker has
      no root/sudo, then runs `vercel deploy --prebuilt`):
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
- [x] **Confirmed working end-to-end**: release deploys to `dev` successfully, and
      login at `dev.usereflow.app` works — verified by inspecting the live network
      request (`apikey` header carries the real `sb_publishable_...` key, not a
      placeholder).
- [ ] Apply the same env-var fix to QUALITY and PROD (see "Root cause" below) —
      they currently work via their old Vercel-native deploys, but will need this fix
      before they're ever redeployed through Octopus.
- [ ] Not started: manual intervention approval steps for `preprod`/`prod`. Add once
      confident in the base deploy path (now proven for `dev`).

## Root cause (resolved) — Vercel "Sensitive" env vars break CLI-driven builds

`dev.usereflow.app` returned `invalid API key` on login after a successful-looking
deploy. Diagnosed by fetching the live built JS bundle directly (via Playwright,
bypassing browser devtools redaction) and finding the literal 11-character string
`[SENSITIVE]` baked in at the exact position where the Supabase anon key should be
— confirmed at the byte level, not a display artifact.

Cause: `VITE_SUPABASE_ANON_KEY` was marked **"Sensitive"** in Vercel (Vercel
auto-suggests this for any var whose name contains `VITE_`/`key`). Per Vercel's docs,
Sensitive values are only guaranteed readable "within the Vercel build container" —
QUALITY/PROD worked because their live deployments were built by Vercel's own git
integration (before we disabled it), which has that access. DEV's build runs via
`vercel build` inside GitHub Actions, authenticated with a bare `--token`, which
could not decrypt the Sensitive value and silently substituted a placeholder instead
of failing loudly.

**Fix applied**: unmarked `VITE_SUPABASE_ANON_KEY` as Sensitive on the DEV Vercel
project, triggered a fresh GitHub Actions run (new build = new bundle with the real
value), created a new Octopus release, deployed to `dev`. Confirmed working.

This is not a security regression — the Supabase anon/publishable key
(`sb_publishable_...`) is designed to be public; it ships in client JS on every
Supabase app by design. Real access control is enforced by RLS policies
(`auth.uid() = user_id` on `tasks`), not by hiding this key. Discussed and confirmed
with the user before unmarking.

**Still to do**: unmark Sensitive on `VITE_SUPABASE_ANON_KEY` for the **QUALITY and
PROD** Vercel projects too, so they don't hit the same bug whenever they're first
deployed through Octopus (they haven't been yet — still on old Vercel-native
deploys).

## Pre-launch follow-up (not part of devops-setup, don't lose this)

Before real users/payments go live, do a focused RLS/security audit: confirm every
table in `supabase/migrations/` has RLS enabled with policies correctly scoping
every operation (select/insert/update/delete) to the authenticated user, not just
`tasks`. Explicitly deferred by the user during this session to keep focus on
finishing the deploy pipeline — flagged here so it isn't forgotten before launch.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition runs for dev/preprod/prod, just with different variable values.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.
- Full debugging history (sudo/root dead-ends, the `.vercel/output` packaging bug,
  the release-snapshot gotcha, this Sensitive-var bug) is preserved in git history on
  this file and in `.github/workflows/release.yml`'s commit messages.

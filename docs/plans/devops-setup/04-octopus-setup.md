# Phase 4 — Octopus Deploy setup

**The full pipeline is built, tested, and has been used for a real production
deployment.** GitHub Actions builds and packages on every push to `main`, creates
a matching-numbered Octopus release, `dev` auto-deploys, `preprod`/`prod` require
manual approval in Octopus, and a real release has been approved through all three
environments — `usereflow.app` is confirmed live and serving that build. Only the
"approve outside Octopus's web UI" nice-to-have remains unbuilt.

## Deliverables

- [x] Provisioned Octopus Cloud (free Starter tier).
- [x] Created environments, in order: `dev`, `preprod`, `prod`.
- [x] Lifecycle: built-in **"Default Lifecycle"**, unmodified.
- [x] Created the Octopus project **`reflow`**.
- [x] Project variables: `VercelToken`, `VercelOrgId`, `VercelProjectId`,
      `SupabaseUrl`, `SupabaseAnonKey`, `SupabaseSchema` — one name per variable,
      environment-scoped rows.
- [x] Generated an Octopus API key for GitHub Actions.
- [x] `Deploy to Vercel` step (step 2 in the process): Run a Script, Bash, "Run once
      on a worker", Referenced Package `reflow`. Installs Node via `nvm` (worker has
      no root/sudo), then runs `vercel deploy --prebuilt`:
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
- [x] Root-caused and fixed the `invalid API key` login bug — see "Env var fix"
      below. Unmarked Sensitive on **all three** Vercel projects (DEV, QUALITY,
      PROD), not just DEV.
- [x] **Manual Intervention approval gate** — step 1 in the process, runs *before*
      `Deploy to Vercel`:
      - Step type: Manual Intervention, name `Approve Deployment`.
      - Instructions text: "Review this release before promoting it to
        #{Octopus.Environment.Name}. Confirm the deployment to the previous
        environment looked correct before approving."
      - Scoped via Configure features → Environments → "Run only for specific
        environments" → `preprod` + `prod` (not `dev`, which stays automatic).
      - **Responsible Teams: "Space Managers"**, not "Octopus Administrators" — the
        account that created this Octopus Cloud instance is a Space Manager but
        is *not* automatically a member of Octopus Administrators, and lacks the
        `AdministerSystem` permission needed to add itself to that team. If
        approvals ever get stuck on "must be assigned" with no way to assign,
        check which team the step is actually scoped to and confirm your user is
        really a member of it — don't assume instance-owner implies
        Administrators membership.
      - New steps append to the *end* of the process by default — this step had
        to be manually reordered to run first. If Octopus's UI doesn't offer
        drag-and-drop, look for a per-step reorder control (varies by version).
- [x] **Verified working, for real**: deployed a release through `dev` (auto) →
      `preprod` (approved, gate correctly paused first) → `prod` (approved).
      `usereflow.app` confirmed serving that exact release.
- [x] **Version traceability**: package version, Octopus `release_number`, and an
      in-app badge all driven by the same `0.0.${{ github.run_number }}` value from
      the GitHub Actions workflow (see `.github/workflows/release.yml`), plus the
      short commit SHA. A device's live site directly shows e.g. `v0.0.16 ·
      afb799e`, traceable to both the exact Octopus release and GitHub commit
      without opening Octopus. Versioning is deliberately manual for the middle
      number — stays `0.0.x` incrementing forever unless the user explicitly asks
      to bump to `0.1.0` for a real milestone; nothing auto-bumps it.
- [ ] **Not built — nice to have**: approve preprod/prod deployments from outside
      Octopus's web UI (phone notification, email with an approve action, etc.).
      Requested by the user, not yet scoped. Octopus Cloud has built-in
      subscription/notification features (Slack, email, webhooks) that could
      *notify* on a pending approval, but a notification alone isn't the same as
      an *approve action* from that channel — investigate what Octopus actually
      supports here (likely: notify via email/Slack that something is pending,
      human still clicks through to the web UI to approve; a true one-tap mobile
      approve would need more — e.g. a webhook receiver with its own auth) before
      promising more than is realistic.

## Env var fix — Vercel "Sensitive" flag breaks CLI-driven builds

`dev.usereflow.app` returned `invalid API key` on login after a successful-looking
deploy. Root cause: `VITE_SUPABASE_ANON_KEY` was marked **"Sensitive"** in Vercel.
Per Vercel's docs, Sensitive values are only guaranteed readable "within the Vercel
build container" — QUALITY/PROD were unaffected at the time because their live
deployments were built by Vercel's own git integration (before it was disabled),
which has that access; DEV's build runs via `vercel build` inside GitHub Actions
with a bare `--token`, which could not decrypt the Sensitive value and silently
substituted the literal string `[SENSITIVE]` instead of failing loudly. Confirmed
at the byte level by fetching the live built JS bundle directly via Playwright.

Not a security regression: the Supabase anon/publishable key is designed to be
public (ships in client JS on every Supabase app); real access control is RLS
policies (`auth.uid() = user_id` on `tasks`), not hiding this key. Confirmed with
the user before unmarking. Fixed on all three Vercel projects.

## Pre-launch follow-up (not part of devops-setup, don't lose this)

Before real users/payments go live, do a focused RLS/security audit: confirm every
table in `supabase/migrations/` has RLS enabled with policies correctly scoping
every operation (select/insert/update/delete) to the authenticated user, not just
`tasks`. Deliberately deferred to keep focus on finishing the deploy pipeline.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition runs for dev/preprod/prod, just with different variable values.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.
- Full debugging history (sudo/root dead-ends, the `.vercel/output` packaging bug,
  the release-snapshot gotcha, the Sensitive-var bug, the version-sync fix) is
  preserved in git history on this file and in `.github/workflows/release.yml`'s
  commit messages.

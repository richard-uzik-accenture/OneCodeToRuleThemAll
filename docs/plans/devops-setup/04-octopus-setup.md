# Phase 4 — Octopus Deploy setup

Octopus Cloud instance provisioned, environments/lifecycle/project/variables built,
`Deploy to Vercel` step exists and runs. **Currently blocked on installing Node.js
without root** — the dynamic worker's user has no passwordless sudo (confirmed via
two failed sudo-based attempts). Current fix uses `nvm` for a user-space install, no
root needed; written into the step's script below, needs to be pasted in and
re-tested. Resume there.

**Important, learned the hard way**: Octopus **releases snapshot the deployment
process at creation time** — editing a step's script does NOT affect releases already
created, only ones created afterward. After changing this step, you must create a
*new* release (push to `main`, or `workflow_dispatch` on the GitHub Actions workflow)
before redeploying — redeploying an old release just re-runs its old snapshot and
looks like the edit "didn't save" even when it did.

## Deliverables

- [x] Provisioned Octopus Cloud (free Starter tier). Site URL/instance chosen by
      user, host region set to a European region (closer to Supabase's `eu-west-3`).
- [x] Created environments, in order: `dev`, `preprod`, `prod`. "Dynamic
      Infrastructure" left unchecked on each (no auto-registering deployment targets
      — we don't use Octopus-managed infrastructure at all, deploys go straight to
      Vercel's API).
- [x] Lifecycle: using the built-in **"Default Lifecycle"** as-is, not a custom one.
      Its "default conventions" already enforce dev → preprod → prod ordering because
      it auto-includes environments in the order they were created.
- [x] Created the Octopus project: **`reflow`**. Settings: process/variables stored
      in Octopus (not Config-as-Code/Git), deploy target type **"Other"** (none of
      Kubernetes/Azure/AWS/Linux/Windows fit — we deploy via a scripted Vercel API
      call, not to Octopus-managed infrastructure).
- [x] Project variables added, **one name per variable with multiple environment-
      scoped rows** (not per-environment variable names — keeps the deploy step's
      script identical across all three environments):
      - `VercelToken` — scoped to dev, preprod, prod (same rotated token).
      - `VercelOrgId` — scoped to dev, preprod, prod (same Team ID).
      - `VercelProjectId` — three rows, one value per environment (dev/preprod/prod
        Vercel project IDs).
      - `SupabaseUrl` — one row scoped to dev+preprod (shared Supabase project), one
        row scoped to prod (separate project).
      - `SupabaseAnonKey` — same shape as `SupabaseUrl`.
      - `SupabaseSchema` — three rows: `public` (dev), `preprod` (preprod), `public`
        (prod).
- [x] Generated an Octopus API key (Full access, 1 year expiry) for the GitHub
      Actions service account. Value is in the `OCTOPUS_API_KEY` GitHub secret
      (Phase 5) — not recorded here.
- [x] `Deploy to Vercel` step exists in the project's deployment process: Run a
      Script, Bash, Execution Location **"Run once on a worker"**, Referenced Package
      `reflow` (Octopus Server built-in feed, version left blank, extract-on-deploy
      checked).
- [x] Confirmed a real release (`0.0.1`, package `reflow` v1.0.4) builds a **viable
      release plan** in Octopus — the earlier "no viable release plans" error is
      resolved now that the deploy step exists and references the package.
- [ ] **Open**: manually deploying release `0.0.1` to `dev` fails inside the `Deploy
      to Vercel` step — see "Current blocker" below.
- [ ] Not started: manual intervention approval steps for `preprod`/`prod`.
      Deliberately deferred until `dev` deploys successfully at least once — no point
      adding approval-gate complexity before the base deploy path is proven. Revisit
      once `dev` is green.

## Current blocker

Manually clicking "Deploy to dev" on release `0.0.1` got through package
acquisition and started the `Deploy to Vercel` step, but failed:

```
/home/Octopus/Work/.../Script.sh: line 16: npx: command not found
The remote script failed with exit code 127
```

Octopus's dynamic Ubuntu worker (`UbuntuDefault` pool) has no Node.js/npm
preinstalled — it's a generic Linux worker, not a JS-toolchain image. Two ways to
fix this were considered: install Node inline in the script (chosen — no new Octopus
concepts needed), or switch the step to run inside a Docker execution container like
`octopusdeploy/worker-tools` (deferred as a possible later optimization, not needed
now).

**Revision history on this fix** — two earlier attempts failed before landing on the
current approach:
1. `sudo apt-get install -y nodejs` (via NodeSource) — failed: `sudo: a terminal is
   required to read the password`.
2. Same, with `id -u` root-check + `sudo -n` (non-interactive) fallback — failed
   definitively: `sudo: a password is required`. Confirms the worker's user has no
   passwordless sudo at all, root-owned install approaches are a dead end here.
3. **Current**: install Node via `nvm` into `$HOME/.nvm` — no root/sudo needed at
   all, since it's a pure user-space install. This is the version below.

### Fix — paste this updated script into the `Deploy to Vercel` step

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

### Next steps to finish this phase

1. Open the `Deploy to Vercel` step, replace its script body with the fixed version
   above, save.
2. Deploy release `0.0.1` to `dev` again (Releases → `0.0.1` → "Deploy to dev...").
   Watch for the Node install lines in the log, then confirm `npx vercel deploy`
   actually runs and succeeds.
3. If it succeeds: check `dev.usereflow.app` in a browser to confirm the real app is
   live there (not just "Octopus said success" — verify the actual site).
4. If it fails again: paste the new log — likely next candidates are Vercel auth
   (`VercelToken` invalid/expired) or project linking (`VercelProjectId`/`VercelOrgId`
   mismatch), not infrastructure this time.
5. Once `dev` deploys are reliably green: add Manual Intervention approval steps for
   `preprod`/`prod`. Add Step → search "Manual Intervention" → scope via "Configure
   features" → Environments → "Run only for specific environments" → `preprod` +
   `prod` → restrict approver to the human's Octopus user/team → **place this step
   before `Deploy to Vercel` in the step order** (drag/reorder if Octopus appends it
   at the bottom). No gate on `dev`.
6. After that: deploy the same release to `preprod`, confirm the approval gate
   actually pauses and requires a click, then approve and confirm it deploys to
   `quality.usereflow.app` using the `preprod` schema/Vercel project. Repeat for
   `prod` only when genuinely ready to go live — don't approve prod as a test.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition runs for dev/preprod/prod, just with different variable values.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.

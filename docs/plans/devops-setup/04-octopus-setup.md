# Phase 4 — Octopus Deploy setup

Octopus Cloud instance provisioned, environments/lifecycle/project/variables built.
**One step is deliberately left unfinished**: the "Deploy to Vercel" step's package
reference — see "Where we paused" below. Resume there.

## Deliverables

- [x] Provisioned Octopus Cloud (free Starter tier). Site URL/instance chosen by
      user, host region set to a European region (closer to Supabase's `eu-west-3`).
- [x] Created environments, in order: `dev`, `preprod`, `prod`. "Dynamic
      Infrastructure" left unchecked on each (no auto-registering deployment targets
      — we don't use Octopus-managed infrastructure at all, deploys go straight to
      Vercel's API).
- [x] Lifecycle: using the built-in **"Default Lifecycle"** as-is, not a custom one.
      Its "default conventions" already enforce dev → preprod → prod ordering because
      it auto-includes environments in the order they were created (see the
      Lifecycle's own Phases description). No explicit phases needed.
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
      - Note: an earlier attempt used per-environment variable *names* (e.g.
        `SupabaseSchemaProd`) — this was corrected to the scoped-single-name pattern
        before building the deploy step, to avoid needing per-environment branching
        logic in the script.
- [x] Generated an Octopus API key (Full access, 1 year expiry) for the GitHub
      Actions service account. Value is in the `OCTOPUS_API_KEY` GitHub secret
      (Phase 5) — not recorded here.
- [ ] **Paused, not finished**: the "Deploy to Vercel" deployment process step. See
      below.

## Where we paused — resume here next session

On the project's **Process** page, added one step:

- **Type**: Run a Script (not "Deploy a Package" — that step type assumes a
  registered Tentacle/deployment-target machine, which we don't have; "Run a Script"
  with a referenced package is the correct fit for calling an external API like
  Vercel's).
- **Step name**: `Deploy to Vercel`
- **Script Source**: Inline, language **Bash**
- **Execution Location**: **"Run once on a worker"**
- **Referenced Packages**: attempted to add a reference with Name/Package ID
  `reflow`, but Octopus rejected it — **"Please select a package ID"** — because at
  that point no package named `reflow` had ever been pushed to the built-in
  repository yet (chicken-and-egg: the reference picker validates against packages
  that already exist). Decision made at the time: pause this step, go build Phase 5
  (GitHub Actions) first so a real `reflow` package exists, then come back.

**As of this session, Phase 5's workflow has successfully pushed real `reflow`
packages** (e.g. `reflow.1.0.3`) to Octopus's built-in repository — confirmed via the
"Push package to Octopus" workflow step going green. So the blocker is gone.

### Next steps to finish this phase

1. Go back to the `reflow` project's Process page, open (or re-add, if it didn't
   save) the `Deploy to Vercel` step.
2. Add the Referenced Package: Package feed = Octopus Server (built-in), Name/ID =
   `reflow`, Version = leave blank (always use the release's version), Package
   Acquisition = default, "Extract package during deployment" = checked. It should
   now resolve since real `reflow` packages exist.
3. Paste this script body (Bash):
   ```bash
   set -euo pipefail

   echo "Deploying package to Vercel project #{VercelProjectId} (environment: #{Octopus.Environment.Name})"

   PACKAGE_DIR="#{Octopus.Action.Package[reflow].ExtractedPath}"
   cd "$PACKAGE_DIR"

   mkdir -p .vercel
   cat > .vercel/project.json <<EOF
   {
     "projectId": "#{VercelProjectId}",
     "orgId": "#{VercelOrgId}"
   }
   EOF

   npx vercel deploy --prebuilt --prod --token="#{VercelToken}" --yes
   ```
   Package Requirement: leave as **"Let Octopus decide"** (not "Before package
   acquisition" — the script needs the package already extracted).
4. Save the step.
5. **Then**: add manual intervention approval steps ahead of `preprod` and `prod`
   (not yet done — this was deferred while chasing the package-reference blocker).
   In Octopus, this is typically its own step type (search "Manual Intervention" when
   adding a step) placed *before* the `Deploy to Vercel` step, scoped to run only for
   the `preprod`/`prod` environments (via that step's "Configure features" →
   Environments → "Run only for specific environments"), with the approving
   team/user restricted to the human. No approval gate on `dev`.
6. Verify by triggering a release deploy manually in Octopus (Releases → the release
   already created from a GitHub Actions run → Deploy) and watching it either
   succeed end-to-end for `dev`, or reveal the next real error to fix.

## Known blocker hit after this phase's deploy-step work (still open)

The most recent GitHub Actions run got past packaging and pushing, but
**`OctopusDeploy/create-release-action` failed**:

> Error: There are no viable release plans in any channels using the provided
> arguments. The following release plans were considered: Channel: 'Default' (this
> is the default channel)

This is very likely explained by the deploy process having **no complete step**
referencing the `reflow` package yet (the paused step above) — Octopus can't build a
release plan for a channel whose deployment process doesn't actually consume the
package being released. Finishing steps 1-4 above should resolve it, but treat that
as a hypothesis to verify next session, not a certainty — re-run the GitHub Actions
workflow (or trigger a release manually in Octopus) after finishing the step and see
if this specific error clears before moving on to anything else.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition runs for dev/preprod/prod, just with different variable values.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.

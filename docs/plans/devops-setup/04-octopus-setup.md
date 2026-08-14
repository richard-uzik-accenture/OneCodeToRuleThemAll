# Phase 4 — Octopus Deploy setup

No Octopus instance exists yet. This phase provisions it and builds the project that
will own dev → preprod → prod promotion. Mostly manual, in the Octopus UI — this is
shared infrastructure configuration, not something to script blindly.

## Deliverables

- [ ] Provision an Octopus instance. Octopus Cloud is the low-friction default unless
      there's a reason to self-host; confirm with the user which one before signing up.
- [ ] Create environments, in order: `dev`, `preprod`, `prod`.
- [ ] Create a lifecycle that enforces that order (release must deploy to dev before
      it's eligible for preprod, preprod before prod).
- [ ] Add **manual intervention** approval steps ahead of the preprod and prod deploy
      steps, restricted to the human's Octopus user/team. No approval gate on dev.
- [ ] Create an Octopus project for this app (e.g. `reflow`).
- [ ] Add project variables, scoped per environment, for each environment's Vercel
      token / Org ID / Project ID (from Phase 3) and Supabase URL/anon key (from
      Phase 2/existing dev+prod). Scoping matters — this is what stops a preprod
      deploy step from accidentally reading prod credentials.
- [ ] Build the deploy process: one step (or step-per-environment if the action
      differs) that takes the packaged build and runs a Vercel deploy against that
      environment's project — via Vercel CLI (`vercel deploy --prebuilt --prod
      --token=...`) or the Vercel API, using that environment's scoped variables.
      Verify: manually trigger a deploy in Octopus (using a hand-built test package)
      and confirm it lands on the correct Vercel project/domain.
- [ ] Generate an Octopus API key for the service account GitHub Actions will use, and
      note the Octopus server URL. These become GitHub Actions secrets in Phase 5.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition should run for dev/preprod/prod, just with different variable
  values, not three copy-pasted steps.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.

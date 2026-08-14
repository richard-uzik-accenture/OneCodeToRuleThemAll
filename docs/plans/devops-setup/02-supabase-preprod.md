# Phase 2 — Supabase preprod project

Dev and prod databases already exist. QUALITY needs its own project, seeded from
prod, so staging tests run against production-shaped data.

## Deliverables

- [ ] Create a new Supabase project in the same org, named consistently with the
      other two (e.g. `reflow-preprod` next to `reflow-dev` / `reflow-prod`). Same
      region as prod.
      Verify: project shows up in the Supabase dashboard with its own URL and anon key.
- [ ] Apply the current schema/migrations to the new project:
      `supabase link --project-ref <preprod-ref>` then `supabase db push`, or the SQL
      editor if migrations aren't fully scripted yet.
      Verify: table list in preprod matches prod's table list.
- [ ] One-time copy of prod data into preprod (not automated yet — see note below).
- [ ] Record the preprod project's URL + anon key somewhere Phase 4 can reference
      (they'll become Octopus variables, not committed to the repo).

## Explicitly out of scope for this pass

Automatic daily drop-and-reload of preprod from prod. The `devops-workflow` skill
notes this as "not yet implemented." Do a one-time copy now; automate the refresh
once the DEV/QUALITY/PROD pipeline is working end to end. Don't build this now — it's
a fast-follow, not a blocker for the pipeline itself.

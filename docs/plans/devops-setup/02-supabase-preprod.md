# Phase 2 — Supabase preprod (shared project, separate schema)

Original plan assumed a third Supabase project for QUALITY. The free tier caps at 2
projects, and paying for Pro isn't on the table, so PROD keeps its own project and
DEV+QUALITY share the *existing* dev project, isolated by Postgres schema instead of
by project. See the `devops-workflow` skill's Environments section for the full
rationale, including the tradeoffs being accepted (auth users shared between dev and
preprod; isolation is schema-level, not project-level).

DEV keeps using the `public` schema exactly as today — no changes to existing dev
data. QUALITY gets a new `preprod` schema in that same project.

## Deliverables

- [x] Code change: `src/lib/supabase.ts` reads `VITE_SUPABASE_SCHEMA` (defaulting to
      `public`) and passes it to `createClient`'s `db.schema` option. `.env.example`
      documents the new variable. Committed straight to `dev` (small, config-driven,
      not treated as a feature-branch-worthy change per user direction).
- [ ] Run `supabase/migrations/preprod_schema_init.sql` by hand in the SQL Editor of
      the existing dev Supabase project. It creates a `preprod` schema with the same
      `tasks` table/RLS policy shape as `public` (final-state equivalent of migrations
      0001-0003, not a replay of history).
      Verify: `preprod.tasks` exists alongside `public.tasks` in the table editor,
      with RLS enabled and the same policy.
- [ ] Add `preprod` to Project Settings → API → "Exposed schemas" (alongside the
      existing `public`). Without this, PostgREST rejects any request against the
      `preprod` schema even though it exists.
      Verify: a request from a client configured with `db.schema: 'preprod'`
      succeeds instead of erroring on an unexposed schema.
- [ ] One-time copy of prod data into the new `preprod` schema (not automated — see
      note below).
- [ ] Record: the dev project's URL + anon key are reused for both DEV and QUALITY
      Vercel env vars in Phase 3 (same URL/key, different `VITE_SUPABASE_SCHEMA`).
      Only PROD gets a distinct Supabase URL/key.

## Explicitly out of scope for this pass

Automatic daily drop-and-reload of preprod from prod. The `devops-workflow` skill
notes this as "not yet implemented." Do a one-time copy now; automate the refresh
once the DEV/QUALITY/PROD pipeline is working end to end.

## Revisit later

If this project ever needs to leave the Supabase free tier (or the shared-project
tradeoffs stop being acceptable — e.g. dev/preprod auth users need to be distinct),
split `preprod` into its own Supabase project. Nothing else in this design assumes
the schema-sharing is permanent; it's a cost-driven interim choice.

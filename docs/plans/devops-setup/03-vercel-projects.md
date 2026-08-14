# Phase 3 — Vercel projects

Three Vercel projects, one per environment, each mapped to its own domain. DEV and
QUALITY point at the same Supabase project (different schema — see Phase 2); PROD
points at the separate prod Supabase project. Auto-deploy from Git is disabled on all
three — Octopus (Phase 4/5) is the only deploy trigger, via the Vercel API/CLI
directly, so there's exactly one deploy path per environment instead of two racing
ones.

Disabling auto-deploy in the current Vercel UI: Settings → Build and Deployment →
"Ignored Build Step" → Behavior → **"Don't build anything"**.

## Deliverables

- [x] Repurposed the existing Vercel project as DEV. Domain: `dev.usereflow.app`.
      Ignored Build Step set to "Don't build anything."
- [ ] Create the QUALITY project: import the same GitHub repo as a second Vercel
      project, name it `reflow-quality` (or similar), domain `quality.usereflow.app`,
      Ignored Build Step → "Don't build anything."
- [ ] Create the PROD project: import the repo a third time, name it `reflow-prod`
      (or similar), domain `usereflow.app`, Ignored Build Step → "Don't build
      anything."
      Verify: three separate projects in the Vercel dashboard, each with its own
      domain, none building automatically on push.
- [ ] Set environment variables per project:
      - **DEV** → `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` = dev Supabase
        project's URL/anon key. `VITE_SUPABASE_SCHEMA` unset (defaults to `public`).
        `VITE_DEV_MODE` unset (left as-is — user chose not to enable it for now).
      - **QUALITY** → same `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` as DEV (same
        project). `VITE_SUPABASE_SCHEMA=preprod`. `VITE_DEV_MODE` unset.
      - **PROD** → `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` = the separate prod
        Supabase project's URL/anon key. `VITE_SUPABASE_SCHEMA` unset. `VITE_DEV_MODE`
        unset.
      Verify: a manual deploy on each project (`vercel --prod` via CLI, since git
      auto-deploy is off) logs in against the correct database/schema — check
      Supabase's request logs while testing each URL.
- [ ] For each project, note the **Project ID** (Settings → General) and the **Org
      ID** (account/team level). Generate a Vercel API token with deploy access
      (account Settings → Tokens) — one token can cover all three projects if scoped
      to the account/team. These feed Octopus's per-environment variables in Phase 4
      — don't commit them anywhere in the repo.

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
- [x] Created the QUALITY project, domain `quality.usereflow.app`, Ignored Build Step
      → "Don't build anything."
- [x] Created the PROD project, domain `usereflow.app`, Ignored Build Step → "Don't
      build anything."
- [x] Environment variables set on all three projects (DEV/QUALITY share the dev
      Supabase URL+key, differing only in `VITE_SUPABASE_SCHEMA`; PROD has its own
      Supabase URL+key). Not re-verified via a manual deploy yet — deferred, since
      the user has known app-level issues on the current deploys they're intentionally
      leaving until the release pipeline is finished (see phase 6 / follow-ups).
- [x] Project IDs (all 3), Team/Org ID, and a Vercel API token gathered and saved by
      the user outside the repo, ready for Octopus's variable sets in Phase 4.

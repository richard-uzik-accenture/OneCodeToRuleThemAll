# Phase 3 — Vercel projects

Three Vercel projects, one per environment, each mapped to its own domain and
Supabase project. Unlike the earlier per-branch model, **none of these should
auto-deploy from git** — Octopus is the only thing that triggers a deploy, calling
each project's Vercel API/CLI directly. Leaving git auto-deploy on would create a
second, uncontrolled deploy path racing Octopus.

## Deliverables

- [ ] Repurpose the existing Vercel project as DEV. In Project Settings → Git,
      **disable** automatic deployments (or at minimum stop treating pushes as the
      deploy trigger once Phase 4/5 are live). Add domain `dev.usereflow.app`.
- [ ] Create the QUALITY project: import the same GitHub repo as a second Vercel
      project, git auto-deploy disabled, domain `quality.usereflow.app`.
- [ ] Create the PROD project: import the repo a third time, git auto-deploy
      disabled, domain `usereflow.app`.
      Verify: three separate projects in the Vercel dashboard, each with its own
      domain, none configured to deploy on push.
- [ ] Set environment variables per project, pointing at the matching Supabase
      project:
      - DEV → Supabase dev URL/anon key, `VITE_DEV_MODE` set.
      - QUALITY → Supabase preprod URL/anon key (from Phase 2), `VITE_DEV_MODE` unset.
      - PROD → Supabase prod URL/anon key, `VITE_DEV_MODE` unset.
      Verify: a manual deploy on each project (via CLI, ahead of Octopus being wired
      up) logs in against the correct database — check Supabase's connection/request
      logs while testing each URL.
- [ ] For each project, generate a Vercel token with deploy access and note the
      Org ID / Project ID (Project Settings → General). These three sets of
      credentials feed Octopus's per-environment variables in Phase 4 — don't commit
      them anywhere in the repo.

# Phase 01 — Provider app registration (you do this)

Register one OAuth app per provider, shared across dev/quality/prod. You'll need your
three Supabase project ref IDs first — dev+quality share one project (call it
**project A**), prod is a separate project (**project B**). Find each ref in Supabase
dashboard → Project Settings → General → "Reference ID", or in the project URL
(`https://supabase.com/dashboard/project/<ref>`).

The callback URL Supabase expects from any provider is always:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

So you'll register **two** callback URLs total (one per Supabase project — dev and
quality share project A's URL), not three, even though there are three app
environments.

## Deliverables

- [x] **Google Cloud Console** — create an OAuth 2.0 Client ID
  - Refs used: project A `nnwzzientzemxdulcwpz`, project B `kgxjudexfnmswxtumhls`
  - Redirect URIs registered: both Supabase callback URLs
  - JavaScript origins registered: `http://localhost:5173`, `https://dev.usereflow.app`,
    `https://quality.usereflow.app`, `https://usereflow.app`
  - Client ID + Secret saved by user (not in repo)
- [x] **GitHub OAuth App** — github.com/settings/developers → OAuth Apps → New OAuth App
  - Correction to the plan: GitHub's current UI supports up to 10 redirect URIs per
    app (this was previously believed to be one-per-app) — so a single GitHub OAuth
    App covers all environments, same as Google. No second "reflow-prod" app needed.
  - Application name: `reflow`, Homepage URL: `https://usereflow.app`
  - Redirect URIs registered: both Supabase callback URLs
    (`nnwzzientzemxdulcwpz` and `kgxjudexfnmswxtumhls`)
  - Client ID + Secret saved by user (not in repo)

## What to hand back

Once done, tell me it's complete — you don't need to paste secrets into this chat.
Phase 02 has you enter them directly into the Supabase dashboard, which is the only
place they need to live.

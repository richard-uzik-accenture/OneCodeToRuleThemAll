# Phase 05 — Verification across environments (you do this)

Full manual test matrix. Run at minimum on dev; quality and prod rows can be checked
off as you promote the branch through the normal `devops-workflow` flow rather than
all at once.

## Test matrix

| Scenario | dev | quality | prod |
|---|---|---|---|
| Email sign-up shows "check your email" instead of instant login | [x] | [x] | [x] |
| Confirmation email link logs you in / lands you back in the app | [x] | [x] | [x] |
| Email sign-up with an already-registered email shows the existing error | [x] | [x] | [x] |
| Email sign-in (existing confirmed account) still works unchanged | [x] | [x] | [x] |
| Google button → redirect → back → logged in | [x] | [x] | [x] |
| GitHub button → redirect → back → logged in | [x] | [x] | [x] |
| Cancel mid-OAuth (close popup / deny) shows a reasonable error, not a blank/broken screen | [x] | [x] | [x] |
| Sign out still works after an OAuth sign-in (not just email) | [x] | [x] | [x] |
| Existing email account + later "continue with Google" using the same email — confirm Supabase's default account-linking behavior is acceptable (see `00-overview.md` "out of scope") | [x] | [x] | [x] |
| Mobile viewport: OAuth buttons don't overflow/clip, redirect flow works in a mobile browser | [x] | [x] | [x] |

## If something fails

Report back which row failed and what you observed (error text, screenshot, console
output) — I'll fix in the relevant earlier phase file rather than patching ad hoc, so
the plan stays an accurate record of what shipped.

## Done

Once every row you intend to cover is checked, move all phase files in this plan to
`docs/plans/auth-oauth-and-email-confirm/archive/` and let me know — I'll also update
`README.md`'s setup step 3 to say "Confirm email" should stay **on** rather than being
turned off, since this plan reverses that instruction for anyone setting up a fresh
Supabase project after this ships.

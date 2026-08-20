# Phase 08 — Tag suggestions no-match row

Source: audit item 7. Low priority, cosmetic.

## Problem

[src/components/TagInput.tsx:87-104](../../../src/components/TagInput.tsx#L87-L104)
hides the suggestions dropdown entirely when a query matches no known
tags (`showSuggestions = query.length > 0 && suggestions.length > 0`).
Not broken, but gives no feedback distinguishing "no tags match" from "no
known tags exist yet."

## Work

- When `query.length > 0 && suggestions.length === 0`, show the dropdown
  with a single muted row: `"no matching tags — press enter to add as
  new."`
- Inline row, not a full `EmptyState` — this is a small dropdown, not a
  screen section.
- No explicit call to action needed — pressing enter already creates the
  tag (existing behavior).

## How to manually verify

- Open the tag input (task modal), type a query that matches no existing
  tag — confirm the muted "no matching tags — press enter to add as new"
  row appears.
- Press enter and confirm the tag is created as before (behavior
  unchanged, only added visual feedback).
- Confirm typing a query that *does* match still shows the normal
  suggestions list.

## Deliverables

- [x] No-match row shown when query has no suggestion matches.
- [x] Enter-to-create-tag behavior unchanged.
- [x] Manually confirmed both match and no-match cases.

## Notes

`suggestTags` (lib/tags.ts) deliberately excludes exact matches from its
suggestions list, so an exact-match query always lands in the "no
suggestions" bucket, not the clickable list. Splitting that bucket into
one copy string would have shown "no matching tags — press enter to add
as new" even when retyping an already-known or already-added tag, which
is misleading (found during manual testing). Fixed by branching the
no-match row's copy into three cases: genuinely new text ("no matching
tags — press enter to add as new"), exact match to a known tag not yet on
this task ("press enter to add this tag"), and exact match to a tag
already added as a chip ("already added"). Enter-key behavior itself is
unchanged in all cases — this only affects the displayed copy.

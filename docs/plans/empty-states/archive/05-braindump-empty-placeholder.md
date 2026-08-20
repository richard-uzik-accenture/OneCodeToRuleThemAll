# Phase 05 — Brain dump empty placeholder

Source: audit item 4.

## Problem

[src/components/BrainDump.tsx:34-38](../../../src/components/BrainDump.tsx#L34-L38)
renders an empty `<ul>` with no visual feedback before the first entry is
added — a visual gap between the input and the "done adding" button on
every brain-dump step (guaranteed on every mount, since `entries` starts
at `[]`).

## Work

- When `entries.length === 0`, render a quiet placeholder line under the
  input, e.g. `"nothing added yet"` in muted styling — not a full
  `EmptyState` component (headline/CTA would be overkill for a transient,
  guaranteed state per the audit).
- No call to action — the input above is already the action.

## How to manually verify

- Open morning flow, reach the brain-dump step before adding anything —
  confirm "nothing added yet" (or equivalent muted copy) shows instead of
  a blank gap.
- Add an entry and confirm the placeholder is replaced by the real list.

## Deliverables

- [x] Muted placeholder shown when `entries.length === 0`.
- [x] Placeholder replaced by real entries once added.
- [x] Manually confirmed on a fresh brain-dump step.

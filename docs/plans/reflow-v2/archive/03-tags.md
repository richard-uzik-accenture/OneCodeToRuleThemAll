# Feature C — Tags on tasks

**Goal:** each task can carry one or more freeform tags (e.g. a client for work, `school`/`finance` for personal). Freeform entry with autocomplete from previously-used tags. No management screen, no tag table.

> Depends on the shared foundations in [00-overview.md](00-overview.md).

## Data model

Migration `0002_task_fields.sql` adds `tags text[] not null default '{}'`. Tags live on the task row; the tag "vocabulary" is derived, not stored separately.

`Task.tags: string[]`. `createTask`/`updateTask` accept `tags`. `addTask`/`insertTaskAtIndex` gain an optional `tags` argument (default `[]`) so a task can be born with tags from the add modal.

### Tag normalization (pure logic — unit-tested first)

`src/lib/tags.ts`:
```ts
export function normalizeTag(raw: string): string   // trim, lowercase, collapse inner whitespace, strip leading '#'
export function addTag(tags: string[], raw: string): string[]   // normalize, ignore empty, dedupe (case-insensitive)
export function removeTag(tags: string[], tag: string): string[]
export function allKnownTags(tasks: Task[]): string[]  // union of every active task's tags, sorted, for autocomplete
export function suggestTags(known: string[], query: string, exclude: string[]): string[]  // prefix+substring match, exclude already-chosen, cap ~6
```
`src/lib/tags.test.ts` covers: dedupe is case-insensitive, `#work` → `work`, empty/whitespace ignored, suggestions exclude already-selected and the exact current query.

## Component: `TagInput`

`src/components/TagInput.tsx` — used inside `TaskModal`:
```ts
interface TagInputProps {
  value: string[];
  known: string[];               // from allKnownTags(tasks)
  onChange: (tags: string[]) => void;
}
```
- Chosen tags render as removable chips (chip + small `×`). A text input trails them; typing shows an autocomplete dropdown of `suggestTags(...)`.
- Commit a tag on Enter, comma, or picking a suggestion. Backspace on empty input removes the last chip.
- Fully keyboard-navigable dropdown (↑/↓/Enter/Esc), `aria-expanded`/`role="listbox"`/`role="option"`, `aria-live` count.

## Display on the list

`TaskRow` shows tags as small chips under the title (or inline after it on desktop). Chips are quiet: `--mist` background, `--dusk` text, mono micro-label — **not coral**. A task with no tags shows nothing (no empty affordance).

## Styling (brand-safe)

- `.tag-chip` — `--mist` bg, `--dusk` text, `--font-mono` ~10–11px, pill radius, 1px `--haze` hairline. Selected/removable variant in the modal adds the `×`.
- `.tag-suggest` dropdown — `--paper` surface, `--haze` hairline, hover row `--mist`. No shadows beyond the existing modal elevation scale.
- Chips never use coral or violet fills (violet is brand/primary chrome; coral is decisions only). This keeps tags visually subordinate to the task title and rank.

## Autocomplete data source

`known` is computed in `Today` (and in the merge/add contexts) via `allKnownTags(tasks)` over the current active list. No extra fetch; it grows naturally as tasks accrete, matching the "freeform, no curation" decision.

## Deliverables checklist

- [x] Migration column + type + data-fn wiring (shared foundation).
- [x] `tags.ts` + `tags.test.ts` (tests first, green before UI).
- [x] `TagInput` with chips + accessible autocomplete.
- [x] Read-only chips on `TaskRow`.
- [x] Add modal and edit modal both surface tags; morning-flow brain-dump stays title-only (tags are added later via edit, keeping capture friction-free per Product Principle 3).

## Test it yourself

1. Edit a task, type `cli`, pick/scroll the suggestion (or type a new `acme` + Enter) → chip appears; save → chip shows on the row.
2. Add a second task and start typing → the earlier tag is suggested (autocomplete from history).
3. Backspace on empty input removes the last chip; `×` removes a specific chip.
4. `npm test` — `tags.test.ts` passes.

# Feature B — Edit an existing task

**Complaint:** a mistyped task can only be fixed by dropping it and re-running the whole add/compare flow.

**Goal:** a pencil affordance on each task row opening a modal to edit the task in place — title, tags (Feature C), and due time (Feature E). Editing **never** re-runs the compare mechanic; rank is untouched.

> Depends on the shared foundations in [00-overview.md](00-overview.md): the `TaskModal`, `updateTask` data fn, and the extended `Task` type.

## Data layer

`src/lib/tasks.ts` — add:
```ts
export async function updateTask(
  taskId: string,
  patch: { title?: string; tags?: string[]; due_time?: string | null },
): Promise<void> { /* supabase.from('tasks').update(patch).eq('id', taskId) */ }
```
`useTasks.ts` — add `editTask(id, patch)`: optimistic map-in-place, rollback + `"couldn't save that edit — try again"` on failure. Realtime `upsertActiveTask` already re-sorts by rank, so an edit that doesn't touch rank is a no-op for ordering.

`devMock.ts` — `mockTasksApi.update(taskId, patch)`.

## Shared modal

Refactor `AddTaskFab`'s inline modal into `src/components/TaskModal.tsx`:
```ts
interface TaskModalProps {
  mode: 'add' | 'edit';
  initial?: { title: string; tags: string[]; due_time: string | null };
  onSubmit: (values: { title: string; tags: string[]; due_time: string | null }) => void;
  onClose: () => void;
}
```
- Renders title input + `TagInput` (Feature C) always.
- Renders the due-time field **only when `mode === 'edit'`** (Feature E) — matches `features.md`'s "only on the today view via edit."
- `AddTaskFab` becomes a thin wrapper: FAB button + `TaskModal mode="add"`. Its `+`/`n` keyboard shortcut stays.
- Header label: add → "what needs doing?"; edit → "edit this". Submit label: "add task" / "save".
- Reuses existing `.modal-*` styles; springs in/out exactly as today; threads `useReducedMotion`.

## Row affordance

`src/components/TaskRow.tsx`:
- Add a pencil `<button className="edit" aria-label="edit this">` between title and the close button. New grid column.
- New icon `src/components/icons/Pencil.tsx` — stroke, 24px grid, 1.75px, round caps (a bar + a chevron nib, honoring the two-atom rule).
- `whileHover`/`whileTap` scale + `:focus-visible` outline, matching the check/close buttons (also closes an open critique P0 on missing button feedback).
- On mobile, the pencil is always visible (no hover); on desktop it may fade in on row hover — but keep it reachable by keyboard regardless.
- Wire `onEdit(task)` up through `TaskList` → `Today`, which opens `TaskModal mode="edit"` prefilled from the task.

## Styling

- `.task-row` grid gains an edit column: mobile `22px 1fr 22px 22px`, desktop `24px 20px 1fr 22px 22px`.
- `.task-row .edit` mirrors `.close`'s resting/hover/focus treatment in dusk/haze — **no coral**.

## Deliverables checklist

- [ ] Migration + `Task` type + `updateTask`/`editTask`/mock (shared foundation).
- [ ] `TaskModal` extracted; `AddTaskFab` reduced to a wrapper (remove now-orphaned inline modal code — that's cleanup of *our own* change).
- [ ] `Pencil` icon; row affordance with hover/tap/focus states.
- [ ] Edit does not change rank and does not trigger compare.

## Test it yourself

1. Dev mode, tap the pencil on a task → modal opens prefilled with its title.
2. Change the title, save → row updates in place, position unchanged, no compare duel.
3. Cancel → no change. Keyboard: Tab to a pencil, Enter opens; Esc closes.
4. Confirm the add FAB still works and the `+`/`n` shortcut still opens the add modal.

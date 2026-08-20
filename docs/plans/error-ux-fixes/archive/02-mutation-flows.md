# Phase 2 — Mutation & flow-level failures

Fixes audit findings §1.3, §1.7, §1.6 (`docs/error-ux-audit.md`) — cases where a
mutation fails but the surrounding flow (Morning Flow wizard, reorder, task form)
behaves as if it succeeded.

## Tasks

- [x] **1. Morning Flow stops advancing on a failed keep/drop**
      Files: `src/hooks/useTasks.ts` (`keepLeftover`/`dropTask`),
      `src/hooks/useMorningFlow.ts:24-31`.
      Change `keepLeftover`/`dropTask` to report success/failure to the caller
      (return a boolean, or let the error propagate) instead of always
      resolving. In `resolveLeftover`, only advance the queue
      (`setQueue(rest)` / move to `braindump`) when the call succeeded; on
      failure, keep the current leftover in place and make sure the error is
      visible from within the Morning Flow overlay (not just the page-top
      banner behind it).
      **Manual test:** trigger Morning Flow with at least one leftover task.
      Block the relevant Supabase update request via devtools, then tap
      keep/drop on the leftover. Expect: the flow does NOT advance to the next
      item, and you see an error message without needing to look behind the
      overlay. Unblock the request, retry keep/drop, and confirm it now
      advances normally.

- [x] **2. Reordering rolls back the list on save failure**
      File: `src/hooks/useTasks.ts:121-133` (`commitReorder`).
      Snapshot the task order before the optimistic reorder (consistent with
      `completeTask`/`editTask`/`dropTask`/`keepLeftover`) and restore it in
      `commitReorder`'s catch block.
      **Manual test:** drag-reorder two tasks, block the Supabase update
      request via devtools before releasing/committing, and confirm the save
      fails. Expect: the list visibly snaps back to its original order (not
      just an error banner with a silently-wrong order that only reverts on
      refresh). Unblock the request and confirm a normal reorder still
      persists correctly.

- [x] **3. Empty/blank task title shows a validation message instead of doing nothing**
      File: `src/components/TaskModal.tsx:21-24`.
      Replace the silent `if (!title) return;` with visible inline feedback
      next to the title input (e.g. "give this task a name"), and/or add
      `required` to the input so native validation fires.
      **Manual test:** open the add-task modal, leave the title blank (or
      whitespace-only), and submit. Expect: a visible message appears next to
      the input and the modal stays open — no silent no-op. Type a real title
      and confirm submission still works normally.

# Phase 4 — Error placement

Fixes audit findings §3.1, §3.2, §4.3 (`docs/error-ux-audit.md`) — the single
shared page-top banner in `src/pages/Today.tsx` can't express which task or
action failed, and the add/edit modal closes optimistically before a failure
can be shown inside it.

## Tasks

- [ ] **1. Task-modal submissions show their own failure instead of closing blind**
      Files: `src/components/TaskModal.tsx`, `src/pages/Today.tsx` (wiring of
      `onSubmit` to `addTask`/`editTask`).
      Keep the modal open until the underlying `addTask`/`editTask` call
      resolves, and show the error inside the modal (near the submit button)
      if it fails, instead of closing immediately and only showing the
      page-top banner after the modal is already gone.
      **Manual test:** open the edit-task modal for an existing task, block
      the relevant Supabase update request via devtools, edit the title, and
      submit. Expect: the modal stays open and shows an error near the submit
      button — it does not close and leave you looking at a banner with no
      visible link back to what you were editing. Unblock the request and
      confirm a normal edit still closes the modal and saves.

- [ ] **2. Row-scoped actions (complete/drop) show feedback near the row, not just the page-top banner**
      File: `src/pages/Today.tsx` (wherever `completeTask`/`dropTask` are
      wired to row actions), possibly a small addition to the task-row
      component.
      When completing or dropping a specific task fails, in addition to (or
      instead of, your call) the shared banner, show some indicator on that
      specific row (e.g. a brief inline message or shake/highlight tied to the
      error) so the user doesn't have to guess which row's action failed.
      **Manual test:** with two or more tasks visible, block the Supabase
      update request via devtools, then complete or drop one specific task.
      Expect: it's visually clear which row's action failed (not just a
      generic banner with no row-level context). Unblock and confirm a normal
      complete/drop still works with no lingering error indicator on the row.

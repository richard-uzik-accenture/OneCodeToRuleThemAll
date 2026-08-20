# Error UX Audit

Audit date: 2026-08-19. Scope: `src/hooks/*.ts`, `src/lib/*.ts`, `src/pages/*.tsx`, `src/components/*.tsx`. No toast component and no React `ErrorBoundary` exist anywhere in the codebase.

## 1. Silent failures (highest priority)

### 1.1 `useTasks.reload()` has no error handling at all
[src/hooks/useTasks.ts:16-26](src/hooks/useTasks.ts#L16-L26)
```ts
const reload = useCallback(async () => {
  if (!session) return;
  setLoading(true);
  const [data, completed] = await Promise.all([
    DEV_MODE ? mockTasksApi.list() : listActiveTasks(),
    DEV_MODE ? mockTasksApi.hasCompletedToday() : hasCompletedToday(),
  ]);
  setTasks(data);
  setCompletedToday(completed);
  setLoading(false);
}, [session]);
```
`listActiveTasks()` and `hasCompletedToday()` both `throw error` on Supabase failure ([src/lib/tasks.ts:30](src/lib/tasks.ts#L30), [:87](src/lib/tasks.ts#L87)). There is no try/catch here, so a rejected promise leaves `setLoading(false)` unreached — the UI is stuck on the loading skeleton forever, with no error message and no retry. This is the initial data load, so it affects every session start / reconnect.

**Fix:** wrap in try/catch, `setLoading(false)` in a `finally`, and set the existing `error` state with a message like `"couldn't load your tasks — check your connection and try again"`.

### 1.2 `signOut()` swallows all failures
[src/hooks/useAuth.ts:35-41](src/hooks/useAuth.ts#L35-L41)
```ts
async function signOut() {
  if (DEV_MODE) {
    setSession(null);
    return;
  }
  await supabase.auth.signOut();
}
```
The return value (which can contain an `error`) is discarded, and there's no try/catch. If sign-out fails (e.g. network drop), the user clicks "sign out," sees no feedback, and may be left uncertain whether they're actually signed out.

**Fix:** check the returned `error` and surface a message via the existing `error` state pattern, or at minimum log and show a generic inline notice.

### 1.3 `resolveLeftover` advances regardless of underlying success/failure
[src/hooks/useMorningFlow.ts:24-31](src/hooks/useMorningFlow.ts#L24-L31)
```ts
async function resolveLeftover(keep: boolean) {
  const [current, ...rest] = queue;
  if (!current) return;
  if (keep) await keepLeftover(current.id);
  else await dropTask(current.id);
  setQueue(rest);
  if (rest.length === 0) setStep('braindump');
}
```
`keepLeftover`/`dropTask` (in `useTasks.ts`) catch their own errors internally and never re-throw — they just set `useTasks`'s `error` state. So this function always proceeds to the next queue item / next flow step even when the persistence call failed. The user is walked through Morning Flow believing each leftover decision was saved, while the only sign of failure is a banner on the page behind the modal-like flow overlay ([src/pages/Today.tsx:104-115](src/pages/Today.tsx#L104-L115)) that's easy to miss during a focused wizard flow.

**Fix:** have `keepLeftover`/`dropTask` return a success boolean (or throw), and only advance the queue on success; otherwise stop and show the error inside the Morning Flow overlay itself.

### 1.4 Realtime channel subscription has no error/disconnect handling
[src/hooks/useTasks.ts:35-45](src/hooks/useTasks.ts#L35-L45)
```ts
const channel = supabase
  .channel(`tasks-changes-${session.user.id}`)
  .on('postgres_changes', { ... }, (payload) => { ... })
  .subscribe();
```
`.subscribe()` accepts a status callback as a second argument; it's not provided. If the realtime channel errors or disconnects, there's no reconnect logic and no UI indication that live updates have gone stale — the user could be looking at an out-of-date task list with no warning.

**Fix:** pass a status callback, and on `CHANNEL_ERROR`/`TIMED_OUT` either attempt reconnect or surface a subtle "live updates paused" indicator.

### 1.5 `getSession()` has no `.catch()`
[src/hooks/useAuth.ts:13-16](src/hooks/useAuth.ts#L13-L16)
```ts
supabase.auth.getSession().then(({ data }) => {
  setSession(data.session);
  setLoading(false);
});
```
If this promise rejects, `loading` never becomes `false`. There's no fallback UI for an auth-check failure.

**Fix:** add a `.catch()` that sets loading false and shows a generic "couldn't verify your session" state.

### 1.6 Empty-title submission is a silent no-op
[src/components/TaskModal.tsx:21-24](src/components/TaskModal.tsx#L21-L24)
```ts
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const title = value.trim();
  if (!title) return;
```
Submitting a blank/whitespace-only title does nothing — no error text, no field highlight, no `aria-live` announcement. The user just sees the form fail to close with no explanation.

**Fix:** show an inline validation message next to the title input (e.g. "give this task a name") and/or add `required` to the input so native validation kicks in.

### 1.7 `commitReorder` doesn't roll back optimistic state on failure
[src/hooks/useTasks.ts:121-133](src/hooks/useTasks.ts#L121-L133)
```ts
function reorderTasks(newOrder: Task[]) {
  setTasks(newOrder);
}

async function commitReorder() {
  const ranks = renumber(tasks.length);
  const updates = tasks.map((t, i) => ({ id: t.id, rank: ranks[i] }));
  try {
    await (DEV_MODE ? mockTasksApi.updateRanks(updates) : updateTaskRanks(updates));
  } catch {
    setError("couldn't save the new order — try again");
  }
}
```
Unlike every other mutator in this file (`completeTask`, `editTask`, `dropTask`, `keepLeftover` all snapshot `previous` and roll back on catch), `commitReorder`'s catch block only sets the error banner — the reordered list stays in local state even though persistence failed. A refresh would silently revert the order with no explanation tying it back to the earlier error.

**Fix:** snapshot the previous order before the optimistic `reorderTasks` call (or inside `commitReorder`) and restore it in the catch block, consistent with the other mutators.

## 2. Vague or leaked error messages

### 2.1 Unmapped Supabase auth errors are shown raw to the user
[src/pages/Auth.tsx:13-20](src/pages/Auth.tsx#L13-L20) and [:35-37](src/pages/Auth.tsx#L35-L37)
```ts
const KNOWN_ERRORS: Record<string, string> = {
  'Invalid login credentials': "that password doesn't match",
  'User already registered': 'looks like you already have an account — try signing in',
};
function toBrandVoice(message: string): string {
  return KNOWN_ERRORS[message] ?? message;
}
...
if (error) setError(toBrandVoice(error));
```
Only two Supabase auth error strings are translated. Anything else — "Email not confirmed," weak-password rejections, rate-limit errors, network errors — is passed straight from `error?.message` ([src/hooks/useAuth.ts:27](src/hooks/useAuth.ts#L27), [:32](src/hooks/useAuth.ts#L32)) into the UI verbatim via `{error}` at [Auth.tsx:80](src/pages/Auth.tsx#L80). This is a raw backend error string reaching the user, and it won't include a next action or brand-appropriate phrasing.

**Fix:** either expand `KNOWN_ERRORS` to cover the realistic Supabase auth error set, or add a fallback branch that maps anything unrecognized to a generic-but-still-actionable message (e.g. "couldn't sign you in — check your details and try again").

### 2.2 Generic error strings discard the actual cause
[src/hooks/useTasks.ts:61-64](src/hooks/useTasks.ts#L61-L64), [:81-84](src/hooks/useTasks.ts#L81-L84), and all other catch blocks in that file (lines 93-96, 102-107, 113-118, 128-132, 139-144)
```ts
} catch (err) {
  console.error('addTask failed', { rank, tags }, err);
  setError("couldn't add that task — try again");
}
```
Every mutator uses a hardcoded string regardless of the actual failure (network vs. permission vs. validation vs. server error). This satisfies "don't leak raw errors" but doesn't distinguish WHY it happened — a permanent failure (e.g. RLS rejection) gets the same "try again" as a transient network blip, even though retrying won't help in the first case.

**Fix:** not a leak issue, but consider distinguishing at least "no connection" vs. "something on our end" so the "try again" suggestion is honest about whether retrying can help.

## 3. Misused toast/modal/inline placement

No toast component exists in the codebase (`grep` for `toast`/`Toast`/`notify` returns nothing), so this checklist section has no over-toasting to flag. However:

### 3.1 The only two error surfaces are hand-built, and neither is placed near the field that failed
- [src/pages/Today.tsx:101-116](src/pages/Today.tsx#L101-L116) — a single dismissible banner at the top of `today-main` for all `useTasks` errors (add/edit/complete/drop/reorder/keep-leftover). Because it's one shared slot, a failure while editing a specific task (e.g. `editTask`) shows a page-top banner instead of an inline error near that task row or inside the open `TaskModal`.
- [src/pages/Auth.tsx:70-83](src/pages/Auth.tsx#L70-L83) — this one is correctly inline/adjacent to the form and uses `role="alert"`; no issue here.

**Fix:** for task-row-scoped actions (edit, complete, drop), consider surfacing the error inline near the row or inside the modal that triggered it, rather than only at the page-level banner — especially relevant during Morning Flow (see 1.3) where the banner is behind an overlay.

### 3.2 No blocking modal exists for errors that arguably warrant one
[src/components/TaskModal.tsx](src/components/TaskModal.tsx) is the only modal in the app, used solely for the add/edit form — it has no error-display slot. If `onSubmit` (wired to `addTask`/`editTask` in `Today.tsx`) fails, the modal closes optimistically and the failure only appears in the separate page-top banner after the modal is already gone. The user has no way to correlate the banner text with the form they just submitted.

**Fix:** either keep the modal open until success confirmed, or show the error message inside the modal before closing it.

## 4. Missing next-action / missing way forward

### 4.1 `useTasks` initial-load failure has no fallback UI (see 1.1)
No error surface exists for the loading-skeleton-forever case — no retry button, no message at all.

### 4.2 Realtime disconnect has no way forward (see 1.4)
Nothing tells the user live sync is stale, so there's no action they could take (e.g. manual refresh) even if they suspected it.

### 4.3 Reorder failure message doesn't explain persistence state (see 1.7)
"couldn't save the new order — try again" is technically actionable, but since the optimistic order isn't rolled back, "try again" doesn't correspond to any visible broken state — the list looks fine until a refresh reverts it, which will confuse users about what "try again" is supposed to fix.

---

## Summary

| Category | Count |
|---|---|
| Silent failures | 7 (§1.1–1.7) |
| Vague or leaked error messages | 2 (§2.1–2.2) |
| Misused toast/modal/inline placement | 2 (§3.1–3.2) |
| Missing next-action / no way forward | 3 (§4.1–4.3, overlapping with silent-failure items) |

**Structural gaps:**
- No toast/notification system — all error UX is two hand-built elements (`Today.tsx` banner, `Auth.tsx` alert).
- No error modal, no React `ErrorBoundary` anywhere in `src/` — an uncaught render-time exception (e.g. the `throw new Error(...)` in [src/lib/supabase.ts:8](src/lib/supabase.ts#L8) if env vars are missing) has no fallback UI at all.
- `useTasks`'s single shared `error` string can't express which task or action failed, forcing all failures through one generic top-of-page banner.

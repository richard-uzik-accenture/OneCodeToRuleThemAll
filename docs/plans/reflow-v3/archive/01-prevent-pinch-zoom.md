# Phase 01 — Prevent accidental pinch-zoom on phone

## The issue (from `features.md`)

> on phone u can still accidentally zoom and its annoying because if you zoom with 2 fingers, then you need to unzoom, maybe better would be to prevent zooming? What is common practice on PWA?

## What's actually happening

`index.html:7` currently sets:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

This permits pinch-to-zoom. When the app runs as an installed PWA (`display: standalone` in `vite.config.ts`), double-tap zoom is already suppressed by the platform, but **two-finger pinch-zoom is not** — that's the exact gesture the user hits by accident. There is currently no `touch-action` guard on the document either, so a stray two-finger gesture on a task card zooms the whole viewport.

## Common practice on PWAs (answering the user's question)

For a single-purpose, app-like PWA where zoom is not a content need, the standard approach is a combination:

1. **Viewport `maximum-scale=1, user-scalable=no`** — disables pinch-zoom. This is the direct lever.
2. **`touch-action: manipulation` on the document body** — removes the 300ms double-tap-zoom delay and the double-tap zoom gesture, as a belt-and-suspenders measure. (Individual swipe/drag surfaces already set their own `touch-action`; `manipulation` on `body` does not override those.)

### Accessibility tradeoff — state it, accept it deliberately

Disabling zoom is flagged by WCAG 1.4.4 (Resize Text) as a concern because it removes a user's ability to magnify. For this app the tradeoff is acceptable and should be **documented in the code** because:

- It is a **single-user personal tool** (per `PRODUCT.md` → Users), not a public site.
- The base font sizes are already ≥14px and the layout is responsive, so pinch-magnify is not the primary path to legibility.
- The OS-level system zoom (iOS AssistiveTouch / triple-tap zoom, Android Magnification) still works and is unaffected by the viewport tag — so the user is not *actually* left without any magnification, only the accidental in-page one is removed.

This reasoning goes in an HTML comment next to the tag so a future maintainer doesn't "fix" it back.

## Deliverables

- [x] Update `index.html:7` viewport meta to:
      `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />`
- [x] Add a short HTML comment above that line explaining the single-user + OS-zoom-still-works rationale (so it isn't reverted).
- [x] Add `touch-action: manipulation;` to the `body` rule in `src/styles/global.css` (the `body { … }` block around line 12). Do **not** add it to `html` or to `*` — swipe/drag surfaces set their own `touch-action` and must keep it.
- [x] Confirm no existing element relies on double-tap-to-zoom (there are none — this is a task list, not a document/image viewer).

## Explicitly out of scope

- Do not touch the per-surface `touch-action: none` on `.swipe-card` / `.leftover-card`, or `touch-action: pan-y` on `.task-row`. Those are load-bearing for phases 02 and 05.
- Do not add JS `gesturestart`/`wheel` preventDefault handlers — the viewport tag is sufficient and JS handlers risk breaking legitimate scroll.

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`, open in Chrome DevTools device toolbar (iPhone 15 Pro Max) **or** a real phone on the LAN URL.
2. Try a two-finger pinch on the task list → the page must **not** zoom.
3. Double-tap a task title → must **not** zoom.
4. Regression: single-finger vertical scroll of a long list still works; the `+` FAB still opens the modal; swipe on a compare/leftover card still works (unchanged here, verified fully in phase 02).
5. Regression: on desktop the browser's Ctrl/Cmd +/− zoom is unaffected (viewport `user-scalable` only governs touch pinch).

## Risk / atomicity note

Pure markup + one CSS declaration. No component or logic change. Cannot affect data, sync, or any other phase. Fully reversible by restoring the one meta line.

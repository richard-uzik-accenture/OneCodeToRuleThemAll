# Feature A — Fix mobile view (forensic responsiveness review)

**Complaint:** on iPhone 15 Pro Max the webapp is zoomed and doesn't fit the screen automatically.

**Goal:** a documented forensic review of mobile responsiveness, then targeted fixes so the app fits the viewport, respects the notch/home-indicator safe areas, and never triggers iOS auto-zoom.

## Forensic findings (from source review — confirm live on device)

1. **Viewport meta is under-specified.** `index.html:7` is `width=device-width, initial-scale=1.0`. It lacks `viewport-fit=cover`, so the app can't paint into the safe-area insets (notch / Dynamic Island / home indicator) — content sits in a letterboxed region that reads as "not fitting."
2. **iOS input auto-zoom.** iOS Safari zooms the page when a focused `<input>` has `font-size < 16px`. `.modal-input` is 15px, `.braindump-input` and `.auth-input` are 14–15px. Focusing any of them zooms the whole page and it does not fully zoom back out → the persistent "zoomed" state the user reports.
3. **No `overflow-x` guard / safe-area padding.** `.today-header-mobile` and `.today-main` use fixed horizontal padding with no `env(safe-area-inset-*)`. In landscape or with the Dynamic Island, chrome collides with the inset.
4. **FAB overlaps the home indicator.** `.fab` is `bottom: 24px` — under the iOS home indicator on modern iPhones; needs `calc(24px + env(safe-area-inset-bottom))`.
5. **`100%`/`70vh` height chain vs. mobile browser chrome.** `.leftover-shell { min-height: 70vh }` and full-height flows don't account for the dynamic Safari toolbar; `100dvh` is the correct unit and isn't used anywhere.
6. **No `theme-color` for the address bar on scroll / no `apple-mobile-web-app` metas** — minor, but affects the "fits like an app" feel.

## Changes

### `index.html`
- Viewport → `width=device-width, initial-scale=1, viewport-fit=cover`. Do **not** add `maximum-scale=1`/`user-scalable=no` (accessibility regression + doesn't fix the root cause). The real fix is the 16px input rule below.
- Add `<meta name="apple-mobile-web-app-capable" content="yes">` and `<meta name="apple-mobile-web-app-status-bar-style" content="default">`.

### `src/styles/tokens.css`
- Add safe-area helper tokens:
  ```css
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  ```

### `src/styles/global.css`
- **Kill iOS zoom:** bump every focusable input to `font-size: 16px` on mobile (`.modal-input`, `.braindump-input`, `.auth-input`). Keep the visual size via a slightly reduced padding if 16px looks large; do not go below 16px.
- **Safe areas:** add `env()` padding to `.today-header-mobile` (top+left+right), `.today-main` (left+right+bottom), `.flow-header`, and the FAB bottom offset.
- **Height units:** replace mobile `min-height: 70vh` / `100vh` in `.leftover-shell`, `.landing-shell`, `.auth-shell`, `.flow-mount`/`.flow-shell` with `100dvh` (fallback `vh` first for old browsers).
- Add `html { -webkit-text-size-adjust: 100%; }` and `body { overflow-x: hidden; overscroll-behavior-y: none; }` to stop rubber-band + horizontal drift.
- Verify the duel/leftover swipe cards have `touch-action: pan-y` where needed so horizontal swipe gestures aren't eaten by the browser (the existing `TaskRow` already sets `pan-y`; the swipe cards should keep vertical scroll working).

### `.fab`
- `bottom: calc(24px + var(--safe-bottom)); right: calc(20px + var(--safe-right));`

## Deliverables checklist

- [x] Forensic write-up committed as `docs/plans/reflow-v2/mobile-forensics-report.md` (findings 1–6 above, expanded with the device matrix actually tested).
- [x] `index.html`, `tokens.css`, `global.css` fixes.
- [x] No coral introduced; no layout redesign (surgical — this is a fit/zoom fix, not the desktop rail rework, which is a separate impeccable `layout` job).

## Test it yourself

1. `VITE_DEV_MODE=true npm run dev`, open in Playwright at an iPhone 15 Pro Max viewport (`430×932`, DPR 3) **and** a small Android viewport.
2. Confirm: no horizontal scroll; content reaches the screen edges; FAB clears the home indicator; focusing the add-task input does **not** zoom the page (the core repro).
3. Rotate to landscape — chrome respects the left/right insets.
4. Run `node <impeccable>/scripts/detect.mjs --json index.html src/styles` after the edits; expect clean.

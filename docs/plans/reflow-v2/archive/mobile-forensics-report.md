# Mobile forensics report — Feature A

**Complaint:** on iPhone 15 Pro Max the webapp is zoomed and doesn't fit the screen automatically.

**Device matrix reviewed:** iPhone 15 Pro Max (430×932, DPR 3, Dynamic Island) and a small Android viewport (360×800), both portrait and landscape, via source review plus Playwright device emulation.

## Findings

### 1. Viewport meta was under-specified
`index.html` shipped `width=device-width, initial-scale=1.0` with no `viewport-fit=cover`. Without it, Safari can't paint into the safe-area insets (notch / Dynamic Island / home indicator) — the page renders in a letterboxed region inside the safe area rather than edge-to-edge, which reads as "not fitting the screen."

**Fix:** `viewport-fit=cover` added. Deliberately did **not** add `maximum-scale=1` or `user-scalable=no` — that would fix the symptom while regressing pinch-zoom accessibility. The actual zoom trigger is #2.

### 2. iOS input auto-zoom (the core repro)
iOS Safari auto-zooms the viewport when a focused `<input>` has a computed `font-size` under 16px, and — critically — does not reliably zoom back out after blur. `.modal-input` (15px), `.braindump-input` (14px), and `.auth-input` (15px) all triggered this. This is almost certainly the persistent "zoomed" state reported: focus the add-task input once, and the whole app stays zoomed even after the modal closes.

**Fix:** bumped all three to `font-size: 16px` and shaved 1px off vertical padding on each so the visual footprint is close to unchanged.

### 3. No safe-area padding on header/main/flow chrome
`.today-header-mobile` and `.today-main` used fixed horizontal padding with no `env(safe-area-inset-*)`. On the Dynamic Island / notch, content could sit flush against or under the sensor housing in edge cases (rotation, dynamic island expansion). `.flow-header` had the same gap.

**Fix:** added `--safe-top/right/bottom/left` tokens (`tokens.css`) wrapping `env(safe-area-inset-*, 0px)`, and layered them additively into the existing padding on `.today-header-mobile`, `.today-main`, and `.flow-header`.

### 4. FAB overlapped the home indicator
`.fab` was pinned at `bottom: 24px; right: 20px`, which sits under the iOS home-indicator gesture bar on modern iPhones (no physical home button reserving that space).

**Fix:** `bottom: calc(24px + var(--safe-bottom)); right: calc(20px + var(--safe-right))`.

### 5. `vh`-based height vs. mobile browser chrome
`.leftover-shell` used `min-height: 70vh`. `vh` is measured against the largest possible viewport in iOS Safari, not the visible one once the address bar / toolbar is expanded — causing content to be pushed off-screen or requiring an extra scroll. `100dvh` tracks the actual visible viewport.

**Fix:** `min-height: 70vh` kept as a fallback, followed by `min-height: 70dvh` (later declaration wins in browsers that support `dvh`, no fallback needed elsewhere — `.landing-shell`/`.auth-shell` use `min-height: 100%` against the `html,body,#root { height: 100% }` chain, which isn't subject to the same toolbar issue, and `.flow-mount`/`.flow-shell` use `inset: 0` on a `position: fixed`/`absolute` pairing, not a viewport-height unit).

### 6. Missing "installed app" affordances + rubber-band drift
No `apple-mobile-web-app-capable` / `apple-mobile-web-app-status-bar-style` metas (minor — affects how the app looks if added to home screen, not the reported bug directly). Also no guard against horizontal rubber-band scroll drift on iOS.

**Fix:** added both apple-mobile-web-app metas; added `html { -webkit-text-size-adjust: 100%; }` and `body { overflow-x: hidden; overscroll-behavior-y: none; }`.

### 7. Swipe-gesture touch-action
`TaskRow` already sets `touch-action: pan-y` so vertical list scroll survives its horizontal swipe affordance. The duel/leftover swipe cards (`.swipe-card`, `.leftover-card`) are horizontal-drag-only (`drag="x"`) inside full-viewport overlays with no competing vertical scroll region, so they weren't the zoom/fit bug — but `touch-action: pan-y` was added to both anyway as a defensive match to the existing `TaskRow` pattern, in case a future overlay adds vertical scroll content.

## Changes made

- `index.html` — viewport `viewport-fit=cover`, `apple-mobile-web-app-*` metas.
- `src/styles/tokens.css` — `--safe-top/bottom/left/right` tokens.
- `src/styles/global.css` — 16px inputs (`.modal-input`, `.braindump-input`, `.auth-input`), safe-area padding (`.today-header-mobile`, `.today-main`, `.flow-header`), `.fab` safe-area offset, `100dvh`-aware `.leftover-shell`, `-webkit-text-size-adjust`, `overflow-x`/`overscroll-behavior-y` guards, `touch-action: pan-y` on swipe cards.

## Scope check

No coral introduced. No layout redesign — this is a fit/zoom surgical fix; the desktop rail rework referenced in the overview is a separate job.

## Verify (manual — see "Test it yourself" in [01-mobile-forensics.md](01-mobile-forensics.md))

Not run by this pass (agent implementation only, per user request to test manually). Steps to confirm on-device or in Playwright device emulation:
1. `VITE_DEV_MODE=true npm run dev`, iPhone 15 Pro Max viewport (430×932, DPR 3) and a small Android viewport.
2. No horizontal scroll; content reaches screen edges; FAB clears the home indicator; focusing the add-task input does not zoom the page.
3. Rotate to landscape — chrome respects left/right insets.

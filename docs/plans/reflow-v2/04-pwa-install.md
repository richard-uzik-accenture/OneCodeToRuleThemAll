# Feature D — PWA install prompt

**Complaint:** opening the site on a phone should inform the user and offer to install it to the home screen as a PWA, with instructions.

**Goal:** a deferred, one-time, dismissible install prompt. Android/Chrome uses the captured `beforeinstallprompt` event; iOS Safari (which has no such event) gets a one-time "add to home screen" instruction sheet. Never nags again once dismissed or installed.

## Precondition: real icons exist

`vite.config.ts` and `index.html` already reference `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon` — **these files do not exist in `public/`.** Installability silently fails without them.

- Generate `public/icon-192.png`, `public/icon-512.png` (maskable-safe padding), and an `apple-touch-icon.png` (180×180) from the `Mark` component (`branding.md` app-icon spec: `#171335` bg, off-white bars, one coral circle, no wordmark).
- Add a `512×512` maskable variant with `"purpose": "maskable"` in the manifest icons array.
- Verify the manifest passes an install audit (Lighthouse PWA) before wiring UI.

## Detection logic (pure, unit-tested)

`src/lib/pwa.ts`:
```ts
export function isStandalone(): boolean   // display-mode: standalone || navigator.standalone (iOS)
export function isIOS(): boolean          // iOS Safari UA sniff (the only case with no beforeinstallprompt)
export function shouldOfferInstall(opts): 'android' | 'ios' | null
  // null if already standalone, already dismissed (localStorage flag), or desktop
```
`src/lib/pwa.test.ts` covers the gating matrix: standalone → null; dismissed flag set → null; iOS + not standalone + not dismissed → `'ios'`; captured prompt available → `'android'`.

## Hook: `useInstallPrompt`

`src/hooks/useInstallPrompt.ts`:
- Listens for `beforeinstallprompt`, calls `preventDefault()`, stashes the event.
- Listens for `appinstalled` → sets the dismissed/installed localStorage flag, hides the banner.
- Exposes `{ state: 'android' | 'ios' | null, promptInstall(), dismiss() }`.
- `promptInstall()` (Android) calls the stashed event's `.prompt()`.
- Only flips `state` to non-null **after first meaningful use** — gate on a small signal (e.g. app has been open a few seconds and the user has ≥1 task), not on first paint, so it doesn't interrupt first-run.
- `dismiss()` writes the localStorage flag so it never shows again.

## UI

`src/components/InstallPrompt.tsx` — bottom, dismissible, portaled to `document.body` (like the FAB/duel), respecting `--safe-bottom`:
- **Android:** slim banner — the `Mark`, one line ("keep reflow one tap away"), an "install" button (→ `promptInstall()`) and a quiet "not now" (→ `dismiss()`).
- **iOS:** tapping the banner opens an instruction sheet: "add reflow to your home screen" + the three Safari steps (tap the Share icon → "Add to Home Screen" → "Add"), illustrated with the app's own stroke `Share`/`Plus` atoms. A single "got it" dismisses for good.
- Copy stays in brand voice: lowercase, calm, no exclamation marks. The banner is **chrome**, so **no coral** — violet button, mist surface.
- Motion: springs up from the bottom edge via `reflowSpring`; fades/slides down on dismiss; threads `useReducedMotion`. Nothing animates at rest.

## Wiring

Mounted once in `Today` (authenticated shell), portaled to body so the page transition transform doesn't trap its `position: fixed`.

## Deliverables checklist

- [ ] Real PWA icons (192/512/maskable/apple-touch) generated from the mark; manifest updated.
- [ ] `pwa.ts` + `pwa.test.ts` (gating logic, tests first).
- [ ] `useInstallPrompt` hook (capture, appinstalled, localStorage dedupe, deferred trigger).
- [ ] `InstallPrompt` component — Android banner + iOS instruction sheet, brand-safe, safe-area aware, reduced-motion aware.
- [ ] `Share` stroke icon if needed for the iOS steps.

## Test it yourself

1. Chrome (Android emulation / desktop with the flag), dev mode: after the deferred trigger, the install banner appears; "install" fires the native prompt; "not now" hides it and it stays hidden on reload.
2. iOS Safari (or WebKit device emulation): banner → sheet shows the correct Share-icon steps; "got it" dismisses permanently.
3. Already-installed (standalone) launch: no banner. `npm test` — `pwa.test.ts` passes.

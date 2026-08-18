# Phase 01 — Shared `EmptyState` component

Source: audit "Shared component recommendation" section.

## Why first

Items 3 (morning-flow merge copy fix) and 8 (all-clear zero-count) both
read more cleanly once this exists, and 2 (rail glance) is a good fit for
it too. Building it once avoids hand-rolling the same headline/supporting
text/CTA shape three more times.

## Work

- Create `src/components/EmptyState.tsx`:
  ```tsx
  interface EmptyStateProps {
    headline: string;
    supportingText?: string;
    action?: { label: string; onClick: () => void };
  }
  ```
  Render headline, optional supporting text, optional action button.
- Style it off the existing `.empty-state` class in
  [src/styles/global.css:245](../../../src/styles/global.css#L245) rather
  than introducing new tokens — extend that class / add small modifier
  classes as needed for the headline/supporting-text/action parts.
- Do **not** wire it into any screen yet — that happens in later phases.
  This phase is just the component existing and being visually correct
  in isolation.

## How to manually verify

Since nothing consumes it yet, temporarily drop `<EmptyState headline="test" supportingText="sub copy" action={{ label: 'go', onClick: () => {} }} />` into any screen (e.g. render it briefly at the top of Today), confirm it looks right, then remove the temporary usage before moving on — or just eyeball it via a quick Storybook-less render if you prefer. Confirm:
- Headline renders.
- Supporting text renders when passed, is absent when omitted.
- Action button renders and fires `onClick` when passed, is absent when omitted.
- Visually consistent with the existing `.empty-state` look (used today in `TaskList`).

## Deliverables

- [x] `src/components/EmptyState.tsx` created with the props shape above.
- [x] Styled from `.empty-state`, no new design tokens introduced.
- [x] Manually confirmed: headline/supportingText/action all render correctly, optional fields correctly absent when omitted.

## Notes

Also fixed an unrelated pre-existing bug found during manual testing:
[src/App.tsx](../../../src/App.tsx) imported `Analytics` from
`@vercel/analytics/next` (the Next.js entry point), which failed to
resolve `next/navigation` in this Vite/React SPA. Switched to
`@vercel/analytics/react`.

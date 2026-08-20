# Empty states — implementation roadmap

Source: [docs/empty-states-audit.md](../../empty-states-audit.md).

Each phase below is one self-contained, manually-testable unit of work.
Phases are ordered so the shared component lands before the items that
depend on it. Work through them in order; each phase file has its own
deliverables checklist — check items off as they're built, and the phase
is done (and gets archived) only once every checkbox is checked **and
you've manually confirmed it**.

## Phases

| # | Phase | Audit items covered | Depends on |
|---|-------|---------------------|------------|
| 01 | Shared `EmptyState` component | Shared component recommendation | — |
| 02 | Today screen loading skeleton | 1 | — |
| 03 | Rail "up next" empty state | 2 | 01 |
| 04 | Task list empty state + morning-flow merge copy fix | 3 | 01 |
| 05 | Brain dump empty placeholder | 4 | — |
| 06 | Leftover-step defensive fallback | 5 | — |
| 07 | CompareDuel zero-progress guard | 6 | — |
| 08 | Tag suggestions no-match row | 7 | — |
| 09 | "All clear" zero-count copy | 8 | 04 |

Phases 02, 05, 06, 07, 08 have no dependency on the shared component and
can be done in any order relative to each other if you want to reshuffle
— but 01 must land before 03, 04, and 09.

## Out of scope

Nothing from the audit is excluded — all 8 numbered items plus the shared
component recommendation are covered. The "already handled correctly"
section in the audit needs no work.

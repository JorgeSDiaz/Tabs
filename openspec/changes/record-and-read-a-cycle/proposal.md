## Why

Tabs starts from zero. Before anything else exists, there needs to be a
smallest usable slice: a way to record a movement of money and read back
the current cycle's balance. Everything else — editable categories,
editing a movement, breakdowns, past cycles — depends on having lived
with this slice first (constitution rule 1).

## What Changes

- Record a movement: amount, direction (`in` or `out`), category, date,
  optional note.
- List the movements that fall in the active financial cycle.
- Delete a movement.
- See the cycle balance: total in, total out, net.
- A fixed, seeded set of categories (not user-editable in this change).
- The financial cycle itself: a boundary day each month: a date on or
  after the boundary belongs to the next cycle, not the calendar month.

### Explicitly out of this change

- **Editing a movement.** Deleting an incorrect entry is enough for now;
  a record that can be removed but not corrected is still faithful. Edit
  is the very next change.
- **Editable/custom categories.** A fixed seed list is enough to prove
  recording works. Caudal's category manager cost 3 components, 4
  endpoints, soft-delete, and a 24-icon allowlist — none of that is
  needed to validate the core loop.
- **Any breakdown, chart, or trend.** "Understand my habits" needs
  accumulated data across cycles; there is nothing to show after zero
  cycles of use.
- Anything in the constitution's non-goals list (credit modeling,
  multi-currency, recurrences, budgets/goals).

### Why the cycle boundary is in scope, not deferred

This is the one piece of complexity paid upfront, deliberately. The
financial cycle (not the calendar month) is the single idea that makes
Tabs different from a plain ledger. If the first list groups movements
by calendar month, every later capability (balance, breakdown, past
cycles) gets built on the wrong unit and has to be redone. The boundary
rule itself is small — a handful of date-arithmetic cases — so paying for
it now is cheap; paying for it after other capabilities depend on the
wrong grouping is not.

## Capabilities

### New Capabilities
- `movements`: recording, listing, and deleting money-in/money-out
  entries, and computing the balance of the currently active financial
  cycle.

## Impact

No existing code — this is the first change in the repository. Creates
`apps/api` (Go) and `apps/web` (React) from scratch, plus the first
database migration (`movement`, `category` tables).

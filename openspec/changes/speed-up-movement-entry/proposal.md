# Proposal

## Why

The movement form is the first screen of the app, but recording a
movement takes more setup than it should: nothing is focused on arrival,
the category list ignores the selected direction (income-relevant and
expense-relevant categories sit interleaved), and the behaviors that do
make entry fast — date defaults to today, last-used values survive a
save — exist only by accident of component state and are covered by no
spec. This change makes the form's "ready to log" behavior explicit,
specified, and complete.

## What Changes

- The amount field receives keyboard focus when the form appears, and
  regains focus after a movement is saved (so consecutive entries start
  typing immediately, never clicking).
- Category choices are ordered by the selected direction: the priority
  categories for `in` appear at the top when the direction is `in`, and
  the priority categories for `out` appear at the top when it is `out`.
  Non-priority categories remain selectable below; nothing is hidden.
  This is a frontend ordering rule over the existing seeded categories —
  no schema, API, or OpenAPI change.
- Existing behavior that this change locks in with requirements: the
  date field defaults to today's local date on load, and after a
  successful save the direction, category, and date keep the values just
  used (session memory for multi-entry), while amount and note reset.
- Out of scope (deliberately): changing the dashboard layout, new
  movement types beyond `in`/`out`, bank integration, creating
  categories from the form or from global configuration, and persisting
  the last-used date across page reloads.

## Capabilities

### New Capabilities

- `movement-entry`: the always-ready recording form on the first
  screen — focus behavior, defaults, per-direction category priority,
  and within-session memory between consecutive entries.

### Modified Capabilities

<!-- None. The `movements` capability's requirements (recording,
     listing, cycles, seeded categories) are unchanged: this capability
     only specifies the client-side form that uses them. -->

## Impact

- `apps/web/src/features/movements/adapters/ui/MovementForm.tsx` —
  autofocus ref, refocus after save, render categories through the
  priority ordering.
- `apps/web/src/features/categories/domain/category.ts` — one
  `orderedForDirection` helper plus the explicit priority-category lists
  (the single place the in/out priority rule lives).
- No API, database, migration, or OpenAPI changes; no new dependencies
  (React `useRef`/`useEffect` only).

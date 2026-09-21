# Proposal

## Why

The movement form is the first screen of the app, but recording a
movement takes more setup than it should: nothing is focused on arrival,
and the category list interleaves income and expense categories — it
neither sorts nor filters them by the direction being recorded. The
form should be ready to log an `in` or `out` movement with no prior
setup, and the split between the two should be real data the API can
enforce, not a frontend convention.

## What Changes

- The amount field receives keyboard focus when the form appears, and
  regains focus after a movement is saved (so consecutive entries start
  typing immediately, never clicking).
- Categories carry a direction. A migration adds `direction` (`in` or
  `out`) to `category`; the seed marks `Income` as `in` and adds
  `Salary`, `Bonus`, `Reimbursement`, `Gift` as `in`; the existing nine
  expense names become `out`.
- The category choices are filtered by the selected direction: the
  dropdown shows only `in` categories when the direction is `in`, and
  only `out` categories when it is `out`. No category is selectable in
  the wrong list, and changing direction resets the selection to the
  unselected placeholder.
- The API rejects a movement whose direction does not match its
  category's direction. This is enforced once, in Postgres, via a
  composite foreign key — the same layer that already enforces category
  existence — and surfaces as 400 Bad Request.
- `GET /api/v1/categories` now exposes each category's `direction`;
  the OpenAPI contract and the generated client types are updated.
- Existing behavior that this change locks in with requirements: the
  date field defaults to today's local date on load, and after a
  successful save the direction, category, and date keep the values
  just used (session memory for multi-entry), while amount and note
  reset.
- Out of scope (deliberately): changing the dashboard layout, new
  movement types beyond `in`/`out`, bank integration, creating or
  renaming categories (from the form or from global configuration),
  and persisting the last-used date across page reloads.

## Capabilities

### New Capabilities

- `movement-entry`: the always-ready recording form on the first
  screen — focus behavior, defaults, per-direction category filtering,
  and within-session memory between consecutive entries.

### Modified Capabilities

- `movements`: "Record a movement" requires the chosen category to
  carry the movement's direction (mismatched pairs are rejected);
  "Seeded categories" gains a per-category direction, with four new
  income categories in the seed.

## Impact

- `apps/api/db/migrations/004_category_direction.sql` (new): the
  direction column, seed backfill, new in-categories, and the
  composite foreign key.
- `apps/api/internal/categories` — domain struct, repository query,
  and HTTP JSON gain `direction`.
- `apps/api/internal/movements/adapters/postgres` — error mapping for
  the direction-mismatch constraint.
- `apps/web/src/features/categories/domain/category.ts` — the
  hardcoded priority lists and ordering helper are replaced by a
  filter over the category's own direction.
- `apps/web/src/features/movements/adapters/ui/MovementForm.tsx` —
  filtered options, selection reset on direction change, plus the
  autofocus ref.
- `openapi/tabs.yaml` and the regenerated
  `apps/web/src/shared/api/schema.d.ts`.
- No auth, no new dependencies; React `useRef`/`useEffect` only.

# Proposal

## Why

The seeded categories carry generic and redundant entries (both `Income` and
`Salary`; `Housing`, `Subscriptions`, and `Shopping` mix several spending
habits into one bucket), so movements get recorded against labels the user
won't read back meaningfully. At the same time the fixed seed makes the set
rigid: the moment a real expense fits none of the names, the user is stuck
misfiling it, because no creation path exists. Both fixes are cheap now that
the app has no production data.

## What Changes

- Replace the seeded category set with 10 standard categories in English:
  2 income (`Salary`, `Gift`) and 8 expense (`Housing`, `Groceries`,
  `Eating out`, `Transport`, `Utilities`, `Health`, `Entertainment`,
  `Other`). Dropped as redundant or too broad: `Income`, `Bonus`,
  `Reimbursement`, `Subscriptions`, `Shopping`.
- Because the app is development-only and the local database is disposable,
  the seed changes are made by editing the existing migrations in place
  (folding the final shape into `001`/`002`), **not** by adding a new
  migration. `make db-reset` picks the new set up.
- Add `POST /api/v1/categories` so a category name entered by the user is
  created with the movement's direction, and is immediately usable.
- **BREAKING** (spec): `movements`' "Seeded categories" requirement stated
  the user cannot create categories. That sentence is superseded: creation
  is now allowed; renaming and deleting still are not.
- In the movement form's category dropdown, add a `Create new…` entry at the
  bottom. Selecting it opens a small modal with one name field and a
  "Create and use" button; on success the new category is selected for the
  pending movement and appears in the category list from then on.

## Capabilities

### New Capabilities

- `categories`: the category set itself — seeded names and directions,
  listing, and quick creation of a new category (API behavior, uniqueness,
  ordering of created entries).

### Modified Capabilities

- `movements`: the "Seeded categories" requirement is removed; its content
  (seed coverage of both directions, movements referencing categories) moves
  to `categories`. The movement/category direction-pairing rule itself is
  unchanged.
- `movement-entry`: the category dropdown gains the `Create new…` entry and
  the creation modal; the "Categories filtered by direction" requirement
  still holds for the listed choices (the `Create new…` entry is a command,
  not a choice).

## Impact

- `apps/api/db/migrations/`: edit `001_category.sql` (final table shape +
  direction + new seed), fold `004`'s constraints into `001`/`002`, remove
  `004_category_direction.sql`.
- `apps/api/internal/categories/`: new `Create` in `ports`, `application`,
  `adapters/postgres`, `adapters/http` (POST route).
- `openapi/tabs.yaml`: new path + `CategoryInput` schema; regenerate
  `apps/web/src/shared/api/schema.d.ts` via `pnpm --filter web generate:api`.
- `apps/web/src/features/categories/`: create call in the API adapter,
  refresh support in `useCategories`.
- `apps/web/src/features/movements/adapters/ui/MovementForm.tsx`: dropdown
  entry + modal; minor CSS in `index.css`.
- No new dependencies; no changes to movements API request/response shapes.

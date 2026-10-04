# Proposal

## Why

Picking a category is the slowest step of logging a movement. The field
starts on a "Choose a category" placeholder that has to be replaced every
time the page loads or the type changes, the list is names only although
every category already has an icon in the ledger, and each category created
from the form lands below `Other`, so the catch-all ends up in the middle of
the list instead of closing it.

## What Changes

- The category field always holds a category. The "Choose a category"
  placeholder is removed; on load and whenever the type changes, the field
  shows the first category listed for that type.
- **BREAKING** (spec): the requirements that describe an "unselected
  placeholder" — after a type change, after cancelling `Create new…`, after
  a reload, and in the edit dialog — are superseded. Cancelling
  `Create new…` now leaves the category that was already selected.
- The category list shows each category's icon next to its name. A native
  select cannot draw that, so the field becomes a custom list that keeps
  full keyboard operation. The entry form and the edit dialog share it.
- A created category lists above `Other`, which stays last among the
  expense categories. `Create new…` stays below everything.
- Categories that were already created and currently sit below `Other` move
  above it. This is done with a new migration: the ledger now lives on Neon,
  so existing migrations are no longer edited in place.

Not in this change (planned next, as `manage-categories`): a separate
categories screen, renaming, deleting, choosing a category's icon, and
stored per-category colors. Icons and colors keep working as they do today:
seeded categories have their own icon, created ones share the generic one,
and colors come from the cycle's spending rank.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `categories`: listing order gains a catch-all that lists last in its
  direction; a created category lists before it instead of after every
  existing category.
- `movement-entry`: the category field always holds a category and defaults
  to the first one; choices show their icon; the list is keyboard operable;
  cancelling `Create new…` and reloading no longer leave it unselected.
- `movement-editing`: changing the type selects the first category of the
  new type instead of a placeholder; "no category selected" is no longer a
  refusable state.
- `dashboard-composition`: the entry form's category control shows icon
  markers for the selected category and for every choice; the "no category
  selected" presentation is removed.

## Impact

- `apps/api/db/migrations/`: new `005_category_catch_all.sql`. Applied to
  Neon by the API on the next `make prod-up`; it adds one column and flags
  one row.
- `apps/api/internal/categories/adapters/postgres/`: listing order; a new
  repository test.
- `openapi/tabs.yaml`: wording of the category listing order only — no
  request or response shape changes. Regenerate
  `apps/web/src/shared/api/schema.d.ts`.
- `apps/web/src/features/categories/`: a new category list control, its
  keyboard navigation, and a list refresh after creating a category.
- `apps/web/src/features/movements/`: `MovementFields.tsx` drops the native
  select; `movementDraft.ts` resolves the default category; `MovementForm.tsx`
  and `MovementEditDialog.tsx` follow.
- `apps/web/src/index.css`: styles for the list; the native select rules for
  the category field go away.
- No new dependencies.

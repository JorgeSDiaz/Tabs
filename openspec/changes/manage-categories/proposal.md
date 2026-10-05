# Proposal

## Why

A category can be created from the entry form but never touched again: a
typo in its name stays, every created category shares the generic icon, and
an unused one cannot be removed. Its color is not its own either — it is
handed out each cycle by spending rank, so the same category changes color
from one cycle to the next and anything beyond the fifth largest is gray.
There is nowhere to see the category set as a whole.

## What Changes

- A separate categories screen, reached from the dashboard header, that
  lists every category by type with its icon, color, and name. It is the
  only place categories are edited; the entry form's list keeps its quick
  `Create new…` and nothing else.
- From that screen a category can be renamed, given another icon from a
  fixed set, given another color, deleted, and created.
- Every category stores its own color and icon. **BREAKING** (spec): colors
  no longer come from the cycle's spending rank. The ledger, the entry form,
  and the chart read the stored color; the chart still draws only the five
  largest expense categories on their own and groups the rest under one
  neutral block.
- Color choices are a fixed set of swatches, plus any other color a
  category already uses, plus a free picker for a color that is in neither.
- A category created from the entry form gets the color of the fixed set
  that the fewest categories use, and the generic icon — to be changed
  later on the categories screen.
- A category can be deleted only when no movement uses it, it is not the
  catch-all, and it is not the last one of its type.
- **BREAKING** (API): `Category` gains `color` and `icon`; creating a
  category requires both. New `PUT` and `DELETE` on
  `/api/v1/categories/{id}`.

Depends on `refine-category-dropdown` being applied and archived first: this
change builds on its catch-all column, its category list control, and its
spec text.

Not in this change: moving a category's movements to another category,
changing a category's type, reordering categories by hand, a catch-all for
income, and uploading custom icons.

## Capabilities

### New Capabilities

- `category-management`: the categories screen — how it is reached, what it
  lists, and how a category is created, edited, and deleted from it,
  including the icon and color choices it offers.

### Modified Capabilities

- `categories`: every category carries a color and an icon; a category can
  be edited and deleted; the seeded set is a starting point, no longer
  fixed.
- `movement-entry`: a category created from the form gets an automatic
  color and the generic icon.
- `dashboard-composition`: category markers use the category's own stored
  color in the chart, the ledger, and the entry form, instead of a color
  assigned by spending rank.

## Impact

- `apps/api/db/migrations/`: new `006_category_color_icon.sql`, with a
  backfill for the categories already on Neon.
- `apps/api/internal/categories/`: color and icon on the domain type;
  update and delete through every layer; new tests.
- `openapi/tabs.yaml`: `Category` and `CategoryInput` gain `color` and
  `icon`; new `CategoryUpdate` schema and the two new operations.
  Regenerate `apps/web/src/shared/api/schema.d.ts`.
- `apps/web/src/features/categories/`: the screen, the category dialog, the
  icon set keyed by icon name, the color set, update and delete calls.
- `apps/web/src/app/App.tsx`: a second view chosen by the URL hash, and a
  header link. No router dependency.
- `apps/web/src/features/dashboard/` and `features/movements/`: read the
  stored color and icon; the rank-based color assignment is removed.
- Overlap: the in-flight change `show-category-distribution-on-hover` also
  modifies the `dashboard-composition` requirement "Analytics remain
  readable without hover". Whichever of the two is archived second has to
  re-copy that requirement from the main spec first.
- No new dependencies.

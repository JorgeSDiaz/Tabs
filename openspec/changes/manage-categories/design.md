# Design

## Context

See proposal.md for the motivation. This design assumes
`refine-category-dropdown` is applied and archived: the `catch_all` column,
`CategorySelect`, `resolveCategoryId`, and the list reload after a create
all exist.

- A category row holds `id, name, direction, sort_order, catch_all`. It has
  no color and no icon.
- Colors are computed in the browser by `categoryColors(totals)`: the five
  largest expense categories of the cycle get the five palette slots, every
  other expense category gets the neutral color, every income category gets
  the income green. The result is a `Map<id, color>` that `App.tsx` passes
  to the chart, the ledger, and the entry form.
- Icons are picked in `CategoryChip` by the category's *name*; a name that
  is not a seeded one gets the generic tag icon.
- The web is a single view with no router. `App.tsx` owns every data hook.
- The movement table references `category (id, direction)` with a foreign
  key, so a category that has movements cannot be deleted by the database.
- The categories slice has `List` and `Create` through its four layers, and
  `NewCategory` is the one place a name and direction are validated.
- Real categories exist on Neon, including user-created ones.

## Goals / Non-Goals

**Goals:**

- A category's color and icon are stored once and read everywhere.
- The fixed color set and the icon set each live in exactly one place.
- Each deletion rule is enforced in exactly one layer.
- The second screen arrives without a routing dependency.

**Non-Goals:**

- Reassigning a category's movements so it can be deleted.
- Changing a category's direction, or reordering categories.
- Persisting a user palette. A custom color exists as long as a category
  uses it.
- Showing on the screen how many movements a category has.

## Decisions

### 1. Color and icon are columns; the server validates their form only

`006_category_color_icon.sql` adds `color TEXT` and `icon TEXT`, backfills
every row, then sets both `NOT NULL`.

The Go domain checks that a color is `#` followed by six hexadecimal digits
and lowercases it, and that an icon is not blank. It does not know the
fixed color set or the icon set: both are presentation, both live in the
web, and a server-side copy would be a second place to edit whenever a
swatch or an icon is added. An icon name the web does not recognize draws
the generic icon, which the specs already require.

The validation of name, color, and icon is one domain function used by
create and by edit. There is no SQL `CHECK` on the color.

Alternative considered: the server assigns the color on create and owns the
palette. It fit a swatches-only design, but the free picker means the
server must accept arbitrary colors anyway, so the palette would be
enforced nowhere and merely duplicated.

### 2. The backfill, and the last use of names as identity

The migration matches the ten seeded categories by name — possible because
renaming ships with this change, so no name can have changed before it
runs — and gives each its color and icon:

| Category | Color | Icon |
| --- | --- | --- |
| Housing | `#6b8cff` | `home` |
| Groceries | `#f5c451` | `cart` |
| Eating out | `#ff9f6b` | `cutlery` |
| Transport | `#9accff` | `bus` |
| Utilities | `#c3aeff` | `bolt` |
| Health | `#ff9bc2` | `heart` |
| Entertainment | `#3ccbb8` | `play` |
| Salary | `#3dbb76` | `banknote` |
| Gift | `#b6e06a` | `gift` |
| Other | `#a9ad6f` | `tag` |

Every other row — the categories created so far — gets the `tag` icon and
a color from the same sequence the browser would have handed out: the two
fixed colors left over (`#e58be0`, `#d9b38c`), then the set from its start,
in creation order.

Those twelve values are the fixed set, in that order with the two spare
ones before `Other`'s. None of them is the chart's neutral gray
(`#8a93a5`): `Other` was first given that gray, but a top-five `Other`
then drew as one block with the grouped remainder, so it has an olive of
its own. The migration's copy of the twelve is a snapshot, not a second
source — it runs once.

### 3. One `PUT` replaces name, color, and icon; `DELETE` removes

`PUT /api/v1/categories/{id}` takes `{name, color, icon}` and answers with
the stored category, the way `PUT /api/v1/movements/{id}` replaces a
movement. Direction is not in the body, so it cannot be changed. Responses:
200, 400 (blank name, bad color, blank icon), 404, 409 (name taken).

`DELETE /api/v1/categories/{id}` answers 204, 404, or 409 with the reason.

`POST /api/v1/categories` now requires `color` and `icon` too.

### 4. Each deletion rule has one owner

- *Has movements*: the database. The delete fails with the foreign-key
  violation, which the repository maps to `ErrCategoryInUse`. Nothing
  counts movements beforehand.
- *Is the catch-all* and *is the last of its direction*: the Go domain. The
  service reads the list it already can (`List`), finds the category — 404
  when it is not there — and asks one domain function whether it may be
  deleted given how many categories share its direction. `Category` gains
  `CatchAll` for this; it is still not exposed by the API.

The web does not pre-check any of the three. It asks, and shows the reason
it is given. A disabled delete control would need the catch-all flag and a
movement count in the API for no rule the server does not already enforce.

### 5. Colors come from the categories, in the same map

`categoryColors` changes its input, not its output: it builds the
`Map<id, color>` from the category list instead of from the cycle's totals.
Every consumer keeps receiving the same map, so the chart, the ledger, and
the form change by one line in `App.tsx`.

`categoryColors.ts` keeps being the one file about color. It holds the
fixed set, the neutral color, and three pure functions: the least-used
fixed color for a new category, the color choices for the dialog (fixed
set, then other colors in use), and the icon ink for a background (dark or
light, by relative luminance). The income green stops being a category
color; it remains the color of income *amounts*.

`waffle.ts` currently takes "five" from the palette's length. It gets its
own constant, since the fixed set now has twelve entries and the rule is
about the chart.

The ledger and the form now show a sixth-largest category in its own color
while the chart groups it under the neutral block. That is the intended
reading of the spec: the chart groups, the markers do not.

### 6. Icons are keyed by icon name, in `CategoryChip`

`CategoryChip` takes `icon` and `color` instead of `name`. The icon table
moves next to it, into `categoryIcons.tsx`, re-keyed by what each icon
depicts (`home`, `cart`, `cutlery`, …), and grows to twenty: the ten in
use plus `card`, `transfer`, `piggy-bank`, `shirt`, `book`, `plane`,
`paw`, `phone`, `wrench`, `coffee`. That file also exports the names for
the dialog's picker; it is a file of its own because a component file that
exports data loses fast refresh. The chip is the only thing that draws
from the table, and it applies the ink from decision 5.

### 7. The second view is a URL hash

`App.tsx` reads `window.location.hash` through a small hook that listens to
`hashchange`: `#/categories` shows the categories screen, anything else the
dashboard. The header control is a link to `#/categories`; the screen's
return control is a link to `#/`. Reload and the browser's back control
work because the address is real.

Both views stay mounted and the one not shown is `hidden`. The data hooks
live in `App.tsx`, so nothing is refetched, and the entry form keeps its
typed values and its remembered setup across a visit — it is never
unmounted. An edit on the screen updates the same `useCategories` state the
dashboard reads, so the dashboard is current the moment it is shown again.

Alternative considered: a router library. One extra view does not need
nested routes, loaders, or params, and no earlier change added a
dependency for less.

### 8. One dialog for creating and editing

`CategoryDialog.tsx` serves both: it receives either a category to edit or
a direction to create in. Fields: name, icon choices and color choices as
two radio groups, a `Custom…` control that opens the native
`<input type="color">`, and a preview `CategoryChip`. It is a native
`<dialog>` opened with `showModal()`, like the movement edit dialog, which
gives Escape, the backdrop, and focus return.

Deleting asks for confirmation in a second small native dialog that names
the category. A refusal is shown inside it.

The entry form's quick-create modal stays as it is and sends the least-used
fixed color and `tag` along with the name.

`useCategories` gains `update` and `remove`. Both reload the list after
success, as `create` already does.

## Risks / Trade-offs

- [Two categories given the same or a similar color are indistinguishable
  in the chart] → The legend names every block; the automatic color is the
  least-used one, so collisions come only from the user's own choice.
- [A custom color makes the marker unreadable] → The icon ink follows the
  color's luminance. Very dark colors still sit close to the dark surface;
  accepted, since the user picked it and can see the preview.
- [A custom color disappears from the choices once nothing uses it] → By
  design; there is no palette table. It can be picked again.
- [The backfill misses a seeded row because of an unexpected name] → That
  row falls into the "created" branch and still gets a color and the
  generic icon, so `NOT NULL` holds either way.
- [`show-category-distribution-on-hover` modifies the same
  `dashboard-composition` requirement] → The second of the two to be
  archived re-copies "Analytics remain readable without hover" from the
  main spec and reapplies its own sentences.
- [Deleting is refused often, since most categories have movements] → The
  refusal says why. Moving movements between categories is left out until
  real use asks for it.
- [Keeping both views mounted hides the dashboard with `hidden`] → Focus
  cannot enter a hidden subtree, and the amount field's autofocus runs once
  at mount as today.

## Migration Plan

1. `refine-category-dropdown` is applied and archived first (migration
   005).
2. `006_category_color_icon.sql` runs at the next API start: locally on
   `make dev`, on Neon at the next `make prod-up`. It adds two columns and
   writes two values into every category row. It deletes nothing.
3. The API and the web ship together: the new web needs `color` and `icon`
   in the listing, and the new API requires them on create.
4. Work and tests run against the local container only.
5. Rollback: revert the code. The columns can stay unused, or be dropped
   with `ALTER TABLE category DROP COLUMN color, DROP COLUMN icon` and the
   `schema_migrations` row removed. Categories renamed or deleted in the
   meantime stay renamed or deleted.

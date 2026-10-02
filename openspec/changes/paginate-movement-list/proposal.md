# Proposal

## Why

`GET /api/v1/movements` returns every movement of the active cycle in one
response, and the dashboard refetches and re-renders all of them after every
record and delete. The same response is also the only source for the category
distribution, the per-direction movement counts, and the category colors, so
the analytics are tied to whatever the ledger happens to load. Serving the
ledger in pages bounds what it loads and shows, and requires the analytics to
get their own source first.

## What Changes

- **BREAKING** `GET /api/v1/movements` returns one page of the active cycle's
  movements instead of a bare array. It takes a `page` query parameter and
  returns the page's movements with the page number, the number of pages, and
  the total number of movements in the cycle. Pages hold 20 movements, newest
  first.
- The list still covers the active cycle only. Past cycles stay out of it.
- `GET /api/v1/cycles/current` additionally reports, for each category with a
  movement in the active cycle, its total and its movement count.
- The widgets stop reading the movement list. The category distribution, the
  movement counts on the income and expense widgets, and the category colors
  come from the cycle's category totals, so they always cover the whole cycle
  whatever page the ledger shows.
- The ledger gains a numbered pagination control: previous, next, and one
  control per page. Its heading counts the cycle's movements, not the rows on
  the page.
- After a movement is recorded the ledger shows the first page. After a
  delete or an edit it stays on its page, or moves to the last page when
  that page is gone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `movements`: "List movements in the active cycle" becomes a paged, ordered
  list; a new requirement reports the active cycle's totals and counts per
  category.
- `dashboard-widgets`: a new requirement that every widget covers the whole
  active cycle regardless of the ledger's page.
- `dashboard-composition`: a new requirement for how the ledger presents
  pages — the control, the count, loading, and where it lands after a
  record, a delete, or an edit.

## Impact

- **Backend:**
  - `movements` slice: the list query takes a limit and an offset and gains a
    count; the page size and the page arithmetic live in the slice's domain.
  - `cycles` slice: the active cycle's balance is derived from per-category
    totals read in one grouped query, which replaces the current balance
    query.
  - No migration.
- **API contract:** `openapi/tabs.yaml` changes the `listMovements` response
  and adds `category_totals` to `CurrentCycle`. The web client is regenerated
  with `pnpm --filter web generate:api`. The web app is the only client and
  ships in the same deploy.
- **Frontend:**
  - `features/movements`: the list call, `useMovements` and `MovementList`
    become page-aware.
  - `features/dashboard`: `WidgetSection`, the category distribution and the
    stat tiles read the cycle's category totals; the client-side sum over
    movements is removed.
  - `App.tsx`: colors come from the cycle; the refresh after a record goes to
    the first page.
- **Tests:** Go tests for the page arithmetic, the paged query, the list
  handler, and the category totals; a web unit test for the totals mapping.
- **Depends on:** `edit-movements` being applied first. This change specifies
  what the ledger does after an edit.
- **Non-goals:**
  - Listing past cycles or the whole history.
  - A user-chosen page size, sorting, filtering, or search.
  - Infinite scroll or "load more".
  - Changing the habit endpoint, which already reports XP for every movement
    of the active cycle by id.

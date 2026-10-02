# Design

## Context

- **Motivation.** See proposal.md — Why.
- **The list today.** `GET /api/v1/movements` returns a bare JSON array: the
  active cycle's movements ordered `occurred_on DESC, id DESC`.
- **Who reads the list.** The web app holds that array in `useMovements` and
  uses it for four things:
  1. the ledger rows and the ledger heading count (`MovementList`);
  2. the category distribution (`sumByCategory(movements, categories)`);
  3. the movement counts on the income and expense tiles
     (`movements.filter(direction).length` in `WidgetSection`);
  4. the category colors shared by the chart, the ledger and the entry form
     (`categoryColors(sumByCategory(...))` in `App.tsx`).
- **The collision.** Once the array is one page, uses 2 to 4 are wrong:
  they would describe 20 movements instead of the cycle. They must get a
  source that covers the whole cycle before the list can be paged.
- **The cycle endpoint.** `GET /api/v1/cycles/current` already returns the
  cycle's balance. The cycles slice reads it through `ports.BalanceReader`,
  implemented by the movements postgres repository (`CycleBalance`).
- **The habit.** `GET /api/v1/habit` returns `movement_xp` for every movement
  dated in the active cycle, keyed by id. The ledger looks rows up by id, so
  it works unchanged on any page.
- **User decisions.** The list stays scoped to the active cycle, and the
  ledger is navigated with numbered pages.
- **Order.** `edit-movements` is applied first, so the ledger rows already
  have an edit control and `App.tsx` already has an edit handler.

## Goals / Non-Goals

**Goals:**
- A ledger that loads and renders a bounded number of rows.
- Widgets and colors that are correct whatever page the ledger shows.
- Each aggregation rule in one place: the page size on the server, the
  category totals in one query.

**Non-Goals:**
- Paging any other endpoint.
- Caching pages on the client. Every page change is a request.
- Keeping the page in the URL.

## Decisions

### Offset pages with a fixed size

**Choice.**
- `GET /api/v1/movements?page=N`. `page` is optional and defaults to 1.
- The response is an object:

```yaml
MovementPage:
  items: [Movement]     # up to 20, newest first
  page: int             # the page actually returned, from 1
  total_pages: int      # at least 1, also for an empty cycle
  total: int            # movements in the active cycle
```

- The page size is one constant, 20, in `movements/domain`. It is not a
  query parameter and not in the response: the client never needs it, because
  it is given `total_pages` (rules 2 and 3).
- `page` that is not a positive integer is a `400`.
- `page` greater than `total_pages` returns the last page, and `page` in the
  response says so.

**Why offset.** Numbered pages need random access and a page count. Keyset
pagination gives neither.

**Why the server clamps.** Deleting the only row of the last page leaves the
client on a page that no longer exists. With clamping, the client adopts the
`page` it gets back and needs no retry logic. The alternative — an empty page
and a second request from the client — puts the same rule in the client and
flashes an empty ledger.

**Alternative considered.** `limit` and `offset` parameters. Rejected: they
let the client restate the page size, and nothing needs another size.

### Page arithmetic in the domain, two queries in the repository

**Choice.**
- `movements/domain` gains the page size, the page count for a total, and the
  clamp of a requested page. These are pure and table-tested.
- `ports.Repository` gains `CountForCycle(ctx, cycle)`, and `ListForCycle`
  takes a limit and an offset.
- `Service.ListActive(ctx, page)` counts, clamps, then lists.
- The order stays `occurred_on DESC, id DESC`. `id` makes it total, so pages
  never overlap or skip.

**Alternative considered.** One query with `COUNT(*) OVER ()`. Rejected: it
returns no count when the requested page is empty, which is exactly the case
the clamp exists for.

### Category totals ride on the current-cycle endpoint

**Choice.** `CurrentCycle` gains `category_totals`:

```yaml
CategoryTotal:
  category_id: int64
  direction: in | out
  total_cents: int64
  movement_count: int
```

- Only categories with a movement in the cycle appear. An empty cycle gives
  `[]`.
- The list is ordered `in` before `out`, then by descending total, then by
  category id — the order the distribution widget shows today.
- `direction` is included so colors and counts do not wait for the
  categories request. A movement's direction always equals its category's;
  the composite foreign key guarantees it.

**Why this endpoint.** It already means "the active cycle and what it adds up
to", the dashboard already refreshes it after every record and delete, and
the widgets already take `cycle` as a prop.

**Alternatives considered.**
- A new `/api/v1/dashboard/summary`. Rejected: a second endpoint, hook and
  refresh for data with the same lifetime as the balance.
- An unpaged variant of the list for the widgets (`?page=all`). Rejected: it
  keeps the cost this change removes.

### One grouped query replaces the balance query

**Choice.**
- The movements repository's `CycleBalance` is replaced by `CategoryTotals`:
  one `SELECT category_id, direction, SUM(amount_cents), COUNT(*) … GROUP BY
  category_id, direction` over the cycle window.
- `cycles/domain` gains `CategoryTotal` and `BalanceOf(totals)`, which sums
  the `in` and `out` rows into the existing `Balance`.
- The port is renamed from `BalanceReader` to `TotalsReader`, because it no
  longer reads a balance (rule 7).
- `cycles/domain.CategoryTotal.Direction` is a plain string. The cycles
  domain cannot import the movements domain (the movements slice already
  imports cycles), and the value is passed through, not validated.

**Why.** Keeping `CycleBalance` next to a new per-category query would define
"the cycle's sums" twice over the same window (rule 3). Deriving the balance
makes the spec's "totals agree with the balance" true by construction.

### Per-direction counts are summed on the client

**Choice.** The income and expense tiles get their movement count by summing
`movement_count` over the totals of their direction, in
`dashboard/domain/widgets.ts`.

**Alternative considered.** `count_in` and `count_out` on `Balance`. Rejected:
a second field carrying what `category_totals` already holds.

### Frontend: widgets read the cycle, the ledger reads a page

**Choice.**
- `dashboard/domain/widgets.ts`: `sumByCategory(movements, categories)` is
  removed. Its replacement joins `category_totals` to category names and
  keeps the server's order. The name changes with the job (rule 7).
- `WidgetSection`, `CategoryDistributionWidget` and the stat tiles lose their
  `movements` prop. `App.tsx` builds `colors` from `cycle.category_totals`.
- Widget readiness no longer waits for the movement list.
- `useMovements` holds the requested page and exposes `page`, `totalPages`,
  `total`, a way to go to a page, and `reload`. It adopts the `page` the
  server returns.
- `MovementList` renders a `<nav aria-label="Movement pages">` between the
  rows and the XP footer: Previous, one button per page with
  `aria-current="page"` on the current one, Next. It is not rendered for a
  single page, is disabled while loading, and scrolls the list to its first
  row when the page changes.
- `App.tsx`: after a record the ledger goes to page 1; after a delete or an
  edit it reloads its page. A re-date that empties the last page is covered
  by the server clamp, like a delete.
- The distribution's error wiring follows its new source: `WidgetSection`
  gets `cycleError ?? categoriesError` as `dataError`, not the movement
  list's error. A failed list request no longer disables the chart.

**Alternative considered.** Truncating the page numbers with ellipses.
Rejected for now: one cycle of one person is a handful of pages, and the
control wraps (rule 2).

## Risks / Trade-offs

- **[Trade-off]** The benefit is modest: one person's cycle is tens of
  movements, so most cycles are one to three pages. The cost is the move of
  the aggregates to the server, which is most of this change.
  → That move is worth having on its own: it removes the coupling between
  what the ledger displays and what the widgets compute.
- **[Risk]** The ledger and the widgets now come from two requests and can
  disagree for a moment.
  → They already refresh together in `refresh()`, and the heading count comes
  from the list response itself.
- **[Risk]** A back-filled movement is recorded while the ledger jumps to
  page 1, so the new row may be on a later page and not visible.
  → Accepted. The save confirmation and the updated count confirm it was
  stored. Revisit after real use.
- **[Risk]** `BREAKING` response shape: an old web bundle against the new API
  fails to render the ledger.
  → The web app is the only client and both ship in one `make prod-up`.
- **[Risk]** The working tree has uncommitted edits in `App.tsx`,
  `WidgetSection.tsx`, `MovementList.tsx` and `useMovements.ts`.
  → Commit them before applying this change.
- **[Trade-off]** Offset pages shift when rows are inserted between requests.
  Accepted: one user, and every mutation refetches.

## Migration Plan

- No schema change. The existing order is served by a sequential scan of one
  user's table; no index is added until use shows a need.
- Deploy the API and web together with `make prod-up`.
- To roll back, redeploy the previous images of both. No data is written by
  this change.

## Open Questions

- Is 20 the right page size for the ledger column? It is one constant, and
  the answer comes from a cycle of use (task 6.3).

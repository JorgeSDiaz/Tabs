# Tasks

## 1. API contract

- [ ] 1.1 In `openapi/tabs.yaml`: add the optional `page` query parameter and a `400` response to `listMovements`; change its `200` body to a new `MovementPage` schema (`items`, `page`, `total_pages`, `total`); add `CategoryTotal` and the required `category_totals` array to `CurrentCycle`. Run `pnpm --filter web generate:api`. Verify `schema.d.ts` contains `MovementPage` and `CategoryTotal`.

## 2. Cycle category totals (Go)

- [ ] 2.1 Add `CategoryTotal` and `BalanceOf(totals)` to `cycles/domain`. Add a table test for no totals, `in` only, `out` only and a mix. Verify with `make api-test`.
- [ ] 2.2 Rename `cycles/ports.BalanceReader` to `TotalsReader` with `CategoryTotals(ctx, cycle)`. Replace the movements repository's `CycleBalance` with the grouped query from design.md, ordered `in` first, then total descending, then category id. Add a repository test against the local database (skip pattern of `habit/adapters/postgres/movements_test.go`) that inserts movements in a cycle window far in the past and checks sums, counts, order and that a movement outside the window is ignored. Verify with `make db-up && make api-test` and that `grep -rn "CycleBalance\|BalanceReader" apps/api` finds nothing.
- [ ] 2.3 Make `cycles/application.Service.Current` return the totals and the balance derived from them, and add `category_totals` to the handler's JSON. Add a handler test with a fake reader for: the JSON shape, `[]` (not `null`) for an empty cycle, and `500` on a reader error. Verify with `make api-test`.

## 3. Paged list (Go)

- [ ] 3.1 Add the page size (20), the page count for a total, and the clamp of a requested page to `movements/domain`. Add a table test: totals 0, 1, 20, 21 and 45; requested pages 1, the last, and beyond the last. Verify with `make api-test`.
- [ ] 3.2 Add `CountForCycle` to `ports.Repository` and give `ListForCycle` a limit and an offset. Add a repository test against the local database with three same-day movements in a past window: the count is 3, limit 2 returns the two recorded last in `id DESC` order, and offset 2 returns the remaining one. Verify with `make db-up && make api-test`.
- [ ] 3.3 Make `Service.ListActive` take a page, count, clamp and list. Make the handler parse `page` (absent means 1) and return `MovementPage`. Add handler tests with a fake repository for: the default page, page 2, a page beyond the last returning the last, `page=0`, `page=-1` and `page=abc` as `400`, and an empty cycle returning `items: []`, `total: 0`, `total_pages: 1`. Verify with `make api-test`.

## 4. Widgets off the movement list (web)

- [ ] 4.1 In `features/dashboard/domain/widgets.ts`, replace `sumByCategory` with a function that joins `category_totals` to category names, and add the per-direction movement count. Add `widgets.test.ts` covering the join, a total whose category is missing from the list, the kept order, and the counts. Verify with `pnpm --filter web test`.
- [ ] 4.2 Make `WidgetSection`, `CategoryDistributionWidget` and the stat tiles read the cycle's totals and drop their `movements` prop; build `colors` in `App.tsx` from `cycle.category_totals`; stop gating widget readiness on the movement list; pass `cycleError ?? categoriesError` as the distribution's `dataError` instead of the movement list's error. Verify that with the list request failing the chart still renders, and that `grep -rn "sumByCategory" apps/web/src` finds nothing and that, on the same local data, every widget shows the values it showed before this task.

## 5. Paged ledger (web)

- [ ] 5.1 Make `listMovements` take a page and return the `MovementPage`. Make `useMovements` hold the page, adopt the page the server returns, and expose `page`, `totalPages`, `total`, go-to-page and `reload`. Verify with `pnpm --filter web build`.
- [ ] 5.2 Add the pagination `<nav>` to `MovementList` (Previous, a button per page with `aria-current`, Next; absent for one page; disabled while loading; list scrolls to its first row on a page change) and make the heading show `total`. Verify the `dashboard-composition` single-page, several-pages, moving and loading scenarios in the browser.
- [ ] 5.3 In `App.tsx`, go to page 1 after a record and reload the current page after a delete and after an edit. Verify the "Recording returns to the first page", both delete scenarios and both edit scenarios in the browser.
- [ ] 5.4 Style the pagination control in `index.css`. Verify at 1440 and 375 px, and at 200 percent zoom, with 6 pages, that it wraps inside the ledger without horizontal page scrolling, and that it is fully operable with the keyboard.

## 6. Verify the usable slice

- [ ] 6.1 Run `openspec validate paginate-movement-list --strict`, `make test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [ ] 6.2 Against the disposable local database only, insert 45 movements dated in the active cycle across several categories, with one category used only by the oldest movement. Walk every scenario in `specs/movements`, `specs/dashboard-widgets` and `specs/dashboard-composition`: page counts, the clamp after deleting or re-dating the last row of the last page, widgets unchanged across pages, the late category in the chart, and colors on page 2.
- [ ] 6.3 Use the paged ledger through one real cycle and record the findings here: how many pages a real cycle produces, whether 20 per page fits the ledger column, and whether jumping to page 1 after a back-filled movement was confusing.

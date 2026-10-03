# Tasks

## 1. API contract

- [x] 1.1 In `openapi/tabs.yaml`: add the optional `page` query parameter and a `400` response to `listMovements`; change its `200` body to a new `MovementPage` schema (`items`, `page`, `total_pages`, `total`); add `CategoryTotal` and the required `category_totals` array to `CurrentCycle`. Run `pnpm --filter web generate:api`. Verify `schema.d.ts` contains `MovementPage` and `CategoryTotal`.

## 2. Cycle category totals (Go)

- [x] 2.1 Add `CategoryTotal` and `BalanceOf(totals)` to `cycles/domain`. Add a table test for no totals, `in` only, `out` only and a mix. Verify with `make api-test`.
- [x] 2.2 Rename `cycles/ports.BalanceReader` to `TotalsReader` with `CategoryTotals(ctx, cycle)`. Replace the movements repository's `CycleBalance` with the grouped query from design.md, ordered `in` first, then total descending, then category id. Add a repository test against the local database (skip pattern of `habit/adapters/postgres/movements_test.go`) that inserts movements in a cycle window far in the past and checks sums, counts, order and that a movement outside the window is ignored. Verify with `make db-up && make api-test` and that `grep -rn "CycleBalance\|BalanceReader" apps/api` finds nothing.
- [x] 2.3 Make `cycles/application.Service.Current` return the totals and the balance derived from them, and add `category_totals` to the handler's JSON. Add a handler test with a fake reader for: the JSON shape, `[]` (not `null`) for an empty cycle, and `500` on a reader error. Verify with `make api-test`.

## 3. Paged list (Go)

- [x] 3.1 Add the page size (6), the page count for a total, and the clamp of a requested page to `movements/domain`. Add a table test: totals 0, 1, 6, 7 and 45; requested pages 1, the last, and beyond the last. Verify with `make api-test`.
- [x] 3.2 Add `CountForCycle` to `ports.Repository` and give `ListForCycle` a limit and an offset. Add a repository test against the local database with three same-day movements in a past window: the count is 3, limit 2 returns the two recorded last in `id DESC` order, and offset 2 returns the remaining one. Verify with `make db-up && make api-test`.
- [x] 3.3 Make `Service.ListActive` take a page, count, clamp and list. Make the handler parse `page` (absent means 1) and return `MovementPage`. Add handler tests with a fake repository for: the default page, page 2, a page beyond the last returning the last, `page=0`, `page=-1` and `page=abc` as `400`, and an empty cycle returning `items: []`, `total: 0`, `total_pages: 1`. Verify with `make api-test`.

## 4. Widgets off the movement list (web)

- [x] 4.1 In `features/dashboard/domain/widgets.ts`, replace `sumByCategory` with a function that joins `category_totals` to category names, and add the per-direction movement count. Add `widgets.test.ts` covering the join, a total whose category is missing from the list, the kept order, and the counts. Verify with `pnpm --filter web test`.
- [x] 4.2 Make `WidgetSection`, `CategoryDistributionWidget` and the stat tiles read the cycle's totals and drop their `movements` prop; build `colors` in `App.tsx` from `cycle.category_totals`; stop gating widget readiness on the movement list; pass `cycleError ?? categoriesError` as the distribution's `dataError` instead of the movement list's error. Verify that with the list request failing the chart still renders, and that `grep -rn "sumByCategory" apps/web/src` finds nothing and that, on the same local data, every widget shows the values it showed before this task.

## 5. Paged ledger (web)

- [x] 5.1 Make `listMovements` take a page and return the `MovementPage`. Make `useMovements` hold the page, adopt the page the server returns, and expose `page`, `totalPages`, `total`, go-to-page and `reload`. Verify with `pnpm --filter web build`.
- [x] 5.2 Add the pagination `<nav>` to `MovementList` (Previous, the page buttons from `movements/domain/pageWindow.ts` with `aria-current`, Next; absent for one page; inert while loading; list scrolls to its first row on a page change) and make the heading show `total`. Verify the `dashboard-composition` single-page, several-pages, moving and loading scenarios in the browser.
- [x] 5.3 In `App.tsx`, go to page 1 after a record and reload the current page after a delete and after an edit. Verify the "Recording returns to the first page", both delete scenarios and both edit scenarios in the browser.
- [x] 5.4 Style the pagination control in `index.css`. Verify at 1440 and 375 px, and at 200 percent zoom, with 6 pages, that it wraps inside the ledger without horizontal page scrolling, and that it is fully operable with the keyboard.
  - Previous and Next are `aria-disabled` at the ends, not `disabled`: a `disabled` button dropped keyboard focus to the page body. They are chevron icons named "Previous page" and "Next page", like the calendar's month buttons.
  - Restyled on 2026-10-03 after a review against the ui-ux-pro-max, impeccable and taste guidelines: cells like the calendar's days in place of seven raised buttons, the current page in the accent, nothing dimmed while a page loads, and a scrollbar thumb at 3:1.
  - Verified on 2026-10-03 in the browser pane with the `1 2 3 … n` control and 7 to 8 pages: no horizontal overflow and the control inside the ledger on one row at 1440, 1100, 720 (1440 at 200 percent) and 375 px, and on two rows at 320 px. Looked at in screenshots at 1440 and 375 px. Real key presses (on the earlier one-button-per-page control, same buttons): Tab and Shift+Tab move through them with a visible focus ring, Enter and Space change the page, and focus stays on the button.

## 6. Verify the usable slice

- [x] 6.1 Run `openspec validate paginate-movement-list --strict`, `make test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
  - Run on 2026-10-03. The Go suite ran inside `golang:1.26-alpine` against the local `tabs-db` container (database tests PASS, not SKIP), because Smart App Control blocks some freshly built test binaries on the host. `make` targets were run as their commands.
- [x] 6.2 Against the disposable local database only, insert 45 movements dated in the active cycle across several categories, with one category used only by the oldest movement. Walk every scenario in `specs/movements`, `specs/dashboard-widgets` and `specs/dashboard-composition`: page counts, the clamp after deleting or re-dating the last row of the last page, widgets unchanged across pages, the late category in the chart, and colors on page 2.
  - Walked on 2026-10-03 against `tabs-db` only, through a dev API on 8080 and the Vite dev server. The local cycle was brought to exactly 45 movements (40 already there plus 5), with Salary used only by the oldest; then 104 for the 6-page layout, and 20 and 0 for the single-page and empty cases. The local database was left with 43 movements in the cycle.
  - That walk used 20 per page and a button for every page. After the page size became 6 and the control `1 2 3 … n`, the same day: 43 movements gave 8 pages with 6 rows each and 1 on the last; the three numbered pages followed the current one from page 1 to 8 and back; deleting the only row of page 8 landed on page 7; and at 1440 px the six rows fit the rail with nothing to scroll.
- [ ] 6.3 Use the paged ledger through one real cycle and record the findings here: how many pages a real cycle produces, whether 6 per page fits the ledger column, whether the missing first-page button is missed, and whether jumping to page 1 after a back-filled movement was confusing.

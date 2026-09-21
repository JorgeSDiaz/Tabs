# Tasks

## 1. Form readiness (first pass — commit 723c1f2)

- [x] 1.1 Category priority lists + `orderedForDirection` in `category.ts` — SUPERSEDED by 2.1/4.1: direction is now data, not a frontend list
- [x] 1.2 `MovementForm.tsx`: `useRef` on the amount input, focus on mount — verified live: caret lands in Amount with no click
- [x] 1.3 `MovementForm.tsx`: refocus amount after a successful save — verified live: amount/note clear, caret returns, direction/category/date kept
- [x] 1.4 First-pass scenarios walked live (focus, date defaults, ordering, session memory, reload reset); `go test` + web build green

## 2. Direction becomes data (backend)

- [x] 2.1 Add `apps/api/db/migrations/004_category_direction.sql`: `direction` column + `CHECK (in|out)`; backfill Income→`in`, the nine expense names→`out`; seed `Salary`, `Bonus`, `Reimbursement`, `Gift` as `in` (sort_order 11–14); `UNIQUE (id, direction)` on `category`; named composite FK `movement_category_direction_fkey` on `movement (category_id, direction)` — verify: API restart applies 004; `psql` shows 14 categories, each with a direction
- [x] 2.2 categories slice: `Direction` on `domain.Category`, repository SELECT/scan, `categoryJSON` emits `direction` — verify: `curl /api/v1/categories` shows `"direction"` on every row
- [x] 2.3 movements postgres adapter: map a violation of `movement_category_direction_fkey` to a new `domain.ErrCategoryDirectionMismatch`, keep `movement_category_id_fkey` → `ErrUnknownCategory`; add the error to `writeDomainError`'s 400 group — verify: `cd apps/api && go test ./...` green; `curl` POST direction `in` + a known `out` category id → 400 with the mismatch message; valid pair → 201

## 3. Contract

- [x] 3.1 `openapi/tabs.yaml`: add required `direction` enum `[in, out]` to the `Category` schema; extend POST /movements 400 description to mention the mismatch — verify: `pnpm --dir apps/web generate:api` regenerates `schema.d.ts` with `direction` and the web build (tsc) passes

## 4. Frontend: filter, not order

- [x] 4.1 `category.ts`: delete `IN_PRIORITY`/`OUT_PRIORITY`/`orderedForDirection`; add `forDirection(categories, direction)` filtering by the category's own `direction` — verify: build + lint pass
- [x] 4.2 `MovementForm.tsx`: options render from `forDirection(categories, direction)`; the Direction `onChange` also resets `categoryId` to unselected — verify live: `in` lists exactly Income/Salary/Bonus/Reimbursement/Gift; `out` lists the nine; selecting a category then switching direction returns the placeholder

## 5. Verification against the spec deltas

- [x] 5.1 Walk every scenario of `specs/movement-entry/spec.md` and the `movements` delta live: fresh load focuses Amount and shows today; filtered lists; reset on switch; save keeps direction/category/date and clears amount/note with focus back; reload resets; POST rejects amount ≤ 0, unknown category, and direction mismatch (curl)
- [x] 5.2 Run `cd apps/api && go test ./...` and `pnpm --dir apps/web build` + lint, record the outcome

## 6. Ship

- [x] 6.1 One real multi-entry session across both directions; tune the seed's category set via a follow-up change if it fights real habits; commit with the `✨` prefix

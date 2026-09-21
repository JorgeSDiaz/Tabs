# Tasks

## 1. Database: fold migrations and re-seed

- [x] 1.1 Rewrite `apps/api/db/migrations/001_category.sql` to create the final table in one statement (`name TEXT NOT NULL UNIQUE`, `direction TEXT NOT NULL CHECK (direction IN ('in','out'))`, `sort_order INTEGER NOT NULL`, `UNIQUE (id, direction)`) and seed the ten categories with directions: `Salary`, `Gift` (`in`), then `Housing`, `Groceries`, `Eating out`, `Transport`, `Utilities`, `Health`, `Entertainment`, `Other` (`out`). Verify: `make db-reset` succeeds and `SELECT name, direction FROM category ORDER BY sort_order` returns exactly those ten.
- [x] 1.2 Replace the plain `REFERENCES category (id)` in `002_movement.sql` with the composite `FOREIGN KEY (category_id, direction) REFERENCES category (id, direction)` (constraint name `movement_category_direction_fkey`, as before) and delete `004_category_direction.sql`. Verify: a movement insert pairing a category with the wrong direction fails with the FK violation the movements repository already maps, and `make api-test` passes.

## 2. API contract

- [x] 2.1 In `openapi/tabs.yaml`, add `POST /api/v1/categories` (`createCategory`) with a `CategoryInput` schema (`name`, `direction` enum) and responses 201 `Category`, 400 invalid name/direction, 409 duplicate name, 500. While there, fix the stale "List the seeded categories" wording — the listing now includes created ones. Verify: `pnpm --filter web generate:api` regenerates `apps/web/src/shared/api/schema.d.ts` with the new operation and no diff noise beyond it.

## 3. API: create path in the categories slice

- [x] 3.1 In `apps/api/internal/categories/domain`, add creation validation in one place: a name trimmed of whitespace must be non-empty, direction must be `in` or `out`; define `ErrDuplicateName` for the repository to map. Verify: a new Go unit test covers blank, whitespace-only, and bad-direction inputs and passes under `make api-test`.
- [x] 3.2 Extend `ports.Repository` with `Create` and implement it in `adapters/postgres/repository.go` with the design's `INSERT ... sort_order = COALESCE(MAX(sort_order),0)+1 ... RETURNING`, mapping SQLSTATE 23505 to `ErrDuplicateName`. Verify: via 3.3's handler check below.
- [x] 3.3 Add `Service.Create` in `application/service.go` and a `POST /api/v1/categories` route in `adapters/http/handler.go` (201 + Category JSON; 400 on validation; 409 on `ErrDuplicateName`), wired wherever `NewService`/`Register` is called today. Verify: with `make db-reset && make api`, `curl` create → 201 with id; repeat same name → 409; blank name → 400; `GET /api/v1/categories` shows the new one after the seeded ones.

## 4. Web: quick create from the form

- [x] 4.1 Add `createCategory(name, direction)` to `features/categories/adapters/api/categories.ts` and expose `create` from `useCategories`, which appends the returned category to its state and passes API errors through to the caller; thread `onCreateCategory` from `App.tsx` into `MovementForm`. Verify: `pnpm --filter web build` (tsc) compiles with the generated types.
- [x] 4.2 In `MovementForm.tsx`, append `<option value="create">Create new…</option>` after the filtered choices; selecting it opens a native `<dialog>` with a name input and a "Create and use" button (Esc/cancel leaves the select at the placeholder and creates nothing); confirming calls `onCreateCategory(name, direction)`, selects the returned id, closes the modal, and preserves amount, date, and note. A rejected create shows the error inside the modal without closing it. Verify: manual run against `make dev`.
- [x] 4.3 Add minimal modal styles to `apps/web/src/index.css` (centered overlay panel, backdrop), consistent with the existing form styling. Verify: the modal renders legibly in the dev browser.

## 5. End-to-end check

- [x] 5.1 On a fresh `make db-reset`: record one movement against a seeded category in each direction; create "Weekend trips" via the modal while recording an `out` movement, save it, and confirm the list shows the name; switch direction to `in` and confirm the new category is *not* offered; reload and confirm it persists. Verify: `make test` and `make build` green, and the manual flow behaves as described.

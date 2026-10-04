# Design

## Context

The `categories` slice today is read-only: `domain.Category` (ID, Name,
Direction, SortOrder), `ports.Repository` with only `List`, a Postgres
repository, and `GET /api/v1/categories`. The `category` table already
carries `direction` with a CHECK constraint and a composite FK from
`movement` enforcing the movement↔category direction pairing — the seed
rows, however, are split across two migrations: `001` creates the table
and inserts direction-less names, `004` adds the column, backfills it,
inserts the `in` rows, and adds the constraints.

The web form gets its choices from `useCategories` (state owned by
`App.tsx`) and filters them by direction with `forDirection`. The API
contract lives in `openapi/tabs.yaml`; `apps/web` regenerates
`src/shared/api/schema.d.ts` from it with `pnpm --filter web generate:api`
and calls the API through `openapi-fetch`, so a new endpoint's types come
for free once the YAML is updated.

Hard constraint from the user: nothing is in production; the local
database is disposable (`make db-reset`). Old data does not have to be
migrated — existing migration files may be edited in place.

## Goals / Non-Goals

**Goals:**
- One authoritative seed: the final ten categories, with directions,
  defined in exactly one place.
- A category can be created from the API in one call and used
  immediately, including within the movement being composed.
- The dropdown/modal flow adds no dependencies and no new layers to any
  slice.

**Non-goals:**
- Rename/delete endpoints or UI for categories (explicitly out of scope).
- Sub-categories, per-direction defaults for created categories beyond
  what the form already knows, or automatic categorization rules.
- A case-insensitive name uniqueness scheme (see Risks).

## Decisions

### 1. Fold the migrations, don't add one
Edit `001_category.sql` to create the final table in one statement —
`direction TEXT NOT NULL CHECK (direction IN ('in','out'))`,
`UNIQUE (name)`, `UNIQUE (id, direction)` (needed as composite FK
target) — followed by the single ten-row seed INSERT with directions.
Move the composite FK `movement_category_direction_fkey` into
`002_movement.sql` and delete `004_category_direction.sql`.

*Alternative considered*: a `005` that renames/merges old rows into the
new set. Rejected: nothing consumes the old data, and a rename migration
would encode names that no longer exist anywhere (violates rule 7, names
match reality). Editing in place keeps the schema story in two files that
match the two tables.

### 2. Creation is `POST /api/v1/categories` with `{name, direction}`
Mirrors the existing movements handler/service shape: domain
`CreateInput`/constructor validates name (non-empty after trimming) and
direction (`in`/`out`) — the one place those two rules live — and the
repository inserts:

```sql
INSERT INTO category (name, direction, sort_order)
VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM category))
RETURNING id, name, direction, sort_order
```

so created categories sort after the seeded ones (the spec's ordering
scenario). A unique violation on `name` (SQLSTATE 23505) maps to `409`
with an `Error` body; the DB constraint is the one place uniqueness is
enforced — Go does not pre-check by listing. Responses: `201` Category,
`400` invalid name/direction, `409` duplicate name, `500`.

*Alternative considered*: deriving direction server-side from the form
context or defaulting to `out`. Rejected: the client already knows the
direction it is recording under; an explicit field keeps the endpoint
honest and the rule in one place.

### 3. Web: creation lives in the `categories` slice, the modal lives in `movements`
- `features/categories/adapters/api`: add `createCategory(name, direction)`.
- `features/categories/application/useCategories`: expose
  `create(name, direction)` that calls the API, appends the returned
  `Category` to its state (it is then immediately offered by
  `forDirection`), and returns it. A failed create leaves state
  untouched; the returned error surfaces in the modal.
- `App.tsx` passes `categories` and `onCreateCategory` into
  `MovementForm` — the form already receives `categories` as a prop, so
  the hook stays the single owner of category state.
- `MovementForm`: the select gains a trailing
  `<option value="create">Create new…</option>` (sentinel string value;
  `categoryId` stays `''` when it is chosen). Selecting it opens the
  modal; confirming calls `onCreateCategory(name, direction)`, then
  `setCategoryId(created.id)` — amount, date, and note are untouched.
- The modal is a native `<dialog>` (`showModal()`): free Escape-to-cancel,
  backdrop click handling aside, focus trapping without a dependency —
  adding a component-library just for this would violate rule 4. A few
  lines in `index.css` alongside the existing form styles.

*Alternative considered*: a separate `CategoryModal` component file under
`categories/adapters/ui`. Rejected as scaffolding for one caller; the
modal is movement-entry behavior (rule 4's "earns its place by having a
caller" — but a second component tree that differs from the form by a
noun buys nothing).

### 4. Contract first
Update `openapi/tabs.yaml` (new path + `CategoryInput` schema) and
regenerate `schema.d.ts` before hand-writing any client call, so
TypeScript compels the handler and the form to agree on the shape.

## Risks / Trade-offs

- [Editing migrations invalidates already-applied dev databases] →
  `make db-reset` is the documented recovery; the constitution already
  declares the container disposable.
- [`UNIQUE (name)` is case-sensitive: `Food` and `food` coexist] →
  acceptable for one user with a visible dropdown; making it
  case-insensitive would add a lower() index or citext — deferred until
  it actually bites (rule 2).
- [Concurrent creates racing on `sort_order` subselect] → single-user
  app; worst case is two categories sharing an order value, and the list
  query breaks ties by name.
- [Native `<dialog>` styling differs across browsers] → the app is
  single-user on the developer's own machines; minimal CSS, revisit only
  if it looks wrong in practice.

## Migration Plan

Dev-only: land code, `make db-reset`, `make dev`. No production steps.

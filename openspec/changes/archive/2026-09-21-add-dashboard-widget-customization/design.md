# Design

## Context

See `proposal.md` — Why. Current state: the dashboard (`apps/web/src/app/App.tsx`)
is a fixed stack of `CycleSummary`, `MovementForm`, `MovementList`. The API
(`apps/api`, Go, `net/http` ServeMux) exposes only active-cycle data:
`GET /api/v1/cycles/current` (total in / total out / net) and
`GET /api/v1/movements` (every movement of the active cycle). Postgres has a
single-row `settings` table (`id = 1`, boundary day + timezone) read by the
`cycles` slice. The web client is typed against `openapi/tabs.yaml` via
`openapi-typescript` + `openapi-fetch`.

Confirmed decisions from the user: server-side persistence, active-cycle-only
data, and a charting library (the "no third-party" constraint ruled out
external chart services, not libraries).

## Goals / Non-Goals

**Goals**

- Widget selection survives across page loads *and* machines.
- Four widgets with fixed visuals; the data they need is derived from
  endpoints that already exist, except the per-category totals, which this
  design derives client-side.
- The dashboard layout rule "form pinned, widgets toggleable" is expressed
  once.

**Non-Goals**

- Widget ordering, sizing, theming, drag-and-drop (proposal scope).
- Multi-cycle history endpoints — nothing in the current use asks for them.
- Making the widget catalog dynamic (adding/removing widgets will be a code
  change on both sides, which is fine for a fixed set of four).

## Decisions

### D1: New `dashboard` slice on the API

`apps/api/internal/dashboard/` with the standard four layers
(`domain/`, `ports/`, `application/`, `adapters/http`, `adapters/postgres`),
wired in `cmd/api/main.go` exactly like the other slices.

Why a new slice and not an extension of `cycles`: `cycles` owns
cycle-boundary math and the balance read; widget selection is a different
noun with no shared logic. Why not a generic `preferences` slice: rule 4 —
it earns its shape from exactly one caller today (the four widgets); when a
second preference appears, the dashboard slice is already the template.

- `domain`: `WidgetID` string type with the four known ids —
  `net-balance`, `total-income`, `total-expenses`, `category-distribution` —
  `WidgetSettings map[WidgetID]bool`, `Defaults()` (all true), and
  `Validate(map[string]bool)` rejecting unknown ids. This is the *single*
  place the widget-id rule lives (rule 3).
- `ports`: `SettingsStore` with `Load(ctx) (map, error)` / `Save(ctx, map)`.
- `application`: thin `Service` over the port: `Widgets()` returns stored
  settings or defaults when nothing is stored; `Save()` validates then
  stores.
- `adapters/http`: `GET /api/v1/dashboard/widgets` and
  `PUT /api/v1/dashboard/widgets`, both body `{"widgets": {id: bool}}`;
  validation errors → 400, matching the existing `writeError` helper style.
- `adapters/postgres`: reads/writes the `dashboard_widgets` column of
  `settings` row id = 1.

### D2: Selection is one nullable JSONB column on `settings`

Migration `004_settings_dashboard_widgets.sql`:
`ALTER TABLE settings ADD COLUMN dashboard_widgets JSONB` (nullable; NULL =
never chosen → defaults). The alternative, four boolean columns, needs a
migration every time the catalog changes and bakes the catalog into the
schema; a separate `widget` rows table is multi-row machinery for a
single-row setting. No SQL CHECK on keys/values: the domain layer is the
one validation place (rule 3), so a SQL constraint would be the exact
triplication Caudal hit.

Trade-off noted: two slices (`cycles` reader, `dashboard` reader/writer)
now touch the `settings` table. They address disjoint columns, and the row
is conceptually "the app's settings"; accepting this beats cloning a
single-row table. If the table ever grows enough columns to hurt, it splits
then, not now (rule 2).

### D3: PUT replaces the whole map; GET never lies

`PUT` requires all four ids with boolean values (spec requirement "Widget
settings endpoint"), so there is no merge semantics to define or forget.
`GET` normalizes: any NULL returns the defaults; a stored map that somehow
contains an unknown id (e.g. after a code rollback) — GET ignores unknown
ids and applies defaults for missing ones, keeping the UI renderable.
Normalization lives in `application`, not in the web.

### D4: No new analytics endpoint; category totals aggregate client-side

`useMovements()` already returns every movement of the active cycle with
`category_id` and `amount_cents`, and `useCategories()` supplies names and
directions. The distribution widget reduces those in a pure function
(`sumByCategory(movements) → [{category, direction, total}]`) placed in
`features/dashboard/domain/`. The three scalar widgets reuse
`/cycles/current`'s `balance`, which the app already fetches. Adding
`?group=category` to the API or a new totals endpoint would be a second
source of truth for numbers the client provably can compute (rule 3, and
movement data is already fully transferred). The volume argument is safe
at personal-finance scale (tens of movements per cycle).

### D5: `recharts` for the two chart widgets, plain tiles for the scalars

`recharts` (react-family, no D3 wrapper ceremony in app code, MIT) is the
only new runtime dependency, installed with `pnpm --filter web add
recharts`.

- `net-balance`: grouped `BarChart` with `In`, `Out`, `Net` bars.
- `category-distribution`: horizontal `BarChart`, one bar per category with
  movements, colored by direction; empty state text when no movements.
- `total-income` / `total-expenses`: stat tiles (large formatted number via
  the existing `formatCents`). A pie/bar of one number is decoration, not
  information; the catalog treats them uniformly anyway — every widget is
  just `{id, enabled}`.

Alternatives: `chart.js`+`react-chartjs-2` (more imperative, canvas-first);
hand-rolled SVG (rejected: user chose a library, and it risks Caudal-style
bespoke chart helpers).

### D6: Web: new `features/dashboard` slice owning selection state

Following the existing feature-slice layout:

- `domain/widgets.ts`: the catalog — ids matching the API enum, labels,
  default order; `sumByCategory` (D4).
- `adapters/api/dashboard.ts`: `getWidgets()` / `putWidgets()` typed from
  the regenerated `schema.d.ts`.
- `application/useWidgetSettings.ts`: loads once, exposes
  `{settings, ready, toggle(id)}`; `toggle` applies optimistically and PUTs
  the full map; a failed PUT re-fetches to resync. No localStorage mirror:
  one source (rule 3), and it removes a cache-invalidation class of bug.
- `adapters/ui/WidgetPicker.tsx`: the "Customize" popover with one switch
  per catalog entry; `adapters/ui/WidgetSection.tsx`: renders enabled
  widgets in catalog order.

`App.tsx` becomes: pinned `MovementForm` on top, then `CycleSummary`
(unchanged, the period header), then the widgets section, then
`MovementList` (unchanged, always shown — it is not a widget in this
change). The widget area renders a minimal placeholder until `ready` so a
slow GET never flashes the wrong widget set. `CycleSummary` stays: removing
it would answer a question the user didn't ask, and the widgets are charts
while the summary is the precise numbers.

### D7: OpenAPI and tests

`openapi/tabs.yaml` gains the two paths + a `WidgetSettings` schema;
`pnpm --filter web generate:api` regenerates types. Go tests: `domain` table
test for `Validate` (unknown/missing id, non-bool comes through JSON decode
errors), `application` test with a fake `SettingsStore` for the
defaults/NULL and normalize-unknown rules; HTTP layer test on the existing
stdlib pattern (no DB in tests — `postgres` adapter stays thin, exercised
via `make dev` against the local container). The "docs promise" the spec
makes (defaults, rejection-without-mutation) is thus test-covered (rule 6).

## Risks / Trade-offs

- [JSONB has no schema guarantee] → domain validation at the single write
  path + GET normalization keeps the UI safe even against stale stored data.
- [Two slices share the `settings` row] → disjoint columns; revisit if the
  table grows (documented in D2).
- [Optimistic toggle can diverge on failed PUT] → resync-on-error (D6);
  divergence lasts one round-trip at most.
- [recharts bundle weight] → import only `ResponsiveContainer`, `BarChart`
  and friends; personal app, local use, acceptable. Re-evaluate if the
  dashboard ever feels sluggish on load.
- [Widget ids duplicated between Go domain and web catalog] → unavoidable
  client/server contract, same as `direction` strings are today; the OpenAPI
  spec documents the four ids so `generate:api` catches drift in types.

## Migration Plan

Additive only: `004` adds a nullable column (no backfill — NULL means
defaults). Deploy = `make build` + normal restart; `postgres.Migrate` runs
`004` at boot. Rollback = revert code; leaving the column is harmless.

## Open Questions

None material. (Exact label strings and colors are polish; catalog names
ship in `domain/widgets.ts` and can change freely.)

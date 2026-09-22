# Tasks

## 1. API — persistence and domain

- [x] 1.1 Add migration `apps/api/db/migrations/004_settings_dashboard_widgets.sql` (`ALTER TABLE settings ADD COLUMN dashboard_widgets JSONB;`, nullable, no backfill) and verify with `make db-reset && make api` that boot logs migrations applying cleanly (design D2)
- [x] 1.2 Create `internal/dashboard/domain` with `WidgetID` (`net-balance`, `total-income`, `total-expenses`, `category-distribution`), `WidgetSettings`, `Defaults()`, and `Validate` rejecting unknown ids, and verify with table-driven unit tests (`go test ./...`)
- [x] 1.3 Create `internal/dashboard/ports` (`SettingsStore` Load/Save) and `internal/dashboard/application` Service — NULL/empty store yields defaults, save validates, load normalizes unknown ids away and defaults missing ones (design D3) — and verify with unit tests using a fake `SettingsStore`
- [x] 1.4 Create `internal/dashboard/adapters/postgres` `SettingsStore` reading/writing `dashboard_widgets` on `settings` row id = 1 and verify it compiles and round-trips a save+load through `make api` + curl (after 1.5 wiring)
- [x] 1.5 Create `internal/dashboard/adapters/http` Handler (`GET`/`PUT /api/v1/dashboard/widgets`, body `{"widgets": {id: bool}}`, invalid → 400 via existing error style), wire the slice in `cmd/api/main.go`, and verify with `httptest` cases: defaults on first GET, full-map PUT round-trip, PUT with unknown/missing id or non-bool → 400 and stored value unchanged
- [x] 1.6 Against `make db-up && make api`, curl the defaults→PUT→GET→restart-still-returns-saved sequence and confirm the persisted selection survives an API restart

## 2. OpenAPI contract and generated types

- [x] 2.1 Add the two `/api/v1/dashboard/widgets` paths and a `WidgetSettings` schema (documenting the four widget ids, per design risk on id drift) to `openapi/tabs.yaml` and verify with a YAML parse (e.g. `pnpm exec -- openapi-typescript` step below)
- [x] 2.2 Run `pnpm --filter web generate:api` and verify `apps/web/src/shared/api/schema.d.ts` contains the new paths and `pnpm --filter web build` type-checks

## 3. Web — dashboard feature slice

- [x] 3.1 Add recharts with `pnpm --filter web add recharts` and verify `pnpm --filter web build` still succeeds
- [x] 3.2 Create `features/dashboard/domain/widgets.ts`: catalog (ids matching the API enum, labels, fixed order) and pure `sumByCategory(movements)` aggregation (design D4), and verify via type-check and a manual sanity read against the spec's distribution rules
- [x] 3.3 Create `features/dashboard/adapters/api/dashboard.ts` (`getWidgets`/`putWidgets` typed from `schema.d.ts`) and `features/dashboard/application/useWidgetSettings.ts` (load once → `{settings, ready, toggle}`; toggle is optimistic, PUTs the full map, refetches on failure — design D6) and verify the module graph compiles in `pnpm --filter web build`
- [x] 3.4 Create the four widget components in `features/dashboard/adapters/ui/widgets/`: grouped bar chart (in/out/net) for net-balance, stat tiles using `formatCents` for total-income/total-expenses, and the direction-colored horizontal bar chart for category-distribution with an explicit empty-state (design D5), and verify each renders from the existing `/cycles/current` + `/movements` + `/categories` data with `make dev`
- [x] 3.5 Create `WidgetPicker.tsx` ("Customize" button + popover with one switch per catalog entry reflecting live state) and `WidgetSection.tsx` (renders enabled widgets in catalog order, placeholder until `ready` — design D6) and verify toggling each switch shows/hides exactly that widget
- [x] 3.6 Restructure `App.tsx`: pinned `MovementForm` on top, then `CycleSummary`, then `WidgetSection` + `WidgetPicker`, then `MovementList` unchanged (design D6) and verify the form is visible and functional with all widgets disabled

## 4. Integration verification

- [x] 4.1 Run `make test` and `make build` and verify both pass
- [x] 4.2 Walk the spec's scenarios against `make dev` + `make db-up`: record a movement and see all widgets update without page reload; unused categories absent from distribution; empty-state on a fresh cycle; disable a widget, reload, and see the same selection; open in a second browser profile and see the selection follow; first-ever load shows all four widgets; observe and fix any divergence between spec and behavior by updating the spec first (constitution rule 8)

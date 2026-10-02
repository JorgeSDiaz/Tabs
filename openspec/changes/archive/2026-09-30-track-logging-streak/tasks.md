# Tasks

## 1. Habit domain (Go)

- [ ] 1.1 Create `apps/api/internal/habit/{domain,ports,application,adapters/http,adapters/postgres}`. Add `domain.Rules` (base 10, note 5, first_of_day 10) and `Level(total)` using 250 XP per level. Add table tests for 0, 249, 250 and 1,265 XP. Verify with `make api-test`.
- [ ] 1.2 Implement `LoggedDays`, `Streak` and `DayMap` over a fixed time zone and clock. Add table tests for every `logging-habit` streak and day-map scenario: today pending, today logged, broken streak, cross-cycle streak, back-filled movement, 23:30 local vs UTC, and deleting the only movement of a day. Verify with `make api-test`.
- [ ] 1.3 Implement `MovementXP` with first-of-day ordered by `(created_at, id)` and a trimmed-note check. Add tests showing that the amount does not matter and that deleting the first movement promotes the next one. Verify with `make api-test`.

## 2. Habit service and adapters

- [ ] 2.1 Add the `LoggedMovements` port and its postgres adapter (`SELECT id, created_at, occurred_on, note FROM movement`). Add a repository test against the local database. Verify with `make db-up && make api-test`.
- [ ] 2.2 Add the `CycleClock` port. Wire it in `cmd/api/main.go` with the cycles settings reader and `cycles/domain.ActiveAt`. Add a service test with a stub clock for a mid-cycle day. Verify with `make api-test`.
- [ ] 2.3 Add `GET /api/v1/habit` in `habit/adapters/http`. It returns the JSON shape in design.md and a 500 with an error body on storage failure. Add handler tests for the success and failure responses. Verify with `make api-test`.
- [x] 2.4 Add `/api/v1/habit` and the `Habit` schemas to `openapi/tabs.yaml`, then run `pnpm --filter web generate:api`. Verify that `schema.d.ts` contains `Habit` and that the web build passes.

## 3. Dashboard presentation

- [x] 3.1 Add `features/habit`: the API adapter, and a `useHabit` hook that refreshes whenever a movement is recorded or deleted. Verify in the browser that recording a movement updates the streak without a reload.
- [x] 3.2 Build the `StreakPanel` as the largest analytics tile. It shows the streak title, the day map, and a legend covering logged, today, missed and ahead, with markers that differ in fill or shape. It shows an error state that leaves the rest of the page working. Verify against `d6-dashboard-dark`, and check the error by stopping the API.
- [x] 3.3 Add the header streak and level indicators, with progress between `level_starts_at` and `next_level_at`. Verify the values against the endpoint response.
- [x] 3.4 Show each ledger row's XP from `movement_xp`, and render the XP rules footnote from `rules`. Grep `apps/web/src` for hard-coded XP values and verify there are none.
- [x] 3.5 Show the XP earned in the post-save confirmation, read from the refreshed habit. Verify that the first movement of the day with a note shows 25 XP and that a second movement without a note shows 10 XP.
- [x] 3.6 Verify that hiding all four widgets leaves the streak panel visible, and that the Customize control still lists exactly four widgets.

## 4. Verify the usable slice

- [ ] 4.1 Run `openspec validate track-logging-streak --strict`, `make api-test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [ ] 4.2 Against disposable local data, walk through a day: log two movements, delete the first, back-fill a past date, and reload. Confirm the streak, the day map and the XP match the spec at 1440 and 375 px.
- [ ] 4.3 Use the app for one real cycle and record the findings here, especially the mid-cycle "missed" days and whether the habit should be hideable.

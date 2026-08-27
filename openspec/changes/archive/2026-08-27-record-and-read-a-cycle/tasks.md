## 1. Database

- [x] 1.1 Put the connection string in `apps/api/.env` (not committed).
      Local dev Postgres for now (`docker-compose.yml`); Neon
      provisioning deferred
- [x] 1.2 Migration: `category` table (id, name, sort_order) + seed the
      fixed category list
- [x] 1.3 Migration: `movement` table (id, amount_cents, direction,
      category_id, occurred_on, note, timestamps)
- [x] 1.4 Migration: `settings` table (boundary_day, timezone) + seed
      the row (`boundary_day = 30`, `timezone = 'America/Bogota'`)

## 2. Cycle logic

- [x] 2.1 Implement the single cycle-boundary function (start/end for a
      given date, with short-month clamping)
- [x] 2.2 Unit tests covering: date on the boundary day, date the day
      before the boundary, a short month (February) clamp, a 31-day
      month, and active-cycle resolution across a time-zone boundary
      (22:00 Sep 29 in `America/Bogota` = 03:00 UTC Sep 30 still
      resolves to the cycle starting Aug 30)

## 3. API (`apps/api`)

- [x] 3.1 `POST /api/v1/movements` — create, validating amount > 0,
      direction, category existence
- [x] 3.2 `GET /api/v1/movements` — list for the active cycle
- [x] 3.3 `DELETE /api/v1/movements/{id}`
- [x] 3.4 `GET /api/v1/categories` — list the seeded categories
- [x] 3.5 `GET /api/v1/cycles/current` — active cycle bounds + balance
      (total in, total out, net)
- [x] 3.6 Write `openapi/tabs.yaml` by hand for the five endpoints above

## 4. Web (`apps/web`)

- [x] 4.1 Generate TS types from `openapi/tabs.yaml`
- [x] 4.2 `movements` feature: `api/`, `hooks/`, `components/` per the
      feature-sliced layout
- [x] 4.3 One screen: record form + movement list + cycle balance

## 5. Verification

- [x] 5.1 `go test ./...` green, including the cycle-boundary scenarios
- [x] 5.2 End-to-end: record an `in` and an `out` movement, see both
      listed, see the correct net, delete one, see the net adjust
- [x] 5.3 Record a movement dated on the boundary day and one dated the
      day before — confirm they land in different cycles
- [x] 5.3b Using the seeded settings row (`boundary_day = 30`), record a
      movement dated the 29th and one dated the 30th — confirm they land
      in different cycles
- [ ] 5.4 Clone the repo on a second machine, point at the same Neon
      connection string, confirm the same movements appear. SKIPPED by
      decision — local dev Postgres for now; validate when access to a
      central DB (Neon) is actually required
- [x] 5.5 `openspec archive record-and-read-a-cycle` — merge this
      change's delta into `openspec/specs/movements/spec.md`

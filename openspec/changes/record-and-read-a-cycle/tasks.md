## 1. Database

- [ ] 1.1 Provision the Neon project and put the connection string in
      `apps/api/.env` (not committed)
- [ ] 1.2 Migration: `category` table (id, name, sort_order) + seed the
      fixed category list
- [ ] 1.3 Migration: `movement` table (id, amount_cents, direction,
      category_id, occurred_on, note, timestamps)

## 2. Cycle logic

- [ ] 2.1 Implement the single cycle-boundary function (start/end for a
      given date, with short-month clamping)
- [ ] 2.2 Unit tests covering: date on the boundary day, date the day
      before the boundary, a short month (February) clamp, a 31-day
      month

## 3. API (`apps/api`)

- [ ] 3.1 `POST /api/v1/movements` — create, validating amount > 0,
      direction, category existence
- [ ] 3.2 `GET /api/v1/movements` — list for the active cycle
- [ ] 3.3 `DELETE /api/v1/movements/{id}`
- [ ] 3.4 `GET /api/v1/categories` — list the seeded categories
- [ ] 3.5 `GET /api/v1/cycles/current` — active cycle bounds + balance
      (total in, total out, net)
- [ ] 3.6 Write `openapi/tabs.yaml` by hand for the five endpoints above

## 4. Web (`apps/web`)

- [ ] 4.1 Generate TS types from `openapi/tabs.yaml`
- [ ] 4.2 `movements` feature: `api/`, `hooks/`, `components/` per the
      feature-sliced layout
- [ ] 4.3 One screen: record form + movement list + cycle balance

## 5. Verification

- [ ] 5.1 `go test ./...` green, including the cycle-boundary scenarios
- [ ] 5.2 End-to-end: record an `in` and an `out` movement, see both
      listed, see the correct net, delete one, see the net adjust
- [ ] 5.3 Record a movement dated on the boundary day and one dated the
      day before — confirm they land in different cycles
- [ ] 5.4 Clone the repo on a second machine, point at the same Neon
      connection string, confirm the same movements appear
- [ ] 5.5 `openspec archive record-and-read-a-cycle` — merge this
      change's delta into `openspec/specs/movements/spec.md`

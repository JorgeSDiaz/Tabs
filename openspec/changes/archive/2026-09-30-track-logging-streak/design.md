# Design

## Context

- **Movement data.** Movements already store `created_at TIMESTAMPTZ` and
  `note`. The habit rules in `specs/logging-habit/spec.md` need nothing
  else.
- **Cycle rules.** The cycle boundary and time zone live in
  `internal/cycles/domain` (`ActiveAt`, `Settings`), and `settings` is read by
  the cycles slice's postgres adapter.
- **Backend shape.** The backend is vertical slices, each with `domain`,
  `ports`, `application` and `adapters/{http,postgres}`, wired in
  `cmd/api/main.go`.
- **Frontend shape.** Frontend features mirror that: `domain`, `application`,
  `adapters/{api,ui}`. They talk to the API through the openapi-fetch client
  generated from `openapi/tabs.yaml`.
- **Reference.** The visual target is the streak panel, the header indicators
  and the XP ledger annotations in `d6-dashboard-dark`. They are built on the
  system introduced by `restyle-dashboard-streak-dark`.

## Goals / Non-Goals

**Goals:**
- Keep the habit rules in one Go package, so the client never restates an XP
  value or a streak rule.
- Keep the habit purely derived: deleting or back-filling movements always
  yields a correct streak and correct XP without any repair job.

**Non-Goals:**
- Caching or precomputing the habit. A single user's movement count keeps a
  full recompute per request cheap.
- Changing movement recording, listing, or cycle resolution.

## Decisions

### New `habit` slice, derived on read

**Choice.**
- `internal/habit/domain` holds pure functions:
  - `LoggedDays(movements, tz)`
  - `Streak(loggedDays, today)`
  - `DayMap(cycle, loggedDays, today)`
  - `MovementXP(movements, tz)`
  - `Level(totalXP)`
  - `Rules`, the single table of XP values that the functions use and that
    the endpoint returns.
- `application.Service.Habit(ctx)` loads every movement's `(id, created_at,
  note)`, resolves the active cycle, and assembles the response.

**Alternative considered.** Store XP and streak counters updated on
create/delete. This was rejected because it adds state that can drift from
the ledger, and needs its own consistency rules (constitution rules 3 and 4).

### Reading movements through a habit-owned port

**Choice.**
- `habit/ports.LoggedMovements` returns every movement's id, creation time,
  own date and note. The own date is only used to list `movement_xp` for the
  movements the ledger shows (dated in the active cycle); it never makes a day
  logged.
- `habit/adapters/postgres` implements it with one read-only `SELECT id,
  created_at, occurred_on, note FROM movement`.

**Trade-off.** The habit slice reads the `movement` table directly instead
of calling the movements slice. This keeps the slice self-contained and the
query minimal. The coupling is read-only and limited to four columns that
already exist, and a repository test pins it.

**Alternative considered.** Add a method to the movements repository and
depend on the movements application. It was rejected because it grows the
movements slice with a query only the habit uses.

### Cycle and time zone come from the cycles domain

**Choice.**
- `habit/ports.CycleClock` returns the active `cycles/domain.Cycle`, the
  time zone, and "now".
- In `main.go` it is satisfied by an adapter that uses the cycles settings
  reader and `cycles/domain.ActiveAt`.
- Boundary and clamping rules stay only in the cycles domain (rule 3).
- Tests inject a fixed clock, which covers the midnight time-zone scenario.

### Streak definition

**Choice.**
- Logged local dates form a set.
- Walking backward from today (or from yesterday, when today is not logged)
  counts consecutive members of the set.
- The walk ignores cycle boundaries, per the spec.

### XP ordering

**Choice.**
- "First of the day" is the minimum `(created_at, id)` among movements whose
  local creation date matches.
- `id` breaks ties between identical timestamps deterministically.

### API shape

`GET /api/v1/habit` returns:

```yaml
Habit:
  streak: { current: int, today_logged: bool }
  days: [{ date: date, status: logged|missed|today_logged|today_pending|ahead }]
  xp:
    total: int
    level: int
    level_starts_at: int
    next_level_at: int
  movement_xp: [{ movement_id: int64, xp: int }]   # active-cycle movements only
  rules: [{ id: string, label: string, xp: int }]  # base, note, first_of_day
```

`movement_xp` is a list rather than a field on `Movement`, so the movements
contract stays unchanged.

### Frontend feature

**Choice.**
- `features/habit` adds:
  - `adapters/api/habit.ts`;
  - `application/useHabit.ts`, which is invalidated by the same success path
    that refreshes movements and the cycle;
  - `adapters/ui/StreakPanel.tsx` and `HabitHeader.tsx`.
- `MovementList` receives a `movementId → xp` lookup.
- After a save, `MovementForm`'s success message reads the saved movement's
  XP from the refreshed habit, and shows no number until the habit has
  refreshed.
- The rules footnote maps `rules`.

## Risks / Trade-offs

- **[Risk]** Full recompute on every dashboard load grows with ledger size.
  → The ledger is single-user and holds hundreds to low thousands of rows. If
  it ever matters, add an index on `created_at` or cache per request. No
  change to the contract would be needed.
- **[Risk]** Users start mid-cycle and see "missed" days before their first
  ever movement.
  → Accepted for now: the legend makes the meaning clear. Revisit after real
  use.
- **[Risk]** A back-filled old movement changes which day it counts for,
  which could confuse the user.
  → The spec defines this on purpose: the streak rewards the act of logging.
  The post-save confirmation shows the XP immediately.
- **[Trade-off]** The streak cannot be hidden. The user can hide the four
  widgets, but not the habit. This will be revisited if real use asks for it.

## Migration Plan

- There are no schema changes.
- Deploy the API and web together with `make prod-up`, since the web reads the
  new endpoint.
- To roll back, redeploy the previous images. No data is written by this
  change.

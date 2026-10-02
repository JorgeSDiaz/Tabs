# Proposal

## Why

Tabs is only useful if the record stays faithful, and a faithful record depends
on the habit of logging every day. The approved "Streak refined" design (design
canvas row 06, `d6-dashboard-dark`) rewards that habit: a logging streak over
the cycle's days, XP for each movement, and a level. None of it rewards the
amounts. This is the second slice, after `restyle-dashboard-streak-dark`. It
starts only once the restyled dashboard has had one real cycle of use.

## What Changes

- A new backend capability derives the logging habit from existing movements,
  with no new stored data:
  - **Logged day:** a local day, in the configured time zone, counts as logged
    when a movement was *created* on it.
  - **Cycle day map:** every day of the active cycle is logged, missed, today,
    or still ahead.
  - **Current streak:** the number of consecutive logged days.
  - **XP per movement:** +10 for every movement, +5 when it has a note, and
    +10 for the first movement created that day.
  - **Level:** one level per 250 XP accumulated over all time.
- A new read-only endpoint, `GET /api/v1/habit`, returns the day map, the
  streak, total XP, the level and its progress, the XP earned by each
  movement in the active cycle, and the XP rules themselves.
- The dashboard gains:
  - A streak panel with the day map and a legend, placed as the largest analytics tile.
  - Streak and level indicators in the header.
  - The XP earned on each ledger row.
  - A confirmation after saving a movement that states the XP it earned.
  - The rules footnote, rendered from the API.
- XP never depends on amount, direction or category, and nothing in the habit
  penalizes spending.

## Capabilities

### New Capabilities

- `logging-habit`: This capability covers:
  - how logged days, the current streak, per-movement XP and levels are
    derived from recorded movements;
  - the read-only habit endpoint;
  - how the dashboard presents the habit.

### Modified Capabilities

None. The streak panel is not a customizable widget, so `dashboard-widgets`
keeps its four-widget catalog. Movement recording and listing are unchanged.

## Impact

- **Backend:**
  - A new vertical slice, `apps/api/internal/habit`, with the standard
    `domain`, `ports`, `application` and `adapters/{http,postgres}` folders.
  - It is wired in `cmd/api`.
  - It reads movement `id`, `created_at` and `note`, and resolves the active
    cycle and time zone through the cycles slice.
  - No migration.
- **API contract:** `openapi/tabs.yaml` gains `/api/v1/habit` and its schemas.
  The web client is regenerated with `pnpm --filter web generate:api`.
- **Frontend:**
  - A new `apps/web/src/features/habit` feature, with its API adapter, a
    `useHabit` hook, the streak panel and the header indicators.
  - `MovementList` shows XP per row.
  - `MovementForm` shows the post-save confirmation.
  - The habit is refetched after a movement is recorded or deleted.
- **Depends on:** `restyle-dashboard-streak-dark` being implemented and used for
  one cycle.
- **Non-goals:**
  - Badges, quests, or any reward tied to amounts.
  - Storing XP, levels, or streaks.
  - Notifications or reminders.
  - Letting the user hide the habit.
  - Changes to how movements are recorded or dated.

# Proposal

## Why

A movement recorded with a typo — a wrong amount, the wrong category, yesterday's
date — can only be fixed today by deleting it and logging it again. That loses
the movement's creation time, so the fix can also change which day counts as
logged and which movement earns the first-of-day XP. A faithful record needs a
way to correct an entry in place.

## What Changes

- A movement can be edited: amount, direction, category, date, and note are
  all replaceable. Its id and creation time never change.
- The API gains `PUT /api/v1/movements/{id}`. It takes the same body as
  recording a movement, applies the same validation, and returns the updated
  movement. An unknown id is a 404.
- Each ledger row gains an edit control beside delete. It opens a modal dialog
  with the movement's current values in the same fields the entry form uses.
  Saving closes the dialog and refreshes the ledger, the cycle totals, the
  widgets, and the habit without a page reload.
- The pinned entry form is untouched by an edit: its typed values and its
  remembered direction, category, and date stay as they were.
- The habit follows the edit by derivation only:
  - The logged day and the streak do not move, because they come from the
    creation time.
  - Adding or clearing a note changes that movement's XP.

## Capabilities

### New Capabilities

- `movement-editing`: how a recorded movement is corrected from the ledger —
  the edit control on each row, the modal dialog and its fields, saving,
  cancelling, failure, and what refreshes afterwards.

### Modified Capabilities

- `movements`: adds the requirement that a movement can be edited, with the
  same validation as recording, and that an edit which re-dates a movement
  moves it between cycles.
- `logging-habit`: states that editing never moves a logged day, that XP is
  recomputed after an edit, and that the dashboard refreshes the habit after
  an edit as it does after a record or a delete.

## Impact

- **Backend:** the `movements` slice gains an update path through its existing
  layers (`adapters/http`, `application`, `ports`, `adapters/postgres`). The
  update goes through `domain.NewMovement`, so validation stays in one place.
  No migration: `movement.updated_at` already exists and is now written.
- **API contract:** `openapi/tabs.yaml` gains `put` on
  `/api/v1/movements/{id}`, reusing `MovementInput` and `Movement`. The web
  client is regenerated with `pnpm --filter web generate:api`.
- **Frontend:** the `movements` feature gains an edit dialog and an
  `updateMovement` API call. The entry form's fields are shared with the
  dialog rather than copied. `MovementList` gains the edit control, and
  `App.tsx` wires the edit into the existing refresh path.
- **Tests:** the first Go tests of the `movements` slice (handler and
  repository), and a web unit test for the shared draft-to-input conversion.
- **Non-goals:**
  - Edit history, an "edited" marker, or exposing `updated_at`.
  - Bulk edits.
  - Creating a category from inside the edit dialog.
  - Changing how movements are recorded, listed, or deleted.

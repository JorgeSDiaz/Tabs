# Proposal

## Why

The date field shipped by `restyle-dashboard-streak-dark` is a select with
Today, Yesterday and "Pick a date…". Any other day takes two controls and the
browser's native picker, which looks different in every browser and has no
reliable way back to today. The user asked for a calendar they can see and
pick from directly, with quick access to today, and approved the design in the
`d6-datepicker` artboard and the Date field of `d6-dashboard-dark`.

## What Changes

- The date field becomes one control that shows the selected date ("Today" or
  a short date) and opens a month calendar.
- The calendar:
  - shows one month, with previous and next month controls;
  - marks today and the selected day differently;
  - tints the days that belong to the active cycle;
  - has a "Today" control that selects today in one step;
  - sets the date and closes when a day is chosen.
- The Today / Yesterday / "Pick a date…" select and the native date input are
  removed.
- Unchanged: the date still defaults to today, the form still remembers the
  date used after a save, and the movement is still stored with the chosen
  date.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `movement-entry`: adds how the date is chosen: from a month calendar with a
  today shortcut, operable by keyboard. The existing requirements are not
  changed.

## Impact

- **Frontend:**
  - `apps/web/src/features/movements/adapters/ui/MovementForm.tsx`: the date
    state and the new control.
  - A new calendar date control next to it, and a pure month-grid function in
    `features/movements/domain` with tests.
  - `apps/web/src/index.css`: styles for the field and the calendar.
  - `shared/lib/money.ts`: the `yesterday()` helper is removed if nothing
    else calls it.
- **Backend and API:** none. The form keeps sending the same ISO date.
- **Dependencies:** none added.
- **Non-goals:**
  - A calendar view of movements (a constitution non-goal; this is only a
    date picker).
  - Date ranges, time of day, or typing a date as text.
  - Blocking dates outside the active cycle.

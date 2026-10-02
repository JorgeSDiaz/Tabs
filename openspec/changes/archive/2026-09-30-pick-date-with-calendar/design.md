# Design

## Context

- **What exists today.** In `MovementForm.tsx` the date is a `DateChoice`
  (`'today' | 'yesterday' | 'custom'`) plus a `customDate` string. A select
  switches between them, and "custom" reveals a native `<input type="date">`.
  On submit the choice is resolved to an ISO date with the `today()` and
  `yesterday()` helpers in `shared/lib/money.ts`.
- **Theme.** The app renders one dark theme from tokens in
  `apps/web/src/index.css`, with `color-scheme: dark`.
- **Cycle data.** The active cycle (`starts_on` inclusive, `ends_on`
  exclusive) is already loaded by `useCurrentCycle`.
- **Tests.** The web app has Vitest, and pure functions live in each feature's
  `domain` folder with tests beside them.
- **Reference.** The approved look is the `d6-datepicker` artboard and the Date
  field in `d6-dashboard-dark`. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**
- One date control that covers every day, with today always one step away.
- Keep the form's contract: it still holds and submits one ISO date.
- Full keyboard operation, with no new dependency.

**Non-Goals:**
- A general-purpose date picker (ranges, min/max, locales, typed input).
- Changing how the active cycle is resolved or how movements are stored.

## Decisions

### A small own calendar instead of the native input or a library

**Choice.** Build one calendar control inside the movements feature:
- `features/movements/domain/calendarMonth.ts`: a pure function that
  returns the 42 day cells for a given year and month, with weeks starting on
  Monday.
- `features/movements/adapters/ui/DateField.tsx`: the field button and the
  calendar popover.

**Alternative considered.** Keep the native `<input type="date">`. It was
rejected for three reasons:
- Its calendar differs per browser.
- It has no consistent "Today" control.
- It cannot tint the active cycle.

**Alternative considered.** Add a date-picker library such as
`react-day-picker`. It was rejected because the need is one month, one
selected day and one shortcut. A dependency and its styling overrides would
outweigh roughly one component and one tested function.

### Form state becomes one ISO date

**Choice.**
- Replace `dateChoice` and `customDate` with a single `date` string
  (`YYYY-MM-DD`), initialised with `today()`.
- Submit sends `date` as `occurred_on`.
- After a save, `date` is kept as it is. This is what "last-used values
  remembered" already requires.
- The field label is derived at render: "Today" when `date === today()`,
  otherwise a short weekday, month and day.
- `yesterday()` loses its only caller and is removed (constitution rule 4).

**Trade-off.** The old select stored the *relative* choice "today", so a tab
left open past midnight kept recording "today". With an absolute date, a tab
left open keeps yesterday's date and the label stops saying "Today". This is
the honest reading of "the date exactly as it was used", and a reload resets
it to today.

### Popover behaviour

**Choice.**
- **Trigger.** The field is a `<button>` with `aria-haspopup="dialog"` and
  `aria-expanded`.
- **Position.** The popover is a non-modal `role="dialog"` labelled "Choose a
  date", anchored under the field.
- **Opening.** It shows the month of `date` and focuses the selected day.
- **Focus in the grid.** Days are `<button>`s in a 7-column grid with a
  roving `tabindex`.
- **Keyboard:**
  - arrow keys move by day and by week, crossing into the next or previous
    month when needed;
  - PageUp and PageDown change month;
  - Enter or Space chooses;
  - Tab reaches the month buttons and "Today";
  - Escape closes and returns focus to the field.
- **Dismissal.** A click outside, or focus leaving the popover, closes it
  without changing `date`.
- **Labels.** Each day has a full-date `aria-label`, and today's label ends
  with "today". The selected day has `aria-pressed="true"`.
- **Narrow screens.** Below 480 px the popover spans the form's width, so the
  7 columns never overflow the viewport.

### Visual tokens

**Choice.**
- The popover reuses the existing tokens. Its surface is one step lighter
  than the form's fields, with a 1 px control border and no shadow, so
  elevation is declared once.
- Markers:
  - today: an ember ring;
  - the selected day: an ember fill with ink text;
  - active-cycle days: a subtle surface tint;
  - days of other months: muted text that still passes 4.5:1.
- The footer holds the "Today" button and a one-line key for the cycle tint.

### Cycle tint source

**Choice.** `DateField` receives the active cycle's `starts_on` and `ends_on`
as props from the dashboard, which already loads them. A day is tinted when
`starts_on <= day < ends_on`. While the cycle is loading or has failed, the
calendar works without the tint.

## Risks / Trade-offs

- **[Risk]** A hand-built calendar gets keyboard or screen-reader details
  wrong.
  → Follow the behaviour listed above. Cover the grid function and the label
  logic with unit tests. Walk every spec scenario by keyboard in the browser
  before closing the change.
- **[Risk]** "Today" in the browser's time zone differs from the server's
  configured time zone near midnight.
  → This is unchanged from today: `movement-entry` already defines the default
  date in the browser's local time zone. The tint uses the cycle dates the API
  returns.
- **[Assumption]** Weeks start on Monday. Changing to Sunday is one offset in
  `calendarMonth.ts` and the weekday header.

## Migration Plan

This is a frontend-only deploy with `make prod-up`. To roll back, redeploy the
previous web image. No data changes.

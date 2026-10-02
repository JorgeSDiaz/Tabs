# Tasks

## 1. Calendar logic

- [x] 1.1 Add `features/movements/domain/calendarMonth.ts`, which returns the 42 day cells (ISO date, day number, in-month flag) for a year and month with a Monday start. Add `calendarMonth.test.ts` covering a month that starts on Monday, one that starts on Sunday, February in a leap year, and the December to January rollover. Verify with `pnpm --filter web test`.
- [x] 1.2 Add the field-label function ("Today" when the date equals today, otherwise a short weekday, month and day), with tests for today, yesterday and a date in another year. Verify with `pnpm --filter web test`.

## 2. Date field and popover

- [x] 2.1 Build `features/movements/adapters/ui/DateField.tsx`: the field button, the popover with the month title, previous and next buttons, the weekday header, the day grid, the "Today" button and the cycle key. Verify in the browser that it opens on the selected month, and that picking a day or "Today" sets the date and closes it.
- [x] 2.2 Add the markers and styles in `index.css` from the existing tokens: today ring, selected fill, active-cycle tint, muted other-month days, and the popover surface with a border and no shadow. Verify against the `d6-datepicker` artboard, and check that other-month day text has a contrast of at least 4.5:1.
- [x] 2.3 Add keyboard and focus behaviour: focus the selected day on open, roving tabindex, arrow keys across month edges, PageUp/PageDown, Enter/Space, Escape with focus returned to the field, and close on outside click or focus leaving. Verify every "Date is chosen from a calendar" scenario using only the keyboard.
- [x] 2.4 Make the popover span the form width below 480 px. Verify at 375 px and at 200% zoom that there is no horizontal scroll and that every day target is at least 40 px.

## 3. Wire into the form

- [x] 3.1 In `MovementForm.tsx`, replace `dateChoice` and `customDate` with one ISO `date` state. Render `DateField`, and pass the active cycle's `starts_on` and `ends_on` from the dashboard. Verify that saving sends the chosen date as `occurred_on` (check the network request).
- [x] 3.2 Remove the Today / Yesterday / "Pick a date…" select, the native date input, and `yesterday()` from `shared/lib/money.ts` if it has no other caller. Verify with a grep for `yesterday` and `type="date"` in `apps/web/src`, and that `pnpm --filter web build` passes.
- [x] 3.3 Re-check the unchanged `movement-entry` scenarios by hand: a fresh load shows today, a second movement keeps the date just used, and a reload resets to today. Verify that amount autofocus still happens on load and after a save.

## 4. Verify the usable slice

- [x] 4.1 Run `openspec validate pick-date-with-calendar --strict`, `pnpm --filter web test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [x] 4.2 Against disposable local data, record a movement for today, one for three days ago, and one in the previous cycle. Confirm that each lands on the right date, and that the previous-cycle one does not appear in the active cycle's ledger.
- [ ] 4.3 Use the form for real entries for a few days and record here whether the Monday week start and the cycle tint are right.

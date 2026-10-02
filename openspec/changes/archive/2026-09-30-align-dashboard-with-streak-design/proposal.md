# Proposal

## Why

`restyle-dashboard-streak-dark` brought the tokens, fonts and waffle chart of
the approved design, but the running dashboard is still far from the
`d6-dashboard-dark` artboard. Measured on the local app at 1280×800 on
2026-09-30:

- The page is 1,345 px tall. The design fits one screen.
- The cycle's figures appear twice: once in a "Cycle balance" strip and again
  in the widgets below it.
- The streak panel and the category chart each take a full-width row, instead
  of sharing an asymmetric grid with the balance and totals.
- The income and expense cards are dark tinted with colored text, and large
  amounts break across two lines ("12,333,333,3 / 33.00").
- The entry bar uses a select for the type, the amount does not stand out,
  and the category shows no color.
- Decorative copy ("The bigger picture", "The details behind your cycle", the
  footer taglines) and Unicode arrows stand in for the design's plain layout
  and drawn icons.

The user reviewed both and asked for the frontend to be brought in line with
the design.

## What Changes

- **Figures appear once.** The "Cycle balance / Money in / Money out" strip is
  removed. The net balance, total income and total expense widgets are the
  cycle's overview, as in the design.
- **Bento layout.** On wide screens the analytics become a two-column grid:
  - Row 1: the streak panel (wider) beside net balance.
  - Row 2: the category chart (wider) beside the income and expense cards,
    which stack.
  - The ledger column runs the full height beside them.
  - With all widgets on, the whole dashboard fits in 1280×800.
- **Header.**
  - The cycle reads as "Day 1 of 30" and "Sep 30 - Oct 29". The last date is
    the cycle's real last day, not the next cycle's first day.
  - Customize moves into the header.
- **Entry bar.**
  - The type is a two-option toggle (Spent / Received).
  - The amount is the largest field, with a `$` prefix and the ember focus
    ring.
  - The category select shows the chosen category's color and icon.
  - The save button reads "Log it".
- **Money format.** Amounts show a `$` and drop the cents when they are zero
  (`$2,650,150`, `$1,234.50`). An amount never breaks across lines; it shrinks
  to fit instead.
- **Cards.**
  - Income and expense cards use the solid leaf and coral surfaces with ink
    text.
  - Net balance drops its repeated Income / Expenses / Net row for one line
    under the bar.
- **Streak panel look.** The ember card with square day cells and a square
  legend, replacing the dark card with dots. Its data and rules are unchanged.
- **Ledger rows.**
  - Expense amounts are neutral with a minus sign.
  - XP sits under the amount.
  - Delete becomes an icon button.
  - The XP rules line moves to the ledger's foot.
- **Cleanup.** Decorative headings, taglines and Unicode glyph icons are
  removed. Icons are drawn in one stroke weight.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-composition`:
  - The hierarchy no longer has a separate cycle overview.
  - The header states the cycle as a day count and a readable date range.
  - The wide layout must fit one laptop screen.
  - Amounts get one format and must not break across lines.
  - The entry form shows its type and category choices directly.

## Impact

- **Frontend only:**
  - `apps/web/src/app/App.tsx`: composition and header.
  - `apps/web/src/index.css`: layout and components.
  - `features/dashboard` widgets: `WidgetSection`, `NetBalanceWidget`,
    `StatTile`, `CategoryDistributionWidget`, `WidgetPicker`.
  - `features/movements`: `MovementForm` and `MovementList`.
  - `features/habit`: `StreakPanel` and `HabitHeader`.
  - `features/cycles`: `CycleSummary` is deleted, and a cycle-label function
    is added.
  - `shared/lib/money.ts`: `formatCents`.
- **Backend and API:** none.
- **Sequencing:**
  - Apply after `track-logging-streak` is finished. It is being implemented
    now and edits the same files (`App.tsx`, `StreakPanel`, `MovementList`,
    `MovementForm`).
  - `pick-date-with-calendar` owns the date control. This change leaves the
    date field as it finds it.
- **Non-goals:**
  - New widgets, routes, or data.
  - Changing streak or XP rules.
  - The calendar date picker.
  - A light theme.
  - Showing an XP preview on the save button, which would restate the XP
    rules in the client.

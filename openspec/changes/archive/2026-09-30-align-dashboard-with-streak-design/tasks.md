# Tasks

## 1. Foundations

- [x] 1.1 Confirm `track-logging-streak` is fully applied, by checking that `openspec list` shows all its tasks done. If it is not, stop and finish it first. Verify that the web build and tests pass before starting.
- [x] 1.2 Rewrite `formatCents` in `shared/lib/money.ts`: `$` prefix, cents only when non-zero, and an optional always-signed form. Add tests for `$2,650,150`, `$1,234.50`, `−$184,300` and `+$250,000`. Verify with `pnpm --filter web test`.
- [x] 1.3 Add `amountScale(text)` (returns `l`, `m` or `s` by character count) with tests, and the three size classes plus `white-space: nowrap` in `index.css`. Verify with the tests, and check that `12,333,333,333` stays on one line in a total card at 1280 px.
- [x] 1.4 Add `cycleLabel(cycle, today)` in `features/cycles/domain` with tests: day 1 of 30 for Sep 30 to Oct 30, the "Sep 30 - Oct 29" range, and a cycle crossing December to January. Verify with `pnpm --filter web test`.
- [x] 1.5 Replace the Unicode glyph icons (`↙`, `↗` and any others found by grep) with inline SVG icons at one stroke width. Verify with a grep for those characters in `apps/web/src`.

## 2. Composition

- [x] 2.1 Delete `CycleSummary.tsx`, its styles and its use in `App.tsx`. Verify by grep that nothing references it, and in the browser that each total appears only in its widget.
- [x] 2.2 Add `bentoLayout(settings)` in `features/dashboard/domain`, with tests for all 16 widget combinations (no empty cells, catalog order kept). Verify with `pnpm --filter web test`.
- [x] 2.3 Rebuild `.dashboard-main` as the `1.6fr 1fr` bento driven by `bentoLayout`: streak beside net balance, category chart beside the stacked totals. Remove the "The bigger picture" heading. Verify at 1280×800 against `d6-dashboard-dark`.
- [x] 2.4 Make the ledger card fill the analytics column's height with internal scroll, and move the XP rules line to its foot. Verify with 3 movements and with 40 movements.
- [x] 2.5 Rebuild the header: wordmark, the `cycleLabel` output, the habit indicators, and the Customize trigger. Remove the footer taglines. Verify that the header reads "Day N of M" and a month-name range, and that Customize still opens from the keyboard.
- [x] 2.6 Check the layout at 1024, 768 and 375 px and at 200% zoom. Verify a single-column flow below 1024 px, with no horizontal scroll and no clipped controls.

## 3. Entry bar

- [x] 3.1 Replace the type select with a two-option radio toggle ("Spent" / "Received"). Verify that arrow keys switch it and that switching still resets the category.
- [x] 3.2 Restyle the amount field: `$` adornment, Fredoka figure, ember focus ring and halo, no spinners. Verify that autofocus on load and after save still works.
- [x] 3.3 Add the color and icon chip to the category select, neutral when empty. Verify that the chip color equals the category's color in the chart for a category that has one.
- [x] 3.4 Rename the save button to "Log it" with the pressed edge. Turn the visible form heading into the form's accessible name. Verify with a screen reader or the accessibility tree that the form is still named.

## 4. Widgets, streak and ledger

- [x] 4.1 Net balance: replace the Income / Expenses / Net list with one "In …, out …" line under the split bar. Verify that the widget still shows income, expense and net.
- [x] 4.2 Totals: solid leaf and coral surfaces with ink text, a label row with the count, the amount using `amountScale`, then the marks. Verify a text contrast of at least 4.5:1 on both surfaces.
- [x] 4.3 Category chart: legend under the grid in up to three columns when the tile is narrow. Verify at 1280 px and 375 px, and check that the "Money in" section still lists income categories.
- [x] 4.4 Streak panel: ember surface with ink text, square day cells in a 16-column grid, a square-marker legend, the flame icon, and no nested card. Verify against the artboard, and check that the four day states stay distinguishable without color.
- [x] 4.5 Ledger rows: neutral expense amounts with `−`, leaf income with `+`, XP under the amount, and an icon delete button with an accessible name. Verify that delete works by keyboard and by touch.

## 5. Verify the usable slice

- [x] 5.1 Run `openspec validate align-dashboard-with-streak-design --strict`, `pnpm --filter web test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [x] 5.2 At 1280×800 with all widgets on, measure `document.documentElement.scrollHeight` and confirm it is at most 800. Take a screenshot and compare it side by side with `d6-dashboard-dark`.
- [x] 5.3 Walk through the unchanged behavior: record, delete, toggle each widget, hide all, reload. Verify that the `movement-entry` and `dashboard-widgets` scenarios still hold.
- [ ] 5.4 Use the app for real entries for a few days. Record here what still feels off against the design.

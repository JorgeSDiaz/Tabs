# Tasks

## 1. Theme foundation

- [x] 1.1 Replace the Geist dependency with `@fontsource/fredoka` and `@fontsource/nunito` in `apps/web/package.json`; verify `pnpm install` and `pnpm --filter web build` succeed.
- [x] 1.2 Rewrite the tokens in `apps/web/src/index.css`. Use one dark token set as listed in design.md. Remove the `prefers-color-scheme` block. Add `color-scheme: dark` and themed `::selection` and focus rings. Verify that no light-palette values remain, using a grep for the old hexes.
- [x] 1.3 Restyle shared controls (buttons with the pressed edge, fields, selects, dialogs) from the tokens. Verify they render dark in a browser with the OS set to light, including an open native select menu.

## 2. Composition

- [x] 2.1 Lay out `App.tsx` at ≥1024 px as: header, full-width entry bar, then an asymmetric analytics grid beside the ledger rail. Verify at 1440 px against the `d6-dashboard-dark` reference, and verify there is no horizontal scroll at 1024 px.
- [x] 2.2 Lay out `MovementForm` as a single grid row on wide screens. Replace the date input with a Today / Yesterday / "Pick a date…" select that reveals the native date input. Verify the `movement-entry` scenarios by hand: autofocus, today default, direction filtering, and remembered values after two consecutive saves.
- [x] 2.3 Keep the single-column flow at 375 px and at 200% zoom. Verify there is no clipping or horizontal scroll with long notes and long category names.

## 3. Widgets and ledger

- [x] 3.1 Add a pure category-color mapping (top five expense categories by total get palette slots, the rest get neutral, income gets leaf). Add unit tests for ranking, the neutral grouping and income. Verify the tests pass.
- [x] 3.2 Replace the Recharts pie in `CategoryDistributionWidget` with the 100-square waffle and a text legend showing name, percentage and amount. Use largest-remainder rounding. Add unit tests showing squares always sum to 100. Verify the tests pass and that a screen reader reads the aria-label.
- [x] 3.3 Restyle `NetBalanceWidget` with the out/kept split bar and labelled percentages. Verify the percentages match `total_out / total_in` for the seeded data.
- [x] 3.4 Add movement-count marks to the income and expense `StatTile`s (at most 40 marks, then "+N"). Verify with 0, 2, 39 and 60+ movements.
- [x] 3.5 Restyle `MovementList` rows for the rail: category icon chip in the mapped color, note or muted "No note", category and day, signed amount, and the delete action. Verify the chip color equals that category's waffle color, and that delete still works by keyboard.
- [x] 3.6 Remove `recharts` if no module imports it. Verify the build succeeds and the bundle-size warning shrinks or disappears.

## 4. Verify the usable slice

- [x] 4.1 Run `openspec validate restyle-dashboard-streak-dark --strict`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [x] 4.2 In the browser against disposable local data, check populated, empty, loading and error states at 1440, 1024 and 375 px. Check contrast of text on the income card, the expense card and the ember button (at least 4.5:1). Check that the 16 widget combinations reflow without holes.
- [ ] 4.3 Use the app for one real cycle and record the findings here before starting `track-logging-streak`.

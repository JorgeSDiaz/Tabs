# Design

## Context

- **Reference.** The `d6-dashboard-dark` artboard: 1280×800, 32 px page
  padding, 24 px between blocks.
- **Current composition** (`apps/web/src/app/App.tsx`), top to bottom:
  1. header;
  2. `MovementForm`;
  3. `.dashboard`, a grid of `minmax(0, 1fr) 360px`.
- **Inside `.dashboard-main`:** `CycleSummary`, a section heading with
  `WidgetPicker`, `StreakPanel`, and `WidgetSection`.
- **The ledger.** `MovementList` is the second column. It is 333 px tall
  beside a 975 px main column.
- **Widget slots.** `WidgetSection` gives each widget a size class (`half`,
  `quarter`, `full`) on a 4-column grid. Net balance is `half`, the totals are
  `quarter` each, and the category chart is `full`.
- **Money.** `formatCents` always prints two decimals and no symbol.
- **Icons.** Several are Unicode glyphs (`↙`, `↗`). Category icons are already
  drawn.
- **Other changes in flight.**
  - `track-logging-streak` is mid-implementation and owns the habit data. This
    change only restyles and repositions `StreakPanel` and `HabitHeader`.
  - `pick-date-with-calendar` owns the date control.

## Goals / Non-Goals

**Goals:**
- Match the artboard's structure, proportions and surfaces at 1280×800, and
  keep the existing single-column flow below 1024 px.
- Remove duplicated figures and decorative text rather than restyle them.
- Keep every rule in one place: one money formatter, one cycle-label
  function, one slot-layout function.

**Non-Goals:**
- Pixel parity at every width. The check is 1280×800, plus 1024, 768 and
  375 px for reflow.
- Any data, API, or rule change.

## Decisions

### Remove `CycleSummary`; the widgets are the overview

**Choice.**
- Delete `features/cycles/adapters/ui/CycleSummary.tsx` and its styles.
- The cycle's loading and error states move to the widget area, which
  already has them.
- If the user hides the three balance widgets, those figures are not shown.
  That is the meaning of hiding them.

**Alternative considered.** Keep a compact fallback strip when net balance is
hidden. It was rejected because it re-adds a second place for the same
figures, and a rule about when it shows.

### Bento layout from one pure function

**Choice.**
- `.dashboard-main` becomes a 2-column grid, `1.6fr 1fr`, with a 24 px gap.
- A pure function `bentoLayout(settings)` in `features/dashboard/domain`
  returns each visible tile's column, row and spans. It has unit tests.
- The streak tile is always part of the layout. `logging-habit` requires the
  panel to stay visible, and it carries its own loading and error states, so
  the function takes no "has streak" input (constitution rule 4).

**Layout rules.**

| Visible tiles | Placement |
|---|---|
| streak + net | streak left (wide), net right |
| streak only (net hidden) | streak spans both columns |
| category + one or both totals | category left (wide), totals stacked right |
| category only | spans both columns |
| both totals only | side by side: income in the wide column, expenses in the narrow one |
| one total only | spans both columns |

**Further rules.**
- Tiles are emitted in catalog order, with the streak first, and placed by
  explicit column and row. The category chart sits on the left visually while
  the document order stays the catalog's.
- There are no empty cells.
- Below 1024 px the grid is one column.

**Alternative considered.** Pure CSS with `grid-auto-flow: dense`. It was
rejected because "no reserved holes" depends on which widgets are visible,
and that is easier to state and test as a function than as selector
combinations.

### Ledger column

**Choice.**
- The `.dashboard` grid stretches both columns.
- The ledger card fills the height of the analytics column and scrolls
  inside (`overflow-y: auto`) when the cycle has more rows than fit.
- Its foot holds the XP rules line, which comes from the habit's `rules`.

### Header

**Choice.**
- `cycleLabel(cycle, today)` in `features/cycles/domain` returns:
  - `day`: `today − starts_on + 1`;
  - `length`: `ends_on − starts_on`;
  - `range`: `starts_on` to `ends_on − 1 day`, as "Sep 30 - Oct 29".
- It has unit tests, including a cycle that crosses a year end.
- The header order is: wordmark, cycle label, then on the right the habit
  indicators and Customize. The `WidgetPicker` trigger moves here.

### One money formatter

**Choice.** `formatCents(cents, { sign })` in `shared/lib/money.ts`:
- **Symbol and separators.** A `$` prefix, with `en-US` thousands and decimal
  separators. They are fixed, not taken from the browser locale: the spec
  scenarios pin `$2,650,150`, and the app has one currency.
- **Cents.** Shown only when `cents % 100 !== 0`.
- **Sign.** `sign: 'always'` adds `+` or `−` for ledger rows. The default
  shows `−` only for negatives.
- **Callers.** All of them go through this function.
- **Tests.** They cover whole amounts, amounts with cents, negatives, and
  the signed forms.

### Amounts never wrap

**Choice.**
- `white-space: nowrap` on every amount.
- A pure `amountScale(text)` returns `'l' | 'm' | 's'` from the character
  count. Widgets apply it as a class that steps the font size down.
- The smallest step is 1 rem, so the amount is never below body text.

**Alternative considered.** Container-query units. They were rejected because
they size to the box, not to the text length, so a 14-digit amount would
still overflow.

### Entry bar

**Choice.**
- **Type.** Two visually styled radio inputs in a fieldset ("Spent",
  "Received"), so arrow keys and form semantics come from the platform. The
  existing rule that a direction change resets the category is unchanged.
- **Amount.** It stays `type="number"`.
  - It gains a `$` adornment and the Fredoka figure style.
  - It gets the ember ring and halo while focused.
  - Its native spinners are hidden.
- **Category.** The select gains a leading chip that shows the selected
  category's color (from `categoryColors`) and icon. The chip is neutral
  while nothing is selected.
- **Save.** The button label becomes "Log it", with the pressed edge.
- **Heading.** The visible "Record a movement" heading becomes the form's
  accessible name. The status text ("Movement saved · +N XP") stays, at the
  right of the labels row.

### Widgets

- **Net balance:**
  - It keeps the figure, the split bar, and the "went out" / "kept" labels.
  - The three-column Income / Expenses / Net list becomes one line under the
    bar ("In $X, out $Y"). The widget still shows income, expense and net,
    as `dashboard-widgets` requires.
- **Totals:**
  - They use the solid `--money-in` and `--money-out` surfaces with
    ink-on-color text.
  - The layout is a label row with the count on the right, then the amount,
    then the marks.
  - The arrows are drawn icons.
- **Category chart:** the legend sits under the grid in up to three columns
  when the tile is narrower than 560 px, and beside it otherwise. The
  "Money in" section stays.
- **Streak panel:**
  - It uses the ember surface with ink text.
  - Day cells are squares in a 16-column grid.
  - The legend uses matching square markers: "Logged", "Today", "Missed" and
    "Still ahead".
  - It has the flame icon.
  - It has no nested card.

### Text and icons

**Choice.**
- Remove "The bigger picture", its subtitle, the ledger subtitle and its
  "Current cycle" label, and the footer taglines.
- Keep one visible title per region where the spec requires a named region
  ("Movements").
- Replace the Unicode glyphs with inline SVG at 16, 20 or 24 px and one
  stroke width.

### Ledger rows

**Choice.**
- Expense amounts use neutral text with `−`. Income uses the leaf text
  color with `+`.
- XP is small text under the amount.
- Delete is an icon button with `aria-label="Delete <note or category>"`.
  It is always present at low emphasis. It is not hover-only, so keyboard
  and touch users keep it.

## Risks / Trade-offs

- **[Risk]** Editing files that `track-logging-streak` is still changing
  causes conflicts.
  → Apply this change only after that one is complete. Task 1.1 checks its
  status first.
- **[Risk]** The one-screen target breaks with many categories or long notes.
  → The spec scopes it to six legend entries. Beyond that the page scrolls,
  and the ledger scrolls inside its card.
- **[Risk]** Hiding the balance widgets hides the balance entirely.
  → This is the meaning of the Customize control, and restoring is one
  switch. Revisit if real use shows it is missed.
- **[Trade-off]** Character-count scaling is approximate, because digits and
  separators have different widths. The steps are chosen with margin, and the
  very large amounts in the local data are the test case.

## Migration Plan

This is a frontend-only deploy with `make prod-up`. To roll back, redeploy the
previous web image. No data changes.

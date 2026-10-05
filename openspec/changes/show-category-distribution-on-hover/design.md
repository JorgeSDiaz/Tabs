# Design

## Context

- **The widget.** `CategoryDistributionWidget.tsx` builds the slices with
  `expenseSlices`, flattens them into 100 `<span>`s inside
  `.waffle` (`role="img"`, one summary `aria-label`), and renders a
  `<ul class="legend">` with one entry per slice. It holds no state.
- **The grid.** `.waffle` is a CSS grid of 20 columns by 5 rows filled column
  by column, so a slice is a run of consecutive cells that usually starts and
  ends mid-column. A slice is therefore not a rectangle and has no element of
  its own.
- **The layout.** `.waffle-layout` puts the legend beside the grid when the
  tile is at least 560px wide and under it otherwise. On a laptop the tile is
  narrower than that, so the legend sits under the grid in up to three
  columns.
- **The slices.** `expenseSlices` (`domain/waffle.ts`) keeps the five largest
  expense categories and folds the rest into one neutral slice that records
  only how many it holds (`grouped`). Nothing reads `grouped` except its test.
- **Shared tile height.** From 1024px up, `.bento` uses `grid-auto-rows: 1fr`,
  so a tile that changes height resizes its row neighbours.
- **Existing idioms.** The streak day map uses the native `title` attribute
  as a supplement to a visible legend. Global `button` styles carry a 44px
  minimum height, a border and a shadow; components that need a bare button
  reset them locally (the calendar does).
- **Tests.** There are no component tests; pure functions have Vitest tests
  beside them.

See proposal.md for the motivation and the specs for the behaviour.

## Goals / Non-Goals

**Goals:**
- The same detail is reachable by mouse, keyboard and touch through one
  mechanism, not three.
- Showing a detail does not resize the tile in the common case.
- No library, no element measuring, no positioning arithmetic.

**Non-Goals:**
- A reusable tooltip component. One widget needs this.
- Arrow-key navigation between blocks.
- Announcing detail changes through a live region.

## Decisions

### The detail is a line in the widget, not a floating tooltip

**Choice.** The widget gains one detail area that takes the legend's place in
`.waffle-layout`: beside the grid in a wide tile, under it in a narrow one.
It shows a color swatch, the name, the percentage and the amount of the shown
block; for the neutral block a second line lists the grouped categories as
`Name 4.1%`, comma-separated. With no block shown it holds the instruction
("Hover, tap or tab to a block to see its category") in the muted text color.

The area holds no spare height: it is as tall as what it shows. The
instruction and a colored block's detail are both one line, so pointing at a
block does not resize the tile; the neutral block's second line, or a name
long enough to wrap, makes it grow while shown. A first version held two
lines at all times. In use the empty second line read as a gap between the
chart and the "Money in" row, and the user asked for the area to stretch only
when it has something to show.

Why not a tooltip: a slice has no box to anchor to, so a tooltip needs either
measurement or column arithmetic plus edge clamping; it has to float over the
heading or the "Money in" row; on a phone the finger sits where it would
appear; and a long category name at 375px or 200% zoom needs its own overflow
rules. A line in the flow has none of those problems and wraps like any other
text. It also gives the instruction somewhere to live — a widget that reveals
things on hover with nothing saying so would be undiscoverable.

**Alternatives considered.**
- Floating tooltip over the block. Rejected for the reasons above. It would
  free the detail's line, which is its one advantage.
- Native `title` on each square, as the day map does. Rejected: it does not
  appear on touch or on keyboard focus, which the spec requires, and there it
  supplements a legend that this change removes.

### One shown block, derived from three inputs

**Choice.** The widget keeps three small pieces of state, each a slice key
(`Slice.key`: the category id, or `other`) or nothing:
- *hovered* — set while a mouse pointer is over a square; cleared when it
  leaves the grid. Moving across the gap between two squares does not clear
  it. Touch and pen pointers do not set it.
- *focused* — set while a block's focus stop has keyboard focus
  (`:focus-visible`); cleared on blur.
- *selected* — toggled by a click or tap on any square of a block, and by
  Enter or Space on its focus stop.

The shown block is the slice whose key is `hovered ?? focused ?? selected`.
Everything visual — the detail area and the highlight — reads only that one
value.

The state holds keys, not positions, because the slices are rebuilt whenever
a movement is recorded, edited or deleted: they re-sort, and their number can
drop. A stored position would then name a different category or none at all.
A key that no longer matches any slice simply shows nothing.

Keeping the inputs apart is what makes touch work: a tap also fires hover and
focus events in an order that differs between browsers, and a single shared
value would be set and cleared by them within the same gesture.

**Alternative considered.** One `active` value written by every handler.
Rejected: a tap would set it on pointer-over, clear it on pointer-leave and
toggle it on click, and the result depends on event order.

### Squares stay flat; the first square of each block is its focus stop

**Choice.** The 100 squares remain direct children of `.waffle`, each tagged
with its slice key so the grid can handle pointer and click events by
delegation. The first square of each slice is rendered as a `<button>` — the
block's single focus stop — with the block's full detail as its accessible
name and `aria-pressed` reflecting *selected*. The other squares stay
`aria-hidden` spans. `.waffle` changes from `role="img"` to `role="group"`
labelled "Expense distribution", since an image cannot contain controls. The
button's global styles are reset so it looks like any other square.

**Alternatives considered.**
- A wrapper element per slice with `display: contents`. Rejected: such an
  element has no box, so it cannot show a focus ring, and browsers disagree
  on whether it can take focus at all.
- A hundred buttons. Rejected: a hundred tab stops, or a hundred
  `tabindex="-1"` controls that exist only to be ignored.
- One focus stop for the whole grid with arrow keys moving between blocks.
  Rejected: key handling and a roving index to save at most five Tab presses.

### The shown block is marked by dimming the others

**Choice.** While a block is shown, the squares of every other block drop in
opacity. The shown block keeps its full color, and the detail area repeats
that color as a swatch. Focus keeps the standard focus ring on the block's
first square in addition. The opacity change is animated only inside the
existing `prefers-reduced-motion: no-preference` block.

**Alternative considered.** An outline or scale on the shown block's squares.
Rejected: with 3px gaps an outline on up to forty squares is noisy, and scale
makes neighbours overlap.

### The neutral slice carries its members

**Choice.** `Slice.grouped?: number` is replaced by
`members?: { name: string; percent: number }[]`, filled by `expenseSlices`
for the neutral slice only, in the order it already sorts by. Each member's
percentage is its share of all of the cycle's expenses, the same base as the
slices' own percentages. The slice's `name` stays "N others".

`expenseSlices` is where the remainder is cut off, so it is the one place
that knows what is in it (constitution rule 3); the count is `members.length`
and needs no field of its own.

**Alternative considered.** Have the widget recompute the remainder from
`totals`. Rejected: it would repeat the sort and the five-category cut in a
second place.

### Legend styles are deleted; the two shared classes are renamed

**Choice.** `.legend`, `.legend li`, `.legend-percent`, `.legend-amount` and
their container-query overrides are deleted (rule 4). `.legend-swatch` and
`.legend-name` are still used by the "Money in" row and by the new detail
area; they become `.distribution-swatch` and `.distribution-name`, matching
`.distribution-heading`, `.distribution-income` and `.distribution-none`
(rule 7 — there is no legend left for them to belong to). The detail area is
`.distribution-detail`.

## Risks / Trade-offs

- [Exact percentages and amounts are no longer visible at a glance; reading
  all six takes six interactions] → This is the trade the user chose. The
  totals stay in their own widgets, block sizes still show the proportions,
  and the last task records whether it holds up in real use. Restoring the
  legend is a revert of this change.
- [A category under roughly half a percent of the cycle's expenses receives
  no square, so it has no block and its name, percentage and amount cannot be
  read in the widget — the legend used to list it] → Accepted by the user
  over giving every category a minimum of one square, which would change how
  squares are allotted. The category still counts in the heading and appears
  in the ledger. The widget renders nothing for a slice with no squares.
- [Two blocks with similar colors are harder to tell apart without their
  names beside them] → The shown block is isolated by dimming the rest, and
  the detail names it.
- [Showing the neutral block's detail adds its member line, so the tile grows
  and its row neighbours resize while it is shown; more lines with many small
  categories] → Accepted by the user over holding an empty line at all times.
  It happens only for that one block, the grid itself does not move, and the
  spec's "One screen on a laptop" scenario is scoped to no detail being shown
  for that reason. If it bothers in use, cap the listed names and say how
  many more there are.
- [Tap, hover and focus events arrive in browser-specific orders] → The three
  inputs are kept apart, and the tasks verify the tap behaviour with touch
  emulation before the change is called done.
- [No automated test covers the interaction] → The repo has no component
  tests. The derived data (`members`) is unit-tested; the interaction is
  verified in the browser against local data, as the rest of the dashboard
  is.

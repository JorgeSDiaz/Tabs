# Proposal

## Why

The category distribution widget draws the 100-square grid and then repeats
every block under it as a legend entry with name, percentage and amount. In
the tile's usual width that legend is taller than the chart itself, breaks
long names mid-word ("Entertainm / ent"), and still cannot say which
categories sit inside "3 others". The user asked for the widget to show only
the squares and to reveal a category's detail when its block is pointed at.

The legend does not grow without limit — it is capped at six entries (the
five largest categories plus one "N others" entry) — so this is about the
space and noise the legend costs today, not about a list that will overflow.

## What Changes

- **BREAKING** The expense legend is removed from the category distribution
  widget. The grid of squares is the only always-visible part of the chart.
- Each category's block of squares reveals that category's name, exact
  percentage and amount when it is hovered with a mouse, focused with the
  keyboard, or tapped. A tapped or clicked block keeps its detail shown until
  it is tapped again or another block is chosen.
- The neutral block's detail names the categories it groups, each with its
  percentage — information the widget does not show anywhere today.
- While a block's detail is shown, that block stands out from the others.
  While none is shown, a short line says how to reveal one.
- Each block is one keyboard focus stop (six at most) whose accessible name
  carries the same detail.
- A category too small to receive a square has no block, so its detail is
  not readable in the widget. The legend used to list it; the ledger still
  does.
- This reverses part of a deliberate earlier decision
  (`compose-the-dashboard`, `restyle-dashboard-streak-dark`): exact chart
  values were always on screen. They are now one interaction away, by any
  input method. Hover is still never the only way to read them.
- Unchanged: how squares are allotted, the five-plus-neutral coloring, the
  chart and ledger sharing colors, the "Money in" row, the heading's count of
  active categories, and the empty and no-expenses states.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-composition`:
  - "Analytics remain readable without hover" — the legend requirement is
    replaced by detail shown per block on hover, focus or tap, and the
    neutral block's detail names its categories.
  - "Dashboard has an explicit visual hierarchy" — the "One screen on a
    laptop" scenario is no longer scoped by the number of legend entries,
    since there is no legend.

## Impact

- **Frontend:**
  - `apps/web/src/features/dashboard/adapters/ui/widgets/CategoryDistributionWidget.tsx`:
    the legend is removed; blocks become interactive and a detail line is
    added.
  - `apps/web/src/features/dashboard/domain/waffle.ts` and its test: the
    neutral slice carries the categories it groups instead of only their
    count.
  - `apps/web/src/index.css`: the legend rules are deleted; rules for the
    detail line and the block states are added.
- **Backend and API:** none. The cycle's category totals already hold
  everything shown.
- **Dependencies:** none added. No tooltip or charting library.
- **Non-goals:**
  - Changing the "Money in" row, which lists every income category and is
    the one list in this widget that does grow with the number of
    categories.
  - Raising or removing the five-category limit before grouping.
  - Detail on hover for any other widget or for the streak day map.

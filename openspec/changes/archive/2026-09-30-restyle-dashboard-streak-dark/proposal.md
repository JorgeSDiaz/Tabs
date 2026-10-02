# Proposal

## Why

The cobalt light/dark dashboard from `compose-the-dashboard` was closed before
its real-use pass. The design exploration since then settled on one direction,
"Streak refined" in dark mode (design canvas row 06, artboard
`d6-dashboard-dark`), and the user wants the app aligned to it. This change is
the first of two slices. It ships the visual system and composition with the
data the app already has, so the new look gets a real cycle of use before any
gamification is built on top of it. Logging streak, XP, and levels come in the
follow-up change `track-logging-streak`.

## What Changes

- **BREAKING (visual):** The app renders a single dark theme and no longer
  follows the system light/dark preference. The light palette is removed.
- Replace the cobalt palette and Geist with the Streak refined system: a cool
  near-black ground with lighter surfaces, ember for the primary action and
  focus, leaf for money in, coral for money out, and a six-slot category
  palette. Fredoka is used for figures and headings and Nunito for all other
  text, both bundled locally.
- Recompose the desktop dashboard:
  - A full-width pinned entry bar with the fields type, amount, category
    select, date select, note and save.
  - An asymmetric analytics grid: net balance with an out/kept split bar,
    compact income and expense cards, and a wider category chart.
  - A ledger rail on the right.
- The income and expense cards show their movement count as one small mark
  per movement, next to the total.
- The category distribution becomes a 100-square waffle chart with a text
  legend, replacing the Recharts pie.
- Ledger rows carry a category icon chip in that category's chart color, so the
  chart and the ledger read as one system.
- Preserved without change:
  - Movement entry behavior: autofocus, date default, direction filtering, and
    the values remembered after a save.
  - Widget selection and its persistence.
  - Every financial calculation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-composition`:
  - The visual system becomes a single dark theme with fixed color semantics.
  - The desktop hierarchy becomes a pinned entry bar, an asymmetric analytics
    grid and a ledger rail.
  - The category distribution becomes a waffle chart whose values are readable
    as text.
  - Scalar total widgets show per-movement counts.

## Impact

- **Frontend:**
  - `apps/web/src/index.css` (tokens and fonts).
  - `apps/web/src/app/App.tsx` (composition).
  - The dashboard widgets: `NetBalanceWidget`, `StatTile`,
    `CategoryDistributionWidget`, `WidgetSection`.
  - `MovementForm` (layout and date control only).
  - `MovementList` (rail rows).
- **Dependencies:** add `@fontsource/fredoka` and `@fontsource/nunito`, and
  remove `@fontsource-variable/geist`. Remove `recharts` if no remaining
  widget uses it.
- **Backend:** no API, database, or domain changes.
- **Spec:** `openspec/specs/dashboard-composition/spec.md` is the baseline this
  change modifies. `movement-entry`, `movements` and `dashboard-widgets`
  behavior is unchanged.
- **Non-goals:** streak, XP and levels (next change); any light theme or theme
  toggle; new routes or pages; new widget types; category icon or color
  fields in the API.

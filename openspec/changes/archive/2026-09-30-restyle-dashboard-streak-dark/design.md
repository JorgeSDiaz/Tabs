# Design

## Context

- **What exists today.** `compose-the-dashboard` (archived 2026-09-30) left
  the following in place:
  - A token-based stylesheet in `apps/web/src/index.css` with light and dark
    palettes selected by `prefers-color-scheme`.
  - Geist from `@fontsource-variable/geist`.
  - A Recharts category chart.
  - A widget grid that reflows by widget identity.
- **Reference.** The target look is the `d6-dashboard-dark` artboard in the
  Tabs design canvas. See proposal.md for why it is being adopted.
- **Data.** Everything the new layout shows is already available on the client:
  - The active cycle and its balance.
  - The active cycle's movements, which give the per-direction counts.
  - The category totals the distribution widget already computes.
- **Behavior contracts.** `movement-entry`, `movements` and `dashboard-widgets`
  are fixed. Only presentation changes.

## Goals / Non-Goals

**Goals:**
- One set of dark theme tokens, with every component reading color, type and
  spacing from those tokens.
- Match the reference composition at ≥1024 px and keep the existing
  single-column flow at 375 px.
- Replace the pie with an accessible waffle chart that needs no charting
  library.

**Non-Goals:**
- Streak, XP and levels, and any backend work. These belong to
  `track-logging-streak`.
- A theme switcher. The removed light palette is not kept behind a flag.

## Decisions

### Dark-only tokens with `color-scheme: dark`

**Choice.**
- Replace both palettes with one semantic token set on `:root`.
- Delete the `prefers-color-scheme` block.
- Set `color-scheme: dark` on the root so native `<select>` menus, date
  pickers, scrollbars and autofill render dark.

**Token values** (from the reference artboard, contrast-checked):

| Token | Value |
|---|---|
| ground | `#0F131B` |
| surface | `#171C27` |
| field | `#1F2633` |
| hairline | `#262E3D` |
| control border | `#3A4457` |
| text | `#EEF1F6` |
| text-muted | `#A3ACBD` |
| action (ember) | `#E8662A`, pressed edge `#9C3A0E` |
| money-in (leaf) | `#3DBB76`, text-on-dark `#5FD08F` |
| money-out (coral) | `#F36D8C`, text-on-dark `#FF8FA8` |
| ink-on-color | `#141821` |
| error | kept as its own token, never reused for money-out |

**Alternative considered.** Keep both palettes and default to dark. This was
rejected because the user chose dark only, and a second palette nobody uses
would be untested surface (constitution rule 4).

### Category palette assigned by cycle rank

**Choice.**
- A pure function ranks the active cycle's expense categories by total.
- The top five get the palette slots in rank order: `#6B8CFF`, `#F5C451`,
  `#C3AEFF`, `#3CCBB8`, `#9ACCFF`.
- All other categories share neutral `#8A93A5`.
- Income categories use leaf.
- The waffle and the ledger rows both read from this one mapping (rule 3).

**Alternative considered.** Add a `color` column to categories. This was
rejected because it needs API and migration work for a presentation concern
that nothing else uses yet.

### Category icons from a presentation map

**Choice.**
- A frontend map from the seeded category names to icons. It covers the
  nine expense and five income categories in the `movements` spec.
- User-created categories fall back to a generic tag icon.

**Trade-off.** Renaming a seeded category drops its icon to the fallback. This
is acceptable while categories cannot be renamed. If icons need to follow the
user's own categories, they move to the API in a later change.

**Alternative considered.** An `icon` field on `Category`. It was rejected for
the same reason as the color column.

### Waffle chart as plain markup

**Choice.**
- 100 `<span>` cells in a CSS grid of 20 columns × 5 rows, filled column by
  column so each category forms a contiguous block.
- Square counts use largest-remainder rounding so they always sum to 100.
- The grid is `role="img"` with an `aria-label` listing every category's
  percentage.
- The legend beneath repeats name, percentage and amount as text.

**Alternative considered.** Keep Recharts and restyle it. It was rejected
because the waffle needs no library, and removing Recharts drops a large part
of the bundle if nothing else imports it.

### Movement-count marks

**Choice.**
- Each total widget renders at most 40 marks, drawn as 8 px squares in rows
  of 20.
- Above that it renders 40 marks and a "+N" label.
- The exact count is always in the widget's text.

### Entry bar layout

**Choice.**
- The existing form markup is laid out as one grid row at ≥1024 px with these
  columns: type, amount, category, date, note (flexible), and save.
- The date control becomes a select with the options Today, Yesterday and
  "Pick a date…". Choosing the last one reveals the native date input.
- The default stays today, which satisfies `movement-entry` unchanged.
- Below 1024 px the fields stack as they do today.

### Fonts

**Choice.** `@fontsource/fredoka` (weights 500–700) and `@fontsource/nunito`
(weights 600–800) are imported in `index.css`, and Geist is removed.

## Risks / Trade-offs

- **[Risk]** Removing the light theme upsets anyone who relied on it.
  → The user requested this. The palette stays recoverable from the archived
  change and git history.
- **[Risk]** Fredoka's rounded figures misalign amounts in columns.
  → Use `font-variant-numeric: tabular-nums` on every amount, and keep ledger
  amounts in Nunito, which has tabular figures.
- **[Risk]** Five palette colors are hard to tell apart for color-blind users.
  → The slots differ in lightness as well as hue, and every legend entry and
  ledger row also carries the category name.
- **[Trade-off]** Rank-based colors can change color when two categories swap
  places during a cycle. This is accepted because the chart and the ledger
  always agree with each other, which is the property the spec requires.

## Migration Plan

This is a frontend-only deploy through `make prod-up`, with no data migration.
To roll back, redeploy the previous web image.

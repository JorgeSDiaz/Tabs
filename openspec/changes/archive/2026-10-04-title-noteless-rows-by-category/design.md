# Design

## Context

- **The row.** `MovementList.tsx` renders two spans per row inside
  `.movement-detail`: `.note` holds `m.note || 'No note'` (with `.muted` when
  the note is empty) and `.category` holds `name · <time>`. The edit and
  delete controls are named `Edit ${m.note || name}` and
  `Delete ${m.note || name}`.
- **The styles.** `.note`, `.note.muted` and `.category` in `index.css` are
  used by these two spans and nothing else.
- **Blank notes.** Nothing trims a note on its way in: the entry form sends
  the text as typed and the API stores it as received. The XP rule
  (`habit/domain/xp.go`) is the one place that asks whether a note has text,
  and it counts only non-whitespace.
- **Tests.** There are no component tests; pure functions have Vitest tests
  beside them.

See proposal.md for the motivation and the specs for the behaviour.

## Goals / Non-Goals

**Goals:**
- The row's title always identifies the movement.
- The visible title and the accessible names of the row's controls come from
  the same value.

**Non-Goals:**
- Normalizing notes when they are saved.
- A shared "movement label" helper. One component needs the title.

## Decisions

### The title is computed once per row and reused

**Choice.** The row derives one title — the trimmed note, or the category's
name when that is empty — and uses it for the visible title and for both
control names. The detail line shows `name · <time>` when there is a note and
`<time>` alone otherwise. The `'No note'` string is deleted.

This also brings the control names in line with what
`movement-editing` already requires ("when a movement has no note, the name
includes its category"): a note of spaces used to produce a control named
`Edit    `.

**Alternative considered.** Keep `m.note ||` for the title. Rejected: a note
of spaces is truthy, so the row would show a blank title and, with this
change, no category under it either — the movement could not be told apart.

### Whitespace is decided in the row, not on save

**Choice.** The row trims the note for display. What is stored does not
change.

**Alternative considered.** Trim the note in `toInput` or in the Go
constructor so a blank note never exists. Rejected for this change: it
alters what is recorded, needs a decision about rows already stored, and the
row would still have to cope with those. If blank notes are ever normalized
on save, the trim here becomes a no-op and can be dropped then.

### The row text classes are renamed after what they hold

**Choice.** `.note` becomes `.movement-title` and `.category` becomes
`.movement-meta`, in the component and in `index.css`. `.note.muted` is
deleted, since no row is muted any more (constitution rule 4).

After this change the first span sometimes holds a category and the second
sometimes holds only a date, so the old names would describe neither
(constitution rule 7). The new names follow the sibling classes
`.movement-detail` and `.movement-figures`.

**Alternative considered.** Leave the class names. Rejected: `.category` on a
span that holds only a date is the kind of drift rule 7 exists to stop, and
the rename touches three selectors.

## Risks / Trade-offs

- [The same category name repeats down the titles when several noteless
  movements share a category] → That is the honest state of those rows; the
  date and the amount tell them apart, as they did under "No note".
- [No automated test covers the row] → The logic is two conditionals in one
  component; the tasks verify both branches in the browser against local
  data, matching how the rest of the ledger is verified.

# Tasks

## 1. Ledger row

- [x] 1.1 In `MovementList.tsx`, derive one title per row: the trimmed note, or the category's name when that is empty. Show it as the row's title, show `name · <time>` in the detail line when there is a note and `<time>` alone otherwise, and use the same title in the edit and delete controls' `aria-label`. Delete the `'No note'` string and the `muted` class. Verify that a grep for `No note` and `muted` in `apps/web/src` finds nothing.
- [x] 1.2 Rename the row's `note` class to `movement-title` and its `category` class to `movement-meta` in `MovementList.tsx` and `index.css`, and delete the `.note.muted` rule. Verify that `index.css` no longer has a `.note {`, `.note.muted {` or `.category {` rule (`.note-field` and `.category-*` stay), and that `movement-title` and `movement-meta` each appear in both `MovementList.tsx` and `index.css`.

## 2. Verify the usable slice

- [x] 2.1 Run `openspec validate title-noteless-rows-by-category --strict`, `pnpm --filter web test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [x] 2.2 Against disposable local data, record one movement with a note and one without. Confirm the first row reads the note over `category · date`, the second reads the category as its title — same color and weight as the first — over the date alone, and that "No note" appears nowhere.
- [x] 2.3 Edit the noteless row to add a note, then clear it, then save a note of three spaces. Confirm the title and detail line follow each time, and that the edit and delete controls' accessible names match the visible title.
- [x] 2.4 At 375 px wide, confirm a noteless row with a long category name wraps without overlapping the amount or the row's controls and without horizontal page scrolling.
- [ ] 2.5 Use the ledger for real entries for a few days and record here whether the category-as-title rows read right.

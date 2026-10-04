# Proposal

## Why

A ledger row for a movement without a note is titled "No note", in a muted
color, with the category pushed to the line below. The title — the most
prominent text of the row — then says nothing about the movement, while the
one thing that does identify it sits in the small print. The user asked for
the category to take the title when there is no note.

## What Changes

- A row whose movement has no note is titled with its category's name, at
  the same weight and color as a note title. Its detail line holds only the
  date.
- The "No note" placeholder is no longer shown anywhere in the ledger.
- A note made only of spaces counts as no note, so a row never shows a blank
  title.
- Unchanged: a row with a note keeps the note as its title and
  "category · date" below it. The category chip, the amount, the XP, and the
  edit and delete controls stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-composition`: adds a requirement for what a ledger row's title
  and detail line hold. No existing requirement states this today, so
  nothing is modified or removed.

## Impact

- **Frontend:**
  - `apps/web/src/features/movements/adapters/ui/MovementList.tsx`: the row
    picks its title and detail line from the note and the category.
  - `apps/web/src/index.css`: the muted-title rule loses its only user and is
    removed; the two row text classes are renamed after what they now hold.
- **Backend and API:** none. The note is stored and returned as before.
- **Dependencies:** none added.
- **Non-goals:**
  - Trimming or rejecting blank notes when a movement is saved.
  - Changing the edit dialog, the entry form, or the XP a note earns.

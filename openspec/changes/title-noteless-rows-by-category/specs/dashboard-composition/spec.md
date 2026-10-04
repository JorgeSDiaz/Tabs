# Spec Delta

## ADDED Requirements

### Requirement: Ledger rows are titled by their note or their category
Each ledger row SHALL show a title and, under it, a detail line. When the
movement's note contains non-whitespace text, the title SHALL be the note and
the detail line SHALL state the category's name and the movement's date. When
the note is empty or holds only whitespace, the title SHALL be the category's
name and the detail line SHALL state only the date.

A category title SHALL be shown with the same prominence as a note title. The
ledger SHALL NOT show placeholder text in place of a missing note, and a row
SHALL NOT state its category's name in both the title and the detail line.

#### Scenario: Row with a note
- **WHEN** the ledger lists a Groceries movement dated September 28 with the
  note "Supermarket run"
- **THEN** the row's title reads "Supermarket run"
- **AND** its detail line states Groceries and September 28

#### Scenario: Row without a note
- **WHEN** the ledger lists an Occasional movement dated September 30 with an
  empty note
- **THEN** the row's title reads "Occasional", styled like the title of a row
  that has a note
- **AND** its detail line states only September 30
- **AND** the row does not read "No note"

#### Scenario: Note of only spaces
- **WHEN** the ledger lists a Transport movement whose note is three spaces
- **THEN** the row's title reads "Transport" and its detail line states only
  the date

#### Scenario: Note added or cleared by editing
- **WHEN** the user edits a row titled "Occasional" to carry the note
  "Sold the old bike"
- **THEN** the row's title reads "Sold the old bike" and its detail line
  states Occasional and the date
- **AND** when the note is later cleared, the title reads "Occasional" again
  and the detail line states only the date

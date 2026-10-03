# movement-editing Specification

## Purpose

Defines how a recorded movement is corrected from the ledger: the edit
control on each row, the modal dialog that holds the movement's values, and
what the dashboard does when an edit is saved, cancelled, or fails.

## Requirements

### Requirement: Every ledger row can be edited
Each ledger row SHALL offer an edit control, next to its delete control, that
opens the edit dialog for that row's movement. The control SHALL be operable
with the keyboard and SHALL have an accessible name that identifies the
movement it edits.

#### Scenario: Edit control on each row
- **WHEN** the ledger lists movements
- **THEN** every row shows an edit control and a delete control

#### Scenario: Control names its movement
- **WHEN** a row's movement has the note "Supermarket run"
- **THEN** the edit control's accessible name includes "Supermarket run"
- **AND** when a movement has no note, the name includes its category instead

### Requirement: Edit dialog starts from the movement's current values
The edit dialog SHALL be modal and SHALL offer the same fields as the entry
form — type, amount, category, date, and note — each starting at the
movement's current value. The amount field SHALL have keyboard focus when the
dialog opens. The category choices SHALL be exactly the existing categories
whose direction matches the selected type, and changing the type SHALL return
the category to its unselected placeholder. The date SHALL be chosen from the
same calendar the entry form uses. The dialog SHALL NOT offer creating a
category.

#### Scenario: Fields are prefilled
- **WHEN** the user opens the edit dialog for an expense of 184,300 in
  Groceries dated September 28 with the note "Supermarket run"
- **THEN** the dialog shows the expense type selected, the amount 184300,
  Groceries, September 28, and "Supermarket run"
- **AND** the amount field has keyboard focus

#### Scenario: Changing the type resets the category
- **WHEN** the user changes the type in the dialog from expense to income
- **THEN** the category returns to the unselected placeholder
- **AND** the choices are exactly the income categories

#### Scenario: No category creation in the dialog
- **WHEN** the user opens the category choices in the edit dialog
- **THEN** only existing categories are offered

### Requirement: Saving an edit updates the dashboard
Saving the dialog SHALL store the new values, close the dialog, and announce
that the movement was updated. The ledger, the cycle totals, the widgets, and
the habit SHALL reflect the edit without a page reload. The dialog SHALL NOT
send values the entry form would refuse: a missing or non-positive amount, or
no category selected.

#### Scenario: Successful save
- **WHEN** the user changes a movement's amount from 184,300 to 148,300 and
  saves
- **THEN** the dialog closes and the ledger announces the update
- **AND** the row shows −$148,300
- **AND** the total expenses and the category distribution include the new
  amount without a page reload

#### Scenario: Re-dated outside the active cycle
- **WHEN** the user changes a movement's date to a day before the active
  cycle's start and saves
- **THEN** the row leaves the ledger
- **AND** the cycle totals and the widgets no longer include the movement

#### Scenario: Invalid values are not sent
- **WHEN** the user clears the amount, or leaves the category unselected,
  and saves
- **THEN** the dialog stays open and states what is wrong
- **AND** the movement is unchanged

#### Scenario: Save fails
- **WHEN** the save is rejected or cannot reach the server
- **THEN** the dialog stays open, keeps the values the user typed, and shows
  the error
- **AND** the ledger still shows the movement's previous values

### Requirement: Cancelling leaves the movement unchanged
Dismissing the edit dialog without saving — with its cancel control or with
Escape — SHALL close it, SHALL leave the movement unchanged, and SHALL return
keyboard focus to the edit control of the row it was opened from.

#### Scenario: Escape discards the changes
- **WHEN** the user changes the amount in the dialog and presses Escape
- **THEN** the dialog closes and the row shows the original amount
- **AND** keyboard focus is on that row's edit control

#### Scenario: Reopening starts from stored values
- **WHEN** the user cancels a dialog with changed values and opens it again
  for the same movement
- **THEN** the fields show the movement's stored values, not the discarded
  ones

### Requirement: Editing does not disturb the entry form
Opening, saving, or cancelling the edit dialog SHALL leave the pinned entry
form as it was: the values typed into it and the direction, category, and
date it remembers from the last recorded movement SHALL NOT change.

#### Scenario: Remembered values survive an edit
- **WHEN** the user records an expense in Groceries dated today, then edits
  another movement into an income dated last week
- **THEN** the entry form still shows the expense type, Groceries, and
  today's date

#### Scenario: Typed values survive an edit
- **WHEN** the user has typed an amount and a note in the entry form, then
  opens the edit dialog and saves an edit
- **THEN** the entry form still holds the typed amount and note

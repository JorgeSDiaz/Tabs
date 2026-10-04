# Spec Delta

## MODIFIED Requirements

### Requirement: Edit dialog starts from the movement's current values
The edit dialog SHALL be modal and SHALL offer the same fields as the entry
form — type, amount, category, date, and note — each starting at the
movement's current value. The amount field SHALL have keyboard focus when the
dialog opens, SHALL start in the money format the entry form's amount field
shows, and SHALL keep that format as it is edited. The category field SHALL
be the one the entry form uses, showing each choice with its icon and
operable with the keyboard in the same way. The category choices SHALL be
exactly the existing categories whose direction matches the selected type,
and changing the type SHALL select the first category listed for the new
type. The date SHALL be chosen from the same calendar the entry form uses.
The dialog SHALL NOT offer creating a category.

#### Scenario: Fields are prefilled
- **WHEN** the user opens the edit dialog for an expense of 184,300 in
  Groceries dated September 28 with the note "Supermarket run"
- **THEN** the dialog shows the expense type selected, the amount 184,300,
  Groceries, September 28, and "Supermarket run"
- **AND** the amount field has keyboard focus

#### Scenario: Amount with cents is prefilled
- **WHEN** the user opens the edit dialog for a movement of 1,234.50
- **THEN** the amount field reads 1,234.50
- **AND** a movement of 184,300 reads 184,300, with no period

#### Scenario: Amount stays grouped while it is corrected
- **WHEN** the dialog's amount reads 184,300 and the user changes it to
  1484300
- **THEN** the field reads 1,484,300

#### Scenario: Changing the type resets the category
- **WHEN** the user changes the type in the dialog from expense to income
- **THEN** the category field shows the first income category
- **AND** the choices are exactly the income categories

#### Scenario: No category creation in the dialog
- **WHEN** the user opens the category choices in the edit dialog
- **THEN** only existing categories are offered

#### Scenario: Escape in the category list keeps the dialog open
- **WHEN** the category list is open in the edit dialog and the user
  presses Escape
- **THEN** the list closes and the dialog stays open with its values
- **AND** a second Escape dismisses the dialog

### Requirement: Saving an edit updates the dashboard
Saving the dialog SHALL store the new values, close the dialog, and announce
that the movement was updated. The ledger, the cycle totals, the widgets, and
the habit SHALL reflect the edit without a page reload. The dialog SHALL NOT
send values the entry form would refuse: a missing or non-positive amount.

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
- **WHEN** the user clears the amount and saves
- **THEN** the dialog stays open and states what is wrong
- **AND** the movement is unchanged

#### Scenario: Type changed and saved without choosing a category
- **WHEN** the user changes an expense's type to income and saves without
  opening the category field
- **THEN** the movement is stored as income in the first income category

#### Scenario: Save fails
- **WHEN** the save is rejected or cannot reach the server
- **THEN** the dialog stays open, keeps the values the user typed, and shows
  the error
- **AND** the ledger still shows the movement's previous values

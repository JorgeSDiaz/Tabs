# Spec Delta

## MODIFIED Requirements

### Requirement: Edit dialog starts from the movement's current values
The edit dialog SHALL be modal and SHALL offer the same fields as the entry
form — type, amount, category, date, and note — each starting at the
movement's current value. The amount field SHALL have keyboard focus when the
dialog opens, SHALL start in the money format the entry form's amount field
shows, and SHALL keep that format as it is edited. The category choices SHALL
be exactly the existing categories whose direction matches the selected type,
and changing the type SHALL return the category to its unselected placeholder.
The date SHALL be chosen from the same calendar the entry form uses. The
dialog SHALL NOT offer creating a category.

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
- **THEN** the category returns to the unselected placeholder
- **AND** the choices are exactly the income categories

#### Scenario: No category creation in the dialog
- **WHEN** the user opens the category choices in the edit dialog
- **THEN** only existing categories are offered

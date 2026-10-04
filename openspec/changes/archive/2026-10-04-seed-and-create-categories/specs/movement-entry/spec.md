# Spec Delta

## MODIFIED Requirements

### Requirement: Categories filtered by direction
The form SHALL list as category choices only the categories whose
direction matches the currently selected direction: when the direction
is `in`, the choices are exactly the `in` categories; when it is `out`,
the choices are exactly the `out` categories. Categories keep their
listed order within each direction. Following those choices the dropdown
SHALL offer one `Create new…` entry, last in both directions; it is a
command, not a category choice, and selecting it never leaves a category
selected.

#### Scenario: In direction offers only income categories
- **WHEN** the user selects direction `in`
- **THEN** the category choices are exactly the categories whose
  direction is `in`

#### Scenario: Out direction offers only expense categories
- **WHEN** the user selects direction `out`
- **THEN** the category choices are exactly the categories whose
  direction is `out`

#### Scenario: Direction change resets the category
- **WHEN** the user changes the direction with a category selected
- **THEN** the category field returns to the unselected placeholder

#### Scenario: Create entry appears in both directions
- **WHEN** the user opens the category dropdown under either direction
- **THEN** `Create new…` is listed after the categories of that
  direction

## ADDED Requirements

### Requirement: Create a category from the form
Selecting `Create new…` SHALL open a small modal with a single name
field and a `Create and use` button. Confirming with a valid name SHALL
create a category whose direction is the one currently selected in the
form, select it in the category field, close the modal, and leave every
other field of the pending movement untouched. Cancelling SHALL close
the modal and leave the category field unselected.

#### Scenario: Creating a category while recording
- **WHEN** the user picks `Create new…`, types a name, and confirms
  while the form direction is `out`
- **THEN** an `out` category with that name is created
- **AND** the modal closes with that category selected in the dropdown
- **AND** the amount, date, and note typed so far are still in the form

#### Scenario: New category is immediately usable
- **WHEN** the movement is saved with the just-created category selected
- **THEN** the movement records against that category
- **AND** the category shows its name in the movement list
- **AND** it remains a choice for later movements

#### Scenario: Cancelling creates nothing
- **WHEN** the user picks `Create new…`, then closes the modal without
  confirming
- **THEN** no category is created
- **AND** the category field is unselected

#### Scenario: Rejected creation reports in the modal
- **WHEN** the user confirms a name that is blank or already taken
- **THEN** the modal stays open and shows the error
- **AND** the user can edit the name and confirm again

# Spec Delta

## ADDED Requirements

### Requirement: Category field always holds a category
Once the categories have loaded, the category field SHALL always show a
selected category and SHALL NOT offer an empty or placeholder choice. When
nothing else has determined the selection, the field SHALL select the first
category listed for the form's direction. While the categories are loading,
the field SHALL be disabled and SHALL say that they are loading.

#### Scenario: Fresh load selects the first category
- **WHEN** the form appears on a fresh load and the categories have loaded
- **THEN** the category field shows the first category listed for the
  form's direction

#### Scenario: Recording without touching the category
- **WHEN** the user types an amount on a fresh load and saves without
  opening the category field
- **THEN** the movement is recorded against the category the field showed

#### Scenario: Categories still loading
- **WHEN** the categories have not loaded yet
- **THEN** the category field is disabled and reads "Loading categories…"
- **AND** a movement cannot be saved

### Requirement: Category choices show their icon
The category field SHALL show the selected category's icon next to its
name, and each choice in the opened list SHALL show that category's icon
next to its name. A category that has no icon of its own SHALL show the
generic category icon.

#### Scenario: Choices carry icons
- **WHEN** the user opens the category list under the `out` direction
- **THEN** every category is listed with its icon followed by its name

#### Scenario: Category without its own icon
- **WHEN** the list includes a category created by the user
- **THEN** that category shows the generic category icon next to its name

### Requirement: Category list is operable with the keyboard
The category field SHALL be reachable with Tab and SHALL open its list with
Enter, Space, ArrowDown, or ArrowUp, starting on the selected category.
While the list is open, ArrowDown and ArrowUp SHALL move through the
choices and the `Create new…` entry, Home and End SHALL move to the first
and the last entry, and typing letters SHALL move to the first choice whose
name starts with them. Typing letters while the list is closed SHALL open
it on the matching choice. Enter or Space SHALL choose the entry the list
is on and close the list. Escape, moving focus away, or clicking outside
SHALL close the list without changing the selected category. After Enter,
Space, or Escape, keyboard focus SHALL be on the category field. The field
SHALL expose its label and the selected category's name to assistive
technology, and each choice SHALL announce its name and whether it is the
selected one.

#### Scenario: Choosing with the keyboard
- **WHEN** the category field has focus showing `Housing` and the user
  presses ArrowDown twice and then Enter
- **THEN** the list opens on `Housing`, moves to `Groceries`, and closes
  with `Groceries` selected
- **AND** keyboard focus is on the category field

#### Scenario: Typing a letter
- **WHEN** the category field has focus and the user types `t`
- **THEN** the list is open on `Transport`
- **AND** pressing Enter selects `Transport`

#### Scenario: Escape keeps the selection
- **WHEN** the list is open, the user moves to another choice, and presses
  Escape
- **THEN** the list closes and the field still shows the category it
  showed before
- **AND** keyboard focus is on the category field

#### Scenario: Reaching the create entry
- **WHEN** the list is open and the user presses End and then Enter
- **THEN** the modal for creating a category opens

## MODIFIED Requirements

### Requirement: Categories filtered by direction
The form SHALL list as category choices only the categories whose
direction matches the currently selected direction: when the direction
is `in`, the choices are exactly the `in` categories; when it is `out`,
the choices are exactly the `out` categories. Categories keep their
listed order within each direction. Following those choices the list
SHALL offer one `Create new…` entry, last in both directions; it is a
command, not a category choice, and choosing it SHALL NOT change the
selected category. Changing the direction SHALL select the first category
listed for the new direction.

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
- **THEN** the category field shows the first category listed for the new
  direction

#### Scenario: Create entry appears in both directions
- **WHEN** the user opens the category list under either direction
- **THEN** `Create new…` is listed after the categories of that
  direction

### Requirement: Create a category from the form
Choosing `Create new…` SHALL open a small modal with a single name
field and a `Create and use` button. Confirming with a valid name SHALL
create a category whose direction is the one currently selected in the
form, select it in the category field, close the modal, and leave every
other field of the pending movement untouched. Cancelling SHALL close
the modal and leave the category field showing the category it showed
before.

#### Scenario: Creating a category while recording
- **WHEN** the user picks `Create new…`, types a name, and confirms
  while the form direction is `out`
- **THEN** an `out` category with that name is created
- **AND** the modal closes with that category selected in the category
  field
- **AND** the amount, date, and note typed so far are still in the form

#### Scenario: New category is immediately usable
- **WHEN** the movement is saved with the just-created category selected
- **THEN** the movement records against that category
- **AND** the category shows its name in the movement list
- **AND** it remains a choice for later movements

#### Scenario: New category is listed above the catch-all
- **WHEN** the user has just created an `out` category from the form and
  opens the category list
- **THEN** the new category is listed above `Other`
- **AND** `Create new…` is listed below `Other`

#### Scenario: Cancelling creates nothing
- **WHEN** the user picks `Create new…` while `Groceries` is selected,
  then closes the modal without confirming
- **THEN** no category is created
- **AND** the category field still shows `Groceries`

#### Scenario: Rejected creation reports in the modal
- **WHEN** the user confirms a name that is blank or already taken
- **THEN** the modal stays open and shows the error
- **AND** the user can edit the name and confirm again

### Requirement: Last-used values remembered within the session
After a successful save, the form SHALL keep the direction, category, and
date exactly as they were used, so consecutive movements on the same day
require no re-configuration. This memory applies within the current page
session only; the form SHALL NOT persist field values across page loads.

#### Scenario: Second movement of the day reuses the setup
- **WHEN** the user records a movement and then records another one
  without reloading the page
- **THEN** the second recording starts with the same direction, category,
  and date as the first

#### Scenario: Reload resets to defaults
- **WHEN** the user reloads the page after recording movements
- **THEN** the date field shows today's local date again
- **AND** the category field shows the first category listed for the
  form's direction

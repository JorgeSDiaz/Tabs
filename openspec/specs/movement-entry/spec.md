# movement-entry Specification

## Purpose

Defines the behavior of the movement-recording form on the first screen:
it is always ready to log an `in` or `out` movement with no prior setup,
through focus, defaults, direction-filtered categories, and short-term
memory.

## Requirements

### Requirement: Form is ready on arrival
The movement form SHALL place keyboard focus in the amount field when it
appears, so a movement can be recorded without any prior click.

#### Scenario: Focus on first appearance
- **WHEN** the user opens the app and the movement form is shown
- **THEN** the amount field has keyboard focus
- **AND** the user can start typing an amount immediately

#### Scenario: Focus returns after a save
- **WHEN** a movement is saved successfully
- **THEN** the amount and note fields are cleared
- **AND** the amount field has keyboard focus again

### Requirement: Amount is shown in the money format as it is typed
The amount field SHALL show its value with the separators the app uses for
every other amount: a comma between each group of three whole-number digits
and a period before the cents. The grouping SHALL update on every change to
the field — typing, deleting, and pasting — without the user leaving the
field.

The field SHALL accept only digits and one period, SHALL keep at most two
digits after the period, and SHALL discard anything else, including the
separators and the currency symbol of pasted text. When the text holds more
than one period, the first one SHALL count and the others SHALL be dropped.
Leading zeros SHALL be dropped from the whole-number part, except that a
whole-number part made only of zeros SHALL read as a single 0, and an amount
that starts with the period SHALL show a zero before it. An empty field SHALL
stay empty.

When the user edits the middle of the amount, the caret SHALL stay next to
the digit just typed or deleted. A separator SHALL never stop a deletion:
deleting backward or forward across a comma SHALL reach the digit on its
other side. Formatting SHALL NOT change the amount that is recorded.

#### Scenario: Whole amount is grouped while typing
- **WHEN** the user types 4324800 into the amount field
- **THEN** the field reads 4,324,800
- **AND** after the first four digits it already read 4,324

#### Scenario: Cents are kept to two digits
- **WHEN** the user types 1234.567
- **THEN** the field reads 1,234.56

#### Scenario: Period before the cents are typed
- **WHEN** the user has typed 1234 followed by a period
- **THEN** the field reads 1,234. and the next digit is taken as cents

#### Scenario: Leading zeros and a leading period
- **WHEN** the user types 007
- **THEN** the field reads 7
- **AND** when the user types .5 into an empty field, it reads 0.5

#### Scenario: Amount below one
- **WHEN** the user types 0 into an empty field
- **THEN** the field reads 0
- **AND** continuing with .50 makes it read 0.50

#### Scenario: Second period
- **WHEN** the field reads 12.34 and the user types a period at the end
- **THEN** the field still reads 12.34
- **AND** when the user instead types a period between the 1 and the 2, the
  field reads 1.23

#### Scenario: Pasted amount with symbols
- **WHEN** the user pastes $1,234.50 into an empty amount field
- **THEN** the field reads 1,234.50

#### Scenario: Characters that are not part of an amount
- **WHEN** the field reads 1,234 and the user types a letter or a minus sign
- **THEN** the field still reads 1,234

#### Scenario: Editing in the middle
- **WHEN** the field reads 184,300 and the user places the caret between the
  8 and the 4 and types 9
- **THEN** the field reads 1,894,300
- **AND** the caret is right after the 9

#### Scenario: Deleting across a separator
- **WHEN** the field reads 1,234 with the caret right after the comma and
  the user presses Backspace twice
- **THEN** the field reads 234
- **AND** when the caret is right before the comma instead and the user
  presses Delete twice, the field reads 134

#### Scenario: Deleting below a thousand
- **WHEN** the field reads 1,234 and the user deletes the last digit
- **THEN** the field reads 123

#### Scenario: Recorded amount is the amount shown
- **WHEN** the user records a movement with the field reading 4,324,800
- **THEN** the movement is stored as 4,324,800 and the ledger row shows
  $4,324,800
- **AND** a movement recorded with the field reading 1,234.50 is stored as
  1,234.50

### Requirement: Date defaults to today
The form SHALL start with the date field set to today's date in the
browser's local time zone, so recording a movement dated today needs no
interaction with the date field.

#### Scenario: Fresh load shows today
- **WHEN** the form appears on a fresh load of the app
- **THEN** the date field shows today's local date

### Requirement: Date is chosen from a calendar
The date field SHALL show the selected date and SHALL open a calendar
that displays one month at a time, from which the user picks a day. The
calendar SHALL open on the month of the currently selected date, SHALL
mark today distinctly from the selected day, SHALL identify the days that
belong to the active cycle, SHALL let the user move to the previous and
the next month, and SHALL offer a single control that selects today.
Choosing a day, or choosing today, SHALL set the date field to that day
and close the calendar. Days outside the active cycle SHALL remain
selectable. The calendar SHALL be fully operable with the keyboard, and
dismissing it without choosing SHALL leave the date unchanged.

#### Scenario: Calendar opens on the selected date
- **WHEN** the date field holds today's date and the user opens the
  calendar
- **THEN** the calendar shows the current month with today marked as both
  today and selected

#### Scenario: Picking another day
- **WHEN** the user picks the day two days before today
- **THEN** the date field shows that day
- **AND** the calendar closes

#### Scenario: Quick return to today
- **WHEN** the user has navigated to another month and activates the
  today control
- **THEN** the date field is set to today's local date
- **AND** the calendar closes

#### Scenario: Day in another cycle
- **WHEN** the user navigates to a previous month and picks a day outside
  the active cycle
- **THEN** the date field accepts that day
- **AND** a movement saved with it is stored with that date

#### Scenario: Field names the selected day
- **WHEN** the selected date is today
- **THEN** the date field reads "Today"
- **AND** when any other day is selected, the field shows that day's
  weekday, month, and day number

#### Scenario: Keyboard operation
- **WHEN** the user opens the calendar and uses only the keyboard
- **THEN** they can move between days and months, choose a day, and reach
  the today control
- **AND** every day announces its full date, and today announces that it
  is today

#### Scenario: Dismiss without choosing
- **WHEN** the user opens the calendar and dismisses it with Escape or by
  moving focus or clicking outside it
- **THEN** the date field keeps its previous date
- **AND** after Escape, keyboard focus returns to the date field

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

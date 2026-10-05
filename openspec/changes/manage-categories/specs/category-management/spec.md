# Spec Delta

## Purpose

Defines the categories screen: the one place, apart from the dashboard,
where the user sees every category at once and creates, renames, restyles,
and deletes them.

## ADDED Requirements

### Requirement: Categories have their own screen
The app SHALL offer a categories screen separate from the dashboard. The
dashboard header SHALL offer a control that opens it, and the screen SHALL
offer a control that returns to the dashboard. The screen SHALL have its
own address, so reloading the page stays on it and the browser's back
control returns to the dashboard. Returning to the dashboard SHALL show
the entry form as it was left, with the values typed into it. The screen
SHALL NOT offer recording a movement, and the dashboard SHALL NOT offer
editing or deleting a category.

#### Scenario: Opening and returning
- **WHEN** the user activates the categories control in the dashboard
  header
- **THEN** the categories screen is shown in place of the dashboard
- **AND** activating its return control, or the browser's back control,
  shows the dashboard again

#### Scenario: Reload stays on the screen
- **WHEN** the user reloads the page while the categories screen is shown
- **THEN** the categories screen is shown again

#### Scenario: Entry form survives the visit
- **WHEN** the user types an amount and a note in the entry form, opens
  the categories screen, and returns
- **THEN** the entry form still holds the amount and the note

#### Scenario: Keyboard
- **WHEN** the user moves through the dashboard header with the keyboard
- **THEN** the categories control can be focused and activated, and it has
  an accessible name

### Requirement: Screen lists every category
The categories screen SHALL list every category in two groups, expenses
and income, each in listing order. Each row SHALL show the category's
marker — its icon on its color — and its name, and SHALL offer an edit
control and a delete control whose accessible names include the
category's name. The screen SHALL state when the categories are loading
and when they could not be loaded. It SHALL remain usable at 375 CSS
pixels wide without horizontal page scrolling.

#### Scenario: Both groups are listed
- **WHEN** the categories screen is shown on a fresh database
- **THEN** the expense group lists `Housing` through `Other` in listing
  order and the income group lists `Salary` and `Gift`
- **AND** every row shows its marker and name

#### Scenario: Controls name their category
- **WHEN** the screen lists `Groceries`
- **THEN** that row's edit and delete controls include "Groceries" in
  their accessible names

#### Scenario: Load failure
- **WHEN** the categories cannot be loaded
- **THEN** the screen states the error and lists no categories

### Requirement: Edit a category from the screen
Activating a row's edit control SHALL open a modal dialog holding the
category's name, its icon choice, and its color choice, each starting at
the category's current value, with a preview of the marker that follows
the choices as they change. Saving SHALL store the changes, close the
dialog, and show them on the screen without a page reload. The dashboard
SHALL show the new name, icon, and color everywhere the category appears
— the entry form's list, the ledger, and the chart — the next time it is
shown, without a page reload. Cancelling, with the cancel control or
Escape, SHALL close the dialog and change nothing. When the dialog
closes, keyboard focus SHALL return to the control that opened it. A
rejected save SHALL keep the dialog open with the values the user chose
and state what is wrong.

#### Scenario: Restyling a category
- **WHEN** the user opens `Transport`, chooses another icon and another
  color, and saves
- **THEN** the dialog closes and the `Transport` row shows the new marker
- **AND** on the dashboard, `Transport` movements in the ledger and
  `Transport` in the entry form's list show the new marker

#### Scenario: Preview follows the choices
- **WHEN** the user picks another color in the dialog
- **THEN** the preview marker shows that color before anything is saved

#### Scenario: Renaming a category
- **WHEN** the user renames `Eating out` to `Restaurants` and saves
- **THEN** the row reads `Restaurants`
- **AND** ledger rows of that category read `Restaurants`

#### Scenario: Name already taken
- **WHEN** the user renames a category to the name of another one and
  saves
- **THEN** the dialog stays open, keeps the typed name, and says the name
  is taken

#### Scenario: Cancelling
- **WHEN** the user changes the name and color in the dialog and presses
  Escape
- **THEN** the dialog closes and the row is unchanged
- **AND** keyboard focus is on that row's edit control

### Requirement: Color choices
The category dialog SHALL offer as color choices a fixed set of twelve
colors, followed by every other color that some category currently uses,
followed by a control that opens a free color picker. A color taken from
the free picker SHALL become the dialog's selected color. The selected
color SHALL be marked, and each choice SHALL have an accessible name. A
marker SHALL keep its icon legible on any color: the icon SHALL be drawn
dark on light colors and light on dark colors.

#### Scenario: Fixed set
- **WHEN** the dialog is opened for a category whose color is in the
  fixed set
- **THEN** the twelve fixed colors are offered and the category's color
  is marked as selected

#### Scenario: Custom color
- **WHEN** the user opens the free picker, chooses a color outside the
  fixed set, and saves
- **THEN** the category's marker uses that color

#### Scenario: Custom color becomes a choice
- **WHEN** one category uses a color outside the fixed set and the user
  opens the dialog for another category
- **THEN** that color is offered after the fixed set

#### Scenario: Unused custom color is not kept
- **WHEN** the only category using a custom color is given another color
- **THEN** the custom color is no longer offered

#### Scenario: Dark custom color
- **WHEN** a category is given a very dark color
- **THEN** its marker draws the icon in a light color

### Requirement: Icon choices
The category dialog SHALL offer a fixed set of icons that includes the
icon of every seeded category and the generic icon. The selected icon
SHALL be marked, and each choice SHALL have an accessible name. A
category whose stored icon is not in the set SHALL show the generic icon.

#### Scenario: Choosing an icon
- **WHEN** the user opens a category created from the entry form
- **THEN** the generic icon is marked as selected
- **AND** choosing another icon and saving changes the category's marker

#### Scenario: Keyboard
- **WHEN** the user moves through the icon and color choices with the
  keyboard
- **THEN** every choice can be reached and selected, and the selected one
  is announced as selected

### Requirement: Create a category from the screen
Each group on the categories screen SHALL offer a control that opens the
category dialog for a new category of that group's direction, with an
empty name, the generic icon, and the fixed color the fewest categories
use. Saving SHALL create the category and list it in its group. The new
category SHALL be offered by the entry form's list from then on.

#### Scenario: New expense category
- **WHEN** the user opens the new-category dialog in the expense group,
  types `Pets`, picks an icon and a color, and saves
- **THEN** `Pets` is listed in the expense group above `Other` with that
  marker
- **AND** the entry form offers `Pets` for an expense

#### Scenario: Blank or taken name
- **WHEN** the user saves a new category with a blank name or the name of
  an existing category
- **THEN** the dialog stays open and states what is wrong
- **AND** no category is created

### Requirement: Delete a category from the screen
Activating a row's delete control SHALL ask for confirmation, naming the
category, before anything is deleted. Confirming SHALL delete the
category and remove its row. When the deletion is refused, the screen
SHALL state the reason and keep the row. Declining the confirmation SHALL
change nothing.

#### Scenario: Deleting an unused category
- **WHEN** the user deletes a category that has no movements and confirms
- **THEN** its row disappears
- **AND** the entry form no longer offers it

#### Scenario: Category in use
- **WHEN** the user confirms deleting a category that has movements
- **THEN** the row stays and the screen says the category has movements

#### Scenario: Catch-all
- **WHEN** the user confirms deleting the catch-all
- **THEN** the row stays and the screen says the catch-all cannot be
  deleted

#### Scenario: Declining
- **WHEN** the user activates a delete control and declines the
  confirmation
- **THEN** the category is still listed

#### Scenario: Deleted category was selected in the entry form
- **WHEN** the entry form had an unused category selected, the user
  deletes that category, and returns to the dashboard
- **THEN** the entry form shows the first category listed for its
  direction

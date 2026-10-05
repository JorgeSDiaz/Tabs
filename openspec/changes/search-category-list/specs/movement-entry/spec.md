# Spec Delta

## ADDED Requirements

### Requirement: Category list can be searched
The opened category list SHALL show a search box above the choices. The
box SHALL be empty each time the list opens, unless the list was opened by
typing a letter on the field. Text in the box SHALL narrow the choices to
the categories of the form's direction whose name contains that text,
ignoring letter case and accents, and SHALL keep them in listing order. The
list SHALL then be on the first remaining choice whose name starts with the
text, or on the first remaining choice when none starts with it. When no
category matches, the list SHALL say so in place of the choices, and SHALL
be on `Create new…` where that entry is offered and on no entry where it is
not. Emptying the box SHALL bring every choice back. `Create new…` SHALL
NOT be narrowed away by the search. Searching SHALL NOT change the selected
category; only choosing a choice does.

#### Scenario: Narrowing the choices
- **WHEN** the list is open under the `out` direction with the seeded
  categories and the user types `ea`
- **THEN** the choices are `Eating out` and `Health`, in that order
- **AND** the list is on `Eating out`

#### Scenario: A name that starts with the text comes first
- **WHEN** the list is open with the seeded `out` categories and the user
  types `t`
- **THEN** the choices are `Eating out`, `Transport`, `Utilities`,
  `Health`, `Entertainment`, and `Other`
- **AND** the list is on `Transport`

#### Scenario: Case and accents are ignored
- **WHEN** a category named `Café` exists and the user types `CAFE`
- **THEN** `Café` is among the choices

#### Scenario: Nothing matches
- **WHEN** the user types text that no category name of the direction
  contains
- **THEN** the list says that no category matches
- **AND** `Create new…` is still shown and the list is on it

#### Scenario: Emptying the box
- **WHEN** the user deletes everything typed in the search box
- **THEN** every category of the direction is listed again

#### Scenario: Search does not select
- **WHEN** the field shows `Housing`, the user types `t`, and closes the
  list with Escape
- **THEN** the field still shows `Housing`

#### Scenario: Reopening starts empty
- **WHEN** the user closes the list after searching and opens it again
  with a click
- **THEN** the search box is empty and every category of the direction is
  listed

### Requirement: Search box and create entry stay in view
When the choices do not fit in the list's height, only the choices SHALL
scroll. The search box SHALL stay at the top of the list and `Create new…`
SHALL stay at its bottom, both visible wherever the choices are scrolled
and whatever is typed in the search box.

#### Scenario: Long list
- **WHEN** the list is open with more choices than fit and the choices are
  scrolled to the top
- **THEN** the search box and `Create new…` are both visible

#### Scenario: Scrolled to the end
- **WHEN** the user scrolls the choices to the last category
- **THEN** the search box is still visible above the choices
- **AND** `Create new…` is still visible below them

## MODIFIED Requirements

### Requirement: Category list is operable with the keyboard
The category field SHALL be reachable with Tab and SHALL open its list with
Enter, Space, ArrowDown, or ArrowUp, starting on the selected category.
Typing a letter while the list is closed SHALL open it with that letter in
the search box. While the list is open, keyboard focus SHALL be in the
search box and typed characters, spaces included, SHALL go to it. ArrowDown
and ArrowUp SHALL move through the choices the search has left and the
`Create new…` entry, and Home and End SHALL move to the first and the last
of them. Enter SHALL choose the entry the list is on and close the list;
when the list is on no entry, Enter SHALL do nothing. Escape, moving focus
away, or clicking outside SHALL close the list without changing the
selected category. After Enter or Escape, keyboard focus SHALL be on the
category field. The field SHALL expose its label and the selected
category's name to assistive technology, the search box SHALL have an
accessible name, and each choice SHALL announce its name and whether it is
the selected one.

#### Scenario: Choosing with the keyboard
- **WHEN** the category field has focus showing `Housing` and the user
  presses ArrowDown twice and then Enter
- **THEN** the list opens on `Housing`, moves to `Groceries`, and closes
  with `Groceries` selected
- **AND** keyboard focus is on the category field

#### Scenario: Typing a letter
- **WHEN** the category field has focus and the user types `t`
- **THEN** the list is open with `t` in the search box, on `Transport`
- **AND** pressing Enter selects `Transport`

#### Scenario: Space is part of the search
- **WHEN** the list is open and the user types `eating o`
- **THEN** the search box reads `eating o` and the only choice is
  `Eating out`
- **AND** the list stays open until the user presses Enter

#### Scenario: Escape keeps the selection
- **WHEN** the list is open, the user moves to another choice, and presses
  Escape
- **THEN** the list closes and the field still shows the category it
  showed before
- **AND** keyboard focus is on the category field

#### Scenario: Reaching the create entry
- **WHEN** the list is open and the user presses End and then Enter
- **THEN** the modal for creating a category opens

#### Scenario: Enter with nothing to choose
- **WHEN** the list is open in the edit dialog, the search matches no
  category, and the user presses Enter
- **THEN** the list stays open and the field still shows the category it
  showed before

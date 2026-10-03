# dashboard-widgets Specification

## Purpose

Lets the single user choose which graphical widgets of the active cycle
appear on the dashboard, keeps that choice on the server so it follows
them across machines, and pins the movement-entry form so a movement can
always be recorded.

## Requirements

### Requirement: Widget catalog for the active cycle
The dashboard SHALL offer exactly four predefined widgets, each computed
from the currently active cycle's movements: **Net balance** (income,
expense, and net for the cycle), **Total income** (sum of `in`
movements), **Total expenses** (sum of `out` movements), and **Category
distribution** (total per category that has at least one movement in the
cycle, each category shown under its own direction). This change adds no
other widget and no user-defined chart type.

#### Scenario: Widgets reflect the active cycle
- **WHEN** the user records a movement dated inside the active cycle
  while all four widgets are enabled
- **THEN** the totals and the category distribution shown on the
  dashboard include that movement without a manual reload of the page

#### Scenario: Category distribution excludes unused categories
- **WHEN** a category has no movement in the active cycle
- **THEN** that category does not appear in the category distribution
  widget

#### Scenario: Empty cycle renders an empty state
- **WHEN** the active cycle contains no movements
- **THEN** the widgets show zero totals and the category distribution
  shows an explicit empty state rather than an error or a broken chart

#### Scenario: Movements outside the active cycle are ignored
- **WHEN** a movement's date falls outside the active cycle
- **THEN** no widget's value changes

### Requirement: Movement form is always pinned
The movement-entry form SHALL always be visible at the top of the
dashboard and SHALL NOT be hideable, removable, or reorderable through
widget customization.

#### Scenario: Form survives hiding every widget
- **WHEN** the user disables all four widgets
- **THEN** the movement form remains visible and fully functional

#### Scenario: Form placement is independent of selection
- **WHEN** the user changes the widget selection in any way
- **THEN** the movement form stays where it is and keeps working

### Requirement: Customize control toggles widgets
The dashboard SHALL provide a customize control that lists the four
widgets, each with a switch reflecting its current state, and toggling a
switch SHALL immediately show or hide only the corresponding widget. The
control offers no other customization (no reordering, resizing, or
chart-type choice).

#### Scenario: Customize panel reflects current state
- **WHEN** the user opens the customize control
- **THEN** exactly four switches are shown, each on or off matching
  whether that widget is currently displayed

#### Scenario: Toggling off hides one widget only
- **WHEN** the user turns a widget's switch off
- **THEN** that widget disappears from the dashboard
- **AND** every other widget keeps its state

#### Scenario: Toggling back on restores the widget
- **WHEN** the user turns a hidden widget's switch back on
- **THEN** that widget reappears with current active-cycle values

### Requirement: Selection persists across sessions and machines
The system SHALL store the user's widget selection server-side so it is
in effect on any subsequent visit from any browser or machine, and SHALL
show all four widgets enabled until the user changes the selection.

#### Scenario: Reload keeps the selection
- **WHEN** the user disables one widget, then closes and reopens the app
- **THEN** the same widget is still hidden and the others still shown

#### Scenario: Selection follows to another machine
- **WHEN** the user opens the app in a browser they have never used for
  it, after having changed the selection elsewhere
- **THEN** the dashboard shows the last saved selection

#### Scenario: First-ever visit gets defaults
- **WHEN** the user opens the app before any selection has been saved
- **THEN** all four widgets are shown

### Requirement: Widget settings endpoint
The API SHALL expose the widget selection as a key/value mapping of
widget id to boolean. `GET` SHALL return the stored mapping, using the
all-enabled default when nothing is stored yet. `PUT` SHALL accept a
complete mapping that contains exactly the four known widget ids and
boolean values, store it, and return what was stored. A mapping with an
unknown id, a missing id, or a non-boolean value SHALL be rejected with
an error and SHALL leave the stored selection unchanged.

#### Scenario: Get returns defaults before any save
- **WHEN** `GET` is called and no selection has ever been stored
- **THEN** the response maps each of the four widget ids to `true`

#### Scenario: Put replaces the whole selection
- **WHEN** `PUT` is called with all four known ids, one of them `false`
- **THEN** the call succeeds
- **AND** a subsequent `GET` returns exactly that mapping

#### Scenario: Unknown widget id is rejected
- **WHEN** `PUT` is called with a widget id outside the four known ids
- **THEN** the request is rejected with a client error
- **AND** the stored selection is unchanged

#### Scenario: Incomplete or malformed mapping is rejected
- **WHEN** `PUT` is called missing one of the four ids or with a value
  that is not a boolean
- **THEN** the request is rejected with a client error
- **AND** the stored selection is unchanged

### Requirement: Widgets cover the whole active cycle
Every widget SHALL be computed from all movements of the active cycle,
whatever page the ledger shows and however many pages it has. Moving between
ledger pages SHALL NOT change any widget's value.

#### Scenario: More movements than one ledger page
- **WHEN** the active cycle has 45 expense movements and the ledger shows 6
  of them
- **THEN** the total expenses widget states 45 movements and the sum of all
  45
- **AND** the category distribution covers all 45

#### Scenario: Changing the ledger page
- **WHEN** the user moves the ledger from page 1 to page 2
- **THEN** no widget's amount, count, or chart changes

#### Scenario: Category used only on a later page
- **WHEN** the only movement of a category is on the ledger's second page
- **THEN** that category appears in the category distribution while the
  ledger shows the first page

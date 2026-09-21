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

### Requirement: Date defaults to today
The form SHALL start with the date field set to today's date in the
browser's local time zone, so recording a movement dated today needs no
interaction with the date field.

#### Scenario: Fresh load shows today
- **WHEN** the form appears on a fresh load of the app
- **THEN** the date field shows today's local date

### Requirement: Categories filtered by direction
The form SHALL list as category choices only the categories whose
direction matches the currently selected direction: when the direction
is `in`, the choices are exactly the `in` categories; when it is `out`,
the choices are exactly the `out` categories. Categories keep their
listed order within each direction.

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
- **AND** the category field is unselected

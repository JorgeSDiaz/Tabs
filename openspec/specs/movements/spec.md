# movements Specification

## Purpose
Movements are the record of money entering or leaving, grouped into the
user's own financial cycle rather than the calendar month, so a single
person can capture what happened and read back where they stand.

## Requirements

### Requirement: Record a movement
The system SHALL let the user record a movement with an amount, a
direction (`in` or `out`), a category, a date, and an optional note.

#### Scenario: Successful recording
- **WHEN** the user submits a positive amount, a direction, an existing
  category, and a date
- **THEN** the movement is stored and appears in the list for the cycle
  its date falls into

#### Scenario: Zero or negative amount is rejected
- **WHEN** the user submits an amount that is zero or negative
- **THEN** the movement is rejected and no record is created

#### Scenario: Unknown category is rejected
- **WHEN** the user submits a category id that does not exist
- **THEN** the movement is rejected and no record is created

### Requirement: List movements in the active cycle
The system SHALL list every movement whose date falls within the
currently active financial cycle, and SHALL NOT list movements from any
other cycle.

#### Scenario: Movement inside the active cycle is listed
- **WHEN** a movement's date falls on or after the active cycle's start
  and before its end
- **THEN** the movement appears in the active cycle's list

#### Scenario: Movement from a past cycle is excluded
- **WHEN** a movement's date falls before the active cycle's start
- **THEN** the movement does not appear in the active cycle's list

#### Scenario: Empty cycle
- **WHEN** no movement has a date within the active cycle
- **THEN** the list is empty and the balance is zero on both sides

### Requirement: Delete a movement
The system SHALL let the user delete a movement they recorded.

#### Scenario: Deleted movement disappears
- **WHEN** the user deletes a movement that exists
- **THEN** it no longer appears in any list and no longer counts toward
  any cycle's balance

### Requirement: Cycle balance
The system SHALL report, for the active cycle, the total amount in, the
total amount out, and the net (in minus out).

#### Scenario: Totals reflect recorded movements
- **WHEN** the active cycle contains one or more movements
- **THEN** total in equals the sum of `in` movements, total out equals
  the sum of `out` movements, and net equals total in minus total out

### Requirement: Financial cycle boundaries
The system SHALL group movements into cycles using a fixed boundary day
each month: a date on or after the boundary day belongs to the next
cycle; a date before the boundary day belongs to the current cycle. When
a calendar month is shorter than the boundary day, the boundary clamps
to that month's last day.

#### Scenario: Date on the boundary day starts the next cycle
- **WHEN** a movement is dated on the boundary day of a month
- **THEN** it belongs to the cycle that starts on that date, not the
  cycle that ends on it

#### Scenario: Date the day before the boundary stays in the current cycle
- **WHEN** a movement is dated one day before the boundary day
- **THEN** it belongs to the cycle currently active on that date

#### Scenario: Short month clamps the boundary
- **WHEN** the boundary day does not exist in a given calendar month
  (for example, a boundary day of 30 in February)
- **THEN** that month's cycle boundary falls on the last day of that
  month instead

### Requirement: Active cycle resolution
The system SHALL resolve the currently active cycle from the current
date and time converted to a configured time zone, not the server's
local or UTC time directly. The boundary day and time zone used for
this resolution are seeded configuration, not user-editable in this
change.

#### Scenario: Time zone determines the active cycle near a boundary
- **WHEN** it is 22:00 on September 29 in the configured time zone
  (03:00 UTC on September 30)
- **THEN** the active cycle is still the one that started on August 30,
  not the cycle starting September 30

### Requirement: Seeded categories
The system SHALL provide a fixed set of categories, seeded at setup, that
movements can be recorded against. This change does not let the user
create, rename, or deactivate categories.

#### Scenario: Seeded categories are available for recording
- **WHEN** the user records a movement
- **THEN** they can choose from the seeded categories

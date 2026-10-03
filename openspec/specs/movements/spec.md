# movements Specification

## Purpose
Movements are the record of money entering or leaving, grouped into the
user's own financial cycle rather than the calendar month, so a single
person can capture what happened and read back where they stand.

## Requirements

### Requirement: Record a movement
The system SHALL let the user record a movement with an amount, a
direction (`in` or `out`), a category whose direction matches the
movement's, a date, and an optional note.

#### Scenario: Successful recording
- **WHEN** the user submits a positive amount, a direction, an existing
  category whose direction matches it, and a date
- **THEN** the movement is stored and appears in the list for the cycle
  its date falls into

#### Scenario: Zero or negative amount is rejected
- **WHEN** the user submits an amount that is zero or negative
- **THEN** the movement is rejected and no record is created

#### Scenario: Unknown category is rejected
- **WHEN** the user submits a category id that does not exist
- **THEN** the movement is rejected and no record is created

#### Scenario: Category of the other direction is rejected
- **WHEN** the user submits a movement whose direction differs from the
  direction of its category
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

### Requirement: Edit a movement
The system SHALL let the user replace the amount, direction, category, date,
and note of a movement they recorded, applying the same rules as recording a
movement. An edit SHALL NOT change the movement's identity or the time it was
created. A rejected edit SHALL leave the movement exactly as it was.

#### Scenario: Successful edit
- **WHEN** the user submits a positive amount, a direction, an existing
  category whose direction matches it, and a date for a movement that exists
- **THEN** the movement holds the submitted values
- **AND** it appears in the list for the cycle its date falls into

#### Scenario: Creation time is preserved
- **WHEN** a movement created on September 16 is edited on September 20
- **THEN** the movement still reports September 16 as its creation time
- **AND** it keeps the same id

#### Scenario: Zero or negative amount is rejected
- **WHEN** the user submits an amount that is zero or negative for an
  existing movement
- **THEN** the edit is rejected and the movement is unchanged

#### Scenario: Unknown category is rejected
- **WHEN** the user submits a category id that does not exist
- **THEN** the edit is rejected and the movement is unchanged

#### Scenario: Category of the other direction is rejected
- **WHEN** the user submits a direction that differs from the direction of
  the submitted category
- **THEN** the edit is rejected and the movement is unchanged

#### Scenario: Unknown movement
- **WHEN** the user submits an edit for a movement id that does not exist
- **THEN** the edit is reported as not found and no movement is created

#### Scenario: Re-dated movement changes cycle
- **WHEN** a movement dated inside the active cycle is edited to a date
  before the active cycle's start
- **THEN** it no longer appears in the active cycle's list
- **AND** it no longer counts toward the active cycle's balance

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
The system SHALL provide a fixed set of categories, seeded at setup,
each carrying its own direction (`in` or `out`), that movements can be
recorded against. This change does not let the user create, rename, or
deactivate categories.

#### Scenario: Seeded categories are available for recording
- **WHEN** the user records a movement
- **THEN** they can choose from the seeded categories

#### Scenario: Seed covers both directions
- **WHEN** setup has run
- **THEN** every seeded category has direction `in` or `out`, with
  Income, Salary, Bonus, Reimbursement, and Gift as `in` and the nine
  expense categories as `out`

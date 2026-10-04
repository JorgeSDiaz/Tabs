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
The system SHALL list the movements whose date falls within the currently
active financial cycle, and SHALL NOT list movements from any other cycle.
The list SHALL be ordered by date, newest first, and among movements of the
same date by most recently recorded first.

The list SHALL be served one page at a time, 6 movements per page. Every
page SHALL report its page number, the number of pages, and the total number
of movements in the active cycle. The first page SHALL be served when no page
is asked for. A page number beyond the last page SHALL be answered with the
last page. A page number that is not a positive whole number SHALL be
rejected.

#### Scenario: Movement inside the active cycle is listed
- **WHEN** a movement's date falls on or after the active cycle's start
  and before its end
- **THEN** the movement appears in the active cycle's list

#### Scenario: Movement from a past cycle is excluded
- **WHEN** a movement's date falls before the active cycle's start
- **THEN** the movement does not appear on any page of the active cycle's
  list
- **AND** it does not count toward the reported total

#### Scenario: Empty cycle
- **WHEN** no movement has a date within the active cycle
- **THEN** the list is empty, reports zero movements and one page, and the
  balance is zero on both sides

#### Scenario: First page by default
- **WHEN** the active cycle has 45 movements and the list is requested
  without a page
- **THEN** the 6 newest movements are returned
- **AND** the response reports page 1 of 8 and a total of 45

#### Scenario: Pages cover every movement once
- **WHEN** the active cycle has 45 movements and pages 1 to 8 are
  requested
- **THEN** pages 1 to 7 hold 6 movements each and page 8 holds 3
- **AND** every movement of the cycle appears on exactly one of them

#### Scenario: Same-day movements keep a stable order
- **WHEN** three movements are dated the same day
- **THEN** the one recorded last is listed first
- **AND** requesting the same page again returns them in the same order

#### Scenario: Page beyond the last
- **WHEN** the active cycle has 45 movements and page 12 is requested
- **THEN** the last page is returned and the response reports page 8

#### Scenario: Invalid page is rejected
- **WHEN** the list is requested with page 0, a negative page, or a page
  that is not a number
- **THEN** the request is rejected with a client error and no movements are
  returned

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

### Requirement: Cycle category totals
The system SHALL report, for the active cycle, each category that has at
least one movement dated in the cycle, with the category's direction, the sum
of its movements' amounts, and the number of its movements. A category with
no movement in the active cycle SHALL NOT be reported. The totals SHALL agree
with the cycle balance: the `in` categories sum to the total in and the `out`
categories sum to the total out.

#### Scenario: Totals and counts per category
- **WHEN** the active cycle has three Groceries movements of 100, 200, and
  300 and one Salary movement of 5,000
- **THEN** Groceries is reported as `out` with a total of 600 and 3
  movements
- **AND** Salary is reported as `in` with a total of 5,000 and 1 movement

#### Scenario: Unused category is not reported
- **WHEN** a category has no movement dated in the active cycle
- **THEN** it does not appear in the category totals

#### Scenario: Totals agree with the balance
- **WHEN** the active cycle contains movements in several categories
- **THEN** the sum of the `out` category totals equals the balance's total
  out, and the sum of the `in` category totals equals its total in

#### Scenario: Empty cycle has no category totals
- **WHEN** no movement has a date within the active cycle
- **THEN** the category totals are an empty list

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

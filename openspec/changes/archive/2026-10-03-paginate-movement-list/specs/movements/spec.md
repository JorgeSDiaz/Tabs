# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

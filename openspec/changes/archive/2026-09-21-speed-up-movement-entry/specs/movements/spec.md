# Spec Delta

## MODIFIED Requirements

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

# Spec Delta

## ADDED Requirements

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

# Spec Delta

## Purpose

Owns the category set itself: the standard categories seeded at setup and
the rules for creating an additional category when the seed does not cover
a real movement.

## ADDED Requirements

### Requirement: Seeded category set
The system SHALL provide a fixed set of categories, seeded at setup, each
carrying its own direction (`in` or `out`): `Salary` and `Gift` as `in`,
and `Housing`, `Groceries`, `Eating out`, `Transport`, `Utilities`,
`Health`, `Entertainment`, and `Other` as `out`. This change does not let
the user rename or delete a category, seeded or created.

#### Scenario: Seed covers both directions
- **WHEN** setup has run on a fresh database
- **THEN** the listed categories are exactly the ten above, each with its
  stated direction, in sort order

#### Scenario: Redundant and over-broad seeds are gone
- **WHEN** setup has run on a fresh database
- **THEN** no category named `Income`, `Bonus`, `Reimbursement`,
  `Subscriptions`, or `Shopping` exists

### Requirement: List categories
The system SHALL return every category, seeded or user-created, in sort
order, so the movement form and the movement list can resolve a category
by id.

#### Scenario: Created categories appear in the list
- **WHEN** a category has been created by the user
- **THEN** it appears in the listing alongside the seeded ones

### Requirement: Create a category
The system SHALL let the user create a category from a name and a
direction (`in` or `out`), and SHALL return the created category with its
id so it can be referenced immediately by a movement. A created category
sorts after the seeded ones within its direction.

#### Scenario: Successful creation
- **WHEN** the user creates a category with a non-empty name and a valid
  direction
- **THEN** the category is stored and returned with a new id
- **AND** a movement of that direction can reference it right away

#### Scenario: Blank name is rejected
- **WHEN** the user creates a category whose name is empty or whitespace
- **THEN** the request is rejected and no category is created

#### Scenario: Duplicate name is rejected
- **WHEN** the user creates a category whose name equals an existing
  category's name
- **THEN** the request is rejected with a conflict indication and no
  category is created

#### Scenario: Invalid direction is rejected
- **WHEN** the user creates a category with a direction other than `in`
  or `out`
- **THEN** the request is rejected and no category is created

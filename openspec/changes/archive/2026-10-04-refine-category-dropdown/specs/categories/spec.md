# Spec Delta

## MODIFIED Requirements

### Requirement: List categories
The system SHALL return every category, seeded or user-created, in listing
order, so the movement form and the movement list can resolve a category
by id. Within a direction, categories SHALL list in the order they were
seeded and then created, except that the direction's catch-all category
SHALL list last. `Other` is the catch-all of the `out` direction; the `in`
direction has none.

#### Scenario: Created categories appear in the list
- **WHEN** a category has been created by the user
- **THEN** it appears in the listing alongside the seeded ones

#### Scenario: Catch-all lists last
- **WHEN** the user has created `out` categories after setup
- **THEN** `Other` is the last `out` category in the listing

### Requirement: Create a category
The system SHALL let the user create a category from a name and a
direction (`in` or `out`), and SHALL return the created category with its
id so it can be referenced immediately by a movement. A created category
SHALL list after every other category of its direction except the
catch-all, which stays last.

#### Scenario: Successful creation
- **WHEN** the user creates a category with a non-empty name and a valid
  direction
- **THEN** the category is stored and returned with a new id
- **AND** a movement of that direction can reference it right away

#### Scenario: Created expense category lists above the catch-all
- **WHEN** the user creates the `out` category `Weekend trips`
- **THEN** it lists after `Entertainment` and after any `out` category
  created earlier
- **AND** it lists before `Other`

#### Scenario: Created income category lists last
- **WHEN** the user creates an `in` category
- **THEN** it lists after `Gift` and after any `in` category created
  earlier

#### Scenario: Categories created before this rule
- **WHEN** `out` categories were created while created categories still
  listed after `Other`
- **THEN** they list before `Other`, in the order they were created

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

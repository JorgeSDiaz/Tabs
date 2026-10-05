# Spec Delta

## MODIFIED Requirements

### Requirement: Seeded category set
The system SHALL provide a set of categories seeded at setup, each
carrying its own direction (`in` or `out`): `Salary` and `Gift` as `in`,
and `Housing`, `Groceries`, `Eating out`, `Transport`, `Utilities`,
`Health`, `Entertainment`, and `Other` as `out`. Each seeded category
SHALL have a color, and an icon that depicts it; `Other` SHALL have the
generic icon. The seeded set is a starting point: a seeded category can be
edited and deleted under the same rules as a created one.

#### Scenario: Seed covers both directions
- **WHEN** setup has run on a fresh database
- **THEN** the listed categories are exactly the ten above, each with its
  stated direction, in sort order

#### Scenario: Redundant and over-broad seeds are gone
- **WHEN** setup has run on a fresh database
- **THEN** no category named `Income`, `Bonus`, `Reimbursement`,
  `Subscriptions`, or `Shopping` exists

#### Scenario: Seeded categories are styled
- **WHEN** setup has run on a fresh database
- **THEN** every seeded category has a color and an icon
- **AND** the seven `out` categories other than `Other` have seven
  different colors

## ADDED Requirements

### Requirement: Category carries a color and an icon
Every category SHALL have a color, written as a six-digit hexadecimal
color, and an icon, identified by the name of an icon in the app's icon
set. The listing and every created or edited category SHALL include both.
Creating a category SHALL require both. A color that is not a six-digit
hexadecimal color, or a blank icon, SHALL be rejected.

#### Scenario: Listing includes color and icon
- **WHEN** the categories are listed
- **THEN** every category states its color and its icon

#### Scenario: Created with a color and an icon
- **WHEN** the user creates a category with the color `#6b8cff` and the
  icon `plane`
- **THEN** the created category is returned with that color and that icon

#### Scenario: Invalid color is rejected
- **WHEN** the user creates or edits a category with the color `blue` or
  `#12345`
- **THEN** the request is rejected and nothing is stored

#### Scenario: Categories that existed before colors were stored
- **WHEN** the system is updated on a database that already holds seeded
  and user-created categories
- **THEN** every category has a color and an icon afterwards
- **AND** the seeded ones have their seeded color and icon, and the
  user-created ones have the generic icon

### Requirement: Edit a category
The system SHALL let the user replace a category's name, color, and icon,
and SHALL return the category as stored. The name SHALL be trimmed of
surrounding whitespace, SHALL NOT be blank, and SHALL NOT equal another
category's name. A category's direction SHALL NOT change, and neither
SHALL its place in the listing: a renamed catch-all stays the catch-all.
Movements SHALL keep referring to an edited category. A rejected edit
SHALL leave the category as it was.

#### Scenario: Successful edit
- **WHEN** the user renames `Eating out` to `Restaurants` and gives it
  another color and icon
- **THEN** the category is returned with the new name, color, and icon
- **AND** it keeps its id, its direction, and its place in the listing
- **AND** the movements recorded against it now show `Restaurants`

#### Scenario: Keeping the same name
- **WHEN** the user changes only a category's color and saves it with its
  current name
- **THEN** the edit is stored

#### Scenario: Renamed catch-all still lists last
- **WHEN** the user renames `Other` to `Misc`
- **THEN** `Misc` is the last `out` category in the listing
- **AND** a category created afterwards lists before it

#### Scenario: Blank name is rejected
- **WHEN** the user edits a category's name to empty or whitespace
- **THEN** the edit is rejected and the category is unchanged

#### Scenario: Duplicate name is rejected
- **WHEN** the user renames a category to the name of another category
- **THEN** the edit is rejected with a conflict indication and the
  category is unchanged

#### Scenario: Unknown category
- **WHEN** the user edits a category id that does not exist
- **THEN** the edit is reported as not found and no category is created

### Requirement: Delete a category
The system SHALL let the user delete a category that no movement refers
to. It SHALL refuse, stating the reason, to delete a category that any
movement refers to — in the active cycle or any other — the catch-all of a
direction, or the only category left in its direction. A refused deletion
SHALL leave the category and every movement as they were.

#### Scenario: Unused category is deleted
- **WHEN** the user deletes a category that no movement refers to
- **THEN** the category no longer appears in the listing
- **AND** its name can be used for a new category

#### Scenario: Category with movements is kept
- **WHEN** the user deletes a category that a movement in an earlier cycle
  refers to
- **THEN** the deletion is refused with a conflict indication that says
  the category has movements
- **AND** the category and the movement are unchanged

#### Scenario: Catch-all is kept
- **WHEN** the user deletes `Other`, or the category `Other` was renamed
  to
- **THEN** the deletion is refused with a conflict indication that says it
  is the catch-all

#### Scenario: Last category of a direction is kept
- **WHEN** only one `in` category is left and the user deletes it
- **THEN** the deletion is refused with a conflict indication that says a
  direction needs at least one category

#### Scenario: Unknown category
- **WHEN** the user deletes a category id that does not exist
- **THEN** the deletion is reported as not found

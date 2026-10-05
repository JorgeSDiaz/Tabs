# Spec Delta

## ADDED Requirements

### Requirement: Category created from the form is styled automatically
A category created from the entry form's `Create new…` modal SHALL get
the color of the fixed color set that the fewest categories use — the
earliest such color in the set when several tie — and SHALL get the
generic icon. The modal SHALL keep asking only for the name. The
category's icon and color SHALL be changeable afterwards on the
categories screen.

#### Scenario: First unused color
- **WHEN** ten colors of the fixed set are in use and the user creates
  a category from the form
- **THEN** the new category has the first of the two unused colors and
  the generic icon
- **AND** the category field shows it with that marker

#### Scenario: Every color in use
- **WHEN** every color of the fixed set is used by exactly one category
  and the user creates a category from the form
- **THEN** the new category has the first color of the fixed set
- **AND** the next category created gets the second color

#### Scenario: Restyled later
- **WHEN** the user changes that category's icon and color on the
  categories screen and returns to the dashboard
- **THEN** the entry form's list shows the category with its new marker

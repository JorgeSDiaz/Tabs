# Spec Delta

## MODIFIED Requirements

### Requirement: Entry form shows its choices directly
The movement-entry form SHALL offer the movement type as two options that are both visible at once, with the current one marked as selected. The amount SHALL be the most prominent field of the form. The category control SHALL show the icon marker of the currently selected category, and its opened list SHALL show the icon marker of every choice. Each marker SHALL use the same color that category has in the chart and the ledger, and the neutral color when the category has none.

#### Scenario: Type is one step
- **WHEN** the form is shown
- **THEN** both movement types are visible and the selected one is marked
- **AND** choosing the other type takes a single click, tap, or key press

#### Scenario: Selected category shows its color
- **WHEN** the user selects a category that has a color in the category chart
- **THEN** the category control shows that category's icon marker in that same color next to the category name

#### Scenario: Choices show their markers
- **WHEN** the user opens the category list
- **THEN** every choice shows its icon marker next to its name
- **AND** a category with a color in the category chart uses that color, and any other category uses the neutral color

#### Scenario: No category selected
- **WHEN** no category is selected because the categories have not loaded yet
- **THEN** the category control shows its loading text and a neutral marker

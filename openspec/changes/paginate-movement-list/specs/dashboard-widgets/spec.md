# Spec Delta

## ADDED Requirements

### Requirement: Widgets cover the whole active cycle
Every widget SHALL be computed from all movements of the active cycle,
whatever page the ledger shows and however many pages it has. Moving between
ledger pages SHALL NOT change any widget's value.

#### Scenario: More movements than one ledger page
- **WHEN** the active cycle has 45 expense movements and the ledger shows 20
  of them
- **THEN** the total expenses widget states 45 movements and the sum of all
  45
- **AND** the category distribution covers all 45

#### Scenario: Changing the ledger page
- **WHEN** the user moves the ledger from page 1 to page 2
- **THEN** no widget's amount, count, or chart changes

#### Scenario: Category used only on a later page
- **WHEN** the only movement of a category is on the ledger's second page
- **THEN** that category appears in the category distribution while the
  ledger shows the first page

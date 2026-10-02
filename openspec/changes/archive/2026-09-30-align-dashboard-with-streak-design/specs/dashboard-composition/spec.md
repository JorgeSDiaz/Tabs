## MODIFIED Requirements

### Requirement: Dashboard has an explicit visual hierarchy
The dashboard SHALL present a compact identity and active-cycle context header, the always-visible movement-entry form as the first functional region, optional analytics, and a named movement ledger. The cycle's balance SHALL be presented by the net balance, total income, and total expense widgets, and the dashboard SHALL NOT repeat those figures in a separate region. The net balance SHALL be distinguished from subordinate income and expense values through typography and grouping. The header SHALL state the active cycle as the current day number out of the cycle's length, and as a date range whose last date is the cycle's last day. On wide viewports the movement-entry form SHALL span the full content width as a single row of fields, the analytics SHALL share an asymmetric grid in which the category chart is wider than any scalar widget, and the ledger SHALL occupy its own column beside them.

#### Scenario: Desktop composition
- **WHEN** the dashboard is viewed at a viewport at least 1024 CSS pixels wide with all widgets enabled
- **THEN** entry precedes analytics and spans the full content width
- **AND** analytics use a multi-column layout with chart widgets wider than individual scalar widgets
- **AND** movements appear in a distinct named ledger section in a column beside the analytics

#### Scenario: All widgets are hidden
- **WHEN** the user disables all four widgets
- **THEN** the entry form, customization control, and ledger remain available
- **AND** the analytics layout reserves no empty widget slots

#### Scenario: Figures appear once
- **WHEN** the dashboard is shown with the net balance, total income, and total expense widgets enabled
- **THEN** the cycle's net, income, and expense totals each appear in their widget and in no other region of the dashboard

#### Scenario: Cycle context is readable
- **WHEN** the active cycle starts on September 30 and the next cycle starts on October 30, and today is September 30
- **THEN** the header states day 1 of 30
- **AND** the header shows the range from September 30 to October 29 with month names rather than ISO dates

#### Scenario: One screen on a laptop
- **WHEN** the dashboard is viewed at 1280 by 800 CSS pixels with all four widgets enabled and no more than six entries in the category legend
- **THEN** the header, the entry form, every widget, and the first ledger rows are visible without scrolling the page

### Requirement: Composition responds to available space
The dashboard SHALL adapt to narrow viewports and browser zoom without horizontal page scrolling, clipped controls, or overlapping financial values. Widgets SHALL retain catalog reading order and reflow when selection changes. A monetary amount SHALL never be split across lines; when an amount is too long for its container it SHALL be shown at a smaller size instead.

#### Scenario: Phone viewport
- **WHEN** the dashboard is viewed at 375 CSS pixels wide
- **THEN** functional regions use a single-column flow
- **AND** all form fields, chart information, amounts, and movement actions remain readable and operable

#### Scenario: Zoom and long content
- **WHEN** the user views the dashboard at 200 percent zoom with long category names, notes, and large monetary amounts
- **THEN** text wraps or the layout reflows without obscuring controls or causing horizontal page scrolling

#### Scenario: Widget selection changes
- **WHEN** the user hides or restores a widget
- **THEN** visible widgets retain catalog order and flow into the available grid space without a placeholder for the hidden widget

#### Scenario: Very large amount in a narrow widget
- **WHEN** a total of 12,333,333,333 is shown in the total income widget on a 1280 pixel wide viewport
- **THEN** the amount stays on one line and inside the widget
- **AND** it remains at least as large as body text

### Requirement: Data states retain the dashboard composition
The dashboard SHALL present contextual loading, empty, and error states without inventing financial data or making entry dependent on widget selection. Existing data-loading and mutation behavior SHALL remain the source of displayed values.

#### Scenario: Empty cycle
- **WHEN** the loaded active cycle has no movements
- **THEN** the net balance and total widgets show actual zero values
- **AND** the ledger and category chart show purposeful empty-state messages
- **AND** movement entry remains usable

#### Scenario: Loading or failure
- **WHEN** dashboard data is loading or a request fails
- **THEN** the corresponding loading or error message is readable in its page or component region
- **AND** unavailable values are not replaced with fabricated financial totals

#### Scenario: Initial load differs from an empty cycle
- **WHEN** movements have not finished their initial request
- **THEN** the ledger indicates loading rather than claiming there are no movements
- **AND** subsequent refreshes retain previously loaded content while indicating progress

## ADDED Requirements

### Requirement: Monetary amounts share one format
Every monetary amount on the dashboard SHALL be shown with a currency symbol and thousands separators, SHALL show cents only when they are not zero, and SHALL use the same format in the widgets, the ledger, and the entry form's feedback. Expenses SHALL carry a minus sign and income a plus sign wherever the two directions appear together.

#### Scenario: Whole amounts drop the cents
- **WHEN** an amount of 2,650,150.00 is shown
- **THEN** it reads $2,650,150

#### Scenario: Cents are kept when present
- **WHEN** an amount of 1,234.50 is shown
- **THEN** it reads $1,234.50

#### Scenario: Signs in the ledger
- **WHEN** the ledger lists an expense of 184,300 and an income of 250,000
- **THEN** they read −$184,300 and +$250,000

### Requirement: Entry form shows its choices directly
The movement-entry form SHALL offer the movement type as two options that are both visible at once, with the current one marked as selected. The amount SHALL be the most prominent field of the form. The category control SHALL show the color marker of the currently selected category, using the same color that category has in the chart and the ledger.

#### Scenario: Type is one step
- **WHEN** the form is shown
- **THEN** both movement types are visible and the selected one is marked
- **AND** choosing the other type takes a single click, tap, or key press

#### Scenario: Selected category shows its color
- **WHEN** the user selects a category that has a color in the category chart
- **THEN** the category control shows that same color marker next to the category name

#### Scenario: No category selected
- **WHEN** no category is selected
- **THEN** the category control shows its placeholder and a neutral marker

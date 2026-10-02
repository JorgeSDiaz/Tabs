## ADDED Requirements

### Requirement: Dashboard has an explicit visual hierarchy
The dashboard SHALL present a compact identity and active-cycle context header, the always-visible movement-entry form as the first functional region, a cycle overview, optional analytics, and a named movement ledger. The overview SHALL distinguish net balance from subordinate income and expense values through typography and grouping.

#### Scenario: Desktop composition
- **WHEN** the dashboard is viewed at a viewport at least 1024 CSS pixels wide with all widgets enabled
- **THEN** entry precedes overview and analytics
- **AND** analytics use a multi-column layout with chart widgets wider than individual scalar widgets
- **AND** movements appear in a distinct named ledger section

#### Scenario: All widgets are hidden
- **WHEN** the user disables all four widgets
- **THEN** the entry form, cycle overview, customization control, and ledger remain available
- **AND** the analytics layout reserves no empty widget slots

### Requirement: Composition responds to available space
The dashboard SHALL adapt to narrow viewports and browser zoom without horizontal page scrolling, clipped controls, or overlapping financial values. Widgets SHALL retain catalog reading order and reflow when selection changes.

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

### Requirement: Interface uses a coherent and accessible visual system
The dashboard SHALL use consistent typography, spacing, surfaces, financial number alignment, and primary/secondary action styling across the form, overview, widgets, ledger, and dialogs. Both supported system color preferences SHALL maintain readable content. Financial direction SHALL be conveyed by labels or signs as well as color.

#### Scenario: Keyboard entry and dialogs
- **WHEN** a user records a movement and uses category creation or widget customization with the keyboard
- **THEN** controls expose accessible labels and visible focus
- **AND** existing autofocus, post-save focus, and native modal keyboard behavior remain functional

#### Scenario: Color preference
- **WHEN** the system preference changes between light and dark
- **THEN** text, inputs, charts, tooltips, dialog surfaces, and focus indicators remain readable with the corresponding palette

### Requirement: Data states retain the dashboard composition
The dashboard SHALL present contextual loading, empty, and error states without inventing financial data or making entry dependent on widget selection. Existing data-loading and mutation behavior SHALL remain the source of displayed values.

#### Scenario: Empty cycle
- **WHEN** the loaded active cycle has no movements
- **THEN** the overview and scalar widgets show actual zero values
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

### Requirement: Analytics remain readable without hover
Charts SHALL share the interface palette and provide exact financial values and direction labels accessible without hovering. Visible widget combinations SHALL use available row space without changing catalog reading order.

#### Scenario: Touch or keyboard chart reading
- **WHEN** the user reads analytics without a pointing device
- **THEN** exact values and income/expense directions are available as text

#### Scenario: Partial widget selection
- **WHEN** any subset of the four widgets is enabled
- **THEN** the visible widgets expand into available row space without empty reserved cells

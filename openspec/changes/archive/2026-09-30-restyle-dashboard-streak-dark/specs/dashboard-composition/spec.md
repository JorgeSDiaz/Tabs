## MODIFIED Requirements

### Requirement: Dashboard has an explicit visual hierarchy
The dashboard SHALL present a compact identity and active-cycle context header, the always-visible movement-entry form as the first functional region, a cycle overview, optional analytics, and a named movement ledger. The overview SHALL distinguish net balance from subordinate income and expense values through typography and grouping. On wide viewports the movement-entry form SHALL span the full content width as a single row of fields, the overview and analytics SHALL share an asymmetric grid in which the category chart is wider than any scalar widget, and the ledger SHALL occupy its own column beside them.

#### Scenario: Desktop composition
- **WHEN** the dashboard is viewed at a viewport at least 1024 CSS pixels wide with all widgets enabled
- **THEN** entry precedes overview and analytics and spans the full content width
- **AND** analytics use a multi-column layout with chart widgets wider than individual scalar widgets
- **AND** movements appear in a distinct named ledger section in a column beside the overview and analytics

#### Scenario: All widgets are hidden
- **WHEN** the user disables all four widgets
- **THEN** the entry form, cycle overview, customization control, and ledger remain available
- **AND** the analytics layout reserves no empty widget slots

### Requirement: Interface uses a coherent and accessible visual system
The dashboard SHALL use consistent typography, spacing, surfaces, financial number alignment, and primary/secondary action styling across the form, overview, widgets, ledger, and dialogs. The dashboard SHALL render a single dark theme regardless of the operating system's color preference. Money coming in SHALL use one fixed color and money going out a different fixed color, and neither SHALL be the color reserved for errors. Financial direction SHALL be conveyed by labels or signs as well as color. Normal text SHALL keep a contrast ratio of at least 4.5:1 against its background, including text placed on colored surfaces.

#### Scenario: Keyboard entry and dialogs
- **WHEN** a user records a movement and uses category creation or widget customization with the keyboard
- **THEN** controls expose accessible labels and visible focus
- **AND** existing autofocus, post-save focus, and native modal keyboard behavior remain functional

#### Scenario: Color preference
- **WHEN** the operating system preference is light or dark
- **THEN** the dashboard renders the same dark theme
- **AND** native controls such as select menus and date pickers also render with dark surfaces

#### Scenario: Direction readable without color
- **WHEN** an income and an expense of the same amount are shown side by side
- **THEN** each carries a sign or label that identifies its direction without relying on its color

#### Scenario: Contrast on colored surfaces
- **WHEN** text is shown on a colored surface such as the income card, the expense card, or the primary action
- **THEN** that text meets a contrast ratio of at least 4.5:1 against the surface

### Requirement: Analytics remain readable without hover
Charts SHALL share the interface palette and provide exact financial values and direction labels accessible without hovering. Visible widget combinations SHALL use available row space without changing catalog reading order. The category distribution SHALL be drawn as a grid of 100 equal squares in which each category fills a number of squares proportional to its share of the cycle's expenses. The five largest expense categories SHALL each receive a distinct palette color, and any remaining categories SHALL be grouped under one neutral color. The same category SHALL use the same color in the chart and in the ledger.

#### Scenario: Touch or keyboard chart reading
- **WHEN** the user reads analytics without a pointing device
- **THEN** exact values and income/expense directions are available as text

#### Scenario: Partial widget selection
- **WHEN** any subset of the four widgets is enabled
- **THEN** the visible widgets expand into available row space without empty reserved cells

#### Scenario: Squares add up to one hundred
- **WHEN** the category distribution is shown for a cycle with expenses
- **THEN** exactly 100 squares are drawn and each category's square count is its rounded share, adjusted so the total stays 100
- **AND** the legend lists each shown category with its exact percentage and amount as text

#### Scenario: Many categories
- **WHEN** the cycle has expenses in more than five categories
- **THEN** the five largest keep their own colors and the rest are combined into one neutral legend entry that states how many categories it holds

#### Scenario: Chart and ledger colors agree
- **WHEN** a category appears both in the distribution chart and in a ledger row
- **THEN** the ledger row's category marker uses the same color as that category in the chart

## ADDED Requirements

### Requirement: Scalar totals show movement counts
The total income and total expense widgets SHALL show, next to their amount, the number of movements behind that total as text and as one small mark per movement. When a total has more movements than marks fit in the widget, the widget SHALL show as many marks as fit followed by a textual indication of how many are not drawn.

#### Scenario: Count matches movements
- **WHEN** the active cycle has 2 income movements and 39 expense movements
- **THEN** the income widget states 2 movements and shows 2 marks
- **AND** the expense widget states 39 movements and shows 39 marks

#### Scenario: More movements than fit
- **WHEN** a total has more movements than the widget can draw marks for
- **THEN** the widget shows the marks that fit and a "+N" indication for the remainder
- **AND** the stated movement count remains the exact total

#### Scenario: No movements in a direction
- **WHEN** the active cycle has no income movements
- **THEN** the income widget shows a zero amount, states 0 movements, and draws no marks

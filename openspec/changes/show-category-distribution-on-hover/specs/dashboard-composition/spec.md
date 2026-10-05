# Spec Delta

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
- **WHEN** the dashboard is viewed at 1280 by 800 CSS pixels with all four widgets enabled and no block's detail shown in the category distribution
- **THEN** the header, the entry form, every widget, and the first ledger rows are visible without scrolling the page

### Requirement: Analytics remain readable without hover
Charts SHALL share the interface palette and SHALL make exact financial values and direction labels available as text by keyboard and by touch, so that hovering with a pointer is never the only way to read them. Visible widget combinations SHALL use available row space without changing catalog reading order. The category distribution SHALL be drawn as a grid of 100 equal squares in which each category fills a number of squares proportional to its share of the cycle's expenses. The five largest expense categories SHALL each receive a distinct palette color, and any remaining categories SHALL be grouped under one neutral color. The same category SHALL use the same color in the chart and in the ledger.

The category distribution SHALL NOT list its expense categories next to the grid. Each category's squares SHALL form one block, and the widget SHALL show the detail of one block at a time: the category's name, its exact percentage of the cycle's expenses, and its amount. A block's detail SHALL be shown while the block is hovered with a pointer or focused with the keyboard, and when the block is tapped or clicked. A tapped or clicked block SHALL keep its detail shown until that block is tapped or clicked again or another block is chosen. The detail of the neutral block SHALL state how many categories it groups and SHALL name each of them with its percentage of the cycle's expenses. A category whose share is too small to receive a square SHALL have no block, and the widget SHALL NOT show a detail for it.

While a block's detail is shown, that block SHALL be distinguished from the other blocks by more than its color. While no block's detail is shown, the widget SHALL state how to reveal one. Each block SHALL be a single keyboard focus stop with visible focus, and its accessible name SHALL carry the same detail that is shown for it.

#### Scenario: Touch or keyboard chart reading
- **WHEN** the user reads analytics without a pointing device
- **THEN** exact values and income/expense directions are available as text
- **AND** each expense category's name, percentage, and amount can be read by focusing or tapping its block

#### Scenario: Partial widget selection
- **WHEN** any subset of the four widgets is enabled
- **THEN** the visible widgets expand into available row space without empty reserved cells

#### Scenario: Squares add up to one hundred
- **WHEN** the category distribution is shown for a cycle with expenses
- **THEN** exactly 100 squares are drawn and each category's square count is its rounded share, adjusted so the total stays 100
- **AND** no list of expense categories is shown next to the grid

#### Scenario: No block chosen
- **WHEN** the category distribution is shown and no block is hovered, focused, or selected
- **THEN** the widget shows a short instruction for revealing a block's detail
- **AND** no expense category's name, percentage, or amount is shown

#### Scenario: Hovering a block
- **WHEN** Housing holds 33.8 percent of the cycle's expenses with a total of 1,264,550 and the pointer rests on any square of the Housing block
- **THEN** the widget shows Housing, 33.8%, and $1,264,550
- **AND** the Housing block stands out from the other blocks
- **AND** the detail is no longer shown once the pointer leaves the grid

#### Scenario: Tapping a block
- **WHEN** the user taps any square of the Credit block on a touch screen
- **THEN** the widget shows Credit's name, percentage, and amount, and keeps showing them after the finger lifts
- **AND** tapping another block shows that block's detail instead
- **AND** tapping the shown block again hides its detail

#### Scenario: Keyboard reading
- **WHEN** the user moves through a distribution of six blocks with the Tab key
- **THEN** focus stops exactly once on each block, six stops in all, from the largest block to the neutral one
- **AND** each stop shows visible focus and that block's detail
- **AND** each stop's accessible name states the category's name, percentage, and amount

#### Scenario: Many categories
- **WHEN** the cycle has expenses in more than five categories
- **THEN** the five largest keep their own colors and the rest are combined into one neutral block
- **AND** that block's detail states how many categories it holds, their combined percentage and amount, and each of their names with its percentage

#### Scenario: Category too small for a square
- **WHEN** a cycle's expenses are 1,200,000 in one category and 5,000 in another, so the second receives no square
- **THEN** all 100 squares belong to the first category's block, which is the only focus stop
- **AND** the widget shows no detail for the second category, which still counts among the active categories and appears in the ledger

#### Scenario: Chart and ledger colors agree
- **WHEN** a category appears both in the distribution chart and in a ledger row
- **THEN** the ledger row's category marker uses the same color as that category in the chart

# Spec Delta

## MODIFIED Requirements

### Requirement: Analytics remain readable without hover
Charts SHALL share the interface palette and provide exact financial values and direction labels accessible without hovering. Visible widget combinations SHALL use available row space without changing catalog reading order. The category distribution SHALL be drawn as a grid of 100 equal squares in which each category fills a number of squares proportional to its share of the cycle's expenses. The five largest expense categories SHALL each be drawn in that category's own color, and any remaining categories SHALL be grouped under one neutral color. A category's own color is the one stored with the category; it SHALL NOT depend on the cycle or on how much was spent. A category SHALL use its own color wherever it is marked: in its own block of the chart, in the income list, in the ledger, and in the entry form.

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
- **THEN** the five largest are each drawn in their own color and the rest are combined into one neutral legend entry that states how many categories it holds

#### Scenario: Chart and ledger colors agree
- **WHEN** a category is drawn on its own in the distribution chart and also appears in a ledger row
- **THEN** the ledger row's category marker uses the same color as that category in the chart

#### Scenario: Color does not change between cycles
- **WHEN** a category was the largest expense in one cycle and the sixth largest in the next
- **THEN** its marker in the ledger and in the entry form has the same color in both cycles

#### Scenario: Recolored category
- **WHEN** the user gives a category another color on the categories screen and returns to the dashboard
- **THEN** its chart block, its ledger rows, and its entry in the form's list use the new color without a page reload

### Requirement: Entry form shows its choices directly
The movement-entry form SHALL offer the movement type as two options that are both visible at once, with the current one marked as selected. The amount SHALL be the most prominent field of the form. The category control SHALL show the icon marker of the currently selected category, and its opened list SHALL show the icon marker of every choice. Each marker SHALL show the category's own icon on the category's own color, the same as in the ledger.

#### Scenario: Type is one step
- **WHEN** the form is shown
- **THEN** both movement types are visible and the selected one is marked
- **AND** choosing the other type takes a single click, tap, or key press

#### Scenario: Selected category shows its color
- **WHEN** the user selects a category
- **THEN** the category control shows that category's icon marker in the category's own color next to the category name

#### Scenario: Choices show their markers
- **WHEN** the user opens the category list
- **THEN** every choice shows its own icon on its own color next to its name
- **AND** a category with no movement in the cycle shows its own color too

#### Scenario: No category selected
- **WHEN** no category is selected because the categories have not loaded yet
- **THEN** the category control shows its loading text and a neutral marker

### Requirement: Ledger is read one page at a time
The ledger SHALL show one page of the active cycle's movements, newest first.
When the cycle has more movements than fit on one page, the ledger SHALL show
a pagination control with a previous control, a next control, and numbered
page controls, with the current page marked. When all movements fit on one
page, the ledger SHALL NOT show the control.

The numbered controls SHALL be three consecutive pages that include the
current page, followed by the last page. Where pages are left out between
them, the control SHALL show an ellipsis in their place. A cycle of four
pages or fewer SHALL show a control for every page.

The ledger heading SHALL state the total number of movements in the active
cycle, not the number of rows on the page. While another page is loading, the
ledger SHALL keep the rows it already shows and indicate progress. A
category's marker in a ledger row SHALL use the category's own color on every
page.

After a movement is recorded, the ledger SHALL show the first page. After a
movement is deleted or edited, the ledger SHALL stay on its page, or show the
last page when its page no longer exists.

The pagination control SHALL be operable with the keyboard, SHALL name each
page in its accessible name, SHALL expose which page is current to assistive
technology, and SHALL wrap rather than cause horizontal page scrolling.

#### Scenario: Everything fits on one page
- **WHEN** the active cycle has 6 movements or fewer
- **THEN** the ledger lists them all and shows no pagination control

#### Scenario: Several pages
- **WHEN** the active cycle has 45 movements
- **THEN** the ledger shows the 6 newest and a control with pages 1, 2, and
  3, an ellipsis, and page 8, with page 1 marked as current
- **AND** the previous control is disabled
- **AND** the ledger heading states 45

#### Scenario: Numbered pages follow the current page
- **WHEN** a ledger of 8 pages shows page 5
- **THEN** the control shows pages 4, 5, and 6, an ellipsis, and page 8

#### Scenario: No ellipsis where no page is left out
- **WHEN** a ledger of 8 pages shows page 6
- **THEN** the control shows pages 5, 6, 7, and 8 with no ellipsis

#### Scenario: Numbered pages at the end
- **WHEN** a ledger of 8 pages shows page 8
- **THEN** the control shows pages 6, 7, and 8

#### Scenario: Few pages are all shown
- **WHEN** the ledger has 4 pages
- **THEN** the control shows pages 1, 2, 3, and 4 whatever the current page

#### Scenario: Moving to another page
- **WHEN** the user activates page 8 in a ledger of 45 movements
- **THEN** the ledger shows the 3 oldest movements from its first row
- **AND** page 8 is marked as current, the next control is disabled, and the
  heading still states 45

#### Scenario: Loading a page keeps the rows
- **WHEN** the user activates another page and its movements have not
  arrived
- **THEN** the rows of the previous page stay visible and the ledger
  indicates that it is updating

#### Scenario: Recording returns to the first page
- **WHEN** the ledger shows page 2 and the user records a movement dated
  today
- **THEN** the ledger shows page 1 with the new movement on it

#### Scenario: Deleting the only row of the last page
- **WHEN** the active cycle has 43 movements, the ledger shows page 8 with
  its single row, and the user deletes that row
- **THEN** the ledger shows page 7 and the control ends at page 7

#### Scenario: Deleting on a middle page
- **WHEN** the ledger shows page 2 of 3 and the user deletes a row
- **THEN** the ledger still shows page 2

#### Scenario: Editing keeps the page
- **WHEN** the ledger shows page 2 of 3 and the user edits the amount of a
  row on it
- **THEN** the ledger still shows page 2 with the row's new amount

#### Scenario: Re-dating the only row of the last page
- **WHEN** the ledger shows page 8 of 8 with its single row and the user edits
  that row's date to a day outside the active cycle
- **THEN** the ledger shows page 7 and the control ends at page 7

#### Scenario: Colors agree on every page
- **WHEN** a category appears in rows on the ledger's first and second page
- **THEN** both rows' category markers use the category's own color
- **AND** it is the color of that category's block in the distribution
  chart when the chart draws it on its own

#### Scenario: Keyboard and assistive technology
- **WHEN** the user reaches the pagination control with the keyboard
- **THEN** every shown page, previous, and next control can be focused and
  activated
- **AND** each page control is named with its page number and the current
  page is announced as current

#### Scenario: Phone viewport
- **WHEN** a ledger with 8 pages is viewed at 375 CSS pixels wide
- **THEN** the pagination control fits within the ledger, wrapping if
  needed, without horizontal page scrolling

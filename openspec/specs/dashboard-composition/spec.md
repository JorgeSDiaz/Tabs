# dashboard-composition Specification

## Purpose
Defines how the dashboard is composed and styled: its visual hierarchy, how it adapts to narrow viewports and zoom, the single dark visual system, data states, and how analytics stay readable without hover.

## Requirements

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
category's color in a ledger row SHALL match its color in the chart on every
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
- **WHEN** a category appears in the distribution chart and in a row on the
  ledger's second page
- **THEN** the row's category marker uses the category's chart color

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

### Requirement: Ledger rows are titled by their note or their category
Each ledger row SHALL show a title and, under it, a detail line. When the
movement's note contains non-whitespace text, the title SHALL be the note and
the detail line SHALL state the category's name and the movement's date. When
the note is empty or holds only whitespace, the title SHALL be the category's
name and the detail line SHALL state only the date.

A category title SHALL be shown with the same prominence as a note title. The
ledger SHALL NOT show placeholder text in place of a missing note, and a row
SHALL NOT state its category's name in both the title and the detail line.

#### Scenario: Row with a note
- **WHEN** the ledger lists a Groceries movement dated September 28 with the
  note "Supermarket run"
- **THEN** the row's title reads "Supermarket run"
- **AND** its detail line states Groceries and September 28

#### Scenario: Row without a note
- **WHEN** the ledger lists an Occasional movement dated September 30 with an
  empty note
- **THEN** the row's title reads "Occasional", styled like the title of a row
  that has a note
- **AND** its detail line states only September 30
- **AND** the row does not read "No note"

#### Scenario: Note of only spaces
- **WHEN** the ledger lists a Transport movement whose note is three spaces
- **THEN** the row's title reads "Transport" and its detail line states only
  the date

#### Scenario: Note added or cleared by editing
- **WHEN** the user edits a row titled "Occasional" to carry the note
  "Sold the old bike"
- **THEN** the row's title reads "Sold the old bike" and its detail line
  states Occasional and the date
- **AND** when the note is later cleared, the title reads "Occasional" again
  and the detail line states only the date

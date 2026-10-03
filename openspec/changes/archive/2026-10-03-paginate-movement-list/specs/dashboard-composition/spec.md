# Spec Delta

## ADDED Requirements

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

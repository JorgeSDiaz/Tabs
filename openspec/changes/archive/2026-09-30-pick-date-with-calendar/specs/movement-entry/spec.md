## ADDED Requirements

### Requirement: Date is chosen from a calendar
The date field SHALL show the selected date and SHALL open a calendar that displays one month at a time, from which the user picks a day. The calendar SHALL open on the month of the currently selected date, SHALL mark today distinctly from the selected day, SHALL identify the days that belong to the active cycle, SHALL let the user move to the previous and the next month, and SHALL offer a single control that selects today. Choosing a day, or choosing today, SHALL set the date field to that day and close the calendar. Days outside the active cycle SHALL remain selectable. The calendar SHALL be fully operable with the keyboard, and dismissing it without choosing SHALL leave the date unchanged.

#### Scenario: Calendar opens on the selected date
- **WHEN** the date field holds today's date and the user opens the calendar
- **THEN** the calendar shows the current month with today marked as both today and selected

#### Scenario: Picking another day
- **WHEN** the user picks the day two days before today
- **THEN** the date field shows that day
- **AND** the calendar closes

#### Scenario: Quick return to today
- **WHEN** the user has navigated to another month and activates the today control
- **THEN** the date field is set to today's local date
- **AND** the calendar closes

#### Scenario: Day in another cycle
- **WHEN** the user navigates to a previous month and picks a day outside the active cycle
- **THEN** the date field accepts that day
- **AND** a movement saved with it is stored with that date

#### Scenario: Field names the selected day
- **WHEN** the selected date is today
- **THEN** the date field reads "Today"
- **AND** when any other day is selected, the field shows that day's weekday, month, and day number

#### Scenario: Keyboard operation
- **WHEN** the user opens the calendar and uses only the keyboard
- **THEN** they can move between days and months, choose a day, and reach the today control
- **AND** every day announces its full date, and today announces that it is today

#### Scenario: Dismiss without choosing
- **WHEN** the user opens the calendar and dismisses it with Escape or by moving focus or clicking outside it
- **THEN** the date field keeps its previous date
- **AND** after Escape, keyboard focus returns to the date field

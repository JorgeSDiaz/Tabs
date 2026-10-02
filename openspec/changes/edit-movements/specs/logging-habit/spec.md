# Spec Delta

## MODIFIED Requirements

### Requirement: Logged days come from when movements are recorded
The system SHALL treat a calendar day in the configured time zone as logged when at least one existing movement was created on that day, judged by the movement's creation time converted to the configured time zone and not by the movement's own date. A day SHALL stop counting as logged when every movement created on it has been deleted. Editing a movement SHALL NOT change the day it counts for.

#### Scenario: Back-filled movement counts for the day it was entered
- **WHEN** on September 16 the user records a movement dated September 8
- **THEN** September 16 is a logged day
- **AND** September 8 does not become a logged day because of it

#### Scenario: Time zone decides the day near midnight
- **WHEN** a movement is created at 23:30 on September 15 in the configured time zone, which is September 16 in UTC
- **THEN** September 15 is the logged day

#### Scenario: Deleting the only movement of a day
- **WHEN** the user deletes the only movement created on a day
- **THEN** that day is no longer a logged day

#### Scenario: Editing keeps the logged day
- **WHEN** on September 20 the user edits a movement created on September 16, changing its date to September 10
- **THEN** September 16 is still a logged day
- **AND** neither September 20 nor September 10 becomes a logged day because of the edit

### Requirement: Experience points reward logging only
The system SHALL award each existing movement 10 XP, plus 5 XP when its note contains non-whitespace text, plus 10 XP when it is the earliest-created existing movement of its logged day. XP SHALL NOT depend on a movement's amount, direction, category, or date. XP SHALL be recomputed from the movements that currently exist, as they currently are, so deleting a movement removes its XP and can make another movement the first of its day, and editing a movement's note changes its note XP.

#### Scenario: First movement of the day with a note
- **WHEN** the first movement created today has the note "Supermarket run"
- **THEN** it earns 25 XP

#### Scenario: Later movement without a note
- **WHEN** a second movement is created the same day with an empty note
- **THEN** it earns 10 XP

#### Scenario: Amount does not matter
- **WHEN** two movements differ only in amount, one for 1,000 and one for 2,100,000
- **THEN** they earn the same XP

#### Scenario: Deleting the first movement of a day
- **WHEN** the earliest-created movement of a day is deleted
- **THEN** the next-earliest movement of that day earns the first-of-day 10 XP

#### Scenario: Adding a note by editing
- **WHEN** a movement that earns 10 XP is edited to carry the note "Bus fare"
- **THEN** it earns 15 XP

#### Scenario: Clearing a note by editing
- **WHEN** a movement that earns 25 XP is edited so its note is empty
- **THEN** it earns 20 XP

#### Scenario: Editing other fields keeps the XP
- **WHEN** a movement's amount, direction, category, or date is edited and its note is left as it was
- **THEN** it earns the same XP as before, including the first-of-day 10 XP when it had it

### Requirement: Dashboard presents the habit
The dashboard SHALL show the logging streak panel with the current streak, the active cycle's day map, and a legend naming every day classification. The header SHALL show the current streak and the level with progress toward the next level. Each ledger row SHALL show the XP its movement earned. After a movement is saved, the dashboard SHALL confirm the XP that movement earned. The dashboard SHALL explain XP using only the rules returned by the API.

The streak panel SHALL stay visible and SHALL NOT be hideable, removable, or reorderable through widget customization. The habit SHALL refresh after a movement is recorded, edited, or deleted, without a page reload.

#### Scenario: Legend explains the squares
- **WHEN** the streak panel is shown
- **THEN** a visible legend names the logged, today, missed, and ahead day markers
- **AND** each marker is distinguishable by shape or fill as well as color

#### Scenario: Save confirmation shows earned XP
- **WHEN** the user saves the first movement of the day with a note
- **THEN** the dashboard confirms that it earned 25 XP
- **AND** the header streak and the day map update without a reload

#### Scenario: Edit updates the row's XP
- **WHEN** the user adds a note to a movement through the edit dialog
- **THEN** that ledger row shows 5 XP more than before
- **AND** the header's level progress updates without a reload

#### Scenario: Hiding every widget keeps the habit
- **WHEN** the user disables all four widgets
- **THEN** the streak panel remains visible

#### Scenario: Habit unavailable
- **WHEN** the habit request fails
- **THEN** the streak panel shows a readable error in its region
- **AND** movement entry, the overview, and the ledger keep working

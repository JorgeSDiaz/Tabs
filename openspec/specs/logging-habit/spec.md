# logging-habit Specification

## Purpose

Rewards the habit of keeping a faithful record by deriving logged days, a logging streak, experience points, and a level from the movements the user records, without ever rewarding or penalizing the amounts involved.

## Requirements

### Requirement: Logged days come from when movements are recorded
The system SHALL treat a calendar day in the configured time zone as logged when at least one existing movement was created on that day, judged by the movement's creation time converted to the configured time zone and not by the movement's own date. A day SHALL stop counting as logged when every movement created on it has been deleted.

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

### Requirement: Active cycle day map
The system SHALL classify every day of the active cycle, from its first day through its last, as exactly one of: logged, missed (a past day that is not logged), today logged, today not yet logged, or ahead (a day after today).

#### Scenario: Mid-cycle classification
- **WHEN** today is day 18 of a 31-day cycle, days 5 and 10 have no movements created on them, and every other past day does
- **THEN** 15 past days are logged, 2 are missed, today is classified by whether a movement was created today, and 13 days are ahead

#### Scenario: Cycle days follow the boundary rules
- **WHEN** the active cycle is resolved with the configured boundary day and time zone
- **THEN** the day map covers exactly the days of that cycle, including a boundary clamped in a short month

### Requirement: Current logging streak
The system SHALL report the current streak as the number of consecutive logged days ending today when today is logged, or ending yesterday when today is not yet logged. The streak SHALL be zero when neither today nor yesterday is logged. The streak SHALL count across cycle boundaries.

#### Scenario: Today not yet logged keeps the streak alive
- **WHEN** the seven days before today are logged and nothing has been created today
- **THEN** the current streak is 7 and today is reported as not yet logged

#### Scenario: Logging today extends the streak
- **WHEN** the user then records a movement today
- **THEN** the current streak is 8

#### Scenario: A missed day breaks the streak
- **WHEN** yesterday is not logged and today is not logged
- **THEN** the current streak is 0

#### Scenario: Streak spans a cycle boundary
- **WHEN** the last four days of the previous cycle and the first three days of the active cycle are all logged, and today is the third day
- **THEN** the current streak is 7

### Requirement: Experience points reward logging only
The system SHALL award each existing movement 10 XP, plus 5 XP when its note contains non-whitespace text, plus 10 XP when it is the earliest-created existing movement of its logged day. XP SHALL NOT depend on a movement's amount, direction, category, or date. XP SHALL be recomputed from the movements that currently exist, so deleting a movement removes its XP and can make another movement the first of its day.

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

### Requirement: Total experience and level
The system SHALL report the total XP as the sum of XP over all existing movements, across all cycles. It SHALL report the level as the total XP divided by 250 and rounded down, plus one. It SHALL also report the XP at which the current level started and the XP at which the next level starts.

#### Scenario: Level from total XP
- **WHEN** total XP is 1,265
- **THEN** the level is 6, the current level started at 1,250 XP, and the next level starts at 1,500 XP

#### Scenario: No movements yet
- **WHEN** no movement exists
- **THEN** total XP is 0, the level is 1, and the current streak is 0

### Requirement: Habit endpoint
The API SHALL expose `GET /api/v1/habit`, returning in one response:
- the active cycle's day map, with each day's date and classification;
- the current streak;
- total XP, the level, and the current and next level thresholds;
- the XP earned by each movement in the active cycle, keyed by movement id;
- the list of XP rules, each with a short label and its XP value.

The endpoint SHALL be read-only.

#### Scenario: Habit reflects a newly recorded movement
- **WHEN** the user records a movement and then requests the habit
- **THEN** the response includes that movement's XP, and today is classified as logged

#### Scenario: Rules come from the server
- **WHEN** the habit is requested
- **THEN** the rules list contains exactly the XP rules the server applies, with their current values

#### Scenario: Failure is reported, not faked
- **WHEN** the habit cannot be computed because of a storage error
- **THEN** the API responds with a server error and an error message, and returns no partial habit

### Requirement: Dashboard presents the habit
The dashboard SHALL show the logging streak panel with the current streak, the active cycle's day map, and a legend naming every day classification. The header SHALL show the current streak and the level with progress toward the next level. Each ledger row SHALL show the XP its movement earned. After a movement is saved, the dashboard SHALL confirm the XP that movement earned. The dashboard SHALL explain XP using only the rules returned by the API.

The streak panel SHALL stay visible and SHALL NOT be hideable, removable, or reorderable through widget customization. The habit SHALL refresh after a movement is recorded or deleted, without a page reload.

#### Scenario: Legend explains the squares
- **WHEN** the streak panel is shown
- **THEN** a visible legend names the logged, today, missed, and ahead day markers
- **AND** each marker is distinguishable by shape or fill as well as color

#### Scenario: Save confirmation shows earned XP
- **WHEN** the user saves the first movement of the day with a note
- **THEN** the dashboard confirms that it earned 25 XP
- **AND** the header streak and the day map update without a reload

#### Scenario: Hiding every widget keeps the habit
- **WHEN** the user disables all four widgets
- **THEN** the streak panel remains visible

#### Scenario: Habit unavailable
- **WHEN** the habit request fails
- **THEN** the streak panel shows a readable error in its region
- **AND** movement entry, the overview, and the ledger keep working

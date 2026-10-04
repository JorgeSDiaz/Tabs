# Spec Delta

## ADDED Requirements

### Requirement: Amount is shown in the money format as it is typed
The amount field SHALL show its value with the separators the app uses for
every other amount: a comma between each group of three whole-number digits
and a period before the cents. The grouping SHALL update on every change to
the field — typing, deleting, and pasting — without the user leaving the
field.

The field SHALL accept only digits and one period, SHALL keep at most two
digits after the period, and SHALL discard anything else, including the
separators and the currency symbol of pasted text. When the text holds more
than one period, the first one SHALL count and the others SHALL be dropped.
Leading zeros SHALL be dropped from the whole-number part, except that a
whole-number part made only of zeros SHALL read as a single 0, and an amount
that starts with the period SHALL show a zero before it. An empty field SHALL
stay empty.

When the user edits the middle of the amount, the caret SHALL stay next to
the digit just typed or deleted. A separator SHALL never stop a deletion:
deleting backward or forward across a comma SHALL reach the digit on its
other side. Formatting SHALL NOT change the amount that is recorded.

#### Scenario: Whole amount is grouped while typing
- **WHEN** the user types 4324800 into the amount field
- **THEN** the field reads 4,324,800
- **AND** after the first four digits it already read 4,324

#### Scenario: Cents are kept to two digits
- **WHEN** the user types 1234.567
- **THEN** the field reads 1,234.56

#### Scenario: Period before the cents are typed
- **WHEN** the user has typed 1234 followed by a period
- **THEN** the field reads 1,234. and the next digit is taken as cents

#### Scenario: Leading zeros and a leading period
- **WHEN** the user types 007
- **THEN** the field reads 7
- **AND** when the user types .5 into an empty field, it reads 0.5

#### Scenario: Amount below one
- **WHEN** the user types 0 into an empty field
- **THEN** the field reads 0
- **AND** continuing with .50 makes it read 0.50

#### Scenario: Second period
- **WHEN** the field reads 12.34 and the user types a period at the end
- **THEN** the field still reads 12.34
- **AND** when the user instead types a period between the 1 and the 2, the
  field reads 1.23

#### Scenario: Pasted amount with symbols
- **WHEN** the user pastes $1,234.50 into an empty amount field
- **THEN** the field reads 1,234.50

#### Scenario: Characters that are not part of an amount
- **WHEN** the field reads 1,234 and the user types a letter or a minus sign
- **THEN** the field still reads 1,234

#### Scenario: Editing in the middle
- **WHEN** the field reads 184,300 and the user places the caret between the
  8 and the 4 and types 9
- **THEN** the field reads 1,894,300
- **AND** the caret is right after the 9

#### Scenario: Deleting across a separator
- **WHEN** the field reads 1,234 with the caret right after the comma and
  the user presses Backspace twice
- **THEN** the field reads 234
- **AND** when the caret is right before the comma instead and the user
  presses Delete twice, the field reads 134

#### Scenario: Deleting below a thousand
- **WHEN** the field reads 1,234 and the user deletes the last digit
- **THEN** the field reads 123

#### Scenario: Recorded amount is the amount shown
- **WHEN** the user records a movement with the field reading 4,324,800
- **THEN** the movement is stored as 4,324,800 and the ledger row shows
  $4,324,800
- **AND** a movement recorded with the field reading 1,234.50 is stored as
  1,234.50

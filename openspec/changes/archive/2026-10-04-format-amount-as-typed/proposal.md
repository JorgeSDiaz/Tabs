# Proposal

## Why

The amount field shows what is typed as one unbroken run of digits:
`4324800`. Every other amount in the app is grouped (`$4,324,800`), so the
field is the one place where the user has to count digits to know whether
they typed four million or forty. The user asked for the field to show the
money format, with its separators, while they type.

## What Changes

- The amount field groups the whole-number digits with the app's separators
  as the user types: `4324800` reads `4,324,800`, and `1234.5` reads
  `1,234.5`.
- The grouping updates on every change — typing, deleting, pasting — without
  leaving the field, and the caret stays where the user is editing.
- The field takes only digits and one period, and at most two digits after
  the period. Anything else is dropped, so a pasted `$1,234.50` becomes
  `1,234.50`.
- The edit dialog shares the field, so it prefills a movement's amount
  grouped (`184,300`, not `184300`) and behaves the same way. An amount with
  cents prefills with both digits (`1,234.50`, not `1234.5`), as the ledger
  shows it.
- Unchanged: the `$` stays outside the field, the placeholder, the focus
  behaviour, the validation messages, and the amount that is recorded.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `movement-entry`: adds how the amount field shows its value while it is
  typed. The existing requirements are not changed.
- `movement-editing`: the edit dialog's amount starts grouped and follows the
  entry form's amount format. The "Fields are prefilled" scenario changes from
  `184300` to `184,300`.

## Impact

- **Frontend:**
  - `apps/web/src/shared/lib/money.ts`: the amount-as-typed formatting, next
    to `formatCents`, with tests in `money.test.ts`.
  - `apps/web/src/features/movements/adapters/ui/MovementFields.tsx`: the
    amount input stops being a number input and formats on change.
  - `apps/web/src/features/movements/domain/movementDraft.ts`: `toDraft`
    writes the cents with two digits when there are any.
  - `apps/web/src/index.css`: the number-input spinner rules lose their only
    target and are removed.
- **Backend and API:** none. The form keeps sending the same `amount_cents`.
- **Dependencies:** none added.
- **Non-goals:**
  - Following the browser's locale (`4.324.800,50`). The field uses the one
    format the rest of the app already shows.
  - Multi-currency (a constitution non-goal) or a currency selector.
  - Formatting any other input.

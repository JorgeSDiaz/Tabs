# Tasks

## 1. Amount text

- [x] 1.1 Add `amountDigits(text)` to `shared/lib/money.ts`: keep the digits and the first period, cap the cents at two digits, drop leading zeros from the whole part, put a zero before a leading period, leave an empty string empty. Add tests in `money.test.ts`: `4324800` → `4324800`, `1234.567` → `1234.56`, `1234.` → `1234.`, `007` → `7`, `0` → `0`, `00` → `0`, `0.05` → `0.05`, `.5` → `0.5`, `$1,234.50` → `1234.50`, `12a-3` → `123`, `1.2.34` → `1.23`, `12.34.` → `12.34` and `''` → `''`. Verify with `pnpm --filter web test`.
- [x] 1.2 Add `groupAmount(digits)` to `shared/lib/money.ts`: insert a comma between each group of three whole-part digits and leave the period and cents as they are. Add tests: `''` → `''`, `123` → `123`, `1234` → `1,234`, `4324800` → `4,324,800`, `1234.` → `1,234.`, `1234.5` → `1,234.5` and `0.05` → `0.05`. Verify with `pnpm --filter web test`.
- [x] 1.3 In `movementDraft.ts`, make `toDraft` write two cents digits when the cents are not zero and none otherwise. In `movementDraft.test.ts`, change the `1050` expectation to `'10.50'` and keep the round-trip test passing unchanged. Verify with `pnpm --filter web test`.

## 2. Amount field

- [x] 2.1 In `MovementFields.tsx`, change the amount input to `type="text"`, keep `inputMode="decimal"`, `required` and the placeholder, and remove `min` and `step`. Show `groupAmount(draft.amount)` and store `amountDigits(...)` of what was typed in the draft. Verify in the browser that typing `4324800` reads `4,324,800` in the entry form and that the edit dialog prefills a 184,300 movement as `184,300`.
- [x] 2.2 Restore the caret on each change as design.md describes: count the surviving characters left of the caret, write the grouped text to the input, and set the caret after that many non-separator characters before reporting the change — past a comma at that spot when the event's `inputType` is `deleteContentForward`, before it otherwise. Verify by hand: typing a digit in the middle of `184,300` leaves the caret after it; in `1,234`, Backspace twice from right after the comma reads `234` and Delete twice from right before it reads `134`; select-all then typing replaces the amount; pasting `$1,234.50` reads `1,234.50`.
- [x] 2.3 Remove `appearance: textfield`, `-moz-appearance: textfield` and the two `::-webkit-*-spin-button` rules under `.amount-input input` in `index.css`. Verify the field looks as before in the entry form and the edit dialog, and that a grep for `spin-button` and `type="number"` in `apps/web/src` finds nothing.

## 3. Verify the usable slice

- [x] 3.1 Run `openspec validate format-amount-as-typed --strict`, `pnpm --filter web test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [x] 3.2 Against disposable local data, record a movement with the field reading `4,324,800` and one reading `1,234.50`. Confirm in the network request that `amount_cents` is `432480000` and `123450`, and that the ledger rows read `$4,324,800` and `$1,234.50`. Edit the second one and confirm the dialog prefills `1,234.50`.
- [x] 3.3 Re-check the unchanged scenarios by hand: the amount field has focus on load, after a save it is cleared and focused again, saving an empty or zero amount states what is wrong, and at 375 px the numeric keypad opens for the field. (Checked in a desktop browser at 375 px: the field keeps `inputMode="decimal"`; the keypad itself still needs a look on a phone.)
- [ ] 3.4 Use the field for real entries for a few days and record here whether the commas and the caret behaviour are right.

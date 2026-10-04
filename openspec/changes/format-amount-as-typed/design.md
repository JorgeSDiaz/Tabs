# Design

## Context

- **The field.** `MovementFields.tsx` renders the amount as
  `<input type="number" inputMode="decimal" min="0.01" step="0.01">`, shared
  by the entry form and the edit dialog. A number input cannot hold a comma,
  so it cannot show a grouped amount.
- **The draft.** `MovementDraft.amount` is the text of the field. `toInput`
  in `movementDraft.ts` is the one place that turns it into `amount_cents`
  (`Math.round(Number(amount) * 100)`), and `toDraft` writes a stored
  movement back as text (`String(cents / 100)`).
- **The money format.** `shared/lib/money.ts` holds `formatCents`, commented
  as "the one money format": `$` prefix, en-US separators, cents only when
  they are not zero. The ledger and the widgets all read through it.
- **Tests.** Pure functions have Vitest tests beside them (`money.test.ts`,
  `movementDraft.test.ts`). There are no component or end-to-end tests.

See proposal.md for the motivation and the specs for the behaviour.

## Goals / Non-Goals

**Goals:**
- The field reads like every other amount in the app while it is typed.
- `toInput` stays the only place that decides what amount is sent.
- The caret does not jump when the text is regrouped.
- No new dependency.

**Non-Goals:**
- A general masked-input component. One field needs this.
- Locale detection, or a setting for the separators.

## Decisions

### The separators are the app's, not the browser locale's

**Choice.** Commas group the whole-number digits and a period starts the
cents, exactly as `formatCents` writes them.

**Alternative considered.** `Intl.NumberFormat` with the browser's locale
(`4.324.800,50` on a Spanish-language browser). Rejected: the field would
then disagree with the ledger row the movement lands in a second later, and
the period and comma would swap meaning between the field and the rest of
the page. If the app's format ever changes, it changes in `money.ts` for the
field and the ledger together.

### A text input, formatted on every change

**Choice.** The input becomes `type="text"` and keeps `inputMode="decimal"`
(the numeric keypad on touch devices) and `required`. `min` and `step` only
mean something on a number input and are removed. The non-positive check they
duplicated already lives in `toInput`, which reports "Amount must be a
positive number".

`appearance: textfield` and the two spin-button rules in `index.css` exist
only to hide the number input's spinner. They lose their target and are
removed (constitution rule 4).

**Alternative considered.** Keep `type="number"` and draw the grouped text in
an overlay on top of a transparent input. Rejected: two elements have to stay
aligned glyph for glyph, and selection and the caret would show against the
ungrouped text.

**Alternative considered.** Format only on blur. Rejected: the user asked for
the format while typing, and the entry form submits with Enter without ever
blurring.

### Format the text, never a number

**Choice.** Two pure functions in `shared/lib/money.ts`, next to
`formatCents`:

- `amountDigits(text)`: keeps the digits and the first period, drops
  everything else, caps the cents at two digits, drops leading zeros from the
  whole part (an all-zero whole part stays one `0`), and puts a zero before a
  leading period. `"$1,234.567"` becomes `"1234.56"`, `"1234."` stays
  `"1234."`, `"0"` stays `"0"`, `""` stays `""`.

The first period wins because it needs no memory of the previous text: a
period typed after the existing one is dropped, and one typed before it
moves the decimal mark there (`1.2.34` reads `1.23`).
- `groupAmount(digits)`: inserts the commas into the whole part.
  `"1234.5"` becomes `"1,234.5"`.

**Alternative considered.** `Number(text).toLocaleString('en-US')`. Rejected:
a number cannot hold a half-typed amount. `1234.` would lose its period and
`0.0` would collapse to `0` before the user reaches `0.05`. It would also
round a long amount instead of leaving the digits as typed.

### The draft keeps plain digits; the separators are display

**Choice.** `MovementDraft.amount` holds the output of `amountDigits`
(`"4324800"`), as it does today. The field shows `groupAmount(draft.amount)`.
`toInput` is untouched, and still parses a string that `Number()` reads
directly.

**Alternative considered.** Store the grouped text in the draft and strip the
commas in `toInput`. Rejected: the separator would then be known to the
formatter and to the parser (constitution rule 3), and every draft fixture
would carry presentation.

**One domain edit.** `toDraft` writes `String(cents / 100)`, which gives
`1234.5` for 1,234.50. Grouped, that would read `1,234.5` beside a ledger row
that reads `$1,234.50`. `toDraft` writes two cents digits whenever the cents
are not zero, and none otherwise — the same rule `formatCents` applies.

### The caret is restored by counting, not by position

**Choice.** Regrouping changes the length of the text, and React moves the
caret to the end when a controlled value is rewritten. On each change the
field:

1. reads the caret position in what the browser just produced;
2. counts the characters that survive to its left
   (`amountDigits(value.slice(0, caret)).length`);
3. writes the grouped text to the input and sets the caret after that many
   non-separator characters — before a comma that sits there, except after a
   forward delete, when it goes past the comma;
4. reports the plain digits to the draft.

The input is written before the state update, so the value React renders
next is the one already in the DOM and React leaves the caret alone.

**Deleting a comma.** Removing a comma changes no digit, so the text is
regrouped and the comma comes back. The caret has to end on the far side of
it, or the key would remove the same comma forever:

- Backspace right after a comma: the caret lands before the comma, and the
  next press deletes the digit to its left.
- Delete right before a comma: the caret lands after the comma, and the next
  press deletes the digit to its right.

The direction comes from the change event's `inputType`
(`deleteContentForward`), which desktop and touch keyboards both report, so
no key handler is needed.

**Alternative considered.** Intercept Backspace and Delete on `keydown` to
remove the neighbouring digit in one press. Left out: touch keyboards do not
report those keys reliably on `keydown`, for a case that costs one extra
press.

### The narrow-desktop entry bar gives the amount a little more room

**Found during apply.** The commas make the text wider. From 1024 px to
about 1045 px the amount column sits at its narrowest (an input 103 px wide),
and `4,324,800` needs 105 px: a seven-digit amount that fit ungrouped was cut
by 2 px.

**Choice.** In the existing 1024–1279 px block of `index.css`, the entry
form's amount box trims its side padding from 14 px to 10 px and its gap from
8 px to 6 px. The input gains 6 px and the other columns keep their widths.
The edit dialog stacks its fields at every width and is not touched.

**Not covered.** At 1024–1090 px an amount with cents or with nine digits
(`4,324,800.50`, `123,456,789`) is still wider than the input and scrolls
inside it. Those lengths did not fit ungrouped either; fixing them means
reflowing the entry bar, which is outside this change.

## Risks / Trade-offs

- **[Risk]** The caret logic has no automated test; the repo has no component
  test setup, and adding one for this change would outweigh it.
  → The counting is done by `amountDigits`, which is unit-tested. The spec
  scenarios for editing in the middle, deleting, selecting all, and pasting
  are walked by hand in the browser before the change closes.
- **[Risk]** A text input loses the browser's own number validation.
  → `amountDigits` makes a non-number untypeable, `required` still blocks an
  empty field, and `toInput` still refuses zero.
- **[Trade-off]** A user who types a comma as the decimal mark, out of habit
  from a locale that uses one, has it dropped: `12,5` reads `125`. The
  grouping makes this visible at once, and the field's own commas show which
  mark is which.
- **[Trade-off]** The arrow keys no longer step the amount up and down. The
  spinner was already hidden, and stepping money by a cent had no use here.

## Migration Plan

This is a frontend-only deploy with `make prod-up`. To roll back, redeploy the
previous web image. No data changes.

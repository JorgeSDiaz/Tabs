# Design

## Context

- **Motivation.** See proposal.md — Why.
- **Backend today.** The `movements` slice records, lists and deletes.
  - `domain.NewMovement` is the one place amount and direction are validated.
  - The category pairing is enforced by the foreign keys on write;
    `Repository.Create` maps the `23503` violation to
    `ErrUnknownCategory` or `ErrCategoryDirectionMismatch`.
  - The `movement` table already has an `updated_at` column that nothing
    writes after insert.
  - The slice has no Go tests.
- **Frontend today.**
  - `MovementForm` owns the entry fields, the amount-to-cents check, the
    last-used memory, the XP confirmation, and the category-creation
    `<dialog>`.
  - `MovementList` renders the ledger rows with a delete button.
  - `App.tsx` refreshes movements, the cycle and the habit after a record or
    a delete.
- **Habit.** The habit reads `id`, `created_at`, `occurred_on` and `note`
  straight from the `movement` table and recomputes on every request. It
  needs no change as long as an edit never touches `created_at`.

## Goals / Non-Goals

**Goals:**
- One validation path for recording and editing.
- One set of field markup for the entry form and the edit dialog.
- An edit that the habit follows by derivation alone, with no habit code
  change.

**Non-Goals:**
- Optimistic UI. The dialog waits for the server and the dashboard refetches,
  like record and delete do.
- Concurrency control between machines. The last write wins.

## Decisions

### `PUT` replaces the whole movement

**Choice.** `PUT /api/v1/movements/{id}` takes `MovementInput`, the same body
as `POST /api/v1/movements`, and returns `200` with the `Movement`. Errors:
`400` for the same failures as recording, `404` for an unknown id.

**Why.** The dialog always holds every field, so it can always send every
field. A full replacement can be built with `domain.NewMovement` and nothing
else, which keeps amount and direction validated in one place (rule 3).

**Alternative considered.** `PATCH` with partial fields. Rejected: it needs a
read, a merge, and a second validation of the merged result — the `merge()`
helper the constitution cites as Caudal's mistake.

### The update path reuses what recording already has

**Choice.**
- `application.RecordInput` is renamed `MovementInput`. Two operations take
  it now, and that is the name the OpenAPI schema already uses (rule 7).
- `Service.Update(ctx, id, in)` builds the movement with `domain.NewMovement`
  and calls `ports.Repository.Update(ctx, id, m)`.
- `Repository.Update` is one statement:
  `UPDATE movement SET amount_cents, direction, category_id, occurred_on,
  note, updated_at = now() WHERE id = $6 RETURNING <movementColumns>`.
  - `created_at` is not in the `SET` list, so the habit's logged day cannot
    move.
  - No row returned (`sql.ErrNoRows`) becomes `domain.ErrNotFound`.
  - The foreign-key mapping moves out of `Create` into one helper that both
    writes call. It has two callers the moment it exists (rule 4).
- The HTTP handler decodes the body and parses `occurred_on` in one function
  shared by `create` and `update`. `createRequest` is renamed to match.

**Alternative considered.** Read the row, change it, write it back in a
transaction. Rejected: there is nothing to merge, and the single statement
is already atomic.

### `updated_at` is written but not exposed

**Choice.** The update sets `updated_at = now()`. The `Movement` schema does
not gain the field.

**Why.** The column exists and its name says what it holds, so it has to be
true after an edit (rule 7). Nothing reads it yet, so the contract does not
carry it (rules 2 and 4).

### Fields are shared, not copied

**Choice.**
- `features/movements/domain/movementDraft.ts` holds the editable shape of a
  movement (amount as typed text, direction, category id or unselected, date,
  note) and two pure functions:
  - draft to `MovementInput`, returning the input or the validation message
    ("Amount must be a positive number", "Pick a category");
  - `Movement` to draft, used to prefill the dialog.
- `adapters/ui/MovementFields.tsx` is the controlled field group extracted
  from `MovementForm`: type toggle, amount, category select with its color
  chip, `DateField`, note. It resets the category when the type changes. It
  shows the "Create new…" option only when given a callback for it.
- `MovementForm` keeps what is entry-only: focus on arrival and after a save,
  last-used memory, the XP confirmation, the category-creation dialog, and
  the "Log it" button.
- `adapters/ui/MovementEditDialog.tsx` is a native `<dialog>` opened with
  `showModal()`, like the category dialog. It holds a draft built from the
  movement, renders `MovementFields` without the create callback, and has
  Cancel and "Save changes" buttons.

**Why.** The entry form and the edit dialog differ only in what surrounds the
fields. Copying the fields would mean every later field change is made twice
(rule 5). Both callers exist in this change, so the extraction is not
speculative (rule 4).

**Alternatives considered.**
- Render `MovementForm` itself inside the dialog with a `mode` prop.
  Rejected: every entry-only behaviour would need a branch on `mode`.
- Load the movement into the pinned form. Rejected by the user in favour of
  the dialog; it would also mix the entry form's remembered values with the
  edited ones.

**Details that follow.**
- Element ids inside the fields (`movement-category-label`) come from
  `useId`, because the entry form and the dialog are on the page together.
- Layout comes from the container: `.entry-fields` stays a single row on
  wide viewports, and the dialog stacks the same fields.

### The ledger owns the dialog; the app owns the refresh

**Choice.**
- `MovementList` keeps the movement being edited in state and renders one
  `MovementEditDialog` for it. It needs the cycle span for the calendar tint,
  so it gains the same optional `cycle` prop `MovementForm` has.
- `MovementList` takes `onEdit(id, input)`. `App.tsx` implements it as
  `updateMovement` followed by the existing `refresh()`, which already
  reloads movements, the cycle and the habit.
- `App.tsx` does not touch `savedId` on an edit, so the entry form's "Movement
  saved · +XP" message keeps describing the last recorded movement.
- The ledger status reads "Movement updated" after a save, next to the
  existing "Movement deleted".
- Closing a native modal dialog returns focus to the element that opened it,
  which is the row's edit button.

### No category creation inside the dialog

**Choice.** The dialog's category select lists existing categories only.

**Why.** Creating a category opens a modal dialog, and the edit is already
one. A correction almost always moves a movement to a category that exists.
When it does not, the user creates it from the entry form first.

### Order relative to `paginate-movement-list`

This change lands first and does not depend on the other.
`paginate-movement-list` then specifies what the ledger does after an edit:
the refresh reloads whatever page is shown.

## Risks / Trade-offs

- **[Risk]** Extracting `MovementFields` regresses an entry behaviour that
  `movement-entry` specifies (focus, direction reset, last-used memory,
  category creation).
  → A task walks those scenarios again after the extraction, before the
  dialog is built.
- **[Risk]** `MovementForm.tsx` and `MovementList.tsx` have uncommitted work
  in the tree from earlier changes.
  → Commit that work before applying this change, so the extraction diff
  shows only this change.
- **[Risk]** A re-dated movement leaves the ledger with no trace of where it
  went.
  → The calendar tints the active cycle, so the user sees the chosen day is
  outside it. The spec defines the disappearance on purpose.
- **[Trade-off]** Last write wins if the same movement is edited from two
  machines. Accepted for a single user.
- **[Trade-off]** No edit history. A wrong edit is corrected by editing
  again.

## Migration Plan

- No schema change.
- Deploy the API and web together with `make prod-up`, since the web calls
  the new operation.
- To roll back, redeploy the previous images. Edits already made stay in the
  ledger as ordinary data.

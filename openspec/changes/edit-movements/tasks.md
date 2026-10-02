# Tasks

## 1. API contract

- [ ] 1.1 Add `put` (`operationId: updateMovement`) to `/api/v1/movements/{id}` in `openapi/tabs.yaml`: body `MovementInput`; responses `200` `Movement`, `400`, `404`, `500`. Run `pnpm --filter web generate:api`. Verify `apps/web/src/shared/api/schema.d.ts` contains `updateMovement`.

## 2. Backend update path

- [ ] 2.1 Rename `application.RecordInput` to `MovementInput`. Add `Update` to `ports.Repository` and `Service.Update(ctx, id, in)`, which builds the movement with `domain.NewMovement`. Add a service test with a fake repository: a zero amount and an invalid direction never reach the repository; a valid input reaches it with the given id. Verify with `make api-test`.
- [ ] 2.2 Implement `Repository.Update` as one `UPDATE … RETURNING` that sets `updated_at = now()`, leaves `created_at` alone, and maps no row to `domain.ErrNotFound`. Move the foreign-key error mapping out of `Create` into a helper both writes call. Add a repository test against the local database (same skip pattern as `habit/adapters/postgres/movements_test.go`) covering: fields replaced and `created_at` unchanged; unknown id; unknown category; category of the other direction leaves the row unchanged. Verify with `make db-up && make api-test`.
- [ ] 2.3 Register `PUT /api/v1/movements/{id}` in `movements/adapters/http`. Share the body decoding and `occurred_on` parsing with `create`. Add handler tests with a fake repository for: `200` with the updated movement, `400` for invalid JSON, a bad date, a zero amount and a non-integer id, and `404` for an unknown id. Verify with `make api-test`.

## 3. Shared fields (web)

- [ ] 3.1 Add `features/movements/domain/movementDraft.ts` with the draft type, draft-to-input (returning the input or the validation message) and movement-to-draft. Add `movementDraft.test.ts` covering a valid draft, a blank, zero and negative amount, an unselected category, cents rounding, and a round trip from a movement. Verify with `pnpm --filter web test`.
- [ ] 3.2 Extract `adapters/ui/MovementFields.tsx` from `MovementForm` (type toggle, amount, category select with chip, `DateField`, note; ids from `useId`; "Create new…" only when a callback is given). Make `MovementForm` use it and `movementDraft`. Verify in the browser that every `movement-entry` scenario still holds: focus on arrival and after a save, date defaults to today, type change resets the category, last-used values are kept, and creating a category still selects it.

## 4. Edit dialog

- [ ] 4.1 Add `updateMovement(id, input)` to `features/movements/adapters/api/movements.ts`. Verify it type-checks against the regenerated schema with `pnpm --filter web build`.
- [ ] 4.2 Build `adapters/ui/MovementEditDialog.tsx`: a native modal `<dialog>` holding a draft built from the movement, `MovementFields` without the create callback, Cancel and "Save changes". It focuses the amount on open, shows validation and server errors in place, and stays open on failure. Verify the `movement-editing` prefill, type-change, invalid-values and save-fails scenarios in the browser (stop the API for the last one).
- [ ] 4.3 Add the edit control to each `MovementList` row (a pencil icon in `shared/ui/Icon.tsx`, `aria-label` naming the note or the category), the `onEdit` and `cycle` props, and the "Movement updated" status. Verify with the keyboard that Escape closes the dialog and focus returns to the row's edit control.
- [ ] 4.4 Wire `onEdit` in `App.tsx` to `updateMovement` followed by `refresh()`, without touching `savedId`. Verify that an edit updates the row, the totals, the category distribution and the row's XP without a reload, and that the entry form keeps its typed and remembered values.
- [ ] 4.5 Style the dialog and the row's two controls in `index.css`. Verify at 1440 and 375 px, and at 200 percent zoom, that nothing overlaps or scrolls horizontally.

## 5. Verify the usable slice

- [ ] 5.1 Run `openspec validate edit-movements --strict`, `make test`, `pnpm --filter web lint` and `pnpm --filter web build`; all must pass.
- [ ] 5.2 Against disposable local data, walk every scenario in `specs/movement-editing`, `specs/movements` and `specs/logging-habit`: edit each field, re-date a movement out of the active cycle, add and clear a note and check the XP, and confirm the streak and day map do not move.
- [ ] 5.3 Use editing through one real cycle and record the findings here, especially whether creating a category from the dialog was missed and whether a re-dated movement vanishing was confusing.

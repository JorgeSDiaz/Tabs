# Design

## Context

See `proposal.md` — Why, for motivation. State that shapes the approach:

- A first pass (commit `723c1f2`) shipped focus-after-save and a
  frontend-only priority ordering of categories (`IN_PRIORITY` /
  `OUT_PRIORITY` name lists + `orderedForDirection`). The user then
  asked for real separation: the dropdown shows only the selected
  direction's categories. Hiding categories makes the in/out split a
  domain fact, not a UI preference — so the split moves into the data.
- `MovementForm.tsx` already defaults the date to `today()`
  (`shared/lib/money.ts`) and keeps `direction`, `categoryId`, and
  `occurredOn` after a save (only `amount`/`note` reset). Those
  requirements are lock-in work, not new code.
- Category existence is enforced by the FK on `movement.category_id`
  (see the comment in `NewMovement`); the movements adapter maps FK
  violation 23503 to a 400. That is the established place for
  relational movement↔category rules.
- The web app has no test runner (Go tests only) and no persistence
  layer; the dev DB (`make db-up`) is disposable and currently holds
  zero movements, so adding constraints cannot fail on stale rows
  there.

## Goals / Non-Goals

**Goals:**
- Each seeded category carries its direction as data; the frontend
  filter and the backend check read the same fact.
- The direction↔category pairing is validated in exactly one layer
  (constitution rule 3).
- The form's "ready to log" behavior (focus, defaults, memory) is
  specified and preserved.

**Non-Goals:**
- No user-facing create/rename/deactivate of categories; the seed and
  its directions are still configuration, not editable.
- No server-side validation beyond the FK: amount, direction, and date
  keep their existing single layers.

## Decisions

### 1. Direction is a column on `category`, seeded, not a frontend list

Migration `004_category_direction.sql`:

- `ALTER TABLE category ADD COLUMN direction TEXT` with a
  `CHECK (direction IN ('in','out'))` (backfill, then `SET NOT NULL`).
- Backfill: `Income` → `in`; the nine expense names → `out`.
- Seed rows added: `Salary`, `Bonus`, `Reimbursement`, `Gift`
  (`in`, sort_order 11–14).
- `UNIQUE (id, direction)` on `category` — needed only as the FK
  target — plus the composite FK from Decision 3.

The frontend name lists and `orderedForDirection` are deleted; a pure
`forDirection` filter replaces them. *Alternative kept as-is:* the
committed frontend-list design. Rejected now because the lists are
disjoint (a hidden category is a domain fact, not an ordering choice)
and because the API must enforce the same pairing — a UI-only rule
would leave the two sources of truth Caudal's rule 5/7 exist to
prevent.

### 2. Programmatic focus via `useRef` + `useEffect`, not `autoFocus`

(As implemented in the first pass.) `MovementForm` holds a
`useRef<HTMLInputElement>` on the amount field, focused on mount via
`useEffect`, and re-focused at the end of the `onSubmit` success path.
No shared "focus manager" abstraction.

### 3. Direction↔category match is enforced once — by a composite FK

`movement (category_id, direction) REFERENCES category (id, direction)`,
named `movement_category_direction_fkey` in the migration. A mismatched
(or nonexistent) category is physically unwritable; the movements
postgres adapter maps a violation of the named constraint to
`domain.ErrCategoryDirectionMismatch` (400 with a distinct message) and
keeps the existing mapping of `movement_category_id_fkey` to
`ErrUnknownCategory`.

*Alternatives considered:* an application-service check reading
category direction through a new cross-slice port — rejected: extra
port + wiring for an invariant the database guarantees in one line, and
the FK would still be needed to keep the promise atomic against
concurrent writes; trusting the frontend filter alone — rejected: the
API must stay honest for direct calls. The existing simple FK is kept
because it preserves the clearer "key is not present" message for
unknown ids.

### 4. Direction change resets the selected category

The two filtered lists are disjoint, so any category selected before a
direction change cannot exist in the new list. Keeping its id would
render a select whose value is absent from the options and submit a
movement the API rejects. The onChange therefore resets `categoryId` to
unselected. This replaces the first pass's "selection survives a
direction change" rule, which only made sense while every category
remained in the list.

### 5. Session memory stays component state — no localStorage

After a save the form keeps `direction`, `categoryId`, `occurredOn`;
after a reload everything returns to defaults. Persisting the last-used
date was explicitly dropped from scope at the user's choice (a fresh
load already shows today; rule 2).

## Risks / Trade-offs

- [A ledger with historical mismatched movements would fail the FK
  creation] → dev DB verified empty; before applying to Neon, check
  `SELECT count(*) FROM movement m JOIN category c ON c.id=m.category_id
  WHERE c.direction <> m.direction` and clean or add the constraint
  `NOT VALID` first if the user prefers.
- [Constraint-name-based error mapping breaks if the constraint is
  renamed] → the name is set in the same migration that defines it and
  referenced in the one adapter that maps it; fall-through stays
  "unknown category", so a rename degrades the message, never a 500.
- [Autofocus pops the on-screen keyboard on mobile] → single-user local
  app, desktop-first; accept and observe during use (rule 1).
- [No web tests, so scenarios are validated manually] → group 5 tasks
  walk every scenario; web test tooling stays its own future change.

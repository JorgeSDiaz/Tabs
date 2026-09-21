# Design

## Context

See `proposal.md` — Why, for motivation. The state that shapes the
approach:

- `MovementForm.tsx` (movements slice, web) already defaults the date to
  `today()` from `shared/lib/money.ts`, and already keeps `direction`,
  `categoryId`, and `occurredOn` after a save because the component
  stays mounted and only `amount`/`note` are reset. Those two
  requirements from the spec delta are therefore lock-in work, not new
  code.
- Categories are a fixed seeded set with no kind/direction column
  (`001_category.sql`); the API returns them ordered by
  `sort_order, name`. Only "Income" is income-flavored; the other nine
  are expense-flavored.
- The web app has no test runner (Go tests only) and no persistence
  layer (no localStorage usage anywhere).
- What is actually new: focusing the amount field, and ordering the
  category choices by the selected direction.

## Goals / Non-Goals

**Goals:**
- All "ready to log" form behavior lives in the web layer; the API and
  database are untouched.
- The in/out category priority rule lives in exactly one place
  (constitution rule 3).

**Non-Goals:**
- No per-category kind in the schema, and no migration, even though the
  ordering is conceptually a category attribute (see Decision 1).
- No new web test infrastructure for this change.

## Decisions

### 1. Priority ordering is a frontend rule, not a `kind` column

Add no database/API change. `apps/web/src/features/categories/domain/category.ts`
grows one exported helper, `orderedForDirection(categories, direction)`,
plus two module-private constants:

- `IN_PRIORITY`: names of categories that lead when direction is `in` —
  `['Income']`.
- `OUT_PRIORITY`: names that lead when direction is `out` —
  `['Groceries', 'Eating out', 'Transport', 'Housing', 'Subscriptions']`
  (the everyday-spend set).

Match is by category name: names are UNIQUE in the seeded set and
renaming does not exist, so a name is a stable identifier today.
Categories whose name appears in the active priority list move to the
top in the list's own order; everything else keeps the server order.
The exact lists are one-line constants the user can tune after real use
(rule 1 — ship, then use).

*Alternative considered:* a nullable `kind` column on `category`,
exposed in the API. Rejected: the category set is fixed by the
`movements` spec ("Seeded categories"), nothing can set or edit the
value, and a column with no writer is scaffolding for future use
(rules 2 and 4). The trigger to move this into data is the day category
creation/rename is opened — the helper's signature already isolates the
change to one call site.

### 2. Programmatic focus via `useRef` + `useEffect`, not `autoFocus`

`MovementForm` holds a `useRef<HTMLInputElement>` on the amount field,
focused once on mount via `useEffect`, and re-focused at the end of the
`onSubmit` success path. `autoFocus` would cover mount but not
refocus-after-save, and React warns about it; one ref covers both
requirements. No shared "focus manager" abstraction — two lines in one
component (rules 4/5).

### 3. Direction change never touches the selected category

`orderedForDirection` runs at render time over the list; it does not
reassign `categoryId`. A user who selected "Other" under `out` and flips
to `in` keeps "Other" selected. Silently changing a user's selection on
a navigation event is the failure mode to avoid, and it is free to
prevent.

### 4. Session memory stays component state — no localStorage

After a save the form keeps `direction`, `categoryId`, `occurredOn`;
after a reload everything returns to defaults. This is the existing
behavior; the spec delta pins it. Persisting the last-used date was
considered and explicitly dropped from scope at the user's choice: a
fresh load already shows today, which is right for the common case, and
storage would add a rule with no second user story (rule 2).

## Risks / Trade-offs

- [Priority lists keyed by name drift if categories ever gain rename] →
  Renaming doesn't exist and the spec forbids it; if category CRUD is
  opened later, Decision 1 already defines the migration path (name
  lists → column, one call site to switch).
- [Autofocus pops the on-screen keyboard on mobile] → Single-user local
  app, desktop-first; the alternative (never focus) is the problem being
  fixed. Accept and observe during use (rule 1).
- [No web tests, so the four requirements are validated manually] →
  Each spec-delta scenario is a concrete manual check-list item in
  `tasks.md`; web test tooling is its own future change, not smuggled
  in here (rule 4).

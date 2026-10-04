# Design

## Context

See proposal.md for the motivation. The constraints that shape the approach:

- The category field is a native `<select>` inside `MovementFields.tsx`,
  which the entry form and the edit dialog both render. A native `<option>`
  holds text only.
- Listing order comes from the API: `ORDER BY sort_order, name`. Creating a
  category gives it `MAX(sort_order) + 1` across the whole table, so every
  created category lists after `Other`.
- The web keeps the list in `useCategories` and appends a created category
  to the end of its state.
- The draft's `categoryId` is `number | ''`. The empty value is what the
  placeholder option shows, and the draft is initialized before the
  categories have loaded.
- Migrations are applied by filename at API start and recorded in
  `schema_migrations`. Earlier changes edited migrations in place because no
  data was worth keeping; the ledger now lives on Neon, so that is over.
- The web has unit tests for pure functions only (vitest, no DOM testing
  library). Component behavior is verified in the browser.
- `DateField.tsx` already is a custom popup that lives inside the edit
  `<dialog>`: it renders inline, closes on outside pointer-down and on blur,
  and handles Escape with `preventDefault()` so the dialog does not cancel.

## Goals / Non-Goals

**Goals:**

- One place decides which category a draft holds when the user has not
  chosen one.
- One place decides listing order: the API's list query.
- One category control, used by the entry form and the edit dialog.

**Non-Goals:**

- Stored colors, stored icons, renaming, deleting, a categories screen —
  all of it is the next change (`manage-categories`).
- A catch-all for the `in` direction.
- Reordering categories by hand.
- A general-purpose select component. The control is for categories and
  lives in the categories slice.

## Decisions

### 1. The catch-all is a column, and only the list query reads it

`005_category_catch_all.sql` adds `catch_all BOOLEAN NOT NULL DEFAULT false`
and sets it for the `out` category named `Other`. The list query becomes
`ORDER BY catch_all, sort_order, name`. `Create` is not touched: a created
category still takes `MAX(sort_order) + 1`, and the flag is what keeps
`Other` behind it.

This also moves the categories already created on Neon above `Other`
without rewriting a single `sort_order`.

The flag is not exposed by the API and nothing can set it: the web needs
only the order, which the array already carries. No uniqueness constraint
is added for the same reason — there is no write path to guard.

Alternatives considered:

- `ORDER BY (name = 'Other')`. Smallest change, but the next change lets
  the user rename categories, and the rule would silently stop applying the
  day `Other` becomes `Misc`. The migration matches by name exactly once,
  at a moment when the name cannot have been changed.
- Keep ordering in `sort_order` alone: renumber so `Other` is the maximum,
  and make `Create` insert just before it. `Create` would still have to
  find the catch-all, so this needs the same identification plus a row
  shuffle on every create.

`sort_order` stays in the API response. It now orders categories within
the non-catch-all group; the array order is the listing order. The OpenAPI
description of the listing says so.

### 2. The web takes the order from the server

After a successful create, `useCategories.create` reloads the list instead
of appending. Inserting "before the catch-all" in the browser would be a
second copy of the ordering rule.

The create resolves with the created category whether or not the reload
succeeds, so the modal can select it. If the reload fails, the category is
appended locally (today's behavior) and the hook's `error` reports the
failed load; the order corrects itself on the next load.

Alternative considered: expose `catch_all` and sort in the browser. That is
the duplicated rule this avoids.

### 3. An empty draft category resolves to the first one, in one function

`movementDraft.ts` gains `resolveCategoryId(draft, categories)`: the draft's
category when it belongs to the draft's direction, otherwise the first
category listed for that direction, otherwise `''` (nothing loaded).
`toInput` takes the categories and calls it, and the category control shows
what it returns.

The draft keeps its `number | ''` type and its initial `''`. Nothing is
written into the draft when categories arrive, so there is no effect that
could overwrite a choice made in the meantime. A direction change keeps
setting `categoryId: ''`, which now means "the first one of the new
direction".

`toInput` keeps its "Pick a category" refusal: it is still reachable while
the categories are loading, and it stays the one place that decides what
may be sent.

Alternative considered: an effect that writes the first category into the
draft once categories load. It needs a guard against clobbering, runs again
on every direction change, and has to be repeated in the edit dialog.

### 4. The control follows the select-only combobox pattern

`CategorySelect.tsx` in `features/categories/adapters/ui/` replaces the
native select. `MovementFields` passes it the categories of the current
direction, the resolved id, the colors, and the optional create handler.

- The trigger is a button with `role="combobox"`, `aria-haspopup="listbox"`,
  `aria-expanded`, `aria-controls`, and `aria-activedescendant`. Keyboard
  focus never leaves it, so closing the list needs no focus hand-back and
  the form's Tab order is unchanged.
- The popup is a `role="listbox"` rendered inline, as a sibling of the
  trigger inside the field. It is not portaled: inside the edit dialog a
  portal to `body` would sit under the dialog's top layer.
- Each choice is a `role="option"` showing `CategoryChip` (small) and the
  name, with `aria-selected` on the current one. `CategoryChip` stays the
  only place that maps a category to an icon, so the next change swaps the
  icon source in one file.
- `Create new…` is the last row, visually separated. It is a `role="option"`
  that is never selected; choosing it calls the create handler and closes
  the list. It stays a row so the arrow keys and End reach it, as the
  native select allowed. Because it never changes the value, cancelling the
  modal needs no restore.
- Escape is handled on key-down with `preventDefault()` while the list is
  open, the way `DateField` does, so the edit dialog does not receive a
  cancel. Outside pointer-down and blur close the list, also as there.
- The list has a maximum height and scrolls; the active row is scrolled
  into view.

The arrow/Home/End stepping and the starts-with match are pure functions in
`features/categories/domain/`, because that is the part vitest can cover.
Typed letters accumulate for a short window, then reset.

Alternatives considered:

- Customizable native select (`appearance: base-select`). Icons in options
  with no JavaScript, but it is not available in every browser the app is
  opened in, and it degrades to names only.
- Keep the native select and show the icon only for the selected category.
  That is today's behavior and does not meet the request.
- Move focus into the list (roving tabindex), as the calendar does. It
  needs focus management on open and close and gains nothing for a single
  column of choices.

## Risks / Trade-offs

- [A movement is recorded against the default category by mistake] → This
  is the trade the change makes on purpose. The field always shows the
  category with its icon and color, the form remembers the last category
  used, and a wrong row is corrected from the ledger.
- [The custom control loses native behavior: type-ahead, mobile picker,
  platform keys] → The keyboard set the native select offered is written
  into the spec and checked by hand in both hosts; the layout is checked at
  375 px and at 200 percent zoom.
- [The list is clipped inside the edit dialog, which scrolls] → Capped
  height with its own scroll; checked in the dialog at 1280×800 and 375 px.
- [The migration finds no `Other`] → Nothing is flagged and created
  categories list last, as today. Renaming does not exist yet, so the row
  is there on both databases.
- [`sort_order` alone no longer gives the listing order] → The web never
  sorted by it; the OpenAPI description is updated.

## Migration Plan

1. `005_category_catch_all.sql` is picked up at the next API start: the
   next `make dev` locally, the next `make prod-up` on Neon. It adds one
   column and updates one row.
2. Work and tests run against the local container only.
3. Rollback: revert the code. The column can stay unused, or be dropped
   with `ALTER TABLE category DROP COLUMN catch_all` and the
   `schema_migrations` row removed.

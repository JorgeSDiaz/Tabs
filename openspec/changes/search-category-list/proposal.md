# Proposal

## Why

The category list has outgrown its popover. With eleven expense categories
it already scrolls, and three things get in the way: the browser's default
scrollbar is a wide light-on-dark bar that belongs to no other surface of
the app; finding a category means scrolling or knowing that typing letters
jumps to a name, which nothing on screen says; and `Create new…` is the
last row of the scrolling list, so it is out of sight exactly when the list
is long enough to need it.

## What Changes

- The opened category list gets a search box above the choices. Typing in
  it narrows the choices to the categories whose name contains the text,
  ignoring letter case and accents. The list lands on the first name that
  starts with the text, so a single letter still reaches the same category
  it reaches today.
- **BREAKING** (spec): the timed type-ahead is replaced by the search box.
  Keyboard focus moves into the search box while the list is open and
  returns to the field when it closes. Space no longer chooses the entry
  the list is on — it is a character of the search; Enter chooses.
- Typing a letter on the closed field still opens the list, now with that
  letter already in the search box.
- When nothing matches, the list says so instead of showing an empty box.
- `Create new…` stays the last entry but is pinned to the bottom of the
  list: only the choices scroll, and neither scrolling nor searching hides
  it. The arrow keys and End still reach it.
- The choices scroll behind the same quiet scrollbar the ledger rail uses,
  instead of the browser's default one.

The edit dialog uses the same field, so it gets the search box and the
scrollbar too. It still offers no `Create new…`.

Not in this change: carrying the searched text into the `Create new…`
modal as the new category's name, searching by anything other than the
name, remembering the last search, and a different behavior for touch
screens.

Builds on `manage-categories` as it stands in the working tree (each choice
draws its stored icon and color). The two changes touch different
requirements, so they can be archived in either order.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `movement-entry`: the category list can be searched; `Create new…` stays
  in view; the keyboard requirement changes from type-ahead to search, and
  Space stops choosing an entry. `movement-editing` already says its
  category field is the entry form's one, operable in the same way, so it
  needs no delta.

## Impact

- `apps/web/src/features/categories/adapters/ui/CategorySelect.tsx`: the
  search box, the pinned create row, focus handling; the timed type-ahead
  is removed.
- `apps/web/src/features/categories/domain/listNavigation.ts` and its
  test: the name filter, and accent folding shared with the starts-with
  match.
- `apps/web/src/shared/ui/Icon.tsx`: a search icon.
- `apps/web/src/index.css`: the list's layout in three parts, the search
  box, and one scrollbar rule shared by the ledger rail and the category
  choices.
- No API, database, or OpenAPI change. No new dependencies.

# Design

## Context

See proposal.md for the motivation. What shapes the approach:

- `CategorySelect.tsx` follows the select-only combobox pattern: the
  trigger button is the combobox, keyboard focus never leaves it, and the
  list is a `ul[role=listbox]` that is also the scroll container.
  `Create new…` is its last `li`, so it scrolls away with the rest.
- One `active` index runs over `categories` plus the create row, and the
  row to scroll into view is found as `listRef.current.children[active]`.
- Typed letters are collected for 500 ms and matched with
  `firstStartingWith` in `domain/listNavigation.ts`. That file and its test
  are the part vitest covers; component behavior is checked in the browser.
- The list renders inline, not in a portal, because inside the edit
  `<dialog>` a portal to `body` would sit under the dialog's top layer. The
  edit dialog caps the list at 232 px so the dialog does not start to
  scroll.
- The `Create new…` modal is a native `<dialog>` opened with `showModal()`
  from an effect in `MovementForm.tsx`. On close the browser returns focus
  to whatever had it when the dialog opened — today always the trigger.
- `index.css` already has a quiet scrollbar for `.movement-list` (6 px
  thumb, no track, a Firefox fallback), written inside the wide-viewport
  media query because that is where the rail scrolls.
- The popover's surface is `--popover`; the rail's is `--surface`. The
  scrollbar thumb is mixed from `--text` and `--surface`.

## Goals / Non-Goals

**Goals:**

- One matching rule — what "the name contains the text" means — in one
  pure, tested function, shared by the filter and the starts-with match.
- `Create new…` stays a list entry for the keyboard and for assistive
  technology while it stops scrolling with the choices.
- One scrollbar rule for every scrolling list in the app.

**Non-Goals:**

- A general-purpose searchable select. The control stays the category
  field, in the categories slice.
- Ranking or fuzzy matching. Listing order is kept; only the starting row
  moves.
- Highlighting the matched letters inside each name.

## Decisions

### 1. The search box is a real input, and focus moves into it

Opening the list focuses an `<input>` at the top of the popover. Closing
with Enter, Escape, or by choosing a row with the pointer focuses the
trigger again.

The roles follow the focus. The input becomes the combobox: it carries
`role="combobox"`, `aria-expanded`, `aria-controls`,
`aria-activedescendant`, `aria-autocomplete="list"` and an accessible name
("Search categories"). The trigger goes back to a plain button with
`aria-haspopup="listbox"` and `aria-expanded`, still labelled by the field
label and the selected name.

Choosing `Create new…` focuses the trigger before it calls the create
handler. The modal opens from an effect after that, so the browser's
return of focus on close still lands on the trigger and not on an input
that no longer exists.

Alternatives considered:

- Keep focus on the trigger and draw the typed letters in a box that only
  looks like an input. No caret, no paste, no selection, and no on-screen
  keyboard on a phone — it is the current type-ahead with a label.
- Make the trigger itself the input (an editable combobox). The field's
  text would be both the selected category and the search; emptying it to
  search would contradict "the field always holds a category".

### 2. Matching lives in `listNavigation.ts`

The file gains two things and changes one:

- a fold of a name for comparison: lowercased, decomposed, combining marks
  removed, so `Café` and `cafe` compare equal;
- the filter: the entries whose folded name contains the folded text, in
  the order given; an empty text keeps every entry;
- `firstStartingWith` compares through the same fold instead of its own
  `toLowerCase()`.

The component picks the starting row as `firstStartingWith` over the
filtered names, falling back to row 0. That keeps the spec's `t` →
`Transport` although `Eating out` contains a `t` and lists earlier.

The text is not trimmed: a leading space matches a name that has that
space inside it, the same way any other character does.

Alternative considered: filter with `startsWith` only. One rule instead of
two, but `out` would not find `Eating out`, and searching a longer set by
the word one remembers is the point of the box.

### 3. `active` indexes the filtered rows

The rows the keys move through are the filtered categories followed by the
create row when it is offered. `active` is an index into that sequence,
`-1` when it is empty (no match in the edit dialog).

- Opening without a letter: the text is empty and `active` is the selected
  category's row.
- Every change of the text sets `active` in the same handler, from the
  rule in decision 2; with no match it is the create row or `-1`. It is
  set in the handler, not in an effect, so there is no render with a stale
  row.
- Choosing reads the filtered sequence, never `categories[active]`.
- The row to scroll into view is found by its id, since the rows are no
  longer the listbox's direct children.

### 4. The popover has three parts, and the listbox spans two of them

```
div.category-popover            flex column, the capped height
  div.category-search           icon + input, does not scroll
  p.category-empty [status]     always mounted; text only when no match
  div.category-list [listbox]   flex column, takes the rest
    div.category-choices        the only scroller, holds the options
    div.create-row [option]     does not scroll, top border
```

`Create new…` stays a `role="option"` inside the listbox, outside the
scroller. Arrow keys and End reach it as before, and it is announced as
the last entry. The elements become `div`s: a `ul` cannot hold the
scroller between itself and its `li`s.

The "no match" line is a `role="status"` element next to the listbox, not
inside it: a listbox may only own options. It stays mounted while the
popover is open and only its text changes, because a live region that
appears already holding its text is often not announced. With no match the
scroller is empty and collapses, so the line sits where the choices were.

When there is no option at all — no match in the edit dialog, which has no
create row — the listbox is not rendered and the input drops
`aria-controls` and `aria-activedescendant`, rather than pointing at a
listbox with nothing in it.

Preventing the default of `mousedown` stays on the whole popup, with the
input as its one exception: a press on a row, on the padding, or on the
search icon must not take focus from the input, but a press on the input
itself has to be able to place the caret.

Alternative considered: `position: sticky` on the create row inside the
single scroller. No structural change, but the scrollbar would run behind
the pinned row and into the popover's rounded corner — the misfit the
change is meant to remove.

### 5. Keys are handled where the focus is

- On the trigger (list closed): Enter, Space, ArrowDown, ArrowUp open on
  the selected row; a single printable character other than a space opens
  with that character as the text. The handler prevents the default and
  puts the character in state, so the input mounts already holding it and
  the following keystrokes land in the input.
- On the input (list open): ArrowDown, ArrowUp, Home and End go through
  `stepRow` and never move the caret; Enter chooses and is ignored while
  an input method is composing; Escape closes with its default prevented,
  so the edit dialog does not cancel; Tab closes the list and lets focus
  move on. Every other key is the input's own.

Home and End move through the entries rather than the caret. The spec's
"End, then Enter opens the create modal" is worth more than caret jumps in
a text that is a few letters long; the left and right arrows still move
the caret.

The timed prefix goes away with its state: `typed`, `TYPEAHEAD_MS` and
`typeAhead` are deleted. The key-up guard for Space was there for a
trigger that kept focus; it is removed, and put back only if Space is seen
to toggle the list shut.

### 6. One scrollbar rule for both lists

The rail's scrollbar rules move out of the media query and are grouped
with the category choices: `.movement-list, .category-choices`. Outside
the wide layout the rail does not scroll, so the rule does nothing there.

The thumb color is a custom property the grouped rule reads and each list
sets. The rail keeps the mix it has: 55 % `--text` over `--surface`, 3.19:1
against the panel. That same color is only 2.66:1 against `--popover`, so
the choices set their own: 60 % `--text` over `--popover`, 3.21:1.

Alternative considered: `scrollbar-width: thin` alone. It keeps the
browser's track and its color in Chromium, which is most of what looks
wrong.

### 7. Sizes

The choices take what the search box and the create row leave of the
popover's height cap. Both caps grow by the 46 px the search box takes, so
the list shows as many rows as it did before: `min(478px, 60dvh)` in the
entry form (at 432 px the eight seeded expense categories would overflow by
one pixel and scroll), and 278 px in the edit dialog, as long as the dialog
still does not scroll at 1280×800 and 375 px.

Where the field sits low on the page — the single-column layout at 375 px,
or 200 percent zoom — the popover's foot would open below the screen, and
with it the pinned `Create new…`. On opening, the popover is scrolled into
view with `block: 'nearest'`: the page moves only as far as it takes to
show all of it, and not at all where it already fits.

The popover is as wide as its longest name, up to its cap. Left alone it
would narrow while the search takes the long names away, so on opening it
takes the width it has as its minimum for as long as it stays open.

## Risks / Trade-offs

- [On a phone, opening the list focuses the search box and brings up the
  on-screen keyboard over part of the list] → Accepted for this slice: the
  app is used on desktops, and one behavior is simpler than two. A desktop
  browser at 375 px does not show it, so it can only be judged on a real
  phone. If it gets in the way, the follow-up is to leave focus on the
  trigger when the list was opened by touch.
- [Space no longer chooses the entry the list is on] → It has to type a
  space for names like `Eating out`. Enter chooses, as in every search
  list; the spec says so.
- [Enter after a text that matches nothing opens the create modal with an
  empty name] → The modal can be cancelled and nothing is created. Carrying
  the text into the modal is the obvious next step and is left out until
  use asks for it (see proposal.md).
- [`role="option"` rows are no longer direct children of the listbox] → A
  plain `div` between them is transparent to the accessibility tree; the
  tree is read back in the browser as part of verification.
- [Fewer rows visible in the edit dialog] → The cap grows with the search
  box (decision 7), and searching shortens the list anyway.
- [The in-flight `manage-categories` change has uncommitted edits to
  `CategorySelect.tsx` and `index.css`] → This change is applied on top of
  that working tree; nothing of it is reverted or restated.

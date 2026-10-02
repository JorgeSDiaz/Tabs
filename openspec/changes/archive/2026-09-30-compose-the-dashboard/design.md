## Context

`App.tsx` renders the movement form, cycle summary, customization button, four optional widgets, and movement list sequentially. `index.css` caps the root at 760px and styles most regions alike. `WidgetSection` returns a fragment rather than a layout container. The movement list has no heading and uses flex rows whose date, category, note, amount, and delete control compete for space.

Existing specs require the entry form at the top, autofocus on amount, direction-filtered categories, retained values after saving, and four independently toggleable server-persisted widgets. Those contracts guide composition.

The approved refinement uses `design-taste-frontend` and `redesign-existing-projects`: audit first, hierarchy over repeated cards, coherent typography and purposeful interaction feedback. Design variance is 4/10, motion intensity 2/10, and visual density 6/10. Marketing imagery and cinematic patterns are inapplicable to a daily ledger. Tooling is available through `mise exec`.

## Goals / Non-Goals

**Goals:** Make entry immediately discoverable, establish a recognizable visual identity, improve cycle comprehension and ledger scanning, and work comfortably on desktop and mobile.

**Non-goals:** New business behavior, sidebar destinations without corresponding screens, new APIs, changed currency/date conventions, or replacing the existing React/Recharts stack.

## Decisions

### 1. A bright, precise financial workspace

User review rejected the warm forest palette as too muted. Replace it with a bright cobalt identity, crisp cool-neutral surfaces, emerald income and coral expenses. Light tokens: canvas `#f2f6ff`, surface `#fefeff`, text `#152442`, muted `#536582`, accent `#2456eb`. Dark mode uses an ink-blue canvas `#0b1222`, separated navy surfaces `#18253e`, and a vivid cobalt action `#4269f5`. Income and expense tiles use their own restrained semantic tints, with stronger color on figures and direction markers. The net chart uses the shared cobalt accent. Verify text, button, and focus contrast in both modes. Financial direction retains explicit labels/signs alongside color.

Use locally bundled Geist Sans with a system sans fallback and tabular numerals for money. Page title approximately 28–36px; lead financial figure 32–44px; section headings 18–20px; body 14–16px. Spacing follows 4/8/12/16/24/32/48px tokens; controls use 8px radii, panels/dialogs 12px. Shadows are primarily for overlays. Keep the form contained, the cycle overview open, and ledger rows separated by quiet rules. The browser title identifies Tabs.

### 2. Explicit desktop and mobile composition

Replace the narrow root with a centered shell of approximately 1200px and fluid gutters. Arrange the page as:

```text
Tabs / personal ledger                         Current cycle dates
Record a movement ...............................................
Amount | Direction | Category | Date        Note | Save movement
Cycle overview: balance prominent, income / expenses subordinate
Insights                                             Customize
Enabled scalar tiles (compact) / chart panels (wide)
Movements
Date        Category / Note                    Amount      Action
```

The header is compact identity and context, not an extra dashboard panel. The form remains the first functional section, above the summary and widgets, with its amount and submit action visually emphasized. It is not hidden in a modal or collapsed behind an action.

At 1024px and above, use a four-column analytics grid: net balance spans two columns, scalar widgets share the rest, and category distribution spans the full row. Remaining widgets expand when neighbors are hidden; preserve catalog DOM order and avoid dense placement. At 768–1023px use two columns, with charts spanning both. Below 768px all regions stack; entry fields become full-width as needed. No fixed panel heights for text or reserved slots for disabled widgets. Chart plots get explicit responsive container heights, leaving their headings and legends in normal flow. At 200% zoom layout follows the available CSS viewport.

### 3. Give existing components clear presentation responsibilities

`App.tsx` owns page regions and semantic headings. `CycleSummary` owns an integrated overview with the net balance as its largest figure. The summary remains the stable exact-numbers overview when widgets are hidden; scalar widgets are subordinate optional analytics, not additional competing hero cards.

`WidgetSection` owns the grid and assigns classes by existing widget identity. Existing widgets and `StatTile` own their internal presentation. `WidgetPicker` stays next to the insights heading. Adapt chart colors, axes, labels, and tooltips to the same tokens, including dark preference. Preserve the current widget catalog and calculations.

`MovementForm` keeps its state and submission logic while gaining structured field groups and a clear primary button. Category creation and widget dialogs share overlay styling and retain native dialog keyboard behavior. Preserve autofocus and post-save focus; style focus visibly.

`MovementList` becomes a named ledger section, with consistent desktop column alignment, right-aligned amounts, secondary notes, and visually quieter but accessible delete controls. On narrow screens, each movement becomes a compact row with wrapped metadata and visible amount/action. Use semantic list markup with decorative column labels if keeping the existing list; do not pretend a list is a table using incomplete ARIA roles. Preserve source order.

### 4. States and accessibility are part of the layout

Loading indicators occupy their corresponding regions and must not display fabricated totals. Empty states use short contextual text and leave entry usable. Errors are legible near the affected form or in the existing page error region. Long notes/categories wrap without pushing amounts/actions outside the viewport. Controls retain explicit labels, visible keyboard focus, and approximately 44px touch targets. Dialogs fit the viewport and scroll internally when necessary. Keep readable text alternatives for chart values. Any added animation honors reduced-motion preferences.

### 5. Keep the change in existing UI adapters

Expose initial-loading and refresh state from the existing movement/cycle/category hooks so an initial empty array is not mistaken for a successfully loaded empty ledger. Retain loaded content during refresh, announce save results without moving focus, and show deletion failures inline. Check every widget combination and provide exact chart values without requiring hover, including direction labels for categories.

Use CSS custom properties and meaningful component classes in the existing stylesheet. Avoid broad selectors that couple every `section` to the same card shape. Reuse React, native controls/dialogs, and Recharts. Extract shared UI only when the implemented design supplies an actual repeated caller. Financial formatting stays in `shared/lib/money.ts`.

## Risks / Trade-offs

- The direction is approved for implementation; the first rendered pass remains subject to user feedback.
- Overview and optional totals overlap informationally: distinguish the stable overview from the smaller optional analytics rather than altering saved widget semantics.
- CSS grid can accidentally reorder content: preserve DOM order and avoid dense auto-placement.
- Narrow charts and large amounts may overflow: verify at 375px and 200% zoom with long labels and large values.
- Appearance work can disturb entry focus or dialogs: verify the existing daily-entry interaction end to end.

## Migration Plan

Apply as a web-only change after proposal review. Run web lint/build, then use the app against disposable local data for entry, category creation, widget persistence, and deletion. Capture desktop/mobile evidence in both color schemes. Record the user-use outcome before calling the change complete. Rollback consists of reverting the UI change; no data migration is involved.

## Open Questions

The user approved implementation of the Taste-informed direction, with refinement after seeing the running interface. Real-use feedback remains the final acceptance step.

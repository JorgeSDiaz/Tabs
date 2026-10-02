## Why

Tabs currently presents useful finance features as equally weighted boxes in a 760px vertical stack. Recording, cycle totals, widget customization, charts, and movements compete for attention without a visual hierarchy. The first usable design pass should make the current cycle understandable and daily entry inviting.

## What Changes

- Compose a responsive dashboard with an identity/period header, a prominent always-visible entry area, a coherent cycle overview, proportionally sized analytics, and a readable movement ledger.
- Establish a bright, precise visual direction refined from user feedback: cool-neutral surfaces, cobalt interaction accent, emerald income and coral expense tones, deliberate type scale, and tabular financial figures.
- Give scalar widgets compact footprints and chart widgets larger footprints; enabled widgets reflow without leaving reserved holes.
- Restyle entry controls, customization, category creation, empty/loading/error states, and movement rows as one interface.
- Bundle Geist Sans locally and distinguish initial loading from a loaded empty cycle through the existing hooks. Compose the workflow as record, understand, then review.
- Preserve the existing top-of-dashboard entry contract, widget selection persistence, and financial behavior.

## Capabilities

### New Capabilities
- `dashboard-composition`: Responsive hierarchy, visual consistency, accessible presentation, and readable dashboard states.

### Modified Capabilities

None. Existing movement-entry and dashboard-widgets behavior remains the acceptance baseline; the form remains the first functional region below the identity header.

## Impact

Primarily `apps/web/src/index.css`, `apps/web/src/app/App.tsx`, existing UI adapters and loading-state hooks in cycles, dashboard, categories, and movements, plus a bundled font dependency. No API, database, or financial calculation changes are required. Browser verification is required alongside the web build and lint checks.

## Non-Goals

New financial features, navigation destinations, widget types, user-controlled rearrangement, historical-cycle queries, localization, and a new component-library dependency.

# Proposal

## Why

The dashboard is a fixed composition (cycle summary, form, list) that shows
the same things to every future version of "me" across machines. The user
wants to choose which graphical views of the active cycle they actually
look at, and wants that choice to survive closing the browser and to follow
them between machines — the same guarantee the ledger has, since a browser
cookie jar would strand the choice on one device.

## What Changes

- A new **dashboard widget** capability: the panel shows 4 predefined
  graphical widgets for the active cycle — net balance, total in, total
  out, and category distribution — plus a "Customize" control that lets
  the user enable/disable each widget with a switch.
- The choice persists server-side: new `GET`/`PUT` endpoints for widget
  settings, stored in the single-user `settings` row so the selection
  follows the user across machines (confirmed decision: server-side, not
  localStorage).
- The "Register movement" form becomes a pinned component: it is always
  visible at the top of the screen and can never be hidden by widget
  customization.
- Charts render with a charting library added to `apps/web` (confirmed
  decision: a library is allowed; "no third-party graphics" meant no
  externally hosted chart services, not no library). A fixed set of
  chart types ships with the 4 widgets; no user-configurable chart types.
- All widget data comes from the existing active-cycle endpoints
  (`GET /api/v1/cycles/current` and `GET /api/v1/movements`); category
  totals are aggregated client-side. No new analytics endpoint.

Non-goals (from the request): drag-and-drop reordering, fully custom
layouts, exporting/printing the dashboard, multi-cycle trend charts.

## Capabilities

### New Capabilities

- `dashboard-widgets`: the widget catalog, enable/disable selection with
  server-side persistence, the fixed movement-entry component, and the
  four predefined graphical widgets over the active cycle.

### Modified Capabilities

<!-- None: movements and movement-entry requirements are unchanged. The
     form being pinned is additive behavior specified in dashboard-widgets;
     no existing requirement is relaxed or altered. -->

## Impact

- **API** (`apps/api`): new `dashboard` slice (`internal/dashboard/`)
  with `GET/PUT /api/v1/dashboard/widgets`; new migration adding a
  `dashboard_widgets` JSONB column to the existing `settings` row.
- **Web** (`apps/web`): `App.tsx` restructured into a widget panel; new
  `features/dashboard/` slice following the existing
  `domain/application/adapters` layout; `recharts` added as a dependency;
  OpenAPI spec (`openapi/tabs.yaml`) and generated `schema.d.ts` updated.
- **Data**: additive schema change only; existing behavior untouched.

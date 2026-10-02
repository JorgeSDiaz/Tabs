## 1. Establish the visual system and page composition

- [x] 1.1 Review the visual direction with Taste and redesign skills; incorporate the user-approved refinements before implementation.
- [x] 1.2 Bundle Geist Sans locally and define light/dark color, spacing, typography, radii, focus, and responsive shell tokens in `apps/web/src/index.css`.
- [x] 1.3 Compose the identity/period header, top entry region, overview, insights heading/customization, and named ledger in existing UI adapters and `App.tsx`.

## 2. Shape the daily entry and cycle overview

- [x] 2.1 Style and group movement fields with an emphasized amount and primary save action; preserve focus, defaults, filtering, and retained values.
- [x] 2.2 Give the cycle overview a lead net balance and subordinate income/expense figures using existing formatting and data.
- [x] 2.3 Align category and customization dialogs with the visual system, keyboard focus, and mobile viewport sizing.

## 3. Compose analytics and ledger

- [x] 3.1 Add responsive widget grid sizing by existing widget identity, preserving catalog order and selection behavior without reserved hidden slots.
- [x] 3.2 Apply coherent chart colors, axes, labels, tooltips, empty states, and scalar typography in both color schemes.
- [x] 3.3 Implement aligned desktop ledger rows and compact mobile rows with readable long content, signed amounts, and accessible delete actions.
- [x] 3.4 Expose initial-loading/refresh state in existing hooks and integrate loading, empty, error, disabled, save/delete feedback, and focus states across regions; honor reduced motion for any new animation.

## 4. Verify the usable slice

- [x] 4.1 Run `openspec validate compose-the-dashboard --strict` in an environment with OpenSpec installed; resolve artifact issues before implementation.
- [x] 4.2 Run `pnpm --filter web lint` and `pnpm --filter web build` after implementation.
- [x] 4.3 Verify populated/empty/loading/error layouts at 1440px, 768px, and 375px, plus 200% zoom, light/dark preference, long categories/notes, and large amounts; capture browser evidence.
- [x] 4.4 Exercise amount autofocus, both directions, inline category creation/cancel, consecutive saves, and deletion against disposable local data; confirm overview and widgets refresh correctly.
- [x] 4.5 Toggle every widget, hide all, reload to confirm persistence, and verify keyboard dialog navigation and visible focus.
- [ ] 4.6 Record a real user-use pass and its findings; address composition problems before marking the change complete.

## Verification notes (2026-09-21)

- User feedback: the initial warm/forest palette feels muted. Refine to cobalt with brighter neutral surfaces, emerald/coral financial semantics, and clearer dark-mode surface separation; visual acceptance remains pending.
- Palette refinement verified: computed WCAG contrast >= 4.5:1 for primary button, tile figures/captions, header caption, and inputs in both themes; full interaction/widget/state suites re-run green after the change; screenshots `tabs-cobalt-{light,dark}-{1440,375}.png`.

- Tooling works through `mise exec --`; OpenSpec strict validation, web production build, and TypeScript check passed. Lint has zero errors and one existing warning in `useWidgetSettings.ts`; Vite reports the existing large-bundle warning.
- Browser verification used headless Edge with the real Go API and isolated local Postgres database `tabs_design_review`. The active preview at `http://localhost:5173` uses that database, containing three test movements rather than the user's ledger.
- Checked all 16 widget combinations at 1440, 768, and 375 CSS pixels for page overflow, catalog order/count, and unfilled rows. Checked server persistence after reload, keyboard focus, modal Escape/cancel/reopen, and local category creation.
- Captured populated, empty, loading, and failed-request states in both color schemes at all three widths. Long-content/large-value fixtures were browser-only responses. Zoom reflow was emulated with a 720 CSS-pixel viewport corresponding to a 1440px window at 200%; native browser zoom was not directly exercised.
- Browser run produced no uncaught page errors. Fixed a tooltip overflow on viewport shrink, category-dialog rapid reopen after Escape, and accessible markup findings. Lighthouse on the dark preview reports accessibility 100 and best practices 100; its SEO-only robots.txt finding is outside this local-app change.
- Review scripts and screenshots are under `C:/Users/j3d1d/AppData/Local/Temp/opencode/`: `tabs-design-check.mjs`, `tabs-state-check.mjs`, `tabs-light-1440.png`, `tabs-light-375.png`, `tabs-dark-768.png`, and `tabs-state-*.png`.
- User review/use is intentionally pending; do not archive until feedback has been incorporated.

- 2026-09-30: Closed by user decision before 4.6. The visual direction is superseded by `restyle-dashboard-streak-dark`, which modifies `dashboard-composition`; its real-use pass happens there.

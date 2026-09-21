# Tasks

## 1. Category priority rule

- [x] 1.1 In `apps/web/src/features/categories/domain/category.ts`, add module-private `IN_PRIORITY` and `OUT_PRIORITY` name lists (design Decision 1) and export `orderedForDirection(categories, direction)`: priority categories first in their list order, the rest in server order, selection never mutated — verify with `pnpm --dir apps/web build` (tsc) and `pnpm --dir apps/web lint` passing

## 2. Form readiness

- [x] 2.1 In `MovementForm.tsx`, add a `useRef` on the amount input and focus it on mount via `useEffect` — verify: with `make dev`, opening the app puts the caret in Amount with no click (spec: Focus on first appearance)
- [x] 2.2 Render the category `<option>`s through `orderedForDirection(categories, direction)` — verify: switching Direction between Out and In reorders the dropdown (Income first for `in`; Groceries/Eating out/Transport/Housing/Subscriptions first for `out`), no option disappears, and a selected category stays selected across the switch
- [x] 2.3 After a successful save, focus the amount field again (end of the success path in `handleSubmit`) — verify: record two movements in a row; after Save the caret is back in Amount, while direction, category, and date keep the values used (spec: Focus returns after a save; Second movement of the day reuses the setup)

## 3. Verification against the spec delta

- [x] 3.1 Walk every scenario in `specs/movement-entry/spec.md` manually against `make dev` (fresh load focuses Amount and shows today's date; save keeps direction/category/date and clears amount/note; reload resets date to today and unselects the category), confirming the no-change lock-in scenarios hold as written
- [x] 3.2 Run `make test` (Go suite — must stay green; no API change is expected) and `pnpm --dir apps/web build`, and record the outcome

## 4. Ship

- [x] 4.1 Update the web dev loop with one real session of multi-entry use (record several same-day movements) and adjust the two priority lists in 1.1 if the ordering fights real habits, then commit with the `✨` gitmoji prefix

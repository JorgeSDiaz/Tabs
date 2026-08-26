## Context

See `proposal.md` — *Why*. Two things shape this design beyond that:

1. `record-and-read-a-cycle` already commits to specifics this scaffold
   must match: three capabilities behind five endpoints (`POST/GET/DELETE
   /movements`, `GET /categories`, `GET /cycles/current`), a single
   cycle-boundary function (task 2.1), and `openapi/tabs.yaml` as the
   hand-written contract the frontend generates types from (task 3.6).
2. The constitution's current *Architecture direction* forbids the
   layout chosen here (`ports/` with a single implementation,
   `application/` for a single-query use case). That section is rewritten
   as part of this change — see *Decisions* below — because a change
   cannot honestly document a layout its own constitution still forbids.

## Goals / Non-Goals

**Goals:**
- Give `/opsx:apply` (on this change) an exact, unambiguous tree to
  create — every folder, every root config file, every command.
- Make the constitution and the documented layout agree, so future
  `/opsx:propose`/`/opsx:apply` runs don't inject a rule the codebase
  violates.

**Non-Goals:**
- Creating any of the documented files or folders — that's `tasks.md`,
  executed by a later, separate `/opsx:apply`.
- Choosing UI libraries (Tailwind/Radix/shadcn), writing the OpenAPI
  contract body, or provisioning Neon — each belongs to the change that
  actually needs it.

## Decisions

**The mixed architecture: screaming + vertical slicing + clean
layers, uniform across every slice.** Each slice folder screams the
domain (`movements`, not `handlers`), owns its full stack (a capability
is not split across a `controllers/` and a `services/` top-level), and
internally separates `domain/` → `ports/` → `application/` → `adapters/`
with dependencies pointing inward. Every slice gets the *same* five
folders — there is no per-slice invention to learn, and a slice that
wants a sixth folder is a signal to re-read the slice boundary, not to
add one.

*Alternative considered:* flat slices (files, no layer folders), which
is what the current constitution text describes. Rejected per David's
explicit choice — this change exists specifically to authorize the
richer layout.

**Why Caudal's identical-looking structure is not evidence against
this.** Caudal already had `domain/ports/application/adapters` per
slice, and it still went wrong — but not because of the layering. It
went wrong because:
- `expenses/` and `incomes/` were two slices that should have been one
  (constitution rule 5) — every layer got duplicated *across slices*,
  which layering inside a slice doesn't cause or fix.
- Packages existed that nothing called: `platform/clock`, a
  `httpx.DomainError` every router bypassed, a pinned-but-unused OpenAPI
  generator (rule 4's evidence).

Tabs keeps the per-slice layering and removes both actual causes: one
`movement` slice with a `direction` field instead of two slices, and no
package created before something needs it (see the exclusions below).

**Three slices, matching `record-and-read-a-cycle` exactly:**
`movements`, `categories`, `cycles`. `cycles/domain` is where the single
boundary function (task 2.1) lives; `movements`' and `categories`'
`application/` layers are where task 3.1–3.4's use cases live one each,
not bundled into a shared service.

**`openapi/` lives at the repo root**, not `apps/api/openapi/` as
Caudal had it — both apps consume the same contract file
(`record-and-read-a-cycle` task 3.6 already targets
`openapi/tabs.yaml`; task 4.1 generates `apps/web`'s types from it), so
neither app should appear to "own" it.

**The frontend mirrors the backend's vocabulary but drops `ports/`.**
`features/<slice>/{domain,application,adapters/{api,ui}}` — no `ports/`,
because a React hook has no second implementation to swap; inventing an
interface for one consumer is exactly the ceremony rule 4 targets, on
either side of the stack.

**Two deliberate breaks from Caudal's frontend layout:**
- No Tailwind/Radix/shadcn dependency yet — that's a UI decision for the
  change that builds the actual screen (`record-and-read-a-cycle` 4.3),
  not for a scaffold with no screen.
- One `shared/ui/` for cross-slice components, not Caudal's split
  between `components/` and `shared/components/` — that split carried
  no distinction in practice.

**Toolchain, pinned to what's already proven or already installed:**
- Go 1.26 (1.26.5 is installed locally), module `tabs-api` (mirrors
  Caudal's `caudal-api` naming, adjusted for the new name).
- Vite + React 19 + TypeScript, `openapi-typescript` + `openapi-fetch` —
  Caudal's exact frontend data-fetching approach, which design.md for
  `record-and-read-a-cycle` already endorses ("the frontend never
  hand-writes a type that duplicates the contract").
- pnpm workspace (pnpm 11 is installed) + a root `Makefile` for common
  commands (`make api`, `make web`, `make test`, ...) — chosen over a
  bare two-project repo so `AGENTS.md`'s Commands section (currently
  "not yet defined") has one place to point to.

**Packages deliberately excluded from the documented tree:**
`platform/clock`, `platform/httpx`, `platform/logging`. These are
specifically the packages Caudal shipped and nothing ever called. They
are not "deferred" to a future task in this change — they are simply
absent from `tasks.md`; whichever future change first needs a seam
(e.g., a test needing to control time) adds the package that change
actually requires.

## Risks / Trade-offs

- **Clean layers add navigation overhead for a single-user, three-slice
  app.** Five folders per slice for what might be a 40-line use case is
  more ceremony than the constitution's default "start flat" stance
  would produce on its own. Accepted: this is David's explicit
  architectural choice, made deliberately, not a default drifted into.
- **The constitution amendment changes a rule every future change reads.**
  If the layering proves too heavy in practice (an `application/` file
  that's a single one-line pass-through to `adapters/postgres`, for every
  slice, every time), the fix is another constitution amendment, per
  rule 8 — spec changes before code changes, not silent flattening in
  one slice while others stay layered.
- **`skip_specs: true` on a structural change is judgment-based.** If a
  later reviewer disagrees that folder layout is behavior-free, the fix
  is to add a `specs/` capability retroactively before `/opsx:apply` —
  cheap, since nothing has been built against the current call yet.

## Migration Plan

Not applicable — no existing code or deployed system to migrate. This
change only edits planning documents and the constitution; the physical
scaffold itself is `tasks.md`, executed by a later `/opsx:apply`.

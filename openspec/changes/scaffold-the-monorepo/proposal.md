## Why

`record-and-read-a-cycle` is fully specified but has no repository to
land in — `apps/api` and `apps/web` do not exist. The target layout
(vertical slicing + clean architecture + screaming architecture) is a
real decision with trade-offs, not an obvious default, so it needs to be
written down and agreed before any file gets created — and the current
constitution's *Architecture direction* says the opposite of what's
chosen here, so that section has to change too, before it contradicts
its own codebase.

## What Changes

- Document the target folder tree for `apps/api` (Go) and `apps/web`
  (React), the toolchain each will use, and the reasoning behind the
  chosen mixed architecture — see `design.md`.
- Record every actual folder, file, and command as unchecked tasks in
  `tasks.md`, to be created later by `/opsx:apply` on this change.
- **Amend `openspec/config.yaml`'s *Architecture direction*** to permit
  full clean layers (`domain/`, `ports/`, `application/`, `adapters/`)
  per vertical slice, replacing the current "start flat" direction,
  with guardrails that keep the layering from degenerating the way
  Caudal's did (see `design.md`).

This change is **documentation and repo-structure planning only**. No
`apps/` directory, `go.mod`, `package.json`, or any source file is
created by this change; those are `tasks.md` items left unchecked for a
later, separate `/opsx:apply`.

## Capabilities

### New Capabilities
(none — this change has no user-observable behavior; it is pure
tooling/structure. `skip_specs: true` is set in `.openspec.yaml`.)

### Modified Capabilities
(none — see above)

## Impact

- `openspec/config.yaml` — the *Architecture direction* section is
  rewritten.
- `AGENTS.md`, `README.md` — get doc-update tasks for once the scaffold
  physically exists (not performed by this change).
- No product code, migrations, or dependencies are affected — nothing
  exists yet for this change to touch.

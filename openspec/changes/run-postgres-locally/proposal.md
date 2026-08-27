## Why

`record-and-read-a-cycle` is fully implemented in the working tree, but
it has never run against a real database: its task 1.1 ("Provision the
Neon project and put the connection string in `apps/api/.env`") is
still unchecked, no `.env` exists, and every end-to-end verification
task behind it (5.2, 5.3, 5.3b, 5.4) is blocked. Constitution rule 1
says a change is done after a real cycle of use — right now nothing can
be used at all.

Developing directly against the Neon project would be the wrong loop
even once it exists: `main.go` runs the migration step on every boot,
so a half-finished migration or a bad manual query lands straight in
the real ledger, and there is no safe way to wipe and start over when
the target is production.

This change gives development a disposable local Postgres, so the real
ledger on Neon is only ever touched deliberately.

The constitution currently forbids this outright. Its Product section
says *"Postgres hosted on Neon (no Docker volumes to move between
machines)"* — naming Docker as the thing rejected. Per rule 8 (the spec
changes before the code), amending that sentence is part of this
change, the same way `scaffold-the-monorepo` had to rewrite
*Architecture direction* before it could scaffold the layout it
described.

## What Changes

- A `docker-compose.yml` at the repo root running Postgres locally.
- `make db-up` / `db-down` / `db-reset` targets.
- `apps/api/.env.example` carries the local connection string as its
  default value, with a comment pointing at Neon for the real ledger.
- **Amend `openspec/config.yaml`'s *Product* section** so Neon keeps
  owning the ledger and a disposable local container backs
  development — narrowing the sentence rather than deleting its
  reason: nothing in the local container is worth carrying between
  machines, unlike the ledger itself.

### Explicitly out of this change

- **Seed data.** The existing migrations already seed categories and
  the settings row; nothing further is needed to develop against an
  empty ledger.
- **Integration tests / testcontainers.** Out of scope for this change;
  the local database is for manual development only.
- **A migration tool.** `postgres.Migrate` already applies every
  embedded `*.sql` file on boot, in order, inside its own transaction —
  a fresh container is schema-current after one `make api`. Adopting
  goose or golang-migrate would be a dependency with no problem to
  solve (rule 4).
- **Any `APP_ENV`-style switch.** `config.Load()` already reads
  `DATABASE_URL` from the environment or a CWD-relative `.env`; since
  `make api` runs from `apps/api`, that file alone decides which
  database gets used. Adding a second variable would give the feature
  a shape its current use doesn't require (rule 2).
- **Editing `record-and-read-a-cycle`'s artifacts.** Its `design.md`
  still says "No Docker for the database" — left as the historical
  record of a decision this change supersedes, not rewritten in place.

**This change is planning only.** No `docker-compose.yml`, no
`Makefile` target, no `.env.example` or `AGENTS.md` edit, and no
constitution edit is performed by it — each is an unchecked item in
`tasks.md`, to be carried out by a later, separate `/opsx:apply`.

## Capabilities

### New Capabilities
(none — this change has no user-observable behavior; it is
dev-environment tooling only. `skip_specs: true` is set in
`.openspec.yaml`.)

### Modified Capabilities
(none — see above)

## Impact

- `openspec/config.yaml` — the *Product* section's Postgres sentence is
  narrowed.
- `docker-compose.yml` — new, repo root.
- `Makefile` — three new targets (`db-up`, `db-down`, `db-reset`).
- `apps/api/.env.example` — default value changes from empty to the
  local connection string.
- `AGENTS.md` — Commands section gains the new targets.
- No Go, TypeScript, SQL, or dependency changes. `apps/api`'s and
  `apps/web`'s source trees are untouched.

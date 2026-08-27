## Context

See `proposal.md` — *Why*. Two things shape this design beyond that:

1. `apps/api/internal/platform/config/config.go`'s `Load()` already
   reads `DATABASE_URL` from the environment, falling back to a
   CWD-relative `.env`; the root `Makefile`'s `api` target runs `cd
   apps/api && go run ./cmd/api`, so `apps/api/.env` already decides
   which database the app talks to. No code change is needed to switch
   between local and Neon.
2. `apps/api/internal/platform/postgres/postgres.go`'s `Migrate`
   applies every embedded `*.sql` file, in lexical order, inside its
   own transaction, on every boot. A fresh container therefore reaches
   the current schema from a single `make api` — the same property
   that lets `make db-reset` be cheap and safe.

## Goals / Non-Goals

**Goals:**
- Let `record-and-read-a-cycle` be verified end to end against a real
  database that is safe to reset.
- Keep Neon as the single real ledger, changed only deliberately.
- Reconcile the constitution with a containerized development
  database, narrowly, without discarding the reason Neon was chosen.

**Non-Goals:**
- Provisioning the Neon project itself — that is
  `record-and-read-a-cycle` task 1.1, unaffected by this change.
- Seed data, integration tests, or a migration tool — see
  `proposal.md`'s *Explicitly out of this change*.
- Creating `docker-compose.yml`, the `Makefile` targets, or any other
  file this change describes — that is `tasks.md`, executed by a
  later, separate `/opsx:apply`.

## Decisions

**Neon keeps the ledger; Docker gets development.** The constitution's
original parenthetical — no Docker volume to carry between machines —
protects data worth keeping. The local container holds none: it is
disposable, reset on demand, and never the source of truth. Narrowing
the Product sentence to say this preserves the reason instead of
deleting it.

**`DATABASE_URL` is the only switch.** No `APP_ENV`, no second
environment variable, no branching config-loader code. `config.Load()`
already does exactly what's needed (see *Context* above).
*Alternative considered:* an environment-aware config loader that picks
a database by an explicit mode flag — rejected, it adds a branch with
a single caller and no problem `DATABASE_URL` doesn't already solve
(rule 4).

**Migrations stay hand-rolled and boot-applied.** `postgres.Migrate`
already makes a fresh container schema-current after one `make api`;
that is exactly what makes `make db-reset` safe to run repeatedly.
Adopting goose or golang-migrate would add a dependency and a second
way to apply schema, solving nothing this change needs solved (rule 4).

**`docker-compose.yml` lives at the repo root**, not `apps/api/`.
`make db-up` and friends live in the root `Makefile`, and this is
repo-level dev scaffolding, not part of the API's deployable unit.
*Alternative considered:* `apps/api/docker-compose.yml` — rejected
because the root `Makefile` would need an extra `cd`, and — unlike
`openapi/tabs.yaml`, which sits at the root because *both* apps consume
it (`scaffold-the-monorepo`'s reasoning) — the reason here is tooling
ownership, not shared consumption by two apps.

**Pinned to `postgres:17-alpine`.** The Neon project doesn't exist yet
(`record-and-read-a-cycle` task 1.1 is still open), so there is no
running prod version to match exactly — 17 is what Neon provisions by
default today, so dev and prod are expected to agree on the major
version once the project is created. Alpine for a fast, small image.
In the spirit of rule 7 (names match reality across layers): the local
major version should not silently diverge from the real one.

## Risks / Trade-offs

- **The constitution amendment changes a rule every future change
  reads.** If a container-based workflow proves wrong in practice, the
  fix is another constitution amendment, per rule 8 — not a silent
  reversion in one change while the doc still says otherwise.
- **`skip_specs: true` on a tooling change is judgment-based.** If a
  later reviewer disagrees that a local database has no
  user-observable behavior, the fix is to add a `specs/` capability
  retroactively before `/opsx:apply` — cheap, since nothing is built
  against the current call yet.
- **Docker becomes a prerequisite for development on a new machine.**
  Accepted: `docker compose` v2 was confirmed present on this machine
  (Docker 29.7.2, Compose 5.5.0) before writing this proposal, and it
  is the same tool most contributors already have for any other
  project.

## Migration Plan

Not applicable — this change adds a new, disposable database, not a
change to an existing one. Neon and its data (once provisioned) are
untouched by anything here.

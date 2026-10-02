## Why

Neon is provisioned and its schema verified, but the production stack —
the run mode that touches the real ledger — has no launch path of its
own. The only run mode that exists is `make dev` on the host, and the
database it talks to is whichever `apps/api/.env` names. Pointing that
file at Neon (as `record-and-read-a-cycle` task 1.1 originally pictured)
means every future `make dev` — every half-finished migration, every
exploratory query — runs against the real ledger: exactly the loop
`run-postgres-locally` existed to prevent. Production and development
need separate launch paths that coexist on one machine: dev stays on
the host against the disposable container, prod runs containerized
against Neon on ports that never collide with dev's.

## What Changes

- `docker-compose.yml` at the repo root — the repo's single compose —
  runs the app: `api` (built from a new `apps/api/Dockerfile`) and
  `web` (built from a new `apps/web/Dockerfile`, nginx serving the
  Vite build and proxying `/api` to the api service). No database
  service — the production database is Neon.
- The dev database stops being a compose: the previous single-service
  `docker-compose.yml` is deleted, and the disposable Postgres becomes
  its own image — `db/Dockerfile` (`FROM postgres:17-alpine`, dev
  credentials and healthcheck baked in) — run by the Makefile's
  `db-up` / `db-down` / `db-reset` with plain `docker build/run/rm`
  against the existing named volume. A one-service compose was
  indirection without orchestration; an image plus three Makefile
  lines is its honest shape.
- Host ports distinct from the dev defaults: web on **8090** (dev:
  5173), api on **8091** (dev: 8080), so both stacks can run at once.
- `.env.prod` at the repo root (gitignored) holds the Neon
  `DATABASE_URL`; the compose api service consumes it via `env_file`.
  The credential never lands in a committed file.
- Makefile targets `prod-up` / `prod-down` drive the single compose;
  `db-up` / `db-down` / `db-reset` drive the dev db container with
  plain `docker` commands, no compose.
- **Revert `apps/api/.env` to the local dev value** (mirror of
  `.env.example`): from now on dev always boots local, and the prod
  switch is `make prod-up`, not editing `.env`.
- `.gitignore` gains `.env.prod`.
- `AGENTS.md`'s Commands section gains the new targets and a one-line
  run-mode map.

### Explicitly out of this change

- **TLS, public exposure, or auth in front of the app.** The prod stack
  serves localhost on a personal machine, same as today's host run.
- **A separate migrate job or entrypoint wrapper.** Boot-applied
  `postgres.Migrate` is already the deployment path; the prod container
  uses it unchanged.
- **Image registries, CI, or healthcheck orchestration.** Personal
  scale: `prod-up --build` on the machine that uses the app.
- **Backing up the Neon ledger.** A documented habit (`pg_dump` /
  manual snapshots), not a compose service.
- **Any Go or TypeScript source change.** The web app already speaks
  same-origin `/api` (vite's dev proxy); nginx reproduces that topology
  in prod, so neither app needs to know which stack it runs in.

## Capabilities

### New Capabilities
(none — deployment tooling only; no user-observable product behavior
changes. `skip_specs: true`, same precedent as `run-postgres-locally`.)

### Modified Capabilities
(none — see above)

## Impact

- `docker-compose.yml` — rewritten: was the single-service dev-db
  compose, now the repo's only compose, running api+web against Neon.
- `db/Dockerfile` — new; owns the postgres pin and the dev credentials.
- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf` —
  new.
- `.env.prod` — new, gitignored; carries the Neon connection string.
- `.gitignore` — gains `.env.prod`.
- `Makefile` — two new targets (`prod-up`, `prod-down`); `db-up`,
  `db-down`, `db-reset` rewritten without compose.
- `apps/api/.env` — reverts to the local dev value.
- `AGENTS.md` — Commands section gains the new targets and the run-mode
  map.
- No Go, TypeScript, SQL, or dependency changes.

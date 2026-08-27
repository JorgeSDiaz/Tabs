## 1. Constitution amendment

- [x] 1.1 Rewrite the last sentence of `openspec/config.yaml`'s Product
      section so Neon holds the ledger (the one copy that must follow
      the user between machines) and development runs against a
      disposable local Postgres container that holds nothing worth
      moving. Verify by reading the Product section end-to-end and
      confirming it no longer rejects Docker outright, and that the
      original reason for choosing Neon is still stated.

## 2. Local Postgres

- [x] 2.1 Add `docker-compose.yml` at the repo root: one service `db`,
      image `postgres:17-alpine`, `POSTGRES_USER`/`PASSWORD`/`DB` all
      `tabs`, port `5432:5432`, a named volume for `PGDATA`, and a
      `pg_isready -U tabs -d tabs` healthcheck. Verify `docker compose
      config` parses and `docker compose up -d --wait` returns only
      once the container reports healthy.

## 3. Make targets

- [x] 3.1 Add `db-up` (`docker compose up -d --wait`), `db-down`
      (`docker compose down`), and `db-reset` (`docker compose down -v`
      then `db-up`) to the root Makefile, using the `docker compose` v2
      subcommand, not the standalone `docker-compose` binary. Verify
      each target runs from a clean state and `db-up` blocks until the
      container is healthy, so a following `make api` never races it.
- [x] 3.2 Add the three new targets to the Makefile's `.PHONY` line
      (currently `install api web dev test api-test build tidy`).
      Verify a stray file named `db-up`, `db-down`, or `db-reset` in
      the repo root does not stop the corresponding target from
      running.

## 4. Connection string

- [x] 4.1 Change `apps/api/.env.example`'s `DATABASE_URL` from empty to
      the local compose URL
      (`postgres://tabs:tabs@localhost:5432/tabs?sslmode=disable`),
      with a comment above it noting this is the local dev database
      and that the Neon connection string replaces it for the real
      ledger. Verify `cp apps/api/.env.example apps/api/.env` followed
      by `make api` connects with no further edits.

## 5. Documentation

- [x] 5.1 Add `db-up`, `db-down`, and `db-reset` to `AGENTS.md`'s
      Commands section, one line each. Verify every command listed in
      that section actually runs (rule 6 — a documented command is a
      checked claim).
- [x] 5.2 Adjust `AGENTS.md`'s opening line ("Postgres on Neon") to
      match the amended constitution without restating it (rule 9).
      Verify `AGENTS.md` points at `openspec/config.yaml` rather than
      duplicating the dev/prod distinction.

## 6. Verification

- [x] 6.1 From a clean checkout state: `make db-up`, copy
      `.env.example` to `.env`, `make api`. Verify the log shows the
      server listening on `:8080` and that all three migrations
      applied — i.e. `SELECT filename FROM schema_migrations` returns
      `001_category.sql`, `002_movement.sql`, `003_settings.sql`.
- [x] 6.2 Exercise the API against the local database: `GET
      /api/v1/categories` returns the ten seeded categories, `POST
      /api/v1/movements` creates one, `GET /api/v1/cycles/current`
      reflects it. Verify none of this touched Neon (no Neon project is
      configured yet).
- [x] 6.3 `make db-reset` then `make api`. Verify the database comes
      back empty-but-migrated and the movement from 6.2 is gone —
      proving the reset loop is safe and repeatable.
- [x] 6.4 `npx @fission-ai/openspec@latest validate
      run-postgres-locally` passes.
- [x] 6.5 Re-read `openspec/config.yaml` end to end and confirm no
      remaining sentence contradicts a containerized development
      database.

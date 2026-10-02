## 1. Production API service

- [x] 1.1 Create `.env.prod` at the repo root carrying the Neon
      `DATABASE_URL` (the pooler connection string), and add `.env.prod`
      to `.gitignore`. Verify: `git check-ignore .env.prod` exits 0 and
      `git status --porcelain` does not list it.
- [x] 1.2 Add `apps/api/Dockerfile`: multi-stage — `golang:1.26-alpine`
      builds `./cmd/api` with `CGO_ENABLED=0`; an `alpine:3.22` runtime
      stage installs `ca-certificates tzdata` and copies the binary.
      Verify: `docker compose -f docker-compose.prod.yml build api`
      succeeds.
- [x] 1.3 Create `docker-compose.prod.yml` with the `api` service:
      `build: apps/api`, `env_file: .env.prod`, `ports: "8091:8080"`,
      `restart: unless-stopped`. Verify:
      `docker compose -f docker-compose.prod.yml up -d --wait` then
      `curl localhost:8091/api/v1/categories` returns the ten seeded
      categories from Neon.

## 2. Production web service

- [x] 2.1 Add `apps/web/nginx.conf`: serve `/usr/share/nginx/html` with
      `index.html`, and proxy `location /api/` to `http://api:8080`
      preserving the path.
- [x] 2.2 Add `apps/web/Dockerfile`: a `node:26-alpine` build stage
      installs `pnpm@12.5.1`, copies root `package.json`,
      `pnpm-lock.yaml`, `pnpm-workspace.yaml` plus `apps/web/`, runs
      `pnpm install --frozen-lockfile` and `pnpm --filter web build`;
      an `nginx:1.27-alpine` runtime stage copies `dist/` and
      `nginx.conf`. Verify: the web service build succeeds.
- [x] 2.3 Add the `web` service to `docker-compose.prod.yml`:
      `build: { context: ., dockerfile: apps/web/Dockerfile }`,
      `ports: "8090:80"`, `depends_on: [api]`, `restart: unless-stopped`.
      Verify: `curl localhost:8090/` serves the built `index.html` and
      `curl localhost:8090/api/v1/cycles/current` answers through the
      proxy with the Neon cycle.

## 3. Workflow integration

- [x] 3.1 Add Makefile targets `prod-up`
      (`docker compose -f docker-compose.prod.yml up -d --build`) and
      `prod-down` (`docker compose -f docker-compose.prod.yml down`),
      and extend `.PHONY`. Verify: `make prod-down && make prod-up`
      brings both services up.
- [x] 3.2 Revert `apps/api/.env` to the local dev value (same content
      as `.env.example`). Verify: with the prod stack down, `make api`
      boots against the local container and serves the local ledger on
      8080.
- [x] 3.3 Add both targets to `AGENTS.md`'s Commands list plus a
      one-line run-mode map (dev: host processes, local container,
      ports 8080/5173; prod: `make prod-up`, Neon, ports 8091/8090).
      Verify: the Commands section lists every root Makefile target
      again.
- [x] 3.4 Isolation end-to-end: with both stacks up, POST a test
      movement to `localhost:8080` (dev/local), confirm it lists on
      8080 and does NOT list on `localhost:8091` (Neon), then DELETE it
      locally. Verify: the prod ledger stays free of test data.

## 4. Single-compose revision (user directive during apply)

- [x] 4.1 Delete the dev-db compose and rename the app compose to
      `docker-compose.yml`, dropping `name: tabs-prod`; Makefile
      `prod-up` / `prod-down` drop the `-f` flag. Verify:
      `make prod-down && make prod-up` brings up `tabs-api-1` /
      `tabs-web-1` and `curl localhost:8091/api/v1/categories` returns
      the ten seeded categories.
- [x] 4.2 Add `db/Dockerfile` (`FROM postgres:17-alpine`, dev
      credentials as ENV, `HEALTHCHECK` via `pg_isready`) and rewrite
      Makefile `db-up` / `db-down` / `db-reset` on `docker build/run/rm`
      plus the existing `tabs-db-data` volume, with `db-up` idempotent
      and blocking until healthy. Verify: after replacing the
      compose-created `tabs-db-1` once, `make db-down && make db-up`
      leaves a healthy `tabs-db`, a second `make db-up` is a no-op, and
      the host `make api` serves the local ledger on 8080.
- [x] 4.3 Reconcile `AGENTS.md` Commands and run-mode wording with the
      single-compose reality. Verify: every root Makefile target is
      listed and no compose file besides `docker-compose.yml` is named
      anywhere in it.

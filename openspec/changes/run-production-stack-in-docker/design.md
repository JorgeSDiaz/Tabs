## Context

Three facts shape this design:

1. The dev topology is already a proxy topology: `apps/web` calls
   same-origin `/api`, and vite's dev server proxies it to
   `localhost:8080`. Any prod web server that reproduces "static files
   + `/api` proxy" runs the built web app with zero source changes.
2. `config.Load()` reads `DATABASE_URL` from the environment before
   falling back to a CWD-relative `.env`. A container given
   `DATABASE_URL` through compose `env_file` needs no mounted file and
   no code change.
3. Neon is provisioned and schema-verified (migrations applied and the
   seeded categories read back through the pooler endpoint).
   `postgres.Migrate` is idempotent through `schema_migrations`, so a
   prod boot against the already-migrated Neon is a no-op.

## Goals / Non-Goals

**Goals:**
- Give the real-ledger run mode its own reproducible launch path
  (`make prod-up`), isolated from the dev loop by process, ports, and
  credential location.
- Let the dev and prod stacks run side by side on one machine without
  port collisions.
- Keep the Neon connection string out of every committed file.

**Non-Goals:**
- Anything in `proposal.md`'s *Explicitly out of this change*.
- Renaming or restructuring the dev compose — it keeps owning exactly
  one disposable database.

## Decisions

**One compose for the app; the dev database is an image, not a
compose.** `docker-compose.yml` — the repo's single compose — owns
api+web against Neon; the disposable dev Postgres is `db/Dockerfile`
plus the Makefile's `docker run`. A compose earns its keep by
orchestrating several services, and the app compose orchestrates two
plus the proxy network between them; a one-service compose file, which
is all the dev db ever was, is indirection without orchestration. An
image owns what there is to own — the `postgres:17-alpine` pin and the
dev credentials (rule 7) — and three Makefile lines own the container's
life cycle (rule 2: the shape its current use requires). User directive
during this change's apply: *"there should be a single compose, the one
that brings up front and back; the other one, if it only brings up a db
container, should just be a dockerfile for the db."* This supersedes the
two-compose shape this change first shipped with, including its
`name: tabs-prod` collision fix: with the db outside compose there is
no second compose project and no shared default network to collide
with — the db container lives on docker's default bridge while the app
compose keeps its own network. *Alternatives considered:* keeping two
composes — rejected by the user directive; profiles in one file —
rejected as before, because a single `compose up` would then bring the
dev database and the production stack up together.

**The db container's life cycle, spelled out.** `db-up` builds the
`tabs-db` image if absent, runs `docker run -d --name tabs-db -p
5432:5432 -v tabs-db-data:/var/lib/postgresql/data` if the container is
absent (idempotent otherwise), starts it if stopped, and blocks until
the image's `HEALTHCHECK` reports healthy — preserving the
"blocks until healthy" promise `AGENTS.md` already makes. `db-down`
removes the container; `db-reset` removes container and volume. The
volume name does not survive the migration from compose-managed to
run-managed container: compose prefixes declared volumes with its
project name (`tabs_tabs-db-data`), while `docker run` uses the name as
written (`tabs-db-data`). Per the constitution the local container
holds nothing worth moving, so the change deletes the orphan prefixed
volume instead of migrating it — a fresh disposable database is the
correct outcome, not data loss.

**Ports: prod web 8090, prod api 8091.** Dev keeps 5173/8080; prod takes
the 809x pair so both stacks can run at once and a glance at the port
says which ledger you are touching. The api port is published even
though the browser only needs 8090, because curling the prod API
directly is the cheapest verification this project has (this change's
own tasks use it).

**nginx serves the web build and proxies `/api`.** It mirrors the dev
proxy topology, so the built app's same-origin `/api` calls work
unchanged. *Alternative considered:* `vite preview` with a preview
proxy — rejected because it ships node plus the web app's
devDependencies in the runtime image to do a static file server's job;
nginx:alpine does it in tens of MB (rule 2: the shape its current use
requires).

**Credentials in a gitignored `.env.prod`, consumed via `env_file`.**
The compose file stays committable and credential-free. *Alternatives
considered:* the string inline in the compose — rejected outright, it
commits the ledger's key; `${DATABASE_URL}` interpolation from a root
`.env` — rejected because no root `.env` exists today and introducing
one would conflate compose's interpolation mechanism with the API's
CWD-relative `.env` mechanism (two readers, one name — the confusion
rules 3 and 5 exist to prevent).

**Runtime images pin to the host toolchain (rule 7).**
`golang:1.26-alpine` (go.mod says 1.26.5), `node:26-alpine` (the host
runs node 26.9.0 through mise) with pnpm 12.5.1 installed explicitly in
the build stage to match the host and the lockfile, `nginx:1.27-alpine`
to serve, and `alpine:3.22` plus `ca-certificates` and `tzdata` for the
API runtime: ca-certificates because Neon is TLS-only, tzdata because
cycle logic resolves `America/Bogota` through `time.LoadLocation`,
which bare alpine cannot.

**Migrations stay boot-applied, in the prod container too.** Same
`postgres.Migrate` path as dev: the first prod boot schemas a fresh
Neon, later boots no-op through `schema_migrations`. A separate migrate
service or entrypoint wrapper would be a second way to apply schema
with one caller (rule 4).

**`apps/api/.env` returns to the local dev value.** `run-postgres-locally`
made `.env` the manual switch between local and Neon; with a prod launch
path of its own, that switch retires: dev is local by default, prod is
`make prod-up`. The Neon string then exists in exactly one place,
`.env.prod`.

## Risks / Trade-offs

- **Two compose files are two mental models.** Mitigated by the
  Makefile targets (`db-up` vs `prod-up` read as what they do) and the
  AGENTS.md run-mode line.
- **`nginx.conf` hardcodes the compose service name** (`proxy_pass
  http://api:8080`). Renaming the api service means editing nginx.conf;
  accepted — one place, and the name lives in the compose file shipped
  beside it.
- **Prod containers keep an API process alive between uses.** Idle
  `database/sql` connections end at the Neon pooler, whose server-side
  connections close when idle, so compute still scales to zero and the
  free plan's CU-hours stay usage-driven. If a future Neon bill says
  otherwise, the fix is connection-lifetime tuning in `postgres.Open`,
  not a compose change.
- **`prod-up --build` rebuilds both images every time.** Minutes at
  personal scale; a cache-aware pipeline is a shape this use does not
  require (rule 2).
- **The db health-wait is a powershell one-liner in the Makefile.**
  Compose's `up --wait` went away with the db compose, and cmd.exe
  (GNU make's recipe shell on this Windows box) has no portable
  retry loop. This repo develops on Windows; if dev ever runs on
  another OS, that one line is the porting surface — accepted per
  rule 2 until a second machine actually appears
  (`record-and-read-a-cycle` task 5.4 remains open).

## Migration Plan

No data moves. `.env.prod` is created with the Neon string (already
verified this session); `apps/api/.env` reverts to the local value, so
the next host `make dev` talks to the container again. The first
`make prod-up` applies zero migrations (Neon is already schema-current)
and serves the real, still-empty ledger on 8090.

The single-compose revision migrates two containers, not data: the
compose-created `tabs-db-1` is replaced once by the run-managed
`tabs-db` (same port 5432, a fresh `tabs-db-data` volume — the old
compose-prefixed `tabs_tabs-db-data` volume is deleted, per the
decision above), and the `tabs-prod-*` containers of the renamed
compose are recreated under the default project name by the next
`make prod-up`.

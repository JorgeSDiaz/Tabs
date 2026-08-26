## 1. Constitution amendment

- [x] 1.1 Rewrite `openspec/config.yaml`'s *Architecture direction*
      section to state the mixed architecture from `design.md`
      (screaming + vertical slicing + clean layers, uniform per slice,
      no unearned sixth folder, no package nothing calls, rule 5
      carried forward as load-bearing). Verify by reading the section
      end-to-end and confirming it no longer says "start flat" or
      forbids `ports/`/`application/`.
- [x] 1.2 Narrow rule 4's wording so it targets speculative/unused
      packages specifically, not the layering stance now owned by
      *Architecture direction*. Verify the two sections no longer
      contradict each other on a single read-through.

## 2. Root tooling

- [x] 2.1 Add `pnpm-workspace.yaml` (`packages: - apps/web`) and a root
      `package.json` (private, name `tabs`). Verify `pnpm install` runs
      without error once `apps/web/package.json` exists (task 4.1).
- [x] 2.2 Add a root `Makefile` with `install`, `api`, `web`, `dev`,
      `test`, `api-test`, `build`, `tidy` targets. Verify each target
      runs (even if some just print "not implemented yet" until their
      underlying app exists).
- [x] 2.3 Create `openapi/` at repo root (empty, contract body is
      `record-and-read-a-cycle` task 3.6). Verify the directory exists
      and is tracked by git (add a `.gitkeep` if needed).

## 3. `apps/api` skeleton (Go)

Consult the `use-modern-go` skill before writing any `.go` file in this
section.

- [x] 3.1 `go mod init tabs-api` inside `apps/api`, Go 1.26. Verify
      `go build ./...` succeeds with zero files (or a stub `main.go`).
- [x] 3.2 Add `apps/api/.env.example` with `DATABASE_URL=`. Verify
      `.env` itself stays out of git (already covered by root
      `.gitignore`).
- [x] 3.3 Add `apps/api/cmd/api/main.go` — minimal entrypoint that logs
      "not implemented yet" and exits 0. Verify `go run ./cmd/api`
      prints the message and exits cleanly.
- [x] 3.4 Create `apps/api/db/migrations/` (empty; first migration is
      `record-and-read-a-cycle` tasks 1.2–1.3). Verify the directory is
      tracked by git.
- [x] 3.5 Create the three slice skeletons under `apps/api/internal/`:
      `movements/`, `categories/`, `cycles/`, each with
      `domain/`, `ports/`, `application/`, `adapters/http/`,
      `adapters/postgres/`. Verify all fifteen folders exist and are
      tracked (via `.gitkeep` where empty) and `go vet ./...` passes.
- [x] 3.6 Create `apps/api/internal/platform/{config,postgres}/` only
      — do **not** create `platform/clock`, `platform/httpx`, or
      `platform/logging` (see `design.md` — Decisions). Verify by
      listing `internal/platform/` and confirming exactly those two
      subfolders exist.

## 4. `apps/web` skeleton (React + Vite + TS)

- [x] 4.1 Scaffold `apps/web` with Vite (React + TypeScript template),
      `package.json` including `dev`, `build`, `lint`, `preview`, and
      `generate:api` (pointing at `../../openapi/tabs.yaml`) scripts,
      plus `openapi-typescript` and `openapi-fetch` as dependencies.
      Verify `pnpm --filter web build` succeeds against the placeholder
      `main.tsx` from task 4.2.
- [x] 4.2 Replace the Vite template's default `src/` with a minimal
      `main.tsx` rendering a placeholder (no product UI) plus empty
      `src/app/`. Verify the dev server renders the placeholder with no
      console errors.
- [x] 4.3 Create the three feature skeletons under
      `apps/web/src/features/`: `movements/`, `categories/`, `cycles/`,
      each with `domain/`, `application/`, `adapters/{api,ui}/` — no
      `ports/` (see `design.md` — Decisions). Verify all folders exist
      and are tracked.
- [x] 4.4 Create `apps/web/src/shared/{api,ui,lib}/` — one shared home
      for cross-slice code, not split the way Caudal split
      `components/` vs `shared/components/`. Verify no other top-level
      "shared" folder exists under `src/`.

## 5. Documentation catch-up

- [x] 5.1 Fill `AGENTS.md`'s **Commands** section with the real
      `make`/`pnpm` commands from section 2. Verify every command
      listed actually runs (rule 6 — a documented command is a checked
      claim).
- [x] 5.2 Update `AGENTS.md`'s **Architecture** section to point at the
      amended *Architecture direction* in `openspec/config.yaml` rather
      than restate it (rule 9). Verify no architectural description is
      duplicated between the two files.
- [x] 5.3 Update `README.md`'s status line — it currently says "No
      application code yet." Verify the new line accurately reflects
      that the skeleton exists and `record-and-read-a-cycle` is ready to
      implement.

## 6. Verification

- [x] 6.1 `git status` after `git add -A` shows every intended file and
      folder tracked (via `.gitkeep` for otherwise-empty layer
      folders), and nothing unintended.
- [x] 6.2 `go build ./...` and `go vet ./...` clean in `apps/api`;
      `pnpm --filter web build` clean in `apps/web`.
- [x] 6.3 `npx @fission-ai/openspec@latest validate scaffold-the-monorepo`
      passes.
- [x] 6.4 Re-read `openspec/config.yaml` end to end and confirm no
      remaining sentence contradicts the scaffolded layout.

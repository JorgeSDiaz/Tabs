# AGENTS.md

Tabs is a personal finance tracker: Go API + React web app, Postgres on Neon.

## Before proposing or implementing any change

Read the project constitution in `openspec/config.yaml` (the `context` field).
It holds the product definition, the non-goals, and the rules this codebase
must follow — each with the reason it exists. Every OpenSpec workflow
(`propose`, `apply`, `archive`) already injects it automatically; if you are
working outside that workflow, read it yourself first.

## Workflow

This repo uses OpenSpec (spec-driven development). Do not write product code
without a corresponding change under `openspec/changes/`.

- Claude Code: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`
- Codex: `$openspec-propose`, `$openspec-apply-change`, `$openspec-archive-change`
- OpenCode: `/opsx-propose`, `/opsx-apply`, `/opsx-archive`

## Commands

- `make install` — install all dependencies (pnpm workspace)
- `make api` — run the API (`apps/api`)
- `make web` — run the web dev server (`apps/web`)
- `make dev` — run both together
- `make test` / `make api-test` — run the Go test suite
- `make build` — build both apps
- `make tidy` — `go mod tidy` for `apps/api`

## Commit messages

Prefix the subject line with a [gitmoji](https://gitmoji.dev) matching the change. Full
catalog at gitmoji.dev; the ones this repo actually uses:

| Emoji | Code | Use for |
| --- | --- | --- |
| ✨ | `:sparkles:` | a new feature |
| 🐛 | `:bug:` | a bug fix |
| 📝 | `:memo:` | docs |
| ♻️ | `:recycle:` | refactor (no behavior change) |
| ✅ | `:white_check_mark:` | adding or fixing tests |
| 🔧 | `:wrench:` | config/tooling |
| 🏗️ | `:building_construction:` | architectural/scaffolding changes |
| ⚡️ | `:zap:` | performance |
| 🔥 | `:fire:` | removing code or files |
| 🚧 | `:construction:` | work in progress, not ready |

Example: `✨ record a movement and read the active cycle's balance`

No `Co-Authored-By` / `Claude-Session` trailers.

## Architecture

See the constitution's *Architecture direction* in `openspec/config.yaml`
for the rule this codebase follows and why.

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

Not yet defined — filled in once `apps/api` and `apps/web` exist (see the
`record-and-read-a-cycle` change).

## Architecture

Screaming structure: folders name the domain, not the framework. See the
constitution for the rule on not adding a layer before it's earned.

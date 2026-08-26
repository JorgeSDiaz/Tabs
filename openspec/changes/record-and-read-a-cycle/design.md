## Context

First change in the repository — no existing code, no existing schema.
Constraints come from the constitution in `openspec/config.yaml`: no
parallel trees, no unearned abstraction layers, invariants validated in
exactly one place, Postgres on Neon (no local Docker volume to move
between machines).

## Goals / Non-Goals

**Goals:**
- Prove the core loop (record → list → balance) end to end, against a
  real Neon database, usable from more than one machine.
- Establish the financial-cycle boundary logic in one place, correctly,
  since every later change depends on it.

**Non-Goals:**
- Editing a movement, editable categories, breakdowns/charts — see
  proposal.md for why each is deferred.
- Authentication, deployment, or mobile access — out of scope per the
  entrepreneurship interview (local use across machines only, for now).

## Decisions

**One `movement` concept with a `direction` field, not two entities.**
Caudal modeled `expenses` and `incomes` as separate, near-identical
backend contexts and frontend features (constitution rule 5's evidence).
Tabs models one `movement` with `direction: in | out`. This halves the
schema, the API surface, and the frontend feature from the start, and
every future capability (edit, categories, breakdown) is written once
instead of twice.

**Categories are not split by direction in this change.** Caudal's
`category` table already carried a `kind` (expense/income) discriminator
at the database level. Whether `movement` categories need the same split
is deferred: this change ships one flat seeded list usable by both
directions, and a `kind` column is added later only if using it in
practice shows it's needed (rule 2 — build for current use, not
anticipated use).

**The cycle boundary lives in exactly one place.** A single function
computes, for a given date, which cycle it belongs to (start/end), with
the short-month clamp handled once. Every other capability — the list
query, the balance calculation — calls it rather than re-implementing
the rule. Caudal got this right (`internal/shared/domain/period.go`) and
it is the one piece of that codebase worth carrying forward unchanged in
spirit.

**Invariants validated once, not per-layer.** Money positivity, category
existence, and direction validity are each checked in exactly one place
(the layer closest to the write) — not re-asserted again in a database
constraint that duplicates the same rule in a different language. This
directly targets constitution rule 3 (Caudal's rules were checked three
times: constructor, SQL `CHECK`, and a `merge()` re-validation step).

**SQL migrations are the schema source of truth.** Plain SQL migration
files, applied in order, define `movement` and `category`. No ORM model
is treated as authoritative.

**Data access is direct SQL, not an ORM.** Caudal used GORM but its
non-trivial queries (monthly reports, debt projections) ended up as raw
SQL anyway. Tabs queries the database directly from the start rather
than carrying an abstraction that gets bypassed under real load.

**The API contract is written by hand, and the frontend's types are
generated from it.** This was Caudal's clearest win: one source of
truth, the frontend never hand-writes a type that duplicates the
contract.

**No Docker for the database.** Neon replaces the local Postgres
container that Caudal ran; there is nothing to volume-mount or carry
between machines. A connection string in `.env` is enough.

**No layer that has not earned its place.** No interface with a single
implementation, no use-case wrapper around a one-line repository call.
Code is organized by domain (a `movements` area, screaming its purpose)
without pre-splitting it into ports/application/adapters until a second
implementation or a genuine test seam requires the split.

## Risks / Trade-offs

- **Flat categories may need a `kind` split later.** If mixing
  in/out-flavored categories in one list proves confusing in real use,
  a follow-up change adds the discriminator. Accepted: cheaper to add a
  column later than to carry unused structure now.
- **No editing in this slice** means a wrong amount or date must be
  deleted and re-entered rather than corrected in place, for the
  duration of this change only. Accepted as the explicit trade-off of
  keeping the first slice small; edit is the next change, not a
  someday.
- **Cycle boundary is the one piece of upfront complexity.** If it turns
  out to need reworking, every capability built on top (list, balance)
  needs to be revisited too. Mitigated by keeping the boundary logic in
  one function with explicit test scenarios for the edge cases (on the
  boundary day, short months) captured in `specs/movements/spec.md`.

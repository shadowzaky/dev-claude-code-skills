# Artifacts

Every file the skills read or write, who owns it, and what it must contain.

**One owner per file.** Other skills may read freely, but only the owner writes structural changes. Shared write access means no one is accountable for the file's shape.

| File | Owner | Other writers | Committed | Required by |
|---|---|---|---|---|
| `idea-backlog.md` | `idea-backlog` | — | yes | — (no skill gates on it) |
| `ARCHITECTURE.md` | `architecture` | `learn-from-pr` (appends rules) | yes | `dev`, `qa`, `/review-branch`, `/sprint`, `/grind` |
| `docs/adr/` | `adr-create` (writes Proposed) | `adr-review` (status only) | yes | read by `architecture`, `dev`, `/review-branch` |
| `MILESTONES.md` | `milestones` | `dev` (task boxes), `qa` (`[COMPLETED]`) | yes | `dev`, `qa`, `/grind` |
| `BUSINESS_RULES.md` | `qa` | — (read by `learn-from-pr`, `backfill-pr-rules`) | yes | `qa` |
| `milestones-archived.md` | `qa` | — | yes | — |
| `docs/product/` | `product-docs` | — | yes | — |
| `CLAUDE.md` | project | `learn-from-pr` | yes | all |

Naming follows the gate: files a skill hard-stops on are `UPPERCASE.md`; staging and derived files are lowercase.

---

## idea-backlog.md

**Owner:** `idea-backlog` skill · **Purpose:** capture ideas before they are worth specifying

No skill gates on this file — it is optional, and the loop runs without it.

### Format

```markdown
# Idea Backlog

## Open

- Bulk CSV export for reports
- Let admins impersonate a user for support cases

## Promoted

- 2026-08-19 — SSO login for enterprise customers → milestone **Keycloak Authentication**

## Dropped

- 2026-06-14 — Native mobile app — web PWA covers the need, revisit if usage says otherwise
```

### Rules

- **One line per idea.** Needing a paragraph means it should be promoted, not expanded here.
- **Three sections only.** The section is the state — no checkboxes, no labels, no owners, no estimates.
- **Unranked.** Position means nothing. Priority is decided at promotion time.
- **Never delete.** Lines move to `## Promoted` or `## Dropped`, always dated. A drop requires a reason.
- **Deduped on add**, checked across all three sections.
- **Never writes `MILESTONES.md`** — promotion hands off to the `milestones` skill.

---

## ARCHITECTURE.md

**Owner:** `architecture` skill · **Purpose:** how code must be written in this repo

A hard prerequisite. `dev`, `qa`, and `/review-branch` stop and refuse to run without it.

### Required sections

| Section | Contents |
|---|---|
| Stack | Runtime, language, framework, DB/ORM, auth, external services, test framework — with versions |
| Folder structure | Every top-level directory and its responsibility, stated as a constraint |
| Layer rules | Per layer: **Allowed**, **Forbidden**, **Rule** |
| Naming conventions | Table: files, classes, methods, constants, enums, route URLs, JSON properties, DB columns, env vars |
| Auth and authorisation | Token issuance and contents, enforcing middleware, roles, post-auth request shape, handler types |
| Error handling | Exact response shape, status code mapping, how errors are thrown and where caught |
| Database | ORM, data source init, entity registration, migration workflow, env config |
| External services | Per service: purpose, client init location, injection pattern, retry/error conventions |
| Environment variables | Names and purpose, grouped by concern, required vs optional. **Names only, never values** |
| Testing strategy | Unit vs integration: what to test, what to mock, file locations, setup/teardown, run commands |
| Adding a feature | Ordered checklist for adding a new resource end to end |

### Writing rules

- **Prescriptive, not descriptive.** Every layer needs a **Forbidden** list — that is what makes a diff checkable.
- **Specific over generic.** Not "utils: utility functions" but "utils: pure functions, no side effects, no DB access, no HTTP calls, no business logic".
- **One convention per thing.** Where the codebase is inconsistent, the skill asks which is intended and documents only that.
- **Read the code, do not assume.** Everything in the file must be traceable to the repo or to a user answer.

### Explicitly out of scope

Business rules → `BUSINESS_RULES.md`. Milestone tracking → `MILESTONES.md`. Deployment/infra → `README.md` or `docs/`. Secrets → environment variables, never committed.

---

## docs/adr/

**Owners:** `adr-create` writes records (always `Proposed`); `adr-review` changes status and propagates · **Purpose:** why the architecture is what it is

```
docs/adr/
  README.md              index: number, title, status, date
  0001-<kebab-title>.md
  0002-<kebab-title>.md
```

### Record format

```markdown
# ADR-0007: Use a single-tenant database per customer

- **Status:** Proposed | Accepted | Rejected | Superseded by ADR-NNNN | Deprecated
- **Date:** YYYY-MM-DD
- **Decided:** YYYY-MM-DD          (added on accept/reject)
- **Deciders:** names or roles
- **Supersedes:** ADR-NNNN         (omit if none)

## Context
## Decision
## Alternatives considered
## Consequences        (Positive / Negative / Follow-up)
```

### Status lifecycle

```
Proposed ──accept──► Accepted ──replaced──► Superseded by ADR-NNNN
   │                     │
   │                     └──no longer relevant──► Deprecated
   └──reject──► Rejected (kept, with reason)
```

### Rules

- **Split of concerns:** `docs/adr/` holds *why* and what was rejected; `ARCHITECTURE.md` holds the resulting *rule*. Rules derived from an ADR cite it inline — `(ADR-0007)`.
- **Immutable once accepted.** A changed decision is a **new** ADR that supersedes the old one. Only the status header of an accepted record may be edited, never its argument.
- **Numbers are sequential and never reused**, gaps included.
- **One decision per record** — otherwise it cannot be superseded cleanly.
- **Negative consequences are mandatory.** `adr-review` sends back any record without them.
- **Nothing is deleted.** Rejected records stay so the same proposal does not return with no memory of why it lost.
- **Accepted ADRs are binding:** `architecture` documents them, `dev` stops rather than working around one, `/review-branch` flags a violation as `[BLOCKER]`.
- **A conflict with a `BR-XXX` business rule blocks acceptance** — business invariants outrank technical preference.

### What is not an ADR

Naming conventions, folder layout, formatting, single-file implementation detail, routine dependency bumps. Those are `ARCHITECTURE.md` rules. Business behaviour is a `BR-XXX` entry. An ADR log padded with trivia stops being read.

---

## MILESTONES.md

**Owner:** `milestones` skill · **Purpose:** what is being built, and the loop's state

### Format

```markdown
# Milestones

## Milestone Name [ACTIVE]

> One-sentence goal: what this milestone delivers and for whom.

### Acceptance Criteria

- [ ] Criterion 1 — specific, testable, user-visible outcome
- [ ] Criterion 2

### Tasks

- [ ] Task 1
- [ ] Task 2

---
```

### Write permissions

| Writer | May change |
|---|---|
| `milestones` (PM) | Add milestones, add criteria and tasks, set/move `[ACTIVE]` |
| `dev` | Check task boxes `[ ]` → `[x]`; set `[ACTIVE]` when a milestone is named |
| `qa` | `[ACTIVE]` → `[COMPLETED]`, add the completion date, archive the block |

The PM never checks a task and never writes `[COMPLETED]`. Dev never writes `[COMPLETED]`.

### Rules

- **No ordering.** No numbers, no sequence. Any milestone may be picked up at any time.
- **Exactly one `[ACTIVE]`.** Setting a new one clears the previous.
- **`[COMPLETED]` is permanent.** Never removed once set.
- **Never destroy history.** No unchecking, no deleting completed tasks or met criteria.
- **At least two acceptance criteria**, specific and testable. No "works correctly".
- **Location:** repo root. `/grind` also falls back to `doc/milestones.md`, preferring the root file when both exist.

Completed milestones stay in place until the user accepts QA's archival offer.

---

## BUSINESS_RULES.md

**Owner:** `qa` skill · **Purpose:** invariants the system must always enforce

Created on the first QA pass, appended to on every pass after.

### Format

```markdown
# Business Rules

> Last updated: YYYY-MM-DD
> Updated by: QA pass on [Milestone Name]

## Authentication

### BR-001: Expired tokens are rejected
**Rule:** A request carrying an expired token is rejected with 401 and a machine-readable error code.
**Rationale:** Prevents indefinite session reuse after credential compromise.
**Validated by:** `tests/integration/auth.test.ts` — "returns 401 when the token is expired"
```

### Rules

- **Stable IDs.** `BR-XXX`, assigned once, never reused, never changed even if the wording is. Cite them in review comments and commits.
- **Grouped by domain** — Authentication, Payments, Users, etc.
- **Append-only.** Never delete a rule. A retired rule is marked `**DEPRECATED**` with a note explaining why.
- **Every rule needs all three fields.** A rule without **Validated by** is a gap QA must close in the same pass.
- **Sources** — acceptance criteria, `ARCHITECTURE.md`, service code, existing test descriptions.
- **Ambiguity is a question, never a guess.** QA asks the user and records the answer immediately.

`learn-from-pr` and `backfill-pr-rules` read this file before writing any new rule, so PR-derived rules cannot contradict it.

---

## milestones-archived.md

**Owner:** `qa` skill · **Purpose:** keep `MILESTONES.md` readable without losing history

Written only when the user accepts QA's archival offer. The full milestone block — heading, goal, completion date, every criterion, every task — moves across; nothing is summarised away.

```markdown
# Milestones Archive

---

## Archived 2026-05-02

### Milestone Name [COMPLETED]

> **Completed:** 2026-05-02
> One-sentence goal.

#### Acceptance Criteria
- [x] ...

#### Tasks
- [x] ...

---
```

---

## docs/product/

**Owner:** `product-docs` skill · **Purpose:** what the product does and for whom

Lives inside the target repo, under version control, next to the code it describes.

```
docs/product/
  README.md      index
  overview.md    what it is, who uses it, non-goals
  features.md    inventory — Shipped / In progress / Planned
  flows.md       user journeys including failure paths
  glossary.md    domain terms
```

`features.md` splits into `features/<area>.md` only past roughly 300 lines.

### Rules

- **Grounded, not invented.** Every **Shipped** feature traces to a code path actually read; every **Planned** one traces to a milestone. Backlog ideas are neither.
- **No implementation detail.** A sentence naming a class, table, or framework belongs in `ARCHITECTURE.md`.
- **Cross-reference, never duplicate.** Constraints cite `BR-XXX` IDs instead of restating rule text.
- **Gaps marked visibly** as `> TBD — <what is missing>` rather than filled with plausible guesses.
- **Removed features are marked removed and dated**, never deleted.
- Updated when a milestone changes user-visible behaviour — QA offers this at sign-off.

---

## CLAUDE.md

**Owner:** the project · **Purpose:** repo-specific instructions for Claude Code

Not created by any skill in this plugin, but `learn-from-pr` writes to it: project-specific review feedback that is not an architecture rule and not a business rule lands here.

Rough split:

- **How code is structured** → `ARCHITECTURE.md`
- **Why it is structured that way** → `docs/adr/`
- **What the system must always do** → `BUSINESS_RULES.md`
- **What the product does, for whom** → `docs/product/`
- **How to work in this repo** (commands, gotchas, local setup) → `CLAUDE.md`

---

## Files these skills never write

- `.env*` — local only, must be gitignored. `/review-branch` flags a committed one as `[BLOCKER]`.
- `.claude/settings.local.json` — machine-local, must be gitignored. Also a `[BLOCKER]`.
- One-time operational or data-migration scripts — run them and discard; committing them is a `[BLOCKER]`.

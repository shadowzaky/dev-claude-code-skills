# The Loop

The core of this plugin is one repeating cycle:

```
Capture  →  PM  →  Dev  →  QA  →  (archive)  →  Capture …
```

Each phase is a separate skill with a separate role, separate inputs, and separate write permissions on the shared spec files. A phase never does another phase's job. That separation is the whole point — it is what stops an agent from writing a feature, declaring the feature good, and moving on.

---

## Why a loop and not one prompt

A single "build me X" prompt gives the model one shot at three different jobs: deciding what to build, building it, and judging whether it works. Those jobs conflict.

- The judge is biased when it is also the builder. An agent that just wrote a function will write a test that the function passes.
- Scope drifts silently. Without a written definition of done, "done" becomes "the model stopped typing".
- Context is lost between sessions. Chat history evaporates; a file does not.

The loop fixes all three by forcing the decisions out of the conversation and into files, and by making a different role read those files back.

| Problem | Loop mechanism |
|---|---|
| Builder grades own work | QA is a separate phase with its own skill and its own pass criteria |
| Scope drift | Acceptance criteria written and approved *before* code exists |
| Lost context | `ARCHITECTURE.md`, `MILESTONES.md`, `BUSINESS_RULES.md` persist across sessions |
| Silent assumptions | Every phase is instructed to **stop and ask** rather than guess |

---

## Phase 0 — Architecture (once, then maintained)

**Skill:** `architecture` · **Writes:** `ARCHITECTURE.md`

Not part of the repeating loop, but a hard prerequisite for it. `dev`, `qa`, `/grind`, and `/review-branch` all **hard-stop** if `ARCHITECTURE.md` is missing.

### Greenfield

An empty repo has no code to read, and the hard stops mean the pipeline cannot start without this file — so the skill switches to **design** mode: gather intent (what, for whom, at what scale, under what constraints, with which team), propose two or three real options per stack choice with the trade-off that separates them, then write the architecture from the confirmed answers.

Every stack choice is ADR material by definition — expensive to reverse, constrains every module, reasonable engineers disagree — so those decisions are recorded via `adr-create` while the reasoning is still fresh. It never survives the week otherwise.

Unanswerable sections are marked `> TBD` rather than guessed, and the file carries a **"Designed, not yet built"** banner until it is reconciled against real code after the first milestone ships.

### Existing codebase

The skill reads the actual codebase — entry point, folder structure, representative files per layer, config, tests — and writes down the conventions it finds. Where the codebase is inconsistent (two naming styles, two error shapes), it asks the user which one is the intended standard and documents **one**, not both.

Why it blocks everything else: without a written architecture, "follows the existing patterns" means whichever pattern the model happened to read first. `ARCHITECTURE.md` makes conformance checkable instead of vibes-based.

### Decisions vs conventions

Resolving those ambiguities produces two different kinds of output, and they go to different places.

A **convention** — file naming, folder layout, error shape — becomes a rule in `ARCHITECTURE.md`. That is all it needs.

A **decision** — one that is expensive to reverse, constrains multiple modules, or rejects an obvious option for a non-obvious reason — also gets an **ADR** in `docs/adr/`, written by `adr-create` and approved by `adr-review`.

| | `ARCHITECTURE.md` | `docs/adr/NNNN-*.md` |
|---|---|---|
| States | *What* the rule is | *Why*, and what was rejected |
| Lifecycle | Living; edited as rules change | Immutable once accepted; superseded, never rewritten |
| Reader question | "How do I write this correctly?" | "Why is it like this, and can I change it?" |

The split exists because a rule and its justification decay at different rates. The rule needs to stay current; the justification needs to stay **dated**. Editing the reasoning to match the present erases the only thing that tells you whether the reason still holds.

ADR flow, mirroring the main loop's separation of building from approving:

```
adr-create  →  Proposed  →  adr-review  →  Accepted  →  ARCHITECTURE.md updated
                              │
                              ├→ Needs work → back to Proposed
                              └→ Rejected (kept, with reason)
```

`adr-create` never writes `Accepted` — same principle that stops Dev closing its own milestone. `adr-review` never accepts without user sign-off; on acceptance it propagates the decision into `ARCHITECTURE.md`, because an accepted ADR nothing enforces is decoration. With no ADRs pending, `adr-review` runs a **drift audit** instead: accepted decisions the code now violates, decisions never reflected in `ARCHITECTURE.md`, and decisions whose original context has expired.

`dev` reads accepted ADRs and stops rather than working around one. `/review-branch` treats a violation as `[BLOCKER]` and an undocumented new structural decision as `[CONCERN]`.

---

## Phase 0.5 — Capture

**Skill:** `idea-backlog` · **Writes:** `idea-backlog.md`

Sits before the PM phase and costs nothing to use. An idea is **one line** — no goal, no criteria, no tasks. Adding one asks no questions, because any friction at capture time means ideas stay in someone's head or in a dead chat transcript.

Three sections, and the section a line sits in is its whole state:

| Section | Meaning |
|---|---|
| `## Open` | Raw, unranked, uncommitted |
| `## Promoted` | Became a milestone — dated, with the milestone name |
| `## Dropped` | Rejected — dated, **with the reason** |

Nothing is ever deleted. The dropped reason is the valuable part: without it the same idea gets re-proposed and re-argued every few months.

**Promotion** is the hand-off to the PM phase: `idea-backlog` invokes `milestones`, which expands the line into a goal, acceptance criteria, and tasks. An idea that turns out to need more than ~8 tasks gets split back into several one-liners rather than becoming an oversized milestone.

The backlog is deliberately unranked. Priority order written into a file is wrong the moment priorities move; ranking happens at promotion time, with current information.

---

## Phase 1 — PM

**Skill:** `milestones` · **Writes:** `MILESTONES.md` (goals, criteria, tasks, `[ACTIVE]`)

Turns an intent into a specification. Output per milestone:

- **Name** — short, no number, no ordering
- **Goal** — one sentence: what it delivers and for whom
- **Acceptance criteria** — at least two, specific, testable, user-visible or system-observable
- **Tasks** — concrete dev tasks; more than ~8 is a signal to split the milestone

Rules that matter:

- **Milestones are unordered.** No numbers, no sequence. Any milestone can be picked up at any time. Ordering is a scheduling decision, not a spec decision — encoding it in the file makes the file wrong the moment priorities change.
- **Exactly one `[ACTIVE]`.** The active marker is the loop's program counter. Setting a new one clears the old one.
- **The PM never checks a task box** and **never writes `[COMPLETED]`.** Dev checks tasks; QA marks completion. A role that can both define and declare success can move the goalposts.

Criteria are written as outcomes, not implementations — *what*, never *how*. "User can log in via SSO and receive a session token accepted by the API" is testable. "Implement the auth service correctly" is not.

---

## Phase 2 — Dev

**Skill:** `dev` · **Writes:** source, tests, task checkboxes in `MILESTONES.md`

1. **Verify prerequisites** — `MILESTONES.md` exists, a milestone is `[ACTIVE]`, `ARCHITECTURE.md` exists. Any missing → stop and direct the user to the right skill.
2. **Plan before coding** — state files to create/modify, migrations, new dependencies, risks. In `/sprint` and `/grind` this plan is a user gate.
3. **Implement one task at a time**, checking each box in `MILESTONES.md` as it lands. The file is the progress bar, so an interrupted session is resumable.
4. **Write tests** — unit (mock at the boundary) and integration (real DB, never a mocked one, each test cleaning up after itself).
5. **Final check** — linter clean, full suite green, OpenAPI updated if present, every task box checked, then `/review-branch`.

Dev leaves the milestone `[ACTIVE]`. It **cannot** mark its own work complete. That single restriction is what makes the QA phase meaningful.

The skill also carries a standing quality bar — layer separation, naming, no secrets in code, no `TODO`s, no dead code, named constants over magic numbers, no silently swallowed errors. `ARCHITECTURE.md` overrides these defaults where it disagrees.

---

## Phase 3 — QA

**Skill:** `qa` · **Writes:** `BUSINESS_RULES.md`, tests, `[COMPLETED]` in `MILESTONES.md`

QA does not build features. It verifies, and it is the only role allowed to close a milestone.

1. **Prerequisites** — all tasks checked; any unchecked task sends the work back to `/dev`.
2. **Discover business rules** from acceptance criteria, `ARCHITECTURE.md`, service code, and existing test names. Every ambiguity is a **question to the user**, never an assumption: *"a valid token belonging to a deleted user — 401 or 403?"* Answers go straight into `BUSINESS_RULES.md`.
3. **Audit tests against rules** — does a test exist per rule, does it assert the violation and not just the happy path, is the data realistic, are the assertions specific? Gaps get written now.
4. **Validate acceptance criteria** one by one, each tied to a passing test. Any criterion that cannot be verified stops the phase.
5. **Run the full suite** — zero failures, zero wrongly-skipped tests.
6. **Mark `[COMPLETED]`** with a completion date. History is preserved; nothing is deleted.
7. **Deliver the QA report** — criteria table, rules validated, tests added, suite summary.
8. **Offer archival** to `milestones-archived.md`.

The rule discovery step is what makes the loop compound. Knowledge that would otherwise live only in a passing test gets a stable ID (`BR-001`) and a rationale, so the next milestone — and the next contributor — inherits it.

---

## The state machine

`MILESTONES.md` holds the loop's entire state in two markers:

```
(no marker)  ──PM or Dev sets active──►  [ACTIVE]  ──QA validates──►  [COMPLETED]  ──►  archived
```

| Marker | Set by | Cleared by | Meaning |
|---|---|---|---|
| none | — | — | Defined, not started |
| `[ACTIVE]` | `milestones`, `dev`, `/grind` | replaced when another goes active | In progress; dev may be partial |
| `[COMPLETED]` | `qa` **only** | never | Criteria verified, tests green |

Task checkboxes carry the finer-grained state inside an active milestone. Because both live on disk, a crashed session, a `/clear`, or a week away costs nothing — re-invoke the skill and it reads its position back.

---

## Two drivers: `/sprint` and `/grind`

Same phases, different gating.

### `/sprint` — one milestone, interactive

```
Preflight → PM → [gate] → Dev → [gate] → QA → report → archive?
```

Every phase boundary needs explicit user approval. Use it when the milestone is not yet defined, the design is uncertain, or the change is risky.

### `/grind` — the whole queue, batch

```
Preflight → queue → [confirm queue] → ┌ Dev plan → [gate] → Dev → QA → archive? ┐
                                      └────────── /clear, next milestone ───────┘
```

No PM phase — milestones must already exist. All non-`[COMPLETED]` milestones become the queue, with any already-`[ACTIVE]` one first. The dev plan gate stays; **the Dev → QA gate is deliberately removed** so a known queue can be processed without babysitting.

`/clear` runs between milestones so context from one does not bleed into the next.

| | `/sprint` | `/grind` |
|---|---|---|
| PM phase | yes | no — queue must exist |
| Scope | one milestone | all incomplete milestones |
| Dev plan gate | yes | yes |
| Dev → QA gate | yes | **no** |
| Between milestones | — | `/clear`, then next |
| Use when | scope is uncertain | scope is settled, want throughput |

Neither driver skips a milestone. A blocked milestone stops the run — it does not get stepped over — because a skipped milestone silently becomes technical debt with no record.

---

## Supporting skills

These do not sit in the loop but feed it.

| Skill / command | Role |
|---|---|
| `/review-branch` | Full-diff review against `ARCHITECTURE.md` — architecture, SOLID, clean code, KISS, hardcoded strings, i18n, secrets, security, correctness, tests, OpenAPI. Called by dev before QA handoff. |
| `/ship` | Closes the pipeline: branch named from the milestone, conventional commits, PR body built from the goal, acceptance criteria, `BR-XXX` rules, and ADRs. Blocks on secrets, failing tests, and committed local-only files. |
| `/status` | Read-only report across every spec file — active milestone, tasks left, pending ADRs, drift, stale docs — ending in one recommended next action. |
| `/sync` | Fetch, merge main into the branch, resolve conflicts — auto only when intent is unambiguous, ask otherwise. |
| `learn-from-pr` | One PR's review comments → persistent rules, at the right scope: project-specific to `CLAUDE.md`/`ARCHITECTURE.md`, generic to user-level skills. |
| `backfill-pr-rules` | Same, batched over historical PRs. A pattern recurring across several PRs is treated as definitively generic. |
| `adr-create` | Writes a `Proposed` ADR to `docs/adr/` from a described decision — or, given nothing, scans the repo and git history and suggests the decisions worth recording. |
| `adr-review` | Reviews `Proposed` ADRs for completeness, honest consequences, and conflicts; on user sign-off accepts and propagates into `ARCHITECTURE.md`. Audits accepted ADRs for drift. |
| `product-docs` | Writes and maintains `docs/product/` in the target repo — what the product does and for whom, grounded in shipped code and completed milestones. QA offers to run it after a milestone changes user-visible behaviour. |
| `create-skill` | Meta-skill for adding new skills and commands to this repo. |

`learn-from-pr` and `backfill-pr-rules` read `BUSINESS_RULES.md` before writing anything, so a new rule cannot contradict a rule QA already established.

This closes an outer loop: human review feedback becomes a written rule, which the next Dev phase reads, so the same comment is never needed twice.

---

## Failure modes and how the loop handles them

| Failure mode | Guard |
|---|---|
| Agent invents conventions | `ARCHITECTURE.md` required; hard-stop if missing |
| Decision rationale lost | ADRs record why and what was rejected, dated and immutable |
| Recorded decision quietly worked around | `dev` stops on conflict; `/review-branch` flags it `[BLOCKER]` |
| Agent grades its own work | Dev cannot write `[COMPLETED]`; only QA can |
| Vague "done" | Acceptance criteria fixed before implementation |
| Assumed business rules | QA must stop and ask; answers recorded with an ID |
| Tests that pass by construction | QA audits tests against rules, not against code |
| Context loss between sessions | All state on disk in `MILESTONES.md` |
| Scope creep mid-milestone | New work becomes a new task or milestone, not a silent addition |
| Milestone quietly abandoned | Blocked milestones stop the run instead of being skipped |
| Same review comment twice | `learn-from-pr` promotes it to a written rule |

---

## Conventions to keep

- **Stop over guess.** Every skill prefers a blocking question to a silent assumption. A wrong assumption written to disk propagates.
- **Never destroy history.** No unchecking boxes, no deleting criteria, no removing rules — deprecate instead.
- **One owner per file.** See [artifacts.md](artifacts.md). Two writers on one file means neither is accountable for it.
- **Specs before code, always.** See [spec-driven-development.md](spec-driven-development.md).

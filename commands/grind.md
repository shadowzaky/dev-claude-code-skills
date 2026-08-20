Run Dev → QA on every non-completed milestone in MILESTONES.md, one by one, until all are COMPLETED.

No PM phase. Milestones must already exist in MILESTONES.md. This command grinds through all of them sequentially.

---

## Step 1 — Read the queue

Read `MILESTONES.md`. If not found at the root, also check `doc/milestones.md`. Use whichever exists; if both exist, prefer the root one.

- If file does not exist in either location or has no milestones: **stop** — tell the user to run `/milestones` or `/sprint` to define milestones first.
- If `ARCHITECTURE.md` does not exist: **stop** — tell the user:
  > No `ARCHITECTURE.md` found. Run `/architecture` to document the project architecture first, then re-run `/grind`.
- If `docs/adr/` exists: read every `Accepted` ADR — they are binding for every milestone in the queue. If any relevant ADR is still `Proposed`, name it and recommend `/adr-review` before the grind starts; batch mode is the worst place to discover a contested decision.
- Build a list of all milestones that are NOT marked `[COMPLETED]`. These are the work queue.
- If the queue is empty (all milestones already `[COMPLETED]`): **stop** — tell the user everything is done, suggest archiving with `/qa`. If `idea-backlog.md` has open ideas, mention that `/idea-backlog` can promote one into the next milestone.
- Present the queue to the user:

  > **Grind queue — X milestones to complete:**
  > 1. Milestone Name A
  > 2. Milestone Name B
  > 3. Milestone Name C
  >
  > These will be processed in the order listed, Dev then QA for each.
  > Any milestone already marked `[ACTIVE]` will be processed first.
  > **Proceed?**

- Wait for explicit user confirmation before starting.

---

## Step 2 — Order the queue

Process milestones in this order:
1. Any milestone already marked `[ACTIVE]` goes first (dev work may already be in progress).
2. Remaining non-completed milestones follow in the order they appear in `MILESTONES.md`.

---

## Step 3 — For each milestone: Dev phase

Invoke the `dev` skill for the current milestone.

Mark the milestone `[ACTIVE]` in the milestones file (whichever path was found in Step 1 — root `MILESTONES.md` or `doc/milestones.md`). Remove `[ACTIVE]` from any other.

Act as a senior developer:

1. Read the milestone: goal, acceptance criteria, tasks.
2. Plan the implementation (files, migrations, dependencies, risks) and present the plan to the user. Flag any expensive-to-reverse or cross-module decision in the plan and offer `/adr-create` for it — that is part of the plan gate, not an afterthought.
3. **GATE: wait for user confirmation of the plan before writing any code.**
4. Implement each task, checking it off in `MILESTONES.md` as it completes.
5. Write unit tests and integration tests following `ARCHITECTURE.md` conventions.
6. Run linter and full test suite — all must pass.
7. Do NOT mark the milestone complete or remove `[ACTIVE]`.
8. Report: **"Dev complete for [Milestone Name]. All tests pass. Starting QA."**
   - No gate here — proceed directly to QA for the same milestone.

---

## Step 4 — For each milestone: QA phase

Invoke the `qa` skill for the current milestone.

Act as a QA engineer:

1. Confirm all tasks are checked `[x]` — stop if any are incomplete, report to user, wait for resolution.
2. Discover business rules from codebase, tests, and acceptance criteria.
3. For any ambiguous rule: **stop and ask the user** — do not assume. Record the answer in `BUSINESS_RULES.md`.
4. Write or update `BUSINESS_RULES.md` with all discovered and confirmed rules.
5. Audit every test against every business rule — write missing or weak tests.
6. Validate each acceptance criterion is covered by a passing test.
7. Run the full test suite — all must pass, zero skips.
8. Mark the milestone `[COMPLETED]` in `MILESTONES.md`.
9. Deliver QA report for this milestone (criteria, rules validated, tests added, suite summary).
10. Ask: **"Archive [Milestone Name] to `milestones-archived.md`?"** — archive if yes, leave if no.
11. If the milestone changed user-visible behaviour and `docs/product/` exists: update it via the `product-docs` skill in the same pass — no gate. Batch mode means the docs stay current without a second sweep at the end.

---

## Step 5 — Advance to next milestone

After QA completes and the user has responded to the archive prompt:

- If more milestones remain in the queue:
  1. Run `/clear` to reset conversation context before starting the next milestone. This prevents context from one milestone bleeding into the next.
  2. Announce **"Moving to next milestone: [Name]"** and return to Step 3.
- If queue is empty: deliver the grind summary (see Step 6).

---

## Step 6 — Grind complete: final summary

When all milestones are `[COMPLETED]`, present:

```
## Grind Complete

**Milestones completed this session:**
| Milestone | Tests Added | Business Rules | Status |
|-----------|-------------|----------------|--------|
| Name A    | X tests     | BR-001, BR-002 | ✓ COMPLETED |
| Name B    | X tests     | BR-003         | ✓ COMPLETED |

**Total tests added:** X
**Business rules documented:** X (see BUSINESS_RULES.md)

All milestones complete. Repository is clean.
```

---

## Pipeline rules

- **No auto-advance past the dev plan gate** — user must approve the implementation plan for each milestone before coding starts.
- **Dev → QA gate is intentionally absent** — unlike `/sprint` (which requires explicit user confirmation between dev and QA), grind proceeds directly from dev to QA for each milestone. This is by design: grind is a batch mode for processing a known queue with minimal interruption. Use `/sprint` when you want interactive sign-off between phases.
- **QA ambiguity always blocks** — never assume a business rule; always ask.
- **No milestone skipping** — if a milestone is blocked (missing impl, failing tests), stop the whole grind and wait for the user to resolve it. Do not skip to the next one.
- **Stop/pause respected** — if the user says "stop", "pause", or "hold" at any point: stop immediately and report which milestone was in progress and what phase it was in. Resume with `/grind` and it will re-read the queue and continue from the next incomplete milestone.

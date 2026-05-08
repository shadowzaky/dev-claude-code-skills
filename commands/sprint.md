Run the full milestone pipeline: PM defines the milestone, Dev implements it, QA validates and closes it.

This command orchestrates three skills in strict sequence. Each phase must fully complete and receive explicit user approval before the next begins. No phase may be skipped.

---

## Phase 0 — Preflight check

Before starting, verify:
- `ARCHITECTURE.md` exists in the project root. If not: **stop** — tell the user:
  > No `ARCHITECTURE.md` found. Run `/architecture` to document the project architecture first, then re-run `/sprint`.
- `MILESTONES.md` may or may not exist — PM phase will create or update it.

---

## Phase 1 — Product Manager: Define the milestone

Invoke the `milestones` skill now.

Act as a product manager. Work with the user to define a new milestone:

1. Ask the user: **"What are we building? Describe the feature or goal in plain language."**
2. From their answer, draft:
   - A milestone name (short, descriptive, no number)
   - A one-sentence goal statement (what it delivers and for whom)
   - At least 3 acceptance criteria (specific, testable, user-visible outcomes)
   - An initial task list (concrete dev tasks, no more than 8 — suggest splitting if larger)
3. Present the full draft to the user and ask: **"Does this milestone look right, or would you like to adjust anything before we start?"**
4. Iterate until the user confirms the milestone is correct.
5. Write the confirmed milestone to `MILESTONES.md` and mark it `[ACTIVE]`.
6. Show the user the written milestone and confirm: **"Milestone written and set as ACTIVE. Ready to hand off to Dev?"**
7. Wait for explicit user confirmation (yes/proceed/go ahead) before continuing.

---

## Phase 2 — Developer: Implement the milestone

Invoke the `dev` skill now.

Act as a senior developer. Implement the active milestone end-to-end:

1. Verify `ARCHITECTURE.md` exists — stop and ask the user to create it if missing (do not continue until it exists).
2. Read the active milestone from `MILESTONES.md`.
3. Plan the implementation (files, migrations, dependencies, risks) and present the plan to the user before writing any code.
4. Wait for user confirmation of the plan before coding.
5. Implement each task, checking it off in `MILESTONES.md` as it completes.
6. Write unit tests and integration tests following `ARCHITECTURE.md` conventions.
7. Run linter and full test suite — all must pass.
8. Do NOT mark the milestone complete or remove `[ACTIVE]`.
9. Optionally run `/review-branch` for a deeper pre-QA code review before handoff.
10. Report implementation summary to the user and ask: **"Dev work is done and all tests pass. Ready to hand off to QA?"**
11. Wait for explicit user confirmation before continuing.

---

## Phase 3 — QA: Validate and close the milestone

Invoke the `qa` skill now.

Act as a QA engineer. Validate the active milestone fully:

1. Confirm all tasks in the milestone are checked `[x]` — stop if any are incomplete.
2. Discover business rules from the codebase, tests, and acceptance criteria.
3. For any ambiguous rules: **stop and ask the user** before assuming — record all answers.
4. Write or update `BUSINESS_RULES.md` with all discovered and confirmed rules.
5. Audit every test against every business rule — write missing or weak tests.
6. Validate each acceptance criterion is covered by a passing test.
7. Run the full test suite — all must pass, zero skips.
8. Only when everything above passes: mark the milestone `[COMPLETED]` in `MILESTONES.md`.
9. Deliver the full QA report to the user (criteria table, rules validated, tests added, suite summary).
10. Ask the user: **"Would you like to archive this milestone to `milestones-archived.md`?"**
11. Archive if yes, leave in place if no.

---

## Pipeline gates

These are non-negotiable. Do not advance phases automatically:

| Gate | Condition |
|------|-----------|
| PM → Dev | User has confirmed the milestone in writing |
| Dev → QA | User has confirmed dev is complete and tests pass |
| QA → Done | All tests pass, all criteria verified, user has seen the QA report |

If the user says "stop", "pause", or "hold" at any point: stop the pipeline and wait. The user can resume by saying "continue" or re-invoking `/ship`.

If any phase hits a hard blocker (missing `ARCHITECTURE.md`, failing tests, incomplete tasks): report the blocker clearly, stop the pipeline, and wait for the user to resolve it before resuming.

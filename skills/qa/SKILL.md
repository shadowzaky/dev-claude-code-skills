---
name: qa
description: >
  QA skill for validating a completed milestone: verifies all tests cover business rules,
  discovers and documents rules in BUSINESS_RULES.md, runs the full test suite, validates
  acceptance criteria are met, marks the milestone COMPLETED, delivers a QA report,
  and offers to archive it to milestones-archived.md. Also runs a rule-intake mode that
  records a single proposed business rule with no milestone involved — this is how /fix
  hands over an invariant a bug revealed, since this skill owns BUSINESS_RULES.md.
  Triggers when user says "qa milestone", "test milestone", "validate milestone",
  "run qa", "/qa", "record this business rule", or asks to sign off on the active milestone.
---

You are acting as a QA engineer. Your job is not to write features — it is to verify that what was built is correct, complete, and well-tested against the business rules. Work methodically through each step before moving to the next.

---

## Step 0 — Which mode is this?

This skill runs in two modes. Decide before Step 1, because the prerequisites differ.

**Milestone validation** — the default. A milestone has been built and needs signing off. Continue to Step 1.

**Rule intake** — invoked with a *proposed business rule* and no milestone to validate. This is how `/fix` records an invariant a bug revealed: `BUSINESS_RULES.md` is owned by this skill, so `/fix` proposes and this skill writes. A user may also invoke it directly to record a rule.

In rule intake mode, **skip Steps 1a and 1c through 9 entirely** — there is no milestone, no acceptance criteria, and nothing to mark `[COMPLETED]`. Do this instead:

1. Read `BUSINESS_RULES.md`. If it does not exist, create it with the standard header and section structure.
2. Read the proposed rule, the behaviour it constrains, and the test that enforces it.
3. **Check it against every existing rule.** If it contradicts one, **stop** and report both — either the existing rule is wrong or the proposed one is, and that is the user's call. Never record two rules that disagree.
4. If an existing rule already covers the behaviour, say so and record nothing. Add the new test to that rule's **Validated by** line instead — a second enforcer of an existing rule is not a new rule.
5. Otherwise assign the next free `BR-XXX` — never renumber existing rules, since ADRs and reports cite them by number — and write the entry in the house format: **Rule**, **Rationale**, **Validated by**.
6. Place it in the section its subject belongs to. Numbers need not be contiguous within a section.
7. Update the header's `Last updated` and `Updated by` lines.
8. Report the rule as written, with its number, and stop. **Do not touch `MILESTONES.md`.**

---

## Step 1 — Verify prerequisites

### 1a. Check MILESTONES.md
Read `MILESTONES.md`.

- If it does not exist: **stop** — tell the user there are no milestones to QA.
- If no milestone is marked `[ACTIVE]` and no name was specified: **stop** — ask the user which milestone to validate.
- If a name was specified (e.g. `/qa Keycloak Authentication`): locate that milestone. If it is not marked `[ACTIVE]`, confirm with the user before proceeding — QA should only run on the milestone currently being developed.
- Extract: milestone name, goal, all acceptance criteria, all tasks (note how many are checked).
- If any tasks are **unchecked**: **stop** — report which tasks are incomplete and tell the user to finish dev (`/dev`) before QA runs.

### 1b. Check ARCHITECTURE.md
Read `ARCHITECTURE.md`. If it does not exist: **stop** — tell the user:
> No `ARCHITECTURE.md` found. Run `/architecture` to document the project architecture, then re-run `/qa`.

If the header block declares a flavor — `> Flavor: <name>` or `> Flavor: <name>@<plugin>` — resolve it by trying `flavor-<name>` first, then, only for the `@` form, `<plugin>:flavor`. Invoke whichever resolves and run its **QA checks** section in addition to the steps below. Where a flavor check and `ARCHITECTURE.md` conflict, `ARCHITECTURE.md` wins — state the override once. If neither candidate exists, **stop** and report the bad marker.

If a header key only *looks* like the marker — `Flavour:`, `flavor:`, `Flavor :`, or any near-miss of `Flavor:` — **stop** and report it. It matches no marker, so the alternative is signing off a milestone whose domain checks never ran, with nothing in the QA report saying so.

### 1c. Check BUSINESS_RULES.md
Look for `BUSINESS_RULES.md` in the project root.
- If it exists: read it fully. These are the authoritative rules QA validates against.
- If it does not exist: note this — you will create it during Step 2.

---

## Step 2 — Discover and document business rules

Business rules are the non-negotiable behaviours the system must enforce regardless of implementation detail. They live in `BUSINESS_RULES.md`, not in code comments.

### 2a. Extract rules from existing sources
Scan the following for implied or explicit business rules:
- The active milestone's acceptance criteria
- `ARCHITECTURE.md` (auth patterns, validation requirements, error shapes)
- Existing service files relevant to the milestone
- Existing test files — test descriptions often encode rules
- Any `BUSINESS_RULES.md` already present

### 2b. Flag ambiguous or missing rules
For each rule you are **unsure about**, stop and ask the user directly. Examples of questions to ask:
- "The auth middleware blocks unauthenticated requests with 401, but I can't find a rule about what happens when a valid token belongs to a deleted user — should it return 401 or 403?"
- "Password reset tokens — is there a rule on expiry duration and single-use enforcement?"
- "Is there a rule on maximum file upload size, or is that left to infrastructure?"

Do not assume. Ask once per ambiguous rule. Record the user's answer immediately.

### 2c. Write or update BUSINESS_RULES.md
After resolving ambiguities, write all discovered and confirmed rules to `BUSINESS_RULES.md`.

**File format:**

```markdown
# Business Rules

> Last updated: YYYY-MM-DD
> Updated by: QA pass on [Milestone Name]

## [Domain Name] (e.g. Authentication, Payments, Users)

### BR-001: Rule title
**Rule:** One sentence statement of the rule.
**Rationale:** Why this rule exists (user safety, legal, business logic).
**Validated by:** `tests/integration/auth.test.ts` — "should return 401 when token is expired"

### BR-002: Rule title
...
```

Rules:
- Each rule gets a unique ID (`BR-XXX`) that never changes even if the rule is reworded.
- New rules added by this QA pass get the next available ID.
- Never delete a rule — if a rule is removed from the system, mark it `**DEPRECATED**` with a note.
- If `BUSINESS_RULES.md` already exists, append new rules and update `Last updated` and `Updated by`.

---

## Step 3 — Audit existing tests against business rules

For each business rule in `BUSINESS_RULES.md` (including ones just added):

1. Find the test(s) that cover it.
2. Verify the test actually asserts the rule — not just that the happy path works, but that violations are caught.
3. Check that the test uses realistic data (no `foo`, `bar`, `test123`, placeholder UUIDs).
4. Check that assertions are specific (status codes, response body shape, DB state) — not just "did not throw".

**For each gap found** (rule exists but no test covers it, or test is too weak):
- Write the missing or strengthened test.
- Follow the testing conventions in `ARCHITECTURE.md`.
- Unit tests: mock external dependencies. Integration tests: use real DB, clean up own data.

After writing any new tests, re-run the full suite. All tests must pass before proceeding.

---

## Step 4 — Validate acceptance criteria

Go through each acceptance criterion in the active milestone one by one:

For each criterion:
1. Identify which test(s) prove it is met.
2. If no test proves it: write one, or note it as a manual verification step if it cannot be automated.
3. Run the relevant tests and confirm they pass.
4. Mark the criterion as verified in your working notes (do NOT edit `MILESTONES.md` yet — wait until all criteria pass).

If any criterion **cannot be verified** (missing implementation, failing test, or ambiguous outcome): **stop**, report the gap to the user, and wait for resolution. Do not mark anything complete while gaps exist.

---

## Step 5 — Run the full test suite

```bash
npm test
```
(or the test command from `ARCHITECTURE.md`)

- All tests must pass — zero failures, zero skipped tests that should run.
- If any test fails: diagnose the failure, fix it (or report it as a bug if it reveals a real defect), and re-run until clean.
- Note total test count, passing count, and coverage if the project reports it.

---

## Step 6 — Mark milestone COMPLETED

Only reach this step when:
- All tasks are checked `[x]`
- All acceptance criteria are verified
- All tests pass
- `BUSINESS_RULES.md` is written/updated

Update `MILESTONES.md`:
- Change the milestone heading from `## Milestone Name [ACTIVE]` → `## Milestone Name [COMPLETED]`
- Add a completion line under the heading:

```markdown
## Keycloak Authentication [COMPLETED]

> **Completed:** YYYY-MM-DD
> One-sentence goal: ...
```

Do not remove any tasks, criteria, or checkboxes — the history must be preserved.

---

## Step 7 — Deliver QA report

Present the following report to the user:

```
## QA Report — [Milestone Name]
**Date:** YYYY-MM-DD
**Status:** PASSED ✓

### Acceptance Criteria
| Criterion | Status | Verified by |
|-----------|--------|-------------|
| User can log in via Keycloak... | ✓ PASS | tests/integration/auth.test.ts |
| ...                             | ✓ PASS | ... |

### Business Rules Validated
| Rule ID | Description | Test |
|---------|-------------|------|
| BR-001  | Token expires after 15 min | auth.test.ts — "expired token returns 401" |
| ...     | ...         | ... |

### Tests Written This Pass
- `tests/integration/auth.test.ts` — 3 new tests added
- `tests/unit/TokenValidationService.spec.ts` — 2 new tests added

### Test Suite Summary
- Total: XX | Passing: XX | Failing: 0

### Notes
(Any observations, risks, or recommendations for future milestones)
```

---

## Step 8 — Offer archival

After presenting the report, ask the user:

> The milestone is marked COMPLETED. Would you like to archive it to `milestones-archived.md`?
> Archiving moves the full milestone block (goal, criteria, tasks, completion date) out of `MILESTONES.md` into `milestones-archived.md` to keep the active file clean.

If the user says **yes**:

1. Read `milestones-archived.md` (create if it does not exist).
2. Append the full completed milestone block (heading, goal, completion date, all criteria, all tasks) to `milestones-archived.md` under a `## Archived YYYY-MM-DD` section.
3. Remove the milestone block from `MILESTONES.md`.
4. Confirm to the user: "Milestone archived. `MILESTONES.md` now has X remaining milestones."

**milestones-archived.md format:**

```markdown
# Milestones Archive

---

## Archived 2026-05-02

### Keycloak Authentication [COMPLETED]

> **Completed:** 2026-05-02
> Enable users to authenticate via Keycloak SSO, replacing the current local JWT flow.

#### Acceptance Criteria
- [x] User can log in via Keycloak and receive a valid session token accepted by the API
- [x] ...

#### Tasks
- [x] Set up Keycloak realm and client config
- [x] ...

---
```

If the user says **no**: leave `MILESTONES.md` as-is with `[COMPLETED]` marker.

---

## Step 8b — Record the findings

**Runs on every QA pass, archived or not, findings or none.** No gate, no prompt.

The QA report in Step 7 is delivered into a conversation and then gone. That is fine for signing off one milestone and useless across several — nothing accumulates, so nothing can be noticed. This step is what makes `qa-retro` possible: a pattern only exists if what QA caught was written down each time.

Append a section to `qa-findings.md` in the project root (create it if absent — lowercase, derived, owned by this skill):

```markdown
## <Milestone Name> — YYYY-MM-DD

- `missing-test` — criterion 3 had no covering test; added `tests/auth.spec.ts::rejects expired token`
- `weak-assertion` — existing test checked status only, not response body
- `undocumented-rule` — BR-018 surfaced during QA rather than during dev
- `criterion-unmet` — criterion 2 failed on first run; fixed in-pass
- `flaky` — `tests/sync.spec.ts` passed only on retry
```

**Use a stable category slug.** Free text alone cannot be clustered — the same mistake described three different ways reads as three different problems. Reuse an existing slug whenever it fits; add a new one only for a genuinely new kind of finding. The slugs above are the starting set.

If the pass found nothing — every criterion covered, no test added, no rule surfaced late — record that too:

```markdown
## <Milestone Name> — YYYY-MM-DD

- `clean` — no findings
```

A clean pass is data. Without it, `qa-findings.md` implies every milestone was troubled, and the denominator that tells a pattern from a coincidence is lost.

---

## Step 9 — Offer a product docs update

If the milestone changed user-visible behaviour and `docs/product/` exists, ask:

> This milestone changed what users can do. Update `docs/product/` to reflect it?

If yes, invoke the `product-docs` skill to move the affected features to **Shipped**, record the milestone name and completion date, and add any new user-facing `BR-XXX` IDs to the relevant features' constraints.

If `docs/product/` does not exist and the milestone shipped user-visible behaviour, mention `/product-docs` once as an option. Do not create it unprompted.

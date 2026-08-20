---
name: adr-review
description: >
  Reviews Proposed ADRs in docs/adr/ for completeness, honesty, and conflicts with existing
  accepted records, then — with user sign-off — accepts, rejects, or sends them back for
  changes. On acceptance it propagates the decision into ARCHITECTURE.md and updates the
  ADR index. Also audits accepted ADRs against the code to find drift.
  Triggers when user says "review ADRs", "approve this ADR", "accept ADR", "reject ADR",
  "any ADRs pending", "audit ADRs", "/adr-review".
---

You are reviewing architecture decision records. Your job is not to agree — it is to find what is missing, what is dishonest, and what conflicts with decisions already accepted.

You do not accept an ADR on your own judgement. You give a verdict with reasons; the **user** signs off. Then you apply the consequences.

---

## Step 1 — Scope the review

Read `docs/adr/` and its `README.md`.

- If `docs/adr/` does not exist: **stop** — tell the user to run `/adr-create` first.
- If a specific ADR was named (`/adr-review 0007`): review that one.
- Otherwise: review every ADR with status `Proposed`, oldest first.
- If none are `Proposed`: offer the **drift audit** instead (Step 6) and stop.

Also read, once, as the review baseline:

- `ARCHITECTURE.md` — what the ADR must fit into or explicitly change.
- All `Accepted` ADRs — for conflicts and supersession.
- `BUSINESS_RULES.md` — a technical decision must not violate a business invariant.

---

## Step 2 — Review each ADR

Check every dimension. Do not skip one because the record reads well.

### A. Completeness

- Are Context, Decision, Alternatives considered, and Consequences all present and non-empty?
- Is the title a **decision**, not a topic? ("Use X for Y", not "Caching")
- Are Status, Date, and Deciders filled in?
- Does it cover exactly one decision? Two decisions in one record cannot be superseded cleanly — send it back to be split.

### B. Context quality

- Does it state the forces that made this decision necessary *now* — constraints, deadlines, scale, compliance, existing commitments?
- Could a reader in two years tell whether the context **still holds**? That is the whole test of a Context section. Context stated as timeless truth is useless for that.
- Are claimed constraints real, or assumed? Flag numbers with no source ("we expect 500 tenants" — from where?).

### C. Alternatives

- Is there at least one genuine alternative, with a **specific** reason for rejection? "Not a good fit", "too complex", "not the standard" are non-reasons — flag them.
- Is the obvious default option addressed? If the industry-standard choice is absent from the list, that is the single most common defect in an ADR.
- Are the alternatives real, or strawmen erected to make the decision look inevitable?

### D. Consequences

- **Are negative consequences listed?** An ADR with only benefits is unreviewed thinking. This alone is grounds to send it back.
- Are the negatives specific and owned, or hedged into meaninglessness?
- Is the Follow-up section actionable — which `ARCHITECTURE.md` sections change, which milestone tasks this creates?

### E. Conflicts

- Does it contradict an `Accepted` ADR? If so, it **must** declare `Supersedes: ADR-XXXX`. An undeclared contradiction is a blocker.
- Does it contradict a rule in `ARCHITECTURE.md`? Then acceptance requires an `ARCHITECTURE.md` change — that must be in Follow-up.
- Does it violate a `BR-XXX` business rule? **Blocker.** Business invariants outrank technical preference; the ADR must change or the rule must be renegotiated with the user first.
- Does it duplicate an existing ADR? Merge or supersede rather than adding a near-duplicate.

### F. Feasibility

- Is the decision consistent with the actual stack and team, or aspirational?
- Does anything in the codebase already contradict it? If accepted, that code becomes a violation — say so, and size the migration.

---

## Step 3 — Deliver the review

Per ADR:

```
## Review — ADR-0007: Use a single-tenant database per customer

**Verdict:** ACCEPT / ACCEPT WITH CHANGES / REJECT / NEEDS WORK

### Blockers
- Contradicts ADR-0003 (shared schema) without declaring `Supersedes`. Add it.
- No negative consequences listed — per-tenant migration cost is not mentioned anywhere.

### Concerns
- "We expect 500+ tenants" has no source. If that number is wrong the decision inverts.
- Schema-per-tenant rejected on migration time, but that is the same cost the chosen
  option carries. The reason does not distinguish the options.

### Notes
- Follow-up correctly identifies the ARCHITECTURE.md Database section.

### If accepted, this requires
- ARCHITECTURE.md → Database: per-tenant connection and migration workflow
- ADR-0003 → Superseded by 0007
- New milestone task: tenant provisioning and per-tenant migration runner
- Existing violation: src/data-source.ts assumes a single connection
```

Verdicts:

| Verdict | Meaning |
|---|---|
| **ACCEPT** | No blockers, no material concerns |
| **ACCEPT WITH CHANGES** | Sound decision, record needs specific fixes first — list them exactly |
| **NEEDS WORK** | Missing alternatives or consequences; the thinking is not done |
| **REJECT** | Conflicts with an accepted ADR or a business rule, or is not feasible |

Reviewing a record is not the same as agreeing with the decision. If the record is complete and honest but you think the decision is wrong, say so under Concerns and still report the record as sound — then let the user decide.

---

## Step 4 — Get the user's decision

Present the verdict and ask:

> **ADR-0007** — review complete. Accept, reject, or send back for changes?

Wait for an explicit answer. Never change a status on your own verdict alone.

If the user says accept **while blockers stand**, restate the blocker in one sentence, then do as they ask — it is their call — and record it in the ADR under a `## Review notes` section so the override is visible later.

---

## Step 5 — Apply the outcome

### Accepted

1. Set `**Status:** Accepted` and add `**Decided:** YYYY-MM-DD`.
2. If it supersedes another: set the old one to `**Status:** Superseded by ADR-NNNN`, add a line at its top pointing forward, and confirm the new one lists `Supersedes`. **Never edit the superseded record's substance** — its argument stays exactly as written.
3. Propagate into `ARCHITECTURE.md`: apply every Follow-up item, and append the ADR reference to the rule it produced — e.g. `All tenant queries go through the per-tenant connection factory (ADR-0007).` Rules that cite their ADR survive contact with the next engineer who thinks they know better.
4. If Follow-up implies work: tell the user which milestone tasks are needed and offer to add them via the `milestones` skill. Do not edit `MILESTONES.md` from this skill.
5. Update `docs/adr/README.md` — status and date for every touched record.

### Accept with changes / Needs work

Apply the listed fixes if the user asks you to, leave `Status: Proposed`, and re-review. Nothing propagates until it is accepted.

### Rejected

Set `**Status:** Rejected`, add `**Decided:** YYYY-MM-DD`, and append a `## Rejection reason` section. Keep the file — a rejected ADR stops the same proposal returning next quarter with no memory of why it lost.

---

## Step 6 — Drift audit

When no ADRs are pending, or the user asks for an audit, check the accepted record against reality.

For each `Accepted` ADR:

1. Find where the decision shows up in the code.
2. Check the code still honours it.
3. Check `ARCHITECTURE.md` still reflects it.
4. Check whether its **Context still holds** — the constraint that forced it may be gone.

Report:

```
## ADR Drift Audit

| ADR | Status | Finding |
|---|---|---|
| 0002 | Accepted | Honoured. No drift. |
| 0004 | Accepted | **Violated** — src/services/ReportService.ts bypasses the repository layer. |
| 0005 | Accepted | **Context expired** — chosen for a constraint that ended when we dropped the legacy client. Candidate for a superseding ADR. |
| 0006 | Accepted | Not reflected in ARCHITECTURE.md — the rule it produced was never written down. |
```

Then offer, without doing any of it unprompted: fix the code, write a superseding ADR via `/adr-create`, or patch `ARCHITECTURE.md`.

---

## Rules

1. **Never accept without explicit user sign-off.**
2. **Never edit an accepted or superseded ADR's substance** — only its status header and, on rejection, the reason section.
3. **A missing negatives list is always at least NEEDS WORK.**
4. **An undeclared conflict with an accepted ADR is always a blocker.**
5. **A conflict with a `BR-XXX` business rule is always a blocker** — business invariants outrank technical preference.
6. **Acceptance is not finished until `ARCHITECTURE.md` reflects it.** An accepted ADR nothing enforces is decoration.
7. **Never delete an ADR** — rejected and superseded records stay in the log.

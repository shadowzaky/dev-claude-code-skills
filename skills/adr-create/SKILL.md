---
name: adr-create
description: >
  Writes an Architecture Decision Record to docs/adr/ from what the user just described, or —
  when given nothing specific — scans the codebase, ARCHITECTURE.md and git history for
  significant undocumented decisions and suggests a list of ADRs worth writing.
  New ADRs are always written as Proposed; approval is /adr-review's job.
  Triggers when user says "create an ADR", "write an ADR", "record this decision",
  "document this decision", "we decided to...", "what ADRs are we missing", "/adr-create".
---

You are recording an architecture decision. An ADR captures **why** a decision was made, what else was considered, and what it costs — the information code can never carry.

Every ADR you write is `Proposed`. You do not approve your own record. Acceptance goes through `/adr-review`.

---

## Where ADRs live

```
docs/adr/
  README.md              index table of every ADR and its status
  0001-<kebab-title>.md
  0002-<kebab-title>.md
```

| File | Question it answers |
|---|---|
| `docs/adr/` | **Why** the architecture is the way it is, and what was rejected |
| `ARCHITECTURE.md` | **What** the resulting rules are, stated prescriptively |
| `BUSINESS_RULES.md` | What must always be true for the business |
| `docs/product/` | What the product does and for whom |

An ADR is a dated, immutable argument. `ARCHITECTURE.md` is the living rulebook that argument produced. When they disagree, the newest accepted ADR wins and `ARCHITECTURE.md` gets corrected.

---

## Step 1 — Determine the mode

**Mode A — a decision was described.** The user said what was decided ("we're going with X", "we decided to drop Y"), or a decision was just made in this conversation. Go to Step 2.

**Mode B — nothing specific given.** The user asked what ADRs are missing, or invoked the skill bare. Go to Step 5.

---

## Step 2 — Check the decision is ADR-worthy

Write an ADR when **any** of these hold:

- It is expensive or slow to reverse (data model, persistence choice, auth mechanism, deployment target, public API shape).
- It constrains future work across more than one module.
- A reasonable engineer would pick differently, and it was genuinely contested.
- Someone will ask "why is it like this?" in six months and the code will not answer.
- It rejects an obvious option for a non-obvious reason.

Do **not** write an ADR for:

- Naming conventions, folder layout, formatting — these are `ARCHITECTURE.md` rules.
- Business behaviour ("tokens expire after 15 minutes") — that is a `BUSINESS_RULES.md` entry.
- Local implementation detail confined to one file.
- Routine dependency upgrades with no behavioural consequence.

If it is not ADR-worthy, say which file it belongs in and offer to put it there instead. An ADR log padded with trivia stops being read.

---

## Step 3 — Gather what is missing

An ADR without alternatives and consequences is a press release. Read the relevant code and `ARCHITECTURE.md` first, then ask the user only for what you genuinely cannot infer:

- **Context** — what forced this decision now? Constraints: deadlines, team size, existing systems, cost, compliance.
- **Alternatives** — what else was seriously considered, and why was each rejected? If the answer is "nothing", ask what the obvious default would have been and why it does not apply. Every decision has at least one alternative — doing nothing.
- **Consequences** — what does this make harder, slower, or more expensive? An ADR listing only benefits has not been thought through; push once for the real cost.
- **Deciders** — who made the call.

Also check `docs/adr/` for an existing ADR this contradicts or replaces. If one exists, this ADR **supersedes** it — record that both ways.

---

## Step 4 — Write the ADR

1. Read `docs/adr/`, creating it and its `README.md` if absent.
2. Take the next unused number — 4 digits, sequential, **never reused**, gaps left in place if one is deleted.
3. Write `docs/adr/NNNN-kebab-case-title.md`:

```markdown
# ADR-0007: Use a single-tenant database per customer

- **Status:** Proposed
- **Date:** 2026-08-19
- **Deciders:** <names or roles>
- **Supersedes:** ADR-0003 <omit if none>

## Context

What situation forced a decision, and what constrained it. State the forces plainly —
compliance requirements, expected scale, team capacity, existing commitments. Someone
reading this in two years must be able to tell whether the context still holds.

## Decision

One paragraph, active voice, stated as a commitment: "We will ...".

## Alternatives considered

### Shared schema with a tenant_id column
Cheaper to operate and simpler to query across tenants. Rejected because our largest
prospect's contract requires physical data separation.

### Schema-per-tenant in one database
Rejected because migration time grows linearly with tenant count and we expect 500+.

## Consequences

**Positive**
- Data separation is structural rather than enforced by application code.

**Negative**
- Cross-tenant reporting needs a separate aggregation path.
- Migrations must run per tenant; deploy time grows with customer count.

**Follow-up**
- `ARCHITECTURE.md` → Database section needs the per-tenant connection pattern.
- New milestone task: tenant provisioning and migration runner.
```

Rules:

- **Title states the decision**, not the topic. "Use Keycloak for authentication", not "Authentication".
- **Status is always `Proposed`** on creation. Never write `Accepted` yourself.
- **Present tense, active voice** in Decision. "We will use X", not "X should probably be used".
- **Alternatives need real reasons.** "Not a good fit" is not a reason.
- **Negative consequences are mandatory.** If you cannot find one, you have not understood the decision.
- **No code dumps.** Reference files and layers; do not paste implementations that will drift.

4. Update `docs/adr/README.md`:

```markdown
# Architecture Decision Records

Why the architecture is the way it is. Each record is immutable once accepted — a changed
decision means a new ADR that supersedes the old one, never an edit to the original.

Status: **Proposed** (awaiting `/adr-review`) · **Accepted** · **Rejected** · **Superseded** · **Deprecated**

| # | Title | Status | Date |
|---|---|---|---|
| [0007](0007-single-tenant-database.md) | Use a single-tenant database per customer | Proposed | 2026-08-19 |
| [0003](0003-shared-schema.md) | Shared schema with tenant_id | Superseded by 0007 | 2026-02-11 |
```

5. Report: number, title, status `Proposed`, and that `/adr-review` is needed before it becomes binding.

Do **not** update `ARCHITECTURE.md` yet. That happens on acceptance, in `/adr-review`.

---

## Step 5 — Mode B: suggest ADRs worth writing

The user wants to know which decisions are undocumented. Do not write anything yet.

### 5a. Read the evidence

- `ARCHITECTURE.md` — every prescriptive rule with no stated rationale is a candidate. "Services must never import `req`" is a rule; the *why* is a missing ADR.
- `docs/adr/` — what is already recorded, so you do not propose duplicates.
- `package.json` / lockfile — significant framework, ORM, auth, queue, and infrastructure choices.
- Entry point, data source config, auth middleware, external service clients — the structural commitments.
- `git log --oneline` for large structural commits ("migrate to", "replace", "drop", "introduce").
- `BUSINESS_RULES.md` and `MILESTONES.md` — a milestone that reshaped the system usually contains a decision.

### 5b. Present candidates, ranked

For each: the decision as a title, the evidence you found, and why it matters now.

```
## Suggested ADRs

1. **Use TypeORM as the persistence layer** — every repository depends on it and swapping
   it would touch every data path. No rationale recorded anywhere.
   *Evidence:* package.json, src/data-source.ts, 14 repositories.

2. **Reject soft deletes in favour of an audit table** — entities have no deletedAt column
   but an audit_log table exists. Deliberate, undocumented, easy to accidentally reverse.
   *Evidence:* src/entities/*, migration 1712...
```

Then ask which to write. Write only the ones the user picks, one at a time, through Steps 2–4.

**Do not invent the rationale.** For historical decisions no one remembers, write the Context and Alternatives from the evidence, mark unknowns explicitly, and ask:

```markdown
> **Reconstructed** — this decision predates the ADR log. Context inferred from the
> codebase and commit history; the deciders' original reasoning was not recorded.
```

A reconstructed ADR that is honest about its gaps beats a confident invention.

---

## Rules

1. **Never write `Accepted`.** Creation and approval are separate roles for the same reason Dev cannot close its own milestone.
2. **Never edit an accepted ADR's substance.** Changed decision → new ADR that supersedes it. The record of what was believed and when is the asset.
3. **Never delete an ADR.** Rejected and superseded ones stay, with status set.
4. **Numbers are never reused**, even if a file is removed.
5. **One decision per ADR.** A record covering "auth and caching" cannot be superseded cleanly.
6. **Do not touch `ARCHITECTURE.md`** — that is `/adr-review`'s job on acceptance.

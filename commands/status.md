Report the state of the whole pipeline in one pass — active milestone, remaining work, pending decisions, documentation drift — and name the single next action.

Read-only. This command never edits a file, never marks anything complete, and never creates anything.

---

## Step 1 — Read what exists

Check for each file. A missing file is a finding, not an error — report it and move on.

| File | Read for |
|---|---|
| `MILESTONES.md` | Active milestone, task counts, criteria counts, queue of incomplete milestones |
| `ARCHITECTURE.md` | Presence, `Last updated` date |
| `BUSINESS_RULES.md` | Rule count, `Last updated`, which milestone last touched it |
| `docs/adr/` | Status of every record — `Proposed` count especially |
| `docs/product/` | Presence, `Last updated` per file |
| `idea-backlog.md` | Counts per section |
| `milestones-archived.md` | How many milestones shipped |

Then read the git state:

```bash
git branch --show-current
git status --short
git log --oneline -5
git log master..HEAD --oneline
```

Do not read source files. This is a spec-state report, not a code review — keep it fast.

---

## Step 2 — Detect problems

Report only what is actually true. An invented problem costs more attention than a missed one.

**Blocking**

- `ARCHITECTURE.md` missing → `/dev`, `/qa`, `/grind`, `/review-branch` are all hard-stopped.
- More than one milestone marked `[ACTIVE]` → the loop's state is corrupt; exactly one is allowed.
- A milestone marked `[COMPLETED]` with unchecked tasks → QA closed something incomplete.

**Needs attention**

- `Proposed` ADRs outstanding — decisions in limbo, especially any the active milestone touches.
- Milestone `[ACTIVE]` with every task checked → QA has not run; `/qa` is the next step.
- Uncommitted changes on top of a `[COMPLETED]` milestone → work never shipped.
- Commits on the branch ahead of master with no PR → `/ship`.
- `docs/product/` older than the newest `[COMPLETED]` milestone → product docs are stale.
- `BUSINESS_RULES.md` missing while completed milestones exist → QA passes ran without recording rules.
- `ARCHITECTURE.md` still carrying the greenfield **"Designed, not yet built"** banner while real code exists → time to reconcile with `/architecture`.

---

## Step 3 — Report

Keep it to one screen. Omit any section with nothing to say rather than printing "none".

```
## Pipeline status

**Milestone:** Keycloak Authentication [ACTIVE]
  Tasks     5/7 complete
  Criteria  4 defined, unverified (QA has not run)

**Branch:** feat/keycloak-authentication — 4 commits ahead of master, 2 files uncommitted

**Specs**
  ARCHITECTURE.md      updated 2026-07-14
  BUSINESS_RULES.md    18 rules, last touched by QA on Tenant Quotas
  docs/adr/            7 records — 6 accepted, 1 proposed
  docs/product/        updated 2026-06-02  (stale — 2 milestones shipped since)
  idea-backlog.md      12 open, 4 promoted, 3 dropped

**Queue:** 3 milestones incomplete — Tenant Quotas, Audit Log, Bulk Export

### Needs attention
- ADR-0007 (single-tenant database) is still Proposed and this milestone implements it → /adr-review
- docs/product/ has not been updated since two milestones shipped → /product-docs

### Next
Finish tasks 6 and 7, then /qa. Settle ADR-0007 before the decision hardens in code.
```

Rules for the report:

- **Numbers, not adjectives.** "5/7 tasks" beats "good progress".
- **Every problem names its command.** A finding with no next step is noise.
- **One recommended next action**, not a menu. If several are genuinely equal, say so in a line.
- **Never modify anything.** If the user asks you to fix something you found, that is the relevant skill's job — invoke it, do not patch the file from here.

---

## Empty project

If none of the spec files exist:

```
## Pipeline status

No pipeline files found. This project is not set up yet.

**Start with:** /architecture
  Empty repo → greenfield mode: designs the stack from your intent and records it as ADRs.
  Existing code → reads it and documents the conventions it finds.

Then: /idea-backlog to capture ideas, or /milestones for the first milestone, then /sprint.
```

---
name: setup-loop
description: >
  Upgrades an existing repository to run the PM → Dev → QA loop: surveys what is already there,
  reports which pipeline artifacts are missing, then sets them up in dependency order by
  delegating to the skill that owns each file. Idempotent — never overwrites what exists.
  Triggers when user says "set up the loop", "set up the pipeline", "onboard this repo",
  "adopt these skills here", "upgrade this repo to use the skills", "get this project ready
  for /dev", or invokes /setup-loop.
---

You are onboarding an existing repository onto the pipeline. The work is mostly **assessment and sequencing** — the actual files are written by the skills that own them, never by this one.

Two rules shape everything below:

- **Never write an artifact another skill owns.** Delegate to `architecture`, `milestones`, `adr-create`, `product-docs`, `idea-backlog`. Ownership is what keeps each file coherent.
- **Never overwrite.** Every existing file is left alone unless the user explicitly asks for it to be revised. A half-finished `ARCHITECTURE.md` someone wrote by hand is worth more than a fresh one that discards their decisions.

---

## Step 1 — Survey

Read, do not write.

### Repository state

```bash
git rev-parse --is-inside-work-tree
git branch --show-current
git log --oneline -10
git remote -v
```

- Not a git repo: say so and ask whether to continue anyway. The loop works without git; `/ship`, `/sync`, `/review-branch`, and `learn-from-pr` do not.
- Note the default branch name — `/review-branch` and `/sync` assume it.

### Codebase

- Is there real application code, or only scaffolding? A scaffold-only repo is greenfield — `architecture` will handle it in design mode.
- Stack: language, framework, package manager, ORM, test framework, from the manifest and lockfile.
- Test setup: does a suite exist, does it run, what command? `dev` and `qa` both depend on this.
- CI config: existing checks are constraints the pipeline must not fight.

### Pipeline artifacts

| Artifact | Present? | Owner if missing |
|---|---|---|
| `ARCHITECTURE.md` | | `architecture` |
| `MILESTONES.md` | | `milestones` |
| `BUSINESS_RULES.md` | | `qa`, on its first pass |
| `qa-findings.md` | | `qa`, on its first pass — like `BUSINESS_RULES.md`, missing is correct until QA has run |
| `docs/adr/` | | `adr-create` |
| `docs/product/` | | `product-docs` |
| `idea-backlog.md` | | `idea-backlog` |
| `CLAUDE.md` | | `/init` |

Also check for equivalents under other names — `docs/architecture.md`, `ROADMAP.md`, `doc/milestones.md`, `decisions/`, a `docs/` product folder. A repo that already documents something under a different name should be **adopted, not duplicated**: ask whether to move or rename it rather than creating a second source of truth.

### Hygiene

- `.gitignore` covers `.env*` and `.claude/settings.local.json`?
- Are any of those **already committed**? Check with `git ls-files`. This is the one thing in this skill worth interrupting for — a committed `.env` is a live credential leak, and it stays in history after deletion.
- Existing sources of work to seed from: `TODO`/`FIXME` comments, a roadmap section in the README, open issues, a `CHANGELOG.md`.
- Does the repo have merged PR history? If so, `/backfill-pr-rules` can convert past review comments into rules — worth mentioning at the end.

---

## Step 2 — Report and plan

Present what you found and what you propose, then wait for confirmation. Do not start writing.

```
## Repo survey — <name>

**Stack:** TypeScript / Express / TypeORM / Jest — tests run with `npm test` (231 passing)
**Git:** master, 14 branches, 40 merged PRs
**Code:** existing — 62 source files across 6 layers

**Pipeline artifacts**
  ARCHITECTURE.md      missing  ← blocks /dev, /qa, /grind, /review-branch
  MILESTONES.md        missing  ← blocks /dev, /qa
  BUSINESS_RULES.md    missing  (created by the first /qa pass — normal)
  docs/adr/            missing
  docs/product/        missing
  idea-backlog.md      missing
  CLAUDE.md            present

**Hygiene**
  .gitignore covers .env — yes
  .gitignore covers .claude/settings.local.json — NO
  Committed secrets — none found

**Adoptable**
  ROADMAP.md looks like milestones under another name
  23 TODO comments across the codebase — backlog material

### Proposed order
1. Fix .gitignore (1 min)
2. /architecture — required first; everything else is gated on it
3. /adr-create — record the significant decisions already baked into this codebase
4. /milestones — convert ROADMAP.md into milestones with acceptance criteria
5. /idea-backlog — capture the 23 TODOs as one-liners
6. /product-docs — document what the product already does
```

Order the steps by dependency, not by value:

1. **Hygiene** — cheap, and a committed secret is urgent.
2. **`ARCHITECTURE.md`** — hard gate. `dev`, `qa`, `/grind`, and `/review-branch` all refuse to run without it, so nothing else matters until it exists.
3. **ADRs** — best done right after the architecture pass, while the conventions and their reasons are freshly in mind.
4. **Milestones** — the first unit of work.
5. **Backlog** — capture what is not being built yet.
6. **Product docs** — describes shipped behaviour, so it is the most useful once everything else is in place.

`BUSINESS_RULES.md` and `qa-findings.md` are not in the list. Both are created by the first `/qa` pass — one from real acceptance criteria, the other from what that pass actually found. Writing either up front means inventing rules nobody agreed to, or findings nobody observed.

Ask which steps to run. Skipping is fine and expected; a repo that only wants `ARCHITECTURE.md` and milestones is a legitimate setup.

---

## Step 3 — Execute, in order

Run only the confirmed steps, one at a time, reporting after each.

### 3a. Hygiene

- Add missing entries to `.gitignore`.
- If a `.env*` or `.claude/settings.local.json` is **already tracked**: stop and tell the user plainly. Removing it from the index does not remove it from history, and any credential in it must be treated as leaked and rotated. Do not attempt a history rewrite — that is the user's call, on their timeline.

### 3b. ARCHITECTURE.md

Invoke the `architecture` skill. It will read the codebase, ask about inconsistencies, and offer ADRs for genuine trade-offs.

If an architecture-like document already exists under another name, say so and ask: adopt it as the basis, or start fresh? Never silently duplicate.

### 3c. ADRs

Invoke `adr-create` in suggest mode — it scans the codebase, `ARCHITECTURE.md`, and git history for significant decisions with no recorded rationale, and proposes a ranked list.

For an existing codebase, most of these are reconstructions: the deciders may be gone and the reasoning unrecorded. `adr-create` marks those explicitly rather than inventing a rationale. Write only the ones the user picks — an ADR log that opens with twenty speculative records will not be read.

Leave them `Proposed`. Mention `/adr-review` at the end; do not run it as part of setup.

### 3d. MILESTONES.md

Invoke the `milestones` skill.

- If a roadmap or issue list exists, offer to convert it. Existing entries are usually goals without acceptance criteria — the criteria are what the PM phase adds, and they need the user's input.
- If nothing exists, define one milestone: the next real piece of work.
- Do not bulk-convert an entire issue tracker. A backlog of 40 vague milestones is worse than three good ones.

### 3e. idea-backlog.md

Invoke the `idea-backlog` skill. Seed it from `TODO`/`FIXME` comments and any "future work" or "nice to have" notes.

One line per idea, verbatim-ish. Do not expand a TODO into a feature spec — that happens at promotion.

Leave the comments in the code; removing them is a separate change the user has not asked for.

### 3f. docs/product/

Invoke the `product-docs` skill. It reads shipped code and completed milestones, and asks about users, roles, and non-goals — the parts no codebase contains.

---

## Step 4 — Verify the gates open

Confirm each gate rather than assuming the setup worked:

| Gate | Check |
|---|---|
| `/dev` runs | `ARCHITECTURE.md` exists **and** `MILESTONES.md` has a milestone |
| `/qa` runs | `ARCHITECTURE.md` exists and a milestone's tasks are checked |
| `/grind` runs | `ARCHITECTURE.md` exists and at least one milestone is not `[COMPLETED]` |
| `/review-branch` runs | `ARCHITECTURE.md` exists |
| `/ship` runs | Git repo with a remote |

Report anything still blocked and exactly what would unblock it.

---

## Step 5 — Hand off

```
## Setup complete

Created:  ARCHITECTURE.md, MILESTONES.md, idea-backlog.md, docs/adr/ (3 proposed)
Adopted:  ROADMAP.md → MILESTONES.md (4 milestones, criteria added)
Skipped:  docs/product/ — deferred

Unblocked: /dev, /qa, /grind, /review-branch, /ship

### Next
1. /adr-review — 3 ADRs are Proposed and not yet binding
2. /sprint — run the full loop on the first milestone
3. /backfill-pr-rules — 40 merged PRs of review comments to convert into rules
4. /status — check pipeline state any time
```

Mention once, without pushing: team members need `npm update claude-code-skills` and a Claude Code restart before these skills appear for them.

---

## Rules

1. **Assess before writing.** The survey and the plan come first, always.
2. **Delegate ownership.** This skill coordinates; the owning skill writes.
3. **Never overwrite.** Adopt, rename, or leave alone — never silently replace.
4. **Never invent content** to fill a file. A missing `BUSINESS_RULES.md` is correct until QA earns it.
5. **Idempotent.** Re-running on a configured repo reports what exists and offers only the gaps.
6. **Committed secrets stop the run** and get reported, not quietly deleted.
7. **Setup is not the loop.** This skill prepares the repo; it does not implement anything.

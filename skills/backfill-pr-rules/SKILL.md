---
name: backfill-pr-rules
description: >
  Batch-processes historical PR review comments and converts them into persistent rules at the right scope.
  Fetches closed PRs from the repo (or a user-supplied list), deduplicates patterns across PRs,
  and treats comments that appear across multiple PRs as definitively generic (user-level rules).
  Follows the same classification and writing logic as learn-from-pr.
  Triggers when user says "backfill PR rules", "process old PRs", "learn from past PRs",
  "ingest historical review comments", or invokes /backfill-pr-rules.
---

You are acting as a technical lead auditing the team's PR history. Your job is to extract patterns from past review comments, deduplicate them, and persist the resulting rules at the right scope — so lessons from past reviews apply to all future work.

## Step 1 — Identify PRs to process

### 1a. Ask for scope

Ask the user:
> Which PRs should I process?
> 1. Last N closed PRs on this repo (I'll fetch them automatically)
> 2. Specific PR numbers (paste a comma-separated list)
> 3. Both

Wait for response.

### 1b. Fetch PR list

If option 1 or 3: ask how many PRs to fetch (default: 10). Then run:
```bash
gh pr list --state closed --limit <N> --json number,title,headRefName
```

If option 2 or 3: accept the user's list of PR numbers.

Merge both lists, deduplicate, and report: "Processing PRs: #1, #2, #3..."

**Hard stop:** If zero PRs identified, stop and tell the user.

---

## Step 2 — Read project context

Read all of these files if they exist:
- `ARCHITECTURE.md`
- `CLAUDE.md`
- `BUSINESS_RULES.md`
- `~/.claude/skills/dev/SKILL.md`
- `~/.claude/commands/review-branch.md`

Note the existing rules in each so you do not add duplicates later. Check `BUSINESS_RULES.md` before writing any code rule — do not create a rule that contradicts a documented business rule; if a conflict is found, ask the user to resolve it.

---

## Step 3 — Fetch all review comments

For each PR number, run:
```bash
gh pr view <number> --comments
gh api repos/{owner}/{repo}/pulls/<number>/comments
gh api repos/{owner}/{repo}/pulls/<number>/reviews
```

Collect every comment. Tag each with its PR number.

Build a flat list of all comments across all PRs. Report total count: "Fetched X comments across Y PRs."

---

## Step 4 — Deduplicate and classify

### 4a. Group by pattern

Read all comments and identify recurring themes. Comments that express the same underlying rule (even with different wording) should be grouped. A pattern appearing in 2+ PRs is strong evidence it is a **generic** rule.

### 4b. Classify each pattern

For every unique pattern, determine:

**A. Is this actionable as a rule?**
- Yes: describes a repeatable pattern to always do or never do.
- No: one-off fix, personal style preference, or praise — skip. Log it as skipped.

**B. Category:**

| Category | Target file |
|---|---|
| Coding standard (naming, structure, error handling, quality) | `CLAUDE.md` and/or `dev` skill |
| Architecture (layer separation, module ownership, patterns) | `ARCHITECTURE.md` and/or `dev` skill |
| Review checklist (something reviewers should catch) | `review-branch.md` |
| API / OpenAPI / endpoint design | `CLAUDE.md` (API Development Rules section) |

**C. Scope — generic or project-specific?**

- **Definitively generic:** pattern appeared in 2+ PRs, OR clearly applies to any TypeScript/Express backend.
  → Write to project files AND user-level files (`dev` skill + `review-branch`).

- **Definitively project-specific:** references this project's entities, domains, or tech decisions.
  → Write to project files only (`CLAUDE.md` / `ARCHITECTURE.md`).

- **Ambiguous (single PR, unclear scope):** ask the user:
  > Is this rule specific to this project, or should it apply to all your projects?
  > Pattern: `"<summary of pattern>"`
  > Seen in: PR #N
  > [Project-only] [All projects] [Skip]

  Batch ambiguous patterns together and ask once, not one-by-one. Wait for all responses before writing.

### 4c. Deduplicate against existing rules

Before writing any rule, check if an equivalent rule already exists in the target file. If it does, skip it. If the existing rule is weaker or less precise, replace it with the better version and note the upgrade.

---

## Step 5 — Write rules

For each classified pattern, write to the appropriate file(s).

### Project-level

**CLAUDE.md** — add under the most relevant existing section, or create `## Learned Rules` if no section fits. Short imperative bullets: "Always X", "Never Y".

**ARCHITECTURE.md** — add under the relevant layer or pattern section with brief rationale.

### User-level (generic patterns only)

**`~/.claude/skills/dev/SKILL.md`** — add under the most relevant sub-section of Step 3. If no sub-section fits, append to a `### Learned rules` block at the end of Step 3.

**`~/.claude/commands/review-branch.md`** — add under the matching dimension (A–K). If the pattern introduces a new dimension, add it as a new `### L. <Name>` section before Step 5.

For each file modified, report exactly what was added, upgraded, or skipped.

---

## Step 6 — Report

Produce a summary table:

| Pattern (truncated) | PRs seen in | Rule extracted | Written to |
|---|---|---|---|
| "Business logic in controller" | #12, #18, #23 | Services handle logic; controllers only parse + delegate | `CLAUDE.md`, `dev` §3, `review-branch` §B |
| "Magic strings not in enums" | #14, #19 | All status/type strings must be enums or constants | `dev` §3, `review-branch` §E |
| "Fix null check on line 42" | #17 | *(skipped — one-off fix)* | — |

Then state:
- Total comments ingested
- Unique patterns identified
- Rules added project-level
- Rules added user-level
- Rules skipped (and why)
- Rules upgraded (existing rule replaced with stronger version)

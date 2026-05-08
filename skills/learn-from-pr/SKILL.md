---
name: learn-from-pr
description: >
  Ingests PR review comments and converts them into persistent rules at the right scope.
  Project-specific feedback updates CLAUDE.md or ARCHITECTURE.md; generic patterns also
  patch the user-level dev skill and review-branch command so the lesson applies everywhere.
  Triggers when user says "learn from this PR", "apply PR feedback", "absorb review comments",
  "I got this comment on my PR", "here are comments from my PR", or invokes /learn-from-pr.
---

You are acting as a technical lead internalising PR feedback. Your job is to extract actionable rules from review comments and persist them at the right scope so the same mistake never happens again.

## Step 1 — Collect comments

### 1a. Auto-detect PR from current branch

Run:
```bash
git branch --show-current
gh pr list --head <branch> --json number,title,url --limit 1
```

If a PR is found: fetch its review comments:
```bash
gh pr view <number> --comments
gh api repos/{owner}/{repo}/pulls/<number>/reviews
gh api repos/{owner}/{repo}/pulls/<number>/comments
```

Report to the user: "Found PR #N — `<title>`. Fetched X review comments."

If no PR is found: tell the user:
> No open PR found for branch `<branch>`. Paste your PR comments below, one at a time. Type `DONE` when finished.

### 1b. Accept pasted comments (always)

Even if PR comments were fetched automatically, ask:
> Any additional comments to include that aren't on the PR? Paste them one at a time, or type `DONE` to continue.

Collect all comments (fetched + pasted) into a single list before proceeding.

**Hard stop:** If zero comments collected after both steps, stop and tell the user there is nothing to process.

---

## Step 2 — Read project context

Read both files if they exist:
- `ARCHITECTURE.md`
- `CLAUDE.md`

If neither exists, tell the user and continue — new sections will be created when writing.

Also read:
- `~/.claude/skills/dev/SKILL.md`
- `~/.claude/commands/review-branch.md`

These are the user-level targets for generic rules.

---

## Step 3 — Classify each comment

For every comment, determine:

**A. Is this actionable as a rule?**
- Yes: the comment describes a pattern to avoid or always do (e.g. "never use raw SQL", "always validate at the boundary", "magic strings must be enums")
- No: the comment is a one-off fix, style preference with no general application, or praise — skip it. Tell the user which comments were skipped and why.

**B. What category does it fall into?**

| Category | Target file |
|---|---|
| Coding standard (naming, structure, error handling, quality) | `CLAUDE.md` and/or `dev` skill |
| Architecture (layer separation, module ownership, patterns) | `ARCHITECTURE.md` and/or `dev` skill |
| Review checklist (something reviewers should catch) | `review-branch.md` |
| API / OpenAPI / endpoint design | `CLAUDE.md` (API Development Rules section) |

**C. Is it generic or project-specific?**

A rule is **generic** if it would apply to any TypeScript/Express backend, regardless of this project's specific domain or tech choices. Examples: "always await async calls", "never put business logic in controllers", "magic strings must be constants".

A rule is **project-specific** if it references this project's entities, domains, naming conventions, or tech decisions. Examples: "Keycloak token validation must go through AuthMiddleware", "Workshop entities need owner assignment on creation".

When unsure, ask the user:
> Is this rule specific to this project, or should it apply to all your projects?
> Comment: `"<comment text>"`
> [Project-only] [All projects] [Skip]

Wait for response before continuing to the next ambiguous comment.

---

## Step 4 — Write rules

For each classified comment, write the rule in the appropriate file(s).

### Project-level rules

**CLAUDE.md** — add under the most relevant existing section, or create a new `## Rules` or `## Conventions` section. Write the rule as a short imperative bullet: "Always X", "Never Y", "Use Z for W".

**ARCHITECTURE.md** — add under the relevant layer or pattern section. If the comment describes a structural decision, add it there with brief rationale.

### User-level rules (generic only)

**`~/.claude/skills/dev/SKILL.md`** — find the most relevant step (Step 3 coding standards is the primary target). Add the rule under the appropriate sub-section. If no sub-section fits, add it to a `### Learned rules` block at the end of Step 3.

**`~/.claude/commands/review-branch.md`** — find the matching review dimension (A–K). Add the rule as a bullet under the correct dimension. If the rule introduces a new dimension not covered, add it as a new `### L. <Name>` section before Step 5.

For each file written, tell the user exactly what was added and where.

---

## Step 5 — Report

Produce a summary table:

| Comment (truncated) | Rule extracted | Written to |
|---|---|---|
| "You're putting business logic in the controller..." | Services only handle business logic; controllers only parse + delegate | `CLAUDE.md`, `dev` Step 3, `review-branch` §B |
| "This magic string should be an enum" | All status/type strings must be enums or constants | `dev` Step 3, `review-branch` §E |
| "Fix the null check on line 42" | *(skipped — one-off fix, no general rule)* | — |

Then state:
- How many rules were added project-level
- How many rules were added user-level (applied to all projects)
- How many comments were skipped and why

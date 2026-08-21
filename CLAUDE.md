# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code plugin distributed via npm. Installing it copies skills and slash commands into the user's `~/.claude/` directory and registers the package as a Claude Code plugin.

## Running postinstall manually

```bash
node scripts/postinstall.js
```

Uninstall:

```bash
node scripts/uninstall.js
```

## How Claude Code loads content from this repo

| Content type | Location in repo | Where Claude Code reads it |
|---|---|---|
| Skills | `skills/<name>/SKILL.md` | Copied to `~/.claude/skills/` by postinstall — the copy wins over plugin discovery |
| Commands | `commands/<name>.md` | Copied to `~/.claude/commands/` by postinstall |
| Plugin manifest | `.claude-plugin/plugin.json` | Read from `installPath` by Claude Code |

The `installPath` in `installed_plugins.json` points to the root of this repo (wherever npm installed it).

**A skill in `~/.claude/skills/` shadows the plugin's copy of the same name.** That is why postinstall copies them: the copy is what runs, so an edit in this repo has no effect until postinstall runs again. The `PostToolUse` hook on `git push` re-runs it. Between an edit and the next push, `~/.claude/skills/` is stale by design — run `node scripts/postinstall.js` to sync sooner.

`~/.claude/.claude-code-skills.json` records which skill directories this package installed. Pruning on later runs is limited to that list, so a hand-written user skill is never removed.

## Skill file format

```markdown
---
name: skill-name
description: >
  One or two sentences. This text is used to match natural language triggers.
  Include trigger phrases here (e.g. "Triggers when user says X or invokes /skill-name").
---

Skill body — plain markdown instructions for Claude.
```

The YAML frontmatter `description` field controls when Claude auto-invokes the skill. Be explicit about trigger phrases.

## Command file format

Commands (`commands/<name>.md`) are plain markdown with no frontmatter. They are invoked explicitly via `/<name>`. The first line should be a one-sentence description of what the command does.

## Plugin registration

`postinstall.js` writes to two user-level files:

- `~/.claude/plugins/installed_plugins.json` — registers the plugin with `installPath` = absolute path to this repo root
- `~/.claude/settings.json` — sets `enabledPlugins["claude-code-skills@npm"] = true`

The plugin ID is `claude-code-skills@npm`. Changing it in `postinstall.js` and `uninstall.js` must be kept in sync.

## Skill pipeline dependencies

The skills form a pipeline. Key dependency chain:

```
architecture → adr-create → adr-review → ARCHITECTURE.md updated
idea-backlog → milestones → dev → qa → product-docs → /ship
/sprint  →     milestones → dev → qa
/grind   →                  dev → qa (no Dev→QA gate; batch mode)
/fix     →     bug path, outside the loop — proposes rules to qa, never writes MILESTONES.md
/release →     completed + archived milestones → CHANGELOG.md
/status  →     read-only report across every spec file
```

- `dev` and `qa` both hard-stop if `ARCHITECTURE.md` is missing — they direct users to `/architecture`
- `qa` creates/updates `BUSINESS_RULES.md`; `learn-from-pr` and `backfill-pr-rules` read it before writing code rules to avoid contradictions
- `qa` Step 8b appends to `qa-findings.md` on every pass — including a `clean` entry when nothing was found, since the denominator is what separates a pattern from a coincidence. `qa-retro` is the only consumer, and hard-stops below two milestones
- `qa-retro` borrows `learn-from-pr` Step 3's scope classification rather than restating it — one classification, one home. It writes rules in `learn-from-pr`'s format to the same targets, and hands a missing *business* invariant to `qa`'s rule-intake mode instead of writing `BUSINESS_RULES.md` itself
- `dev` Step 5 runs `/review-branch` before QA handoff
- `milestones` skill manages `[ACTIVE]`; `qa` skill sets `[COMPLETED]`; milestones skill never sets `[COMPLETED]` itself
- `adr-create` writes ADRs to `docs/adr/` as `Proposed` only; `adr-review` is the sole writer of `Accepted`/`Rejected`/`Superseded`, and on acceptance propagates the decision into `ARCHITECTURE.md`
- `architecture` Step 2b offers ADRs for trade-off answers (not for conventions); `dev` stops rather than violating an accepted ADR; `/review-branch` flags a violation `[BLOCKER]`
- ADRs are immutable once accepted — changed decision means a new superseding ADR, never an edit
- `idea-backlog` owns `idea-backlog.md` and never writes `MILESTONES.md` — promotion invokes the `milestones` skill, which then hands back so the idea line can be moved to `## Promoted`
- `product-docs` owns `docs/product/` **in the target repo**; `qa` Step 9 offers to run it when a milestone changed user-visible behaviour
- File naming rule: skills hard-stop on `UPPERCASE.md` files; staging and derived files are lowercase (`idea-backlog.md`, `milestones-archived.md`, `docs/product/`). **One stated exception:** `CHANGELOG.md` is derived but uppercase — it is the only generated artifact with an audience outside the project, and its consumers expect the conventional name
- `/release` owns `CHANGELOG.md` and reads `MILESTONES.md`, `milestones-archived.md`, `BUSINESS_RULES.md`, and `docs/product/` without writing any of them. Released sections are immutable once written — a correction goes in the next release, never as an edit, mirroring how accepted ADRs are superseded rather than edited
- Flavors are skills named `flavor-<name>`, activated by a `> Flavor: <name>` marker in a project's `ARCHITECTURE.md` (ADR-0001). Each core skill reads exactly one section of the flavor; project `ARCHITECTURE.md` overrides flavor rules (ADR-0002). Core skills must never contain domain vocabulary — only marker resolution
- `setup-loop` onboards an existing repo — it surveys and sequences, then delegates every file to its owning skill; it writes nothing but `.gitignore` fixes
- `architecture` Step 0 branches on greenfield (empty/scaffold-only repo → design from intent, record stack choices as ADRs) vs existing codebase (read and document)
- `/fix` is the bug path: it applies a feature-versus-bug test and refuses feature work, requires a regression test observed failing before the fix, and checks `BUSINESS_RULES.md` on every run. It never writes `MILESTONES.md`, and it never writes `BUSINESS_RULES.md` — a new rule is handed to `qa`, which owns the file and assigns the `BR-XXX`
- `/ship` is the only command that commits, pushes, or opens a PR; `/status` is strictly read-only
- Full methodology docs live in `docs/` — update them when the pipeline changes
- This repo dogfoods its own pipeline: `idea-backlog.md` at the root holds unbuilt ideas for the plugin itself

## Validating this repo

```bash
npm test          # node scripts/validate.js
```

Checks skill frontmatter (`name` must equal its directory, description present and ≤ 1024 chars), command file naming, `.claude-plugin/plugin.json`, and that every backticked slash reference across skills, commands, docs, README, and CLAUDE.md resolves to a real skill, command, or Claude Code builtin.

Illustrative slash names (route URL examples, hypothetical skills in `create-skill`) are declared per-file with `<!-- validate: allow-refs foo, bar -->`. Run this after renaming or removing any skill or command — stale cross-references are the most common breakage.

## Adding or updating skills/commands

After editing any skill or command, team members need to restart Claude Code — there is no hot-reload. For npm-installed users, they must also run `npm update claude-code-skills`.

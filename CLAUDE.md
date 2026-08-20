# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code plugin distributed via npm. Installing it registers the package as a Claude Code plugin and copies slash commands into the user's `~/.claude/` directory. Skills are auto-discovered by Claude Code directly from the install path — no zip or cache step needed.

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
| Skills | `skills/<name>/SKILL.md` | Read directly from `installPath` registered in `~/.claude/plugins/installed_plugins.json` |
| Commands | `commands/<name>.md` | Copied to `~/.claude/commands/` by postinstall |
| Plugin manifest | `.claude-plugin/plugin.json` | Read from `installPath` by Claude Code |

The `installPath` in `installed_plugins.json` points to the root of this repo (wherever npm installed it). Claude Code discovers skills by scanning `<installPath>/skills/*/SKILL.md` at session start.

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
/status  →     read-only report across every spec file
```

- `dev` and `qa` both hard-stop if `ARCHITECTURE.md` is missing — they direct users to `/architecture`
- `qa` creates/updates `BUSINESS_RULES.md`; `learn-from-pr` and `backfill-pr-rules` read it before writing code rules to avoid contradictions
- `dev` Step 5 runs `/review-branch` before QA handoff
- `milestones` skill manages `[ACTIVE]`; `qa` skill sets `[COMPLETED]`; milestones skill never sets `[COMPLETED]` itself
- `adr-create` writes ADRs to `docs/adr/` as `Proposed` only; `adr-review` is the sole writer of `Accepted`/`Rejected`/`Superseded`, and on acceptance propagates the decision into `ARCHITECTURE.md`
- `architecture` Step 2b offers ADRs for trade-off answers (not for conventions); `dev` stops rather than violating an accepted ADR; `/review-branch` flags a violation `[BLOCKER]`
- ADRs are immutable once accepted — changed decision means a new superseding ADR, never an edit
- `idea-backlog` owns `idea-backlog.md` and never writes `MILESTONES.md` — promotion invokes the `milestones` skill, which then hands back so the idea line can be moved to `## Promoted`
- `product-docs` owns `docs/product/` **in the target repo**; `qa` Step 9 offers to run it when a milestone changed user-visible behaviour
- File naming rule: skills hard-stop on `UPPERCASE.md` files; staging and derived files are lowercase (`idea-backlog.md`, `milestones-archived.md`, `docs/product/`)
- `architecture` Step 0 branches on greenfield (empty/scaffold-only repo → design from intent, record stack choices as ADRs) vs existing codebase (read and document)
- `/ship` is the only command that commits, pushes, or opens a PR; `/status` is strictly read-only
- Full methodology docs live in `docs/` — update them when the pipeline changes

## Validating this repo

```bash
npm test          # node scripts/validate.js
```

Checks skill frontmatter (`name` must equal its directory, description present and ≤ 1024 chars), command file naming, `.claude-plugin/plugin.json`, and that every backticked slash reference across skills, commands, docs, README, and CLAUDE.md resolves to a real skill, command, or Claude Code builtin.

Illustrative slash names (route URL examples, hypothetical skills in `create-skill`) are declared per-file with `<!-- validate: allow-refs foo, bar -->`. Run this after renaming or removing any skill or command — stale cross-references are the most common breakage.

## Adding or updating skills/commands

After editing any skill or command, team members need to restart Claude Code — there is no hot-reload. For npm-installed users, they must also run `npm update claude-code-skills`.

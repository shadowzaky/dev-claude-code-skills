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
/sprint  →  milestones → dev → qa
/grind   →              dev → qa (no Dev→QA gate; batch mode)
```

- `dev` and `qa` both hard-stop if `ARCHITECTURE.md` is missing — they direct users to `/architecture`
- `qa` creates/updates `BUSINESS_RULES.md`; `learn-from-pr` and `backfill-pr-rules` read it before writing code rules to avoid contradictions
- `dev` Step 5 runs `/review-branch` before QA handoff
- `milestones` skill manages `[ACTIVE]`; `qa` skill sets `[COMPLETED]`; milestones skill never sets `[COMPLETED]` itself

## Adding or updating skills/commands

After editing any skill or command, team members need to restart Claude Code — there is no hot-reload. For npm-installed users, they must also run `npm update claude-code-skills`.

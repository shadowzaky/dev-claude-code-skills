# claude-code-skills

Team shared Claude Code skills, commands, and hooks. Install once — skills and slash commands appear in every Claude Code session.

## Install

```bash
npm install git+ssh://git@github.com/shadowzaky/dev-claude-code-skills.git
```

Postinstall automatically:
- Copies slash commands to `~/.claude/commands/`
- Registers the package as a Claude Code plugin (skills auto-discovered)
- Enables the plugin in `~/.claude/settings.json`

Restart Claude Code after install.

## Uninstall

```bash
node node_modules/claude-code-skills/scripts/uninstall.js
npm uninstall claude-code-skills
```

## Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `dev` | `/dev` | Implement an active milestone end-to-end |
| `qa` | `/qa` | Validate a milestone and mark it complete |
| `milestones` | `/milestones` | Create and manage MILESTONES.md |
| `architecture` | `/architecture` | Create or update ARCHITECTURE.md |
| `create-skill` | `/create-skill` | Scaffold a new skill in this repo |
| `learn-from-pr` | `/learn-from-pr` | Convert PR review comments into persistent rules |
| `backfill-pr-rules` | `/backfill-pr-rules` | Batch-process historical PR comments into rules |

## Commands

| Command | Description |
|---------|-------------|
| `/sprint` | Full PM → Dev → QA pipeline for a milestone |
| `/grind` | Run Dev → QA on every incomplete milestone |
| `/review-branch` | Review all changes on current branch vs master |
| `/sync` | Fetch latest, merge main, resolve conflicts |

## Adding a skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: One-line description of when this skill triggers.
---

Skill instructions here...
```

2. Commit and push.
3. Team members run `npm update claude-code-skills` then restart Claude Code.

## Adding a command

1. Create `commands/<name>.md` — plain markdown, no frontmatter needed.
2. Commit and push.
3. Team members run `npm update claude-code-skills` then restart Claude Code.

## Updating

```bash
npm update claude-code-skills
```

Re-runs postinstall, copies latest commands, updates plugin registration.

# claude-code-skills

Team shared Claude Code skills, commands, and hooks. Install once — skills and slash commands appear in every Claude Code session.

The skills implement a spec-driven PM → Dev → QA loop. See [docs/](docs/) for the methodology and full details:

- [The Loop](docs/the-loop.md) — phases, gates, state machine, `/sprint` vs `/grind`
- [Spec-Driven Development](docs/spec-driven-development.md) — why the specs live in files
- [Artifacts](docs/artifacts.md) — every spec file, its format, and its owner
- [Flavors](docs/flavors.md) — domain-specific layers on top of the core loop (planned)

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
| `idea-backlog` | `/idea-backlog` | Capture one-line ideas in `idea-backlog.md`, promote them into milestones |
| `dev` | `/dev` | Implement an active milestone end-to-end |
| `qa` | `/qa` | Validate a milestone and mark it complete |
| `milestones` | `/milestones` | Create and manage MILESTONES.md |
| `architecture` | `/architecture` | Create or update ARCHITECTURE.md |
| `adr-create` | `/adr-create` | Write a Proposed ADR to `docs/adr/`, or suggest missing ones |
| `adr-review` | `/adr-review` | Review, accept/reject ADRs; audit accepted ones for drift |
| `product-docs` | `/product-docs` | Create or update `docs/product/` in the target repo |
| `create-skill` | `/create-skill` | Scaffold a new skill in this repo |
| `learn-from-pr` | `/learn-from-pr` | Convert PR review comments into persistent rules |
| `backfill-pr-rules` | `/backfill-pr-rules` | Batch-process historical PR comments into rules |

## Commands

| Command | Description |
|---------|-------------|
| `/sprint` | Full PM → Dev → QA pipeline for a milestone |
| `/grind` | Run Dev → QA on every incomplete milestone |
| `/ship` | Branch, commit, and open a PR with the body built from the specs |
| `/status` | Report pipeline state and the next action (read-only) |
| `/review-branch` | Review all changes on current branch vs master |
| `/sync` | Fetch latest, merge main, resolve conflicts |

## Validating the repo

```bash
npm test
```

Checks skill frontmatter (`name` matches its directory, description present and within limits),
command file naming, the plugin manifest, and that every backticked slash reference in the repo
resolves to a real skill, command, or Claude Code builtin. A file with illustrative names declares
them with `<!-- validate: allow-refs foo, bar -->`.

Run it before committing — a malformed `name:` makes a skill load as nothing, silently.

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

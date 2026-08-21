# Architecture

> Last updated: 2026-08-19

## Stack

- **Runtime:** Node.js ≥ 18 (`engines.node`) — used only by the install and validation scripts
- **Language:** CommonJS JavaScript for scripts; Markdown for everything Claude Code reads
- **Dependencies:** none, and this is deliberate — see [Layer rules → Scripts](#scripts)
- **Distribution:** npm package installed from git, `private: true`, plugin ID `claude-code-skills@npm`
- **Test framework:** none. `npm test` runs `scripts/validate.js` — see [Testing strategy](#testing-strategy)
- **Host:** Claude Code. Skills load from copies on disk — `~/.claude/skills/` for this package's own, a project's own `.claude/skills/` for flavors. Plugin `installPath` registration delivers no skills at all (ADR-0005). Commands are copied into `~/.claude/commands/`

There is no application runtime, no server, no database, and no HTTP surface. The deliverable is prose that Claude Code executes.

---

## Folder structure

```
skills/<name>/SKILL.md   One skill per directory. Prose instructions with YAML frontmatter.
                         Copied to ~/.claude/skills/ by postinstall, which is what Claude
                         Code actually loads. This repo is the source of truth in git.
commands/<name>.md       Slash commands. Plain markdown, no frontmatter. Copied to
                         ~/.claude/commands/ by postinstall. Orchestration only.
scripts/*.js             Install, uninstall, validation. Node built-ins only, zero dependencies.
docs/*.md                Methodology and reference for humans. Never read by a skill at runtime.
.claude-plugin/          plugin.json manifest. Registered but inert — delivers no skills (ADR-0005).
```

Root files:

| File | Role |
|---|---|
| `README.md` | Install, skill and command tables, contribution steps |
| `CLAUDE.md` | How to work in this repo — pipeline dependencies, invariants, validation |
| `ARCHITECTURE.md` | This file — structure and conventions |
| `MILESTONES.md` | Current work, owned by the `milestones` skill |
| `idea-backlog.md` | Unbuilt ideas for the plugin itself, owned by `idea-backlog` |
| `package.json` | Scripts and engine constraint |

---

## Layer rules

### Skills

- **Allowed:** Prose instructions, file formats, decision criteria, worked examples, delegation to other skills.
- **Forbidden:** Writing a file another skill owns. Executable code beyond illustrative snippets. Restating another skill's rules instead of referencing them.
- **Rule:** One skill, one role. Frontmatter `name` must equal the directory name — a mismatch loads the skill as nothing, silently.
- **Rule:** A skill that needs another skill's artifact **invokes that skill**. Ownership is what keeps each artifact coherent; see [Artifact ownership](#artifact-ownership).

### Commands

- **Allowed:** Multi-skill orchestration, phase ordering, gates, preflight checks.
- **Forbidden:** Frontmatter. Reimplementing behaviour a skill already defines — invoke the skill instead.
- **Rule:** First line is a one-sentence description, not a heading. Commands are explicit-invocation only; they never auto-trigger.

### Scripts

- **Allowed:** Node built-in modules, synchronous `fs`, reading and writing under `~/.claude` and this repo.
- **Forbidden:** Third-party dependencies. Network calls. Writing anywhere else on disk. Destructive operations without an existence check first.
- **Rule:** Idempotent — safe to re-run on every `npm install`. Exit non-zero on failure, zero on success.
- **Why zero dependencies:** these run inside `postinstall` on every teammate's machine. A dependency tree there is both a supply-chain surface and a failure mode nobody can debug mid-install.

### Docs

- **Allowed:** Methodology, rationale, cross-file reference, worked examples.
- **Forbidden:** Instructions a skill needs at runtime. If Claude must follow it, it belongs in a `SKILL.md`; `docs/` is read by people.

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Skill directory | kebab-case | `skills/adr-create/` |
| Skill file | always `SKILL.md` | `skills/adr-create/SKILL.md` |
| Skill `name` frontmatter | kebab-case, equals directory name | `name: adr-create` |
| Command file | kebab-case `.md` | `commands/review-branch.md` |
| Script file | kebab-case `.js` | `scripts/validate.js` |
| Doc file | kebab-case `.md` | `docs/the-loop.md` |
| Gate artifacts (skills hard-stop on these) | `UPPERCASE.md` | `ARCHITECTURE.md`, `MILESTONES.md`, `BUSINESS_RULES.md` |
| Staging and derived artifacts | lowercase | `idea-backlog.md`, `milestones-archived.md`, `docs/product/` |
| ADR files | `NNNN-kebab-title.md`, 4-digit, never reused | `docs/adr/0007-single-tenant-database.md` |
| Business rule IDs | `BR-NNN`, stable forever | `BR-014` |
| Script constants | SCREAMING_SNAKE_CASE | `MAX_DESCRIPTION_LENGTH` |
| Script functions | camelCase | `parseFrontmatter()` |

The gate-vs-staging casing split is load-bearing: casing tells a reader at a glance whether a missing file blocks the pipeline.

---

## Skill and command contracts

### Skill frontmatter

```yaml
---
name: skill-name          # required, kebab-case, must equal the directory name
description: >            # required, ≤ 1024 chars
  What the skill does, then the trigger phrases that should invoke it,
  including the literal /skill-name form.
---
```

The `description` is the entire auto-invocation surface — Claude matches natural language against it and nothing else. A description that omits trigger phrases produces a skill that only ever runs when typed explicitly.

### Skill body

Steps in execution order, numbered. Hard stops stated as **stop** with the exact message to give the user. A closing **Rules** section for invariants that apply across all steps.

### Command body

Plain markdown. One-sentence description, then ordered phases with explicit gates. State what blocks and why.

---

## Artifact ownership

Every artifact has exactly one owner. Other skills read freely; only the owner changes structure.

| Artifact | Owner | Other writers |
|---|---|---|
| `ARCHITECTURE.md` | `architecture` | `adr-review` (on acceptance), `learn-from-pr` |
| `docs/adr/` | `adr-create` (writes `Proposed`) | `adr-review` (status only) |
| `MILESTONES.md` | `milestones` | `dev` (task checkboxes), `qa` (`[COMPLETED]`) |
| `BUSINESS_RULES.md` | `qa` | — |
| `docs/product/` | `product-docs` | — |
| `idea-backlog.md` | `idea-backlog` | — |

Shared write access means no one is accountable for a file's shape. A skill needing a change in someone else's artifact invokes the owner.

Full reference: [`docs/artifacts.md`](docs/artifacts.md).

---

## Install and registration

`scripts/postinstall.js` writes to four places under `~/.claude`:

1. `commands/` — every `commands/*.md` copied in, overwriting.
2. `skills/<name>/SKILL.md` — every skill copied in, overwriting.
3. `.claude-code-skills.json` — manifest of the skill directories this package installed.
4. `plugins/installed_plugins.json` and `settings.json` — registers and enables `claude-code-skills@npm` with `installPath` set to this repo.

**The copies are what run — and they are the only thing that runs.** Plugin-registered skills do not load in this version of Claude Code: a plugin that is installed, enabled, marketplace-cached, and shipping well-formed skills contributes none of them to a session, after a restart (ADR-0005). Skill delivery happens entirely through copies on disk. The copy is authoritative at runtime, the repo authoritative in git, and an edit here does nothing until postinstall runs again.

**Step 4 is inert, and known to be.** Claude Code evicts the hand-written `claude-code-skills@npm` entry from `installed_plugins.json` on startup, leaving `settings.json` naming a plugin that is no longer registered. The registration is retained for now only because removing it is a separate decision (ADR-0005 follow-up).

The push hook (`.claude/settings.json`, `PostToolUse` on `git push`) re-runs postinstall, which keeps the two in sync at the point work leaves the machine. Between an edit and the next push, the copy is stale by design.

**The manifest is what makes pruning safe.** A skill renamed or removed here is deleted from `~/.claude/skills/` on the next run — but only if the manifest recorded this package as its installer. An unrecognised directory is the user's own skill and is never touched.

`scripts/uninstall.js` reverses all four, removing skills by manifest for the same reason. The plugin ID appears in both scripts and **must be kept in sync**.

User-level skills and commands — everything postinstall writes to `~/.claude/` — take effect on Claude Code restart. There is no hot reload for those.

**Project-level skills are different.** A skill in a repository's own `.claude/skills/<name>/SKILL.md` loads into the running session without a restart, and is scoped to that repository. This is the mechanism flavors install through (ADR-0005), and the absence of a restart is what makes a flavor usable in the same session that installs it.

---

## Failure handling

Scripts:

- Exit `0` on success, non-zero on failure. `npm test` gates on this.
- Report every problem found before exiting, not just the first. A validator that stops at the first error turns one fix into five runs.
- Distinguish `ERROR` (fails the run) from `warn` (reported, does not fail). Missing trigger phrases are a warning; a name mismatch is an error, because it silently breaks discovery.
- Never write a file to "fix" a validation failure. Report it and let a human decide.

Skills: a blocked precondition is a **stop** with the exact remediation command, never a best-effort guess.

---

## Environment variables

None. The scripts derive every path from `os.homedir()` and `__dirname`, so there is nothing to configure and nothing to leak.

Never committed: `.env*`, `.claude/settings.local.json`. Both are gitignored, and `/review-branch` treats either appearing in a diff as a `[BLOCKER]`.

---

## Testing strategy

**Validation-only.** There is no test framework and no test dependency.

The content here is prose, not logic — the failure modes that actually occur are malformed frontmatter, a `name` that disagrees with its directory, and cross-references left stale by a rename. All three are structural, and `scripts/validate.js` catches all three.

### What `npm test` checks

- Skill frontmatter parses; `name` present, kebab-case, equal to the directory name, unique across skills
- `description` present and ≤ 1024 characters; warns when it omits trigger phrases or the `/name` form
- Command files are kebab-case, non-empty, and do not open with a heading
- `.claude-plugin/plugin.json` exists and parses
- Every backticked slash reference across skills, commands, docs, `README.md`, and `CLAUDE.md` resolves to a real skill, command, or Claude Code builtin

Illustrative slash names are declared per-file:

```markdown
<!-- validate: allow-refs deploy, audit -->
```

### Rules

- **Every new structural rule gets a check in `validate.js`.** A convention this file states but nothing enforces will be violated within a month.
- **`validate.js` stays dependency-free**, like every script here.
- **Verify the validator itself on a scratch copy**, never in place — copy the repo to a temp directory, break something deliberately, confirm the expected error, delete the copy. Mutating tracked files to test them risks losing uncommitted work.
- **Behaviour changes to a skill's prose cannot be unit tested.** Verification is: read the diff for contradictions with the skills it interacts with, then run the affected skill once against a scratch repo. Say plainly which of the two was done.

### Running

```bash
npm test        # validate everything
npm run validate  # same thing, clearer name in CI
```

---

## Adding a new skill — checklist

1. Create `skills/<kebab-name>/SKILL.md`.
2. Write frontmatter: `name` equal to the directory, `description` with explicit trigger phrases including `/<name>`.
3. Write the body as numbered steps with explicit stops, ending in a **Rules** section.
4. Decide artifact ownership. Reading another skill's file is fine; writing it is not — invoke the owner instead.
5. Add cross-references both ways: if the new skill hands off to another, say so in both files.
6. Add a row to the skill table in `README.md`.
7. Add the pipeline dependency to `CLAUDE.md` if it participates in the loop.
8. Add it to `docs/the-loop.md` — as a phase if it sits in the loop, in the supporting table if it does not.
9. If it owns a new artifact, document that artifact in `docs/artifacts.md`.
10. Run `npm test`.

## Adding a new command — checklist

1. Create `commands/<kebab-name>.md`. No frontmatter.
2. First line: one sentence describing what it does.
3. Write ordered phases with explicit gates; delegate real behaviour to skills.
4. Add a row to the command table in `README.md` and to the supporting table in `docs/the-loop.md`.
5. Run `npm test`. Teammates need `npm update claude-code-skills` before the command appears for them.

---

## Decision records

Rules in this file state *what*. The *why* lives in `docs/adr/`. Accepted ADRs are binding — if a rule here contradicts an accepted ADR, the ADR wins and this file is wrong.

| ADR | Decision | Affects |
|---|---|---|
| [0001](docs/adr/0001-flavor-activation-marker.md) | Declare flavors with a `> Flavor: <name>` marker in `ARCHITECTURE.md` | Flavor activation, marker resolution |
| [0002](docs/adr/0002-project-architecture-overrides-flavor.md) | A project's `ARCHITECTURE.md` overrides flavor rules | Precedence in every loop skill |
| ~~[0003](docs/adr/0003-flavors-ship-as-separate-plugins.md)~~ | ~~Flavors ship as plugins from this repo, enabled per project~~ — superseded by 0005 | Nothing; retained for the record |
| [0005](docs/adr/0005-flavors-install-as-project-copies.md) | Flavors install as committed copies in the consuming project's `.claude/skills/` | Distribution, install model, flavor scoping |

A flavor is installed by copying its skills into the **consuming project's** `.claude/skills/`, committed there alongside a `.claude/flavor.json` recording flavor name, version, and source sha (ADR-0005). It must **not** be copied into `~/.claude/skills/` the way this package's own skills are — that would make it globally active and defeat per-project scoping, putting domain skills in front of every unrelated repo on the machine.

Whatever invokes that install must pass the flavor name **read from the marker**, never a literal — a core skill containing a concrete flavor name violates BR-004 and fails `npm test`.

Rules derived from an ADR cite it inline, e.g. *(ADR-0001)*.

Not yet recorded, and each qualifies: the zero-dependency constraint on scripts, validation-only testing, one-owner-per-artifact, and the install model that copies skills into `~/.claude/skills/`.

---

## What does NOT belong in this file

- Decision rationale and rejected alternatives → `docs/adr/`
- How to work in this repo, pipeline invariants → `CLAUDE.md`
- Methodology and the reasoning behind the loop → `docs/`
- Install instructions for users → `README.md`
- Current and planned work → `MILESTONES.md`, `idea-backlog.md`

# ADR-0001: Declare flavors with a marker in ARCHITECTURE.md

- **Status:** Accepted
- **Date:** 2026-08-19
- **Decided:** 2026-08-20
- **Deciders:** repo owner

## Context

Flavors add domain-specific guidance on top of the core loop — extra acceptance-criteria shape, dev standards, QA checks, and review dimensions. Before any flavor could be built, one question had to be settled: how does a project say which flavor it uses?

The constraint that decides it: `dev`, `qa`, `/grind`, and `/review-branch` already read `ARCHITECTURE.md` and hard-stop when it is missing. Any mechanism that lives elsewhere adds a second file every one of those skills must learn to read, and a second place a reader must check to understand how the repo behaves.

## Decision

A project declares its flavor with a marker line in the `ARCHITECTURE.md` header block:

```markdown
# Architecture

> Last updated: 2026-08-19
> Flavor: game-dev
```

The marker names a flavor. Core loop skills read it as part of the `ARCHITECTURE.md` they already load, resolve it to a skill, and invoke that skill for the phase they are running. No marker means no flavor, and the pipeline behaves exactly as it does without flavors.

Resolution accepts either form, because a flavor may ship inside this package or as a separate plugin, and Claude Code namespaces plugin skills as `/plugin-name:skill-name`:

| Marker | Resolves to |
|---|---|
| `> Flavor: game-dev` | `flavor-game-dev` — a skill in this package |
| `> Flavor: game-dev@game-pack` | `game-pack:flavor` — a skill from a separate plugin |

The bare form is tried first. This keeps the marker stable regardless of how the flavor is distributed, which matters because packaging is a separate decision that may change without the declaration changing.

## Alternatives considered

### Field in CLAUDE.md
Keeps `ARCHITECTURE.md` purely about code structure. Rejected because `CLAUDE.md` is optional — a repo can run the whole loop without one — and no loop skill currently requires it. Declaring flavor there would make an optional file load-bearing for some repos and not others.

### Explicit flag per invocation (`/sprint --flavor game-dev`)
Zero configuration and maximally flexible. Rejected because it is forgettable: one missed flag produces a run that silently uses core defaults, and the failure is invisible until someone notices the output is wrong. Configuration that must be repeated is configuration that will be skipped.

### Dedicated config file (`.claude-flavor`, or a field in `package.json`)
The conventional way tools take configuration, and the one option here with a real schema — a typo would fail at parse time instead of vanishing. Rejected for the same reason as `CLAUDE.md`, one step worse: it adds a file that no loop skill currently reads, so every one of them would need a new read for a single line of config. It also splits "how this repo behaves" across two files when the whole point of `ARCHITECTURE.md` is that it is the one file every phase already loads. The schema advantage is real and is answered by validation rather than by a second file.

### Auto-detect from repo contents
Sniff for `project.godot`, `*.uproject`, `ProjectSettings/`. Rejected because it is undeclared magic — a repo would behave differently with nothing in the tree explaining why, and detection would misfire on repos that merely contain a game as a subdirectory. Detection may still be offered as a *suggestion* by `architecture`, but it will not activate anything on its own.

## Consequences

**Positive**
- No skill needs a new file read; the marker arrives with a file they already load and already gate on.
- The declaration is in version control and shows up in review when it changes.
- A repo with no `ARCHITECTURE.md` cannot have a flavor — which is correct, since it cannot run the loop either.

**Negative**
- `ARCHITECTURE.md` now carries a piece of tooling configuration alongside architectural rules; it is no longer purely a description of the code.
- The marker is prose in a header block, so it is parsed by convention rather than by schema. A typo (`Flavour:`) fails silently unless validation catches it.
- Only one flavor can be declared this way without inventing a list syntax. Composing two flavors is deferred, not solved.

**Follow-up**
- `ARCHITECTURE.md` template gains the marker line and an explanation of it. — *done*
- `architecture` skill offers the marker when it detects a domain it has a flavor for. — *done*
- `scripts/validate.js` checks that a declared flavor resolves to a real skill. — *done*
- A misspelled key (`Flavour:`) matches no marker at all, so the project reads as unflavored and the run proceeds silently. Validation catches a marker that resolves to nothing; it cannot catch a marker it never sees. Needs a check for header lines that look like a near-miss of `Flavor:`. — *done*: every phase that reads the marker hard-stops on a near-miss key, and `validate.js` applies the same rule to this repo.
- Namespaced resolution (`name@plugin`) is specified above but not yet implemented in the core skills or the validator. — *done*: both forms resolve in `dev`, `qa`, `milestones`, `architecture`, and `/review-branch`; `validate.js` parses both and defers the plugin skill's existence to runtime, since it cannot see inside another plugin.

# ADR-0001: Declare flavors with a marker in ARCHITECTURE.md

- **Status:** Proposed
- **Date:** 2026-08-19
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

The marker names a flavor skill, `flavor-<name>`. Core loop skills read the marker as part of the `ARCHITECTURE.md` they already load, and invoke the matching flavor skill for the phase they are running. No marker means no flavor, and the pipeline behaves exactly as it does without flavors.

## Alternatives considered

### Field in CLAUDE.md
Keeps `ARCHITECTURE.md` purely about code structure. Rejected because `CLAUDE.md` is optional — a repo can run the whole loop without one — and no loop skill currently requires it. Declaring flavor there would make an optional file load-bearing for some repos and not others.

### Explicit flag per invocation (`/sprint --flavor game-dev`)
Zero configuration and maximally flexible. Rejected because it is forgettable: one missed flag produces a run that silently uses core defaults, and the failure is invisible until someone notices the output is wrong. Configuration that must be repeated is configuration that will be skipped.

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
- `ARCHITECTURE.md` template gains the marker line and an explanation of it.
- `architecture` skill offers the marker when it detects a domain it has a flavor for.
- `scripts/validate.js` checks that any declared flavor resolves to a real `flavor-<name>` skill, so a typo fails loudly.

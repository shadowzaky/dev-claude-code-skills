# Milestones

## Flavor Contract Verification

> Make the flavor rules that currently rely on nobody deleting a guard actually enforced — in this repo by `npm test`, and in a consuming project by a check it can run against its own copy — so a broken or drifted flavor fails loudly instead of silently skipping whichever phase reads the missing section.

**Split out of Game-Dev Package 2026-08-20.** It surfaced during that milestone's dev pass and none of its eight acceptance criteria cover it. It is a distinct deliverable — a checker that runs in *someone else's* repository, rather than the install path itself.

The gap it closes is named in BR-005: `scripts/validate.js` enforces the six-section contract on the flavor this repo authors, which under ADR-0005 is the source of truth. But the consuming project holds a committed copy in its own `.claude/skills/`, and nothing there re-checks it. A section deleted from that copy violates BR-005 in silence, and the skill that reads it applies nothing.

### Acceptance Criteria

- [ ] A project whose flavor copy is missing a contract section is told which section is gone and which phase would have consumed it
- [ ] A project whose copy is intact reports clean, naming the flavor and version it checked
- [ ] A copy that no longer matches the version in `.claude/flavor.json` is reported as **stale**, distinctly from being **malformed** — the fixes differ
- [ ] The check runs in a consuming project that does not have this package's source tree available
- [ ] A malformed copy stops the phase that would have used it, rather than letting it run against a partial contract (BR-002, BR-005)
- [ ] Deleting either guard that keeps a flavor out of `~/.claude/` makes `npm test` fail — BR-021 stops depending on the guards simply not being removed

### Tasks

- [ ] Decide how the checker reaches a consuming project — copied in beside the flavor, or run from the package by recorded path
- [ ] Implement the six-section check against the project's `.claude/skills/flavor-<name>/`
- [ ] Distinguish stale from malformed in the report, using the version and sha in `.claude/flavor.json`
- [ ] Have the loop skills run it at marker resolution so a broken copy stops the phase
- [ ] Extend `scripts/validate.js` to assert both BR-021 guards: that `postinstall.js` skips `flavor-*` when copying user-level, and that `install-flavor.js` still refuses a target inside `~/.claude`
- [ ] Negative-test both — remove each guard in turn and confirm `npm test` fails, since a check that has never been seen to fail proves nothing
- [ ] Document it in `docs/flavors.md`, and hand the **Validated by** revisions for BR-005 *and* BR-021 to `qa`

---


# Milestones

## Game-Dev Package [ACTIVE]

> Let a project that declares the game-dev flavor get that flavor's skills into its own repository with one command, usable in the same session, without putting game vocabulary in front of any other project on the machine.

**Unblocked 2026-08-20 by ADR-0005.** This milestone was blocked because plugin-registered skills turned out not to load, which killed the marketplace route ADR-0003 had chosen. ADR-0005 replaced it: flavors install as committed copies in the consuming project's `.claude/skills/`, which hot-loads and is genuinely project-scoped. The goal, criteria, and tasks below are rewritten against that decision — `marketplace.json` and the move to `plugins/game-dev/` are gone, and `flavor-game-dev` stays where it is.

### Acceptance Criteria

- [ ] Running the install in a project that declares a flavor puts that flavor's skills in the project's `.claude/skills/`, and they are usable in the same session with no restart
- [ ] A project that has not run the install sees no trace of the flavor — no skills, no commands, no domain vocabulary anywhere in the loop
- [ ] An installed project records which flavor and which version it holds, so a stale copy is identifiable without diffing files against the source
- [ ] Re-running the install upgrades an already-installed project in place, and leaves no orphaned file from the previous version
- [ ] Installing a flavor never writes to `~/.claude/skills/` — verified by installing and confirming no new skill appears outside the project
- [ ] The install refuses to delete or overwrite a skill in the target project that it did not itself install
- [ ] A core skill or command naming a concrete flavor still fails `npm test` after the invocation path exists (BR-004 survives the change)
- [ ] `> Flavor: game-dev` activates the installed flavor through the loop's normal resolution, unchanged from ADR-0001

### Tasks

- [x] Determine whether `installed_plugins.json` registration loads skills, or whether only the `~/.claude/skills/` copies do — everything below depends on the answer → **only the copies load** (ADR-0004)
- [x] Write `scripts/install-flavor.js` — zero-dependency Node (BR-009), copying a named flavor's skills into a target project's `.claude/skills/`
- [x] Define and write `.claude/flavor.json` — flavor name, version, source sha — and use it as the manifest that makes pruning safe, mirroring how `postinstall.js` protects a user's own skills
- [x] Make re-runs idempotent: upgrade in place, prune only what the manifest records, never touch anything else in the target
- [x] Add the invocation to `architecture` and `setup-loop`, passing the flavor name read from the marker — never a literal, or BR-004 fails the build → `architecture` owns the invocation; `setup-loop` **surveys and delegates** rather than duplicating it, since it writes no other skill's files
- [x] Extend `scripts/validate.js` to cover the new script and the `flavor.json` shape → required-scripts check and a require-scan enforcing BR-009 in code, not just `package.json`. **No `flavor.json` shape check:** this repo never contains one, so it would be dead code — the check belongs in a consuming project
- [ ] Verify end to end in a real game project: install, invoke a flavor skill in the same session, re-run to upgrade → install and re-run verified; **invoking in-session needs a real game repo as the working directory** and is the one step that cannot be done from here
- [x] Update `docs/flavors.md` and `README.md` for the copy-install path, replacing the marketplace instructions

---

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


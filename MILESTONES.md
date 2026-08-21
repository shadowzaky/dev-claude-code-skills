# Milestones

## Game-Dev Package

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
- [ ] Write `scripts/install-flavor.js` — zero-dependency Node (BR-009), copying a named flavor's skills into a target project's `.claude/skills/`
- [ ] Define and write `.claude/flavor.json` — flavor name, version, source sha — and use it as the manifest that makes pruning safe, mirroring how `postinstall.js` protects a user's own skills
- [ ] Make re-runs idempotent: upgrade in place, prune only what the manifest records, never touch anything else in the target
- [ ] Add the invocation to `architecture` and `setup-loop`, passing the flavor name read from the marker — never a literal, or BR-004 fails the build
- [ ] Extend `scripts/validate.js` to cover the new script and the `flavor.json` shape
- [ ] Verify end to end in a real game project: install, invoke a flavor skill in the same session, re-run to upgrade
- [ ] Update `docs/flavors.md` and `README.md` for the copy-install path, replacing the marketplace instructions

---


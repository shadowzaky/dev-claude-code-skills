# Milestones

## Game-Dev Package

> Move the game-dev flavor into its own plugin, distributed from this repository as a marketplace entry, so projects enable it individually while the contract and its implementation stay versioned together.

**Depends on:** Flavor Resolution Hardening — extracting the flavor before namespaced resolution works leaves the marker pointing at a skill the core cannot resolve.

**BLOCKED — 2026-08-20.** The verification ran and came back bad. An installed, enabled, marketplace-sourced plugin (`caveman`) with five well-formed skills contributes **none** of them to a session, while the 13 skills that do load are exactly those copied into `~/.claude/skills/`. Plugin registration appears to load no skills at all — including via the marketplace route ADR-0003 chose *because* it was believed to work.

Extracting the flavor on this evidence would make a working flavor unreachable, so the move is not being made. Not ruled out: neither `plugin.json` declares a skills path, so auto-discovery may simply not be a thing. Settling it needs a Claude Code **restart** to observe — see ADR-0004, which holds the evidence and the experiment. Resolve that ADR via `/adr-review` before resuming this milestone.

### Acceptance Criteria

- [ ] Installing the plugin leaves it disabled; no project behaves differently until it opts in through `.claude/settings.json`
- [ ] A project that enables it gets the flavor and its companion skills, namespaced; a project that does not sees no trace of them
- [ ] `> Flavor: game-dev@<plugin>` activates the flavor through the loop's normal resolution
- [ ] The flavor plugin does not copy its skills into `~/.claude/skills/` — verified by installing it and confirming no unprefixed skill appears
- [ ] The root package ships no flavor implementation, and `npm test` still enforces the contract for anything it does ship
- [ ] The six-section contract is published in a form an external flavor can be checked against

### Tasks

- [x] Determine whether `installed_plugins.json` registration loads skills, or whether only the `~/.claude/skills/` copies do — everything below depends on the answer → **only the copies load** (ADR-0004)
- [ ] Add `marketplace.json` with entries for the root plugin and `./plugins/game-dev`
- [ ] Move `skills/flavor-game-dev/` to `plugins/game-dev/skills/flavor/` with its own plugin manifest
- [ ] Add the first companion skill to prove the shape works end to end
- [ ] Confirm install-then-enable behaviour in a real project, including what a missed enable looks like
- [ ] Publish the contract as a versioned spec, and decide whether the checker ships with it
- [ ] Update `docs/flavors.md` and `README.md` for the marketplace install path

---


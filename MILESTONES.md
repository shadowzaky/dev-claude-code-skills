# Milestones

## Flavor Resolution Hardening

> Close the two gaps ADR-0001 left open, so a flavor can live outside this package and a mistyped marker cannot pass unnoticed.

### Acceptance Criteria

- [ ] A marker of the form `> Flavor: name@plugin` resolves to the namespaced skill `plugin:flavor`, and the bare form still resolves to `flavor-name`
- [ ] A marker key that is a near-miss of `Flavor:` — `Flavour:`, `flavor:`, `Flavor :` — is reported, not silently ignored as "no flavor declared"
- [ ] A marker naming a flavor that resolves to nothing still stops the run, in both forms
- [ ] `npm test` covers both resolution forms and the near-miss case, and passes

### Tasks

- [ ] Extend marker resolution in `dev`, `qa`, `milestones`, `architecture`, and `/review-branch` to accept the namespaced form
- [ ] Teach `scripts/validate.js` both resolution forms
- [ ] Add a near-miss detector for header lines that look like a misspelled `Flavor:` key
- [ ] Negative-test each case on a scratch copy
- [ ] Update ADR-0001's open follow-ups to done, and `docs/flavors.md` with both marker forms

---

## Game-Dev Package

> Move the game-dev flavor into its own plugin, distributed from this repository as a marketplace entry, so projects enable it individually while the contract and its implementation stay versioned together.

**Depends on:** Flavor Resolution Hardening — extracting the flavor before namespaced resolution works leaves the marker pointing at a skill the core cannot resolve.

**Blocked until verified:** whether the hand-written `installed_plugins.json` registration loads anything at all. If it does not, this milestone also has to replace the core's distribution mechanism, not just add to it (ADR-0003 follow-up).

### Acceptance Criteria

- [ ] Installing the plugin leaves it disabled; no project behaves differently until it opts in through `.claude/settings.json`
- [ ] A project that enables it gets the flavor and its companion skills, namespaced; a project that does not sees no trace of them
- [ ] `> Flavor: game-dev@<plugin>` activates the flavor through the loop's normal resolution
- [ ] The flavor plugin does not copy its skills into `~/.claude/skills/` — verified by installing it and confirming no unprefixed skill appears
- [ ] The root package ships no flavor implementation, and `npm test` still enforces the contract for anything it does ship
- [ ] The six-section contract is published in a form an external flavor can be checked against

### Tasks

- [ ] Determine whether `installed_plugins.json` registration loads skills, or whether only the `~/.claude/skills/` copies do — everything below depends on the answer
- [ ] Add `marketplace.json` with entries for the root plugin and `./plugins/game-dev`
- [ ] Move `skills/flavor-game-dev/` to `plugins/game-dev/skills/flavor/` with its own plugin manifest
- [ ] Add the first companion skill to prove the shape works end to end
- [ ] Confirm install-then-enable behaviour in a real project, including what a missed enable looks like
- [ ] Publish the contract as a versioned spec, and decide whether the checker ships with it
- [ ] Update `docs/flavors.md` and `README.md` for the marketplace install path

---

## Bug Path

> Let a bug fix run through a proportionate path — regression test and business-rule check — without inventing a milestone to hold it.

### Acceptance Criteria

- [ ] Fixing a bug produces a regression test that fails against the old code and passes against the fix, and the report states both were observed
- [ ] Every fix checks `BUSINESS_RULES.md`; when the bug reveals a missing invariant, a new `BR-XXX` is added rather than only patching the code
- [ ] Work that is actually a feature is refused and redirected to `/milestones`, with the reason stated
- [ ] The path leaves `MILESTONES.md` untouched — no milestone is created, none is marked active

### Tasks

- [ ] Write `commands/fix.md` — reproduce, regression test, fix, rule check, verify
- [ ] Define the feature-versus-bug test the command applies before doing anything
- [ ] Wire the `BUSINESS_RULES.md` read and the new-rule handoff to `qa`
- [ ] Add the command to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [ ] Run `npm test`

---

## Release Notes

> Turn completed milestones into a changelog people outside the project can read, without hand-writing it each time.

### Acceptance Criteria

- [ ] `CHANGELOG.md` is generated from `[COMPLETED]` and archived milestones, grouped by release, in user-facing language
- [ ] Each entry names its milestone and cites the `BR-XXX` rules it introduced; no commit messages are restated
- [ ] Re-running produces no duplicate entries and never rewrites an existing release section
- [ ] A milestone with no user-visible change is excluded, and the exclusion is reported rather than silent

### Tasks

- [ ] Write `commands/release.md` — collect, group, draft, confirm, write
- [ ] Define the `CHANGELOG.md` format and the rule for what counts as user-visible
- [ ] Read `docs/product/` for feature names so the changelog and product docs agree
- [ ] Add the command to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [ ] Run `npm test`

---

## QA Retro

> Close the inner feedback loop: repeated QA failures become written rules, the way `learn-from-pr` handles external review comments.

### Acceptance Criteria

- [ ] Failure patterns recurring across two or more milestones are identified, with the milestones named as evidence
- [ ] Each proposed rule states its scope — project (`CLAUDE.md` or `ARCHITECTURE.md`) or generic (user-level `dev` skill and `/review-branch`) — using the same classification as `learn-from-pr`
- [ ] `BUSINESS_RULES.md` is read first, and no proposed rule contradicts an existing one
- [ ] Nothing is written without explicit confirmation; the report stands on its own if the user declines

### Tasks

- [ ] Write `skills/qa-retro/SKILL.md` — gather QA reports, cluster failures, classify scope, propose rules
- [ ] Define what QA leaves behind that a retro can read, and add it to the `qa` skill if it is missing
- [ ] Share the scope-classification logic with `learn-from-pr` rather than duplicating it
- [ ] Add the skill to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [ ] Run `npm test`

---

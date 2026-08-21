# Archived Milestones

> Completed milestones, moved out of `MILESTONES.md` by the `qa` skill after sign-off.
> Newest first. Nothing here is ever edited — an archived milestone is a record of what shipped.

## Game-Dev Package [COMPLETED]

> Archived: 2026-08-20 · Rules added: BR-021, BR-022 · Decisions: ADR-0005

> Let a project that declares the game-dev flavor get that flavor's skills into its own repository with one command, usable in the same session, without putting game vocabulary in front of any other project on the machine.

**Unblocked 2026-08-20 by ADR-0005.** This milestone was blocked because plugin-registered skills turned out not to load, which killed the marketplace route ADR-0003 had chosen. ADR-0005 replaced it: flavors install as committed copies in the consuming project's `.claude/skills/`, which hot-loads and is genuinely project-scoped. The goal, criteria, and tasks were rewritten against that decision — `marketplace.json` and the move to `plugins/game-dev/` are gone, and `flavor-game-dev` stays where it is.

### Acceptance Criteria

- [x] Running the install in a project that declares a flavor puts that flavor's skills in the project's `.claude/skills/`, and they are usable in the same session with no restart
- [x] A project that has not run the install sees no trace of the flavor — no skills, no commands, no domain vocabulary anywhere in the loop
- [x] An installed project records which flavor and which version it holds, so a stale copy is identifiable without diffing files against the source
- [x] Re-running the install upgrades an already-installed project in place, and leaves no orphaned file from the previous version
- [x] Installing a flavor never writes to `~/.claude/skills/` — verified by installing and confirming no new skill appears outside the project
- [x] The install refuses to delete or overwrite a skill in the target project that it did not itself install
- [x] A core skill or command naming a concrete flavor still fails `npm test` after the invocation path exists (BR-004 survives the change)
- [x] `> Flavor: game-dev` activates the installed flavor through the loop's normal resolution, unchanged from ADR-0001

### Tasks

- [x] Determine whether `installed_plugins.json` registration loads skills, or whether only the `~/.claude/skills/` copies do — everything below depends on the answer → **only the copies load** (ADR-0004)
- [x] Write `scripts/install-flavor.js` — zero-dependency Node (BR-009), copying a named flavor's skills into a target project's `.claude/skills/`
- [x] Define and write `.claude/flavor.json` — flavor name, version, source sha — and use it as the manifest that makes pruning safe, mirroring how `postinstall.js` protects a user's own skills
- [x] Make re-runs idempotent: upgrade in place, prune only what the manifest records, never touch anything else in the target
- [x] Add the invocation to `architecture` and `setup-loop`, passing the flavor name read from the marker — never a literal, or BR-004 fails the build → `architecture` owns the invocation; `setup-loop` **surveys and delegates** rather than duplicating it, since it writes no other skill's files
- [x] Extend `scripts/validate.js` to cover the new script and the `flavor.json` shape → required-scripts check and a require-scan enforcing BR-009 in code, not just `package.json`. **No `flavor.json` shape check:** this repo never contains one, so it would be dead code — the check belongs in a consuming project
- [x] Verify end to end in a real game project: install, invoke a flavor skill in the same session, re-run to upgrade → install, orphan pruning, user-skill safety and the `~/.claude` refusal verified here 2026-08-20; **in-session loading in a real game repo confirmed by the repo owner**, not observed from this repo
- [x] Update `docs/flavors.md` and `README.md` for the copy-install path, replacing the marketplace instructions

### QA notes

Six of the eight criteria were re-run mechanically against `master` at sign-off rather than trusting the dev-pass results. Criteria 1 (in-session loading) and 8 (marker resolution) were confirmed by the repo owner in a real game repository and were **not** observed from this repo — recorded that way deliberately.

The consequential finding came from the dev pass, not the plan: `postinstall.js` was copying every `skills/` directory into `~/.claude/skills/`, flavors included, so the game flavor was globally active on every machine regardless of packaging. Per-project scoping had never worked, and ADR-0005 would have delivered nothing without that fix. It surfaced from a `Test-Path` expected to return false.

BR-022 was written during this pass: criterion 6 was an acceptance criterion with no rule behind it, despite being the invariant that stops a reinstall deleting a user's own skill. BR-021's two guards remain asserted by nothing — carried into Flavor Contract Verification.

---

## QA Retro [COMPLETED]

> Archived: 2026-08-20 · Rules added: BR-018, BR-019, BR-020

> Close the inner feedback loop: repeated QA failures become written rules, the way `learn-from-pr` handles external review comments.

### Acceptance Criteria

- [x] Failure patterns recurring across two or more milestones are identified, with the milestones named as evidence
- [x] Each proposed rule states its scope — project (`CLAUDE.md` or `ARCHITECTURE.md`) or generic (user-level `dev` skill and `/review-branch`) — using the same classification as `learn-from-pr`
- [x] `BUSINESS_RULES.md` is read first, and no proposed rule contradicts an existing one
- [x] Nothing is written without explicit confirmation; the report stands on its own if the user declines

### Tasks

- [x] Write `skills/qa-retro/SKILL.md` — gather QA reports, cluster failures, classify scope, propose rules
- [x] Define what QA leaves behind that a retro can read, and add it to the `qa` skill if it is missing
- [x] Share the scope-classification logic with `learn-from-pr` rather than duplicating it
- [x] Add the skill to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [x] Run `npm test`

### QA notes

The second task turned out to be the load-bearing one. `qa` left behind rules and archived
milestone blocks but **no record of what failed** — its report was delivered into a conversation
and lost. A retro over that has nothing to cluster, so the skill would have been well-formed and
permanently empty. `qa` gained Step 8b, which appends to `qa-findings.md` on every pass, clean
passes included.

`qa-retro` is the second skill written this session whose stated integration did not exist until
it was checked. `/fix`'s handoff to `qa` was the first. Both were prose pointing at a door that
did not open.

## Release Notes [COMPLETED]

> Archived: 2026-08-20 · Rules added: BR-015, BR-016, BR-017

> Turn completed milestones into a changelog people outside the project can read, without hand-writing it each time.

### Acceptance Criteria

- [x] `CHANGELOG.md` is generated from `[COMPLETED]` and archived milestones, grouped by release, in user-facing language
- [x] Each entry names its milestone and cites the `BR-XXX` rules it introduced; no commit messages are restated
- [x] Re-running produces no duplicate entries and never rewrites an existing release section
- [x] A milestone with no user-visible change is excluded, and the exclusion is reported rather than silent

### Tasks

- [x] Write `commands/release.md` — collect, group, draft, confirm, write
- [x] Define the `CHANGELOG.md` format and the rule for what counts as user-visible
- [x] Read `docs/product/` for feature names so the changelog and product docs agree
- [x] Add the command to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [x] Run `npm test`

### QA notes

`CHANGELOG.md` violates this repo's naming rule, which sends derived files to lowercase
(`ARCHITECTURE.md` naming table, `docs/artifacts.md`). The milestone's own criteria named it
three times, and it is the one generated artifact with an audience outside the project, whose
consumers expect the conventional name. Recorded as a **stated exception** in `CLAUDE.md` and
`docs/artifacts.md` rather than left to read as drift. `/architecture` should fold it into the
naming table proper, which this milestone had no mandate to edit.

No changelog was generated. The command was written, not exercised — this repo has no git tags
and its completed milestones are the ones that built the loop itself.

## Bug Path [COMPLETED]

> Archived: 2026-08-20 · Rules added: BR-013, BR-014 · Rules amended: BR-010

> Let a bug fix run through a proportionate path — regression test and business-rule check — without inventing a milestone to hold it.

### Acceptance Criteria

- [x] Fixing a bug produces a regression test that fails against the old code and passes against the fix, and the report states both were observed
- [x] Every fix checks `BUSINESS_RULES.md`; when the bug reveals a missing invariant, a new `BR-XXX` is added rather than only patching the code
- [x] Work that is actually a feature is refused and redirected to `/milestones`, with the reason stated
- [x] The path leaves `MILESTONES.md` untouched — no milestone is created, none is marked active

### Tasks

- [x] Write `commands/fix.md` — reproduce, regression test, fix, rule check, verify
- [x] Define the feature-versus-bug test the command applies before doing anything
- [x] Wire the `BUSINESS_RULES.md` read and the new-rule handoff to `qa`
- [x] Add the command to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [x] Run `npm test`

### QA notes

The handoff in the third task was found broken on inspection and fixed during dev: `qa` opened
by requiring an `[ACTIVE]` milestone with every task checked, so a rule proposed by `/fix` would
have hit a hard stop. `qa` gained a **rule intake** mode (Step 0) that records one rule with no
milestone involved. Without it the wiring was prose pointing at a door that does not open.

All four criteria are enforced by prose only. `validate.js` can confirm `commands/fix.md` exists
and that its references resolve; it cannot execute a command, so BR-013 and BR-014 are manual.

Deliberately excluded: `/fix` does not resolve the flavor marker, so a bug fix in a flavored
project runs no domain QA checks. Adding it would have made `/fix` a sixth marker consumer and
invalidated BR-002 and BR-012, both written one milestone earlier. Worth a decision later.

## Flavor Resolution Hardening [COMPLETED]

> Archived: 2026-08-20 · Rules added: BR-011, BR-012 · Rules amended: BR-001, BR-002

> Close the two gaps ADR-0001 left open, so a flavor can live outside this package and a mistyped marker cannot pass unnoticed.

### Acceptance Criteria

- [x] A marker of the form `> Flavor: name@plugin` resolves to the namespaced skill `plugin:flavor`, and the bare form still resolves to `flavor-name`
- [x] A marker key that is a near-miss of `Flavor:` — `Flavour:`, `flavor:`, `Flavor :` — is reported, not silently ignored as "no flavor declared"
- [x] A marker naming a flavor that resolves to nothing still stops the run, in both forms
- [x] `npm test` covers both resolution forms and the near-miss case, and passes

### Tasks

- [x] Extend marker resolution in `dev`, `qa`, `milestones`, `architecture`, and `/review-branch` to accept the namespaced form
- [x] Teach `scripts/validate.js` both resolution forms
- [x] Add a near-miss detector for header lines that look like a misspelled `Flavor:` key
- [x] Negative-test each case on a scratch copy
- [x] Update ADR-0001's open follow-ups to done, and `docs/flavors.md` with both marker forms

### QA notes

Criterion 3 is enforced mechanically for the bare form only. The validator cannot see inside
another plugin, so for the `@` form it warns and defers to the runtime stop in the five
consuming skills. BR-002 records the split rather than claiming uniform coverage.

Carried forward: BR-004's neutrality check iterates `skills/flavor-*`. When the Game-Dev
Package milestone moves the only flavor out, that set empties and the check silently enforces
nothing while still passing.

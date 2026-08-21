# Business Rules

> Last updated: 2026-08-20
> Updated by: QA pass on Game-Dev Package (BR-022 added)

Invariants this plugin must enforce regardless of how any individual skill is written.

**Validation honesty:** a rule validated by `npm test` is mechanically enforced. A rule marked
**manual** is enforced by review only — the prose it constrains cannot be executed, so nothing
can assert it. Manual rules are the ones most likely to erode; they are stated here so a
reviewer knows to look.

---

## Flavor system

### BR-001: Flavor activation is always explicit
**Rule:** A flavor applies only when the project's `ARCHITECTURE.md` header block contains `> Flavor: <name>` or `> Flavor: <name>@<plugin>`, with the key spelled `Flavor` exactly. Nothing else activates a flavor — not repository contents, not file extensions, not inference.
**Rationale:** A repo that behaves differently with nothing in the tree explaining why is undebuggable. Detection may suggest; only a committed line decides. (ADR-0001)
**Validated by:** manual — `architecture` skill Step 1.9 states suggest-only; no code path performs detection.


### BR-002: An unresolvable flavor marker stops the run
**Rule:** When `ARCHITECTURE.md` names a flavor and neither candidate resolves — `flavor-<name>`, nor `<plugin>:flavor` for the `@` form — the invoking skill stops and reports the bad marker. It never falls back to core defaults.
**Rationale:** Silently ignoring a marker produces a run that looks flavored and is not — the failure surfaces later as work that skipped every domain check. (ADR-0001)
**Validated by:** `scripts/validate.js` for the bare form on this repo's own `ARCHITECTURE.md`; skill-side behaviour is **manual** (hook text in `dev`, `qa`, `milestones`, `architecture`, `/review-branch`). For the `@` form the validator **cannot** enforce this — it cannot see inside another plugin, so it warns and defers; only the runtime stop covers that case.
**Note (ADR-0005):** the `<plugin>:flavor` half of this rule is now unreachable. Plugin-provided skills do not load, so an `@` marker that falls through the bare form resolves to nothing and always hard-stops. The rule is unchanged and still correct — this is the outcome it exists to produce — but in practice it now fires for every `@` marker with no in-package counterpart.

### BR-003: Project rules override flavor rules
**Rule:** Where a flavor rule and the project's `ARCHITECTURE.md` disagree, `ARCHITECTURE.md` wins, and the skill applying the override states it once in its output.
**Rationale:** A flavor is a shared default; the project has the actual constraints. Announcing the override matters because a silent one is indistinguishable from a flavor that failed to load. (ADR-0002)
**Validated by:** manual — hook text in `dev`, `qa`, `milestones`, `/review-branch`.

### BR-004: Core skills never name a specific flavor
**Rule:** Skills outside `skills/flavor-*` and all commands resolve `flavor-<name>` generically. None may contain the name of a concrete flavor.
**Rationale:** Domain vocabulary in the core is exactly what the flavor mechanism exists to prevent; once one domain leaks in, the core stops being reusable for any other.
**Validated by:** `scripts/validate.js` — core neutrality check. Negative-tested: adding "game-dev" to `skills/dev/SKILL.md` fails the run.

### BR-005: A flavor provides every contract section
**Rule:** Every `flavor-<name>` skill contains all six sections — Activation, Milestone criteria, Dev standards, QA checks, Review dimensions, Architecture extensions. A section may be thin; none may be absent.
**Rationale:** Each section has exactly one consuming skill. A missing one leaves that skill nothing to apply, and the omission is invisible at the point of use.
**Validated by:** `scripts/validate.js` — flavor section check. Negative-tested: renaming `## QA checks` fails the run. Under ADR-0005 every flavor is authored in this repository, so the checked copy *is* the source of truth and this rule is mechanically enforced where it is written. **Residual gap:** a consuming project holds a committed copy, and nothing in that project re-checks it — a hand-edited copy violates this rule silently, and the phase reading the removed section applies nothing. Detecting that needs the contract to ship as a runnable check against `.claude/flavor.json`; until it does, the copies are covered by this rule and enforced by nothing.

### BR-006: A flavor cannot remove a core gate
**Rule:** No flavor may let dev close a milestone, skip QA rule discovery, or make `ARCHITECTURE.md` optional. Flavors add; they never subtract.
**Rationale:** The gates are what make the loop trustworthy. A domain layer that can switch one off makes every flavored project's guarantees unknowable.
**Validated by:** manual — `flavor-game-dev` Rule 5; structurally, flavors expose only additive sections read by specific phases.

### BR-011: The bare form resolves first, for both marker forms
**Rule:** `<name>@<plugin>` resolves to `flavor-<name>` when that skill exists in this package, and falls through to `<plugin>:flavor` only when it does not. A marker naming a plugin can therefore be satisfied by an in-package skill of the same name.
**Rationale:** Originally, to keep the declaration stable while a flavor moved between the package and a plugin — packaging could change without the marker changing (ADR-0001). **That rationale is void:** ADR-0005 established that plugin-provided skills do not load, so no flavor can make that move and the `<plugin>:flavor` fallback resolves to nothing. What survives is narrower and still worth keeping: bare-first means an `ARCHITECTURE.md` already carrying an `@` marker keeps working as long as the in-package flavor exists, so no project is forced to edit a committed declaration because packaging turned out differently than planned. The rule is retained for that tolerance, not for the migration it was written for.
**Validated by:** `scripts/validate.js` — resolution order. Negative-tested on a scratch copy: `game-dev@game-pack` resolved clean via `flavor-game-dev`, while `nope@ghost` fell through and reported `ghost:flavor`.

### BR-012: A near-miss of the marker key is a hard stop
**Rule:** A header key that is not exactly `Flavor` but is close to it — `Flavour:`, `flavor:`, `FLAVOR:`, `Flavor :` — is reported as a malformed marker. It is never treated as "no flavor declared".
**Rationale:** This is the one failure the rest of the flavor system cannot catch. An unresolvable marker is loud; a *misspelled key* matches no marker at all, so the project reads as unflavored and every phase runs core defaults with nothing anywhere recording that a flavor was intended. (ADR-0001)
**Validated by:** `scripts/validate.js` — near-miss detector over the header block, on this repo's own `ARCHITECTURE.md`; skill-side behaviour is **manual** (hook text in all five consumers). Negative-tested on a scratch copy: all four variants above error, while `Owner:`, `Version:`, `Status:`, `Flags:`, `Flow:`, `Layer:` and `Last updated:` stay clean, and a near-miss below the header block is correctly out of scope.

### BR-021: No flavor is ever installed user-level
**Rule:** A flavor exists only inside a consuming project's `.claude/`. `scripts/install-flavor.js` writes there and nowhere else, and `scripts/postinstall.js` — which does install the core loop skills into `~/.claude/skills/` — must skip every `flavor-*` directory. Neither script may put a flavor in `~/.claude/skills/`, `~/.claude/commands/`, or `~/.claude/settings.json`.
**Rationale:** Scoping is the entire reason flavors install this way. Anything under `~/.claude/` is active in every repository on the machine, which puts domain skills in front of projects that have nothing to do with the domain — the failure ADR-0003 was written to avoid and ADR-0005 preserves by a different route. (ADR-0005)

> **This rule was first written with a carve-out saying it did not constrain `postinstall.js`.** That was wrong, and wrong in the direction that costs most: `postinstall.js` was copying *every* `skills/` directory user-level, flavors included, so `flavor-game-dev` was globally active and a project that never opted in still saw it. The carve-out read as permission for the exact bug it was hiding. Found during the Game-Dev Package dev pass, 2026-08-20, by checking a path that should not have existed. The rule now names both scripts, because a rule that exempts a component is a rule that stops being checked against it.

**Validated by:** **behaviour, not assertion.** `install-flavor.js` refuses any target inside `~/.claude` (realpath-compared, so a symlink cannot slip past) and `postinstall.js` skips `flavor-*`, with manifest-driven pruning that removes copies an earlier version installed — verified 2026-08-20: `flavor-game-dev` disappeared from `~/.claude/skills/` and the manifest dropped to 13 core skills. But **`npm test` asserts none of this.** Both guards were confirmed by hand and nothing would catch their removal. Closing that needs a `validate.js` check that `postinstall.js` skips the flavor prefix and that `install-flavor.js` keeps its home guard.

### BR-022: An installer never removes what it did not install
**Rule:** Every script that writes skills into a directory prunes only what its own manifest records — `~/.claude/.claude-code-skills.json` for `postinstall.js`, `.claude/flavor.json` for `install-flavor.js`. A skill directory the manifest does not name is never deleted and never overwritten, however stale it looks.
**Rationale:** Both scripts write into directories their users also write into by hand. Manifest-limited pruning is the only thing that makes those writes safe: without it, reinstalling silently deletes someone's own skill, and the loss is invisible until they go looking for it. The manifest is not bookkeeping — it is the boundary between "this is mine to clean up" and "this belongs to someone else".
**Validated by:** **manual.** Verified 2026-08-20: a hand-written `hand-written/SKILL.md` in a target project survived a flavor reinstall, and an orphan file inside the flavor's own directory was correctly removed. `postinstall.js`'s equivalent is stated in `ARCHITECTURE.md` → Install and registration. `npm test` asserts neither, so this rule carries the same exposure as BR-021 and should be closed by the same `validate.js` work.

---

## Plugin integrity

### BR-007: A skill's frontmatter name equals its directory name
**Rule:** `skills/<dir>/SKILL.md` declares `name: <dir>`, kebab-case, unique across the repo.
**Rationale:** A mismatch makes Claude Code load the skill as nothing — no error, no warning, the skill simply never runs.
**Validated by:** `scripts/validate.js` — name checks. Negative-tested: renaming `qa` to `q-a` fails the run with the mismatch plus every stale reference.

### BR-008: Every slash reference resolves
**Rule:** Every backticked slash reference in skills, commands, docs, `README.md`, and `CLAUDE.md` names a real skill, command, or Claude Code builtin. Illustrative names are declared with `<!-- validate: allow-refs ... -->`.
**Rationale:** A stale reference sends the user to a command that does not exist — the most common breakage after a rename, and invisible until someone follows it.
**Validated by:** `scripts/validate.js` — cross-reference check.

### BR-009: Scripts carry no third-party dependencies
**Rule:** `dependencies`, `peerDependencies`, and `optionalDependencies` stay empty. Scripts use Node built-ins only.
**Rationale:** These run in `postinstall` on every teammate's machine. A dependency there is both a supply-chain surface and a failure mode nobody can debug mid-install.
**Validated by:** `scripts/validate.js` — dependency check. Negative-tested: adding `chalk` fails the run.

### BR-010: Every artifact has exactly one owning skill
**Rule:** A skill that needs a change in another skill's artifact invokes the owner rather than writing the file itself.
**Rationale:** Shared write access means no one is accountable for a file's shape, and two writers with different formats corrupt it slowly enough that nobody notices which pass did it.
**Validated by:** manual — ownership table in `ARCHITECTURE.md` and `docs/artifacts.md`. Worked instance: `/fix` proposes a business rule and hands it to `qa`'s rule-intake mode, which owns `BUSINESS_RULES.md` and assigns the `BR-XXX`.

---

## Bug path

### BR-013: The bug path stays outside the milestone loop
**Rule:** `/fix` never creates, activates, completes, or otherwise writes `MILESTONES.md`. Work that cannot be justified as a bug is refused and redirected to `/milestones`, naming which part of the feature-versus-bug test it failed.
**Rationale:** The two failure modes are opposite and both real. Forcing a bug through the loop produces a milestone nobody planned, with criteria written after the fact to describe a patch; letting a feature through the bug path produces work with no criteria, no plan, and no record. Naming the failing test is what makes the refusal actionable rather than obstructive.
**Validated by:** manual — `/fix` Step 1 and its Rules table. Not mechanically checkable: `validate.js` reads command prose but cannot execute it.

### BR-014: A regression test is observed failing before the fix exists
**Rule:** Every fix produces a regression test written against the *unfixed* code and run against it, failing for the reason the bug describes. The report states both the failing and the passing observation, quoting the failure output. A test that was not seen to fail is reported as such, never implied to have failed.
**Rationale:** A test written after the fix proves only that the code does what it currently does — it will keep passing when the bug returns, which is the one moment it exists to catch. Requiring the failure to match the bug's reason blocks the near-miss where a test fails on a typo or bad fixture and is mistaken for a valid reproduction.
**Validated by:** manual — `/fix` Steps 3 and 6, and the report format in Step 7 which has a dedicated line for both observations.

---

## Release notes

### BR-015: A published release section is never rewritten
**Rule:** Once a dated release section exists in `CHANGELOG.md`, `/release` never edits it — not to reword, not to add a milestone discovered later. Corrections go in the next release, stated as corrections. Re-running adds nothing for a milestone already recorded.
**Rationale:** The same reasoning that makes an accepted ADR immutable. A release note is a record of what was announced; editing it desynchronises the file from what readers already have, and unlike an ADR there is no status field to show it changed. Idempotency follows from the same constraint — a regeneration that rewrites is a regeneration that corrupts.
**Validated by:** manual — `/release` Step 6 and its Rules table.

### BR-016: Release notes derive from specs, never from commit messages
**Rule:** Entries are built from milestone goals, acceptance criteria, `BR-XXX` rules, and `docs/product/`. Git is consulted for release boundaries — tags and dates — and for nothing else. No commit message is restated.
**Rationale:** A commit message describes how the code changed, for the people changing it. A changelog describes what the product does, for people who will never read the code. Deriving one from the other produces a file that serves neither, and it is the default failure mode of every generated changelog.
**Validated by:** manual — `/release` Step 1 (explicit prohibition) and Step 4.

### BR-017: An excluded milestone is reported with its reason
**Rule:** Every completed or archived milestone left out of the changelog as not user-visible is named in the confirmation report, with the reason. Exclusion is never silent.
**Rationale:** A missing milestone is indistinguishable from a bug in the generator. The exclusion list is also the part most likely to be wrong and the part invisible in the finished file, so it is shown before writing, while it can still be corrected.
**Validated by:** manual — `/release` Step 3 and the exclusion table in Step 5, shown before the write gate.

---

## QA retro

### BR-018: A pattern needs two milestones, named
**Rule:** `qa-retro` proposes a rule only for a finding recurring across two or more milestones, and cites every milestone as evidence. Below the threshold it reports the near-miss and proposes nothing. With fewer than two milestones on record it stops entirely.
**Rationale:** One occurrence is an incident, not a pattern, and a rule set that fills with rules built from single incidents stops being read — at which point the good rules stop working too. Naming the evidence is what lets a proposal be argued with instead of merely accepted.
**Validated by:** manual — `qa-retro` Steps 1 and 3, and its Rules table.

### BR-019: QA records findings on every pass, including clean ones
**Rule:** `qa` Step 8b appends to `qa-findings.md` after every pass, using stable category slugs, and records `clean` when a pass found nothing. It runs ungated, whether or not the milestone is archived.
**Rationale:** The Step 7 report is delivered into a conversation and lost, so nothing accumulates and no pattern can ever be seen. Clean passes matter as much as troubled ones: without them the file implies every milestone went badly, and the denominator that separates a real pattern from a coincidence is gone. Stable slugs are what make clustering possible — the same mistake described three ways reads as three problems.
**Validated by:** manual — `qa` Step 8b. `qa-retro` depends on this rule holding; if it erodes, the retro silently has less to work from rather than failing loudly.

### BR-020: One scope classification, shared not copied
**Rule:** `qa-retro` applies `learn-from-pr` Step 3's classification by reference and does not restate it. Confirmed rules are written in `learn-from-pr`'s format to the targets it specifies.
**Rationale:** Two copies of one classification drift, and then the same rule is filed in two different places by two skills that each believe they are right. This is `ARCHITECTURE.md`'s "restating another skill's rules instead of referencing them" applied to the case where it does the most damage.
**Validated by:** manual — `qa-retro` Step 4, which states the prohibition explicitly. Not mechanically checkable; a future copy-paste would pass `npm test`.

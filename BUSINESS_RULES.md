# Business Rules

> Last updated: 2026-08-19
> Updated by: QA pass on Game-Dev Flavor

Invariants this plugin must enforce regardless of how any individual skill is written.

**Validation honesty:** a rule validated by `npm test` is mechanically enforced. A rule marked
**manual** is enforced by review only — the prose it constrains cannot be executed, so nothing
can assert it. Manual rules are the ones most likely to erode; they are stated here so a
reviewer knows to look.

---

## Flavor system

### BR-001: Flavor activation is always explicit
**Rule:** A flavor applies only when the project's `ARCHITECTURE.md` header block contains `> Flavor: <name>`. Nothing else activates a flavor — not repository contents, not file extensions, not inference.
**Rationale:** A repo that behaves differently with nothing in the tree explaining why is undebuggable. Detection may suggest; only a committed line decides. (ADR-0001)
**Validated by:** manual — `architecture` skill Step 1.9 states suggest-only; no code path performs detection.

### BR-002: An unresolvable flavor marker stops the run
**Rule:** When `ARCHITECTURE.md` names a flavor with no matching `flavor-<name>` skill, the invoking skill stops and reports the bad marker. It never falls back to core defaults.
**Rationale:** Silently ignoring a marker produces a run that looks flavored and is not — the failure surfaces later as work that skipped every domain check. (ADR-0001)
**Validated by:** `scripts/validate.js` — marker resolution check on this repo's own `ARCHITECTURE.md`; skill-side behaviour is **manual** (hook text in `dev`, `qa`, `/review-branch`).

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
**Validated by:** `scripts/validate.js` — flavor section check, **for flavors in this repository only**. Negative-tested: renaming `## QA checks` fails the run. Under ADR-0003 flavors may ship as separate plugins; for any flavor outside this repo the rule is **manual** until the contract ships as a runnable check.

### BR-006: A flavor cannot remove a core gate
**Rule:** No flavor may let dev close a milestone, skip QA rule discovery, or make `ARCHITECTURE.md` optional. Flavors add; they never subtract.
**Rationale:** The gates are what make the loop trustworthy. A domain layer that can switch one off makes every flavored project's guarantees unknowable.
**Validated by:** manual — `flavor-game-dev` Rule 5; structurally, flavors expose only additive sections read by specific phases.

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
**Validated by:** manual — ownership table in `ARCHITECTURE.md` and `docs/artifacts.md`.

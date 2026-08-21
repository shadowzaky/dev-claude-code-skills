# ADR-0005: Install flavors as committed copies in the project's `.claude/skills/`

- **Status:** Accepted
- **Date:** 2026-08-20
- **Decided:** 2026-08-20
- **Deciders:** repo owner
- **Supersedes:** ADR-0003, ADR-0004

<!-- validate: allow-refs playtest -->

## Context

ADR-0003 decided flavors ship as separate plugins, distributed from this repository through a
marketplace and enabled per project. It rested on a premise taken from documentation rather than
observation: that plugin skills load, namespaced `/plugin-name:skill-name`.

ADR-0004 recorded the first evidence against that premise and stopped work pending an experiment
that could not be run from inside a session — it needed a restart. The experiment has now run.

### What was observed, 2026-08-20

| Fact | Evidence |
|---|---|
| Claude Code genuinely restarted | `claude` PID 47916 start time 8:42:38 PM; the prior session's last write was 8:42:16 PM |
| `caveman@caveman` remains installed, enabled, and intact | `installed_plugins.json` v2 entry, marketplace cache at `plugins/cache/caveman/caveman/84cc3c14fa1e`, five well-formed `skills/*/SKILL.md` on disk |
| **It still contributes zero skills post-restart** | No `caveman:*` and no bare `caveman`, `caveman-commit`, `caveman-help`, `caveman-review`, `compress` in the session |
| The manifest-declaration hypothesis is dead | Anthropic's own `claude-code-setup`, `claude-md-management`, and `claude-security` ship `skills/` with **no** skills key in `plugin.json` — identical manifest shape to caveman's and ours |
| The hand-written registration is not merely inert — it is collected | `claude-code-skills@npm` was **evicted** from `installed_plugins.json` on startup, while `settings.json` still lists it in `enabledPlugins` |
| **Project-level `.claude/skills/` loads, without a restart** | A probe skill written into this repo's `.claude/skills/` appeared in the live session's skill list immediately |

ADR-0004 named exactly one innocent explanation — a missing skills declaration in the manifest.
Anthropic's own plugins remove it. The route ADR-0003 chose *because* it was believed to work is
the route now shown not to.

That leaves three candidate mechanisms, of which only two load anything:

| Mechanism | Loads? |
|---|---|
| Plugin registration, hand-written or marketplace | **No** |
| `~/.claude/skills/` copies | Yes — globally, in every project |
| `.claude/skills/` copies in the project | Yes — scoped to that project, hot |

Per-project scoping and *working* were believed to be available only from the plugin route. The
probe shows they are available from the third row instead.

**This context expires** if Claude Code fixes plugin skill loading, or gains per-project scoping
for user-level skills. Either would make the plugin route viable and this decision inherited
rather than reasoned. Revisit; do not assume.

## Decision

We will install a flavor by **copying its skills into the consuming project's `.claude/skills/`**,
through a re-runnable script in this repository, invoked when a project declares that flavor.

- The copied skills are **committed** to the consuming repository. A clone works with no extra step.
- A tracked `.claude/flavor.json` records the flavor name, the version installed, and the source
  commit sha, so what a project holds is identifiable rather than anonymous.
- The script is idempotent: re-running it upgrades a project in place.
- `> Flavor: game-dev` in `ARCHITECTURE.md` continues to declare the flavor to the loop, per ADR-0001.
- `flavor-game-dev` **stays in this package** and is no longer moved into `plugins/game-dev/`.

The core package's own install model is unchanged: it still copies into `~/.claude/skills/`, because
the loop skills are meant to be global. Only flavors are project-scoped, and only flavors use this path.

## Alternatives considered

### Ship flavors as marketplace plugins, enabled per project — ADR-0003
The decision this supersedes. Rejected because plugin-provided skills do not load: an installed,
enabled, correctly-formed, marketplace-cached plugin contributes nothing to a session after a
restart, and Anthropic's own plugins rule out the mis-declaration explanation. It is not a worse
option than the one chosen; it is a non-functional one.

### Copy flavor skills into `~/.claude/skills/` alongside the core
The mechanism with the longest track record here — it is how all 13 core skills load. Rejected for
the reason ADR-0003 gave and this decision still accepts: user-level skills are all-or-nothing, so
installing the game flavor puts `/playtest` in front of someone working on a payments API. Scoping
is the whole point of a flavor.

### Copy into the project, but gitignore the copies
Each developer runs the script themselves; nothing generated is committed, which answers ADR-0003's
objection directly. Rejected by the repo owner: a teammate who clones and skips the script gets a
project whose `ARCHITECTURE.md` declares a flavor that is not there, and the failure is silent —
the same two-step-activation trap ADR-0003 listed as a negative of the plugin route.

### Sections only — no companion flavor skills
What exists today, and correct by construction since the flavor is one marker-gated skill. Rejected
for ADR-0003's original reason, which this evidence does not touch: it caps what a flavor can be. A
playtest workflow compressed into a `## QA checks` bullet is not a workflow.

### Wait for Claude Code to fix plugin skill loading
The cheapest option, and it preserves ADR-0003 intact. Rejected because it blocks the Game-Dev
Package milestone on a vendor timeline with no announced date, in exchange for avoiding a migration
that is a script and a manifest file.

## Consequences

**Positive**
- The install path is the one mechanism with direct evidence of working, rather than the one with
  documentation.
- Per-project scoping survives: a repo without the marker and without the copies sees no trace of
  the flavor.
- Hot-loading means the flavor is live in the session that installs it — no restart, so scaffolding
  a game project and using its skills is one continuous flow.
- No marketplace, no cache, no second distribution channel. One npm package and one script.
- `flavor-game-dev` does not move, so the Flavor Resolution Hardening work already shipped stands.

**Negative**
- **Generated files are committed to every consuming repo** — precisely what ADR-0003 rejected this
  approach for. The cost is accepted, not dissolved: flavor churn shows up in the consuming project's
  diffs, blame, and review surface.
- **Drift is detectable but not prevented.** `flavor.json` records the version; nothing enforces
  re-running the script. Five game repos can still sit at five versions, and now each has a file
  claiming which.
- **Updates fan out linearly.** Fixing a flavor bug means re-running the script in every consuming
  repo and committing the result — work proportional to repo count, where the plugin route would
  have been one version bump.
- **It depends on undocumented behaviour.** Project-level `.claude/skills/` hot-loading is observed,
  not specified. This is the same class of risk that sank ADR-0003, differing only in that the
  observation is first-hand. If it regresses, flavors break with no fallback.
- **The `@plugin` marker form goes vestigial.** ADR-0001 specified `> Flavor: <name>@<plugin>`
  resolving to `<plugin>:flavor`. If plugin-provided skills do not load, that form can never resolve
  to anything real. Nothing breaks — the bare form resolves first (BR-011) and an unresolvable marker
  hard-stops (BR-002) — but two business rules now govern a path no flavor can take, and BR-011's
  stated rationale, *keeping the declaration stable while a flavor moves between the package and a
  plugin*, describes a migration this decision makes impossible.
- **A consuming repo's copy is unvalidated.** `validate.js` checks the six-section contract on the
  flavor this repo ships, which under this decision *is* the source of truth — so BR-005 keeps the
  reach ADR-0003 would have cost it. The residual gap is narrower but real: nothing stops a consuming
  repo hand-editing its copy, and no check there would notice.
- Two install models still coexist — user-level for the core, project-level for flavors — so there
  remain two stories to document and keep working.
- Project-scoped skills may require a workspace-trust prompt on first load; unverified.
- The restart evidence is strong but not airtight: caveman's `installedAt` is ~2s *after* the process
  start, so its registration may have been refreshed during startup. ADR-0004 recorded the same
  absence in an earlier session at the same cache sha, spanning two process lifetimes, and the
  Anthropic-plugins finding is independent of the restart entirely — but a single decisive re-check
  would close it. The probe was likewise observed *listed*, not invoked.

**Follow-up**
- **`ARCHITECTURE.md` needs four corrections.** Line 147's claim that plugin skills are namespaced
  and coexist is false and must go. Line 149's "Unverified" note is now resolved. Line 157's *"there
  is no hot reload"* is false for project-level skills — the property this decision depends on. Line
  251's restatement of ADR-0003 must be replaced with this decision.
- **`BUSINESS_RULES.md` needs three rules revisited, and this record cannot write them.** `qa` owns
  that file (BR-010), so the changes are handed over, not applied here: BR-005's *Validated by* clause
  cites ADR-0003 by name and is now wrong; BR-002's `@`-form caveat and BR-011's entire rationale
  govern a marker form this decision makes unreachable.
- Rewrite the **Game-Dev Package** milestone: unblock it, drop the `marketplace.json` and
  `plugins/game-dev/` tasks, add the script and `flavor.json`.
- Whatever invokes the install script must pass the flavor name **read from the marker**, never a
  literal — a core skill containing the string `game-dev` violates BR-004 and fails `npm test`.
- Build `scripts/install-flavor.js` and define the `flavor.json` schema.
- Decide the fate of the plugin registration in `postinstall.js:81-97`. It writes a file Claude Code
  discards on startup, and `enabledPlugins` is left pointing at an unregistered plugin. Dead code
  that produces a misleading artifact, but removing it is a separate decision.
- **Resolve ADR-0004 in `/adr-review`.** Its observations were correct and its stop-work call was
  right at the time; its deferral is now spent. Accepting it and marking it superseded by this
  record preserves the reasoning; rejecting it as moot discards it. That is the reviewer's call.

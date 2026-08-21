# ADR-0004: Plugin-registered skills do not load; ADR-0003's premise is unconfirmed

- **Status:** Superseded by ADR-0005
- **Date:** 2026-08-20
- **Decided:** 2026-08-20
- **Deciders:** repo owner

> **Accepted on review 2026-08-20, then superseded the same day.** The observations here were
> sound and the decision to stop work was correct — it prevented an extraction that would have
> made a working flavor unreachable. The experiment it demanded was then run, and both innocent
> explanations failed. [ADR-0005](0005-flavors-install-as-project-copies.md) carries the result.
> Nothing below has been edited.

<!-- validate: allow-refs playtest -->

## Context

ADR-0003 decided that flavors ship as separate plugins, enabled per project. It rests on one
factual premise, taken from the Claude Code documentation rather than from observation:

> Plugin skills are namespaced `/plugin-name:skill-name`, and coexist with same-named
> unprefixed skills rather than overriding them.

ADR-0003 also listed a follow-up: *confirm the core's plugin registration actually loads
anything*, noting that namespaced `claude-code-skills:*` skills had never been observed, while
the marketplace-installed `caveman` plugin reportedly did appear namespaced. That contrast was
the reason to believe the marketplace route worked and the hand-written route did not.

The Game-Dev Package milestone made this the blocking first task. It was investigated on
2026-08-20.

### What was observed

On this machine, in a live session:

| Fact | Evidence |
|---|---|
| `caveman@caveman` is installed | `~/.claude/plugins/installed_plugins.json`, `scope: user`, cached under `plugins/cache/caveman/caveman/84cc3c14fa1e` |
| It is enabled | `~/.claude/settings.json` → `enabledPlugins["caveman@caveman"] = true` |
| It ships five skills | `skills/{caveman,caveman-commit,caveman-help,caveman-review,compress}/SKILL.md`, all with valid `name` + `description` frontmatter |
| Its author expects namespacing | `compress` documents its own trigger as `/caveman:compress` |
| **None of the five are available in the session** | Absent from the session's skill list, both as `caveman:*` and bare |
| All 13 of this package's skills *are* available, unprefixed | They also exist as copies in `~/.claude/skills/`, recorded in `.claude-code-skills.json` |

The control fails. A correctly-formed, installed, enabled, marketplace-sourced plugin
contributes **zero** skills. The skills that do load are exactly the set that exists as copies
in `~/.claude/skills/`.

**This contradicts ADR-0003's premise**, and it contradicts it for the marketplace route
specifically — the route ADR-0003 chose *because* it was believed to work.

### What was not ruled out

Neither manifest declares a skills path. `caveman`'s `plugin.json` lists only `hooks`; this
package's is `"hooks": {}`. If Claude Code requires an explicit declaration rather than
auto-discovering `skills/` in the plugin root, then the mechanism may be sound and both
plugins are simply mis-declared — in which case ADR-0003 stands unchanged.

Distinguishing the two requires an experiment that cannot be run from inside a session: add a
skills declaration to a plugin manifest, **restart Claude Code** (there is no hot-reload), and
observe whether the namespaced skills appear.

## Decision

**Deferred pending that experiment.** This record exists to stop work, not to settle direction.

Concretely, until the experiment is run:

- `flavor-game-dev` **stays** in `skills/`. Moving it into a plugin subdirectory on the current
  evidence would make a working flavor unreachable.
- The Game-Dev Package milestone is blocked. Its second acceptance criterion — a project that
  enables the plugin gets the flavor namespaced — cannot be satisfied or even tested.
- Namespaced marker resolution, delivered by the Flavor Resolution Hardening milestone, is
  unaffected and stays. It costs nothing if unused and is required either way.

## Alternatives considered

### Proceed with the extraction anyway
Rejected. It trades a flavor that works today for one that demonstrably does not load, on the
strength of documentation already contradicted by observation.

### Supersede ADR-0003 now, and keep flavors in the core
Premature. The falsifying evidence has an untested innocent explanation, and superseding an
accepted ADR on incomplete evidence would replace one unverified premise with another.

### Ship flavors as a second npm package reusing the copy mechanism
The one route with direct evidence of working, since the copy mechanism is what loads skills
today. Rejected for now because it reintroduces exactly what ADR-0003 rejected it for: copies
in `~/.claude/skills/` are global, so per-project enablement is lost. Worth reopening only if
the experiment confirms plugin skills genuinely do not load.

## Consequences

- The Game-Dev Package milestone cannot proceed. It is the only blocked item; the remaining
  milestones do not touch flavor packaging.
- ADR-0003 stays `Accepted` and is **not** edited — records are immutable. If the experiment
  confirms the premise is false, a superseding ADR replaces it then, with evidence.
- ADR-0003's follow-up *"correct the install section of `ARCHITECTURE.md`"* also waits. The
  current text says copies "win over plugin discovery"; the observation here suggests there may
  be no plugin discovery of skills to win over, which is a stronger claim than the correction
  ADR-0003 anticipated.

## Follow-up

- **Run the experiment.** Declare a skills path in a plugin manifest, restart Claude Code, and
  record whether namespaced skills appear. Everything above turns on the result.
- If plugin skills load once declared: fix both manifests, keep ADR-0003, unblock the milestone.
- If they do not load: write the ADR superseding ADR-0003, and treat per-project flavor scoping
  as unavailable until Claude Code supports it.

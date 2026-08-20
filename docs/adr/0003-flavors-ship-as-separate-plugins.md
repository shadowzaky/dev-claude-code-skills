# ADR-0003: Ship domain flavors as separate plugins, enabled per project

- **Status:** Accepted
- **Date:** 2026-08-20
- **Decided:** 2026-08-20
- **Deciders:** repo owner

<!-- validate: allow-refs playtest -->

## Context

ADR-0001 settled how a project *declares* a flavor. It did not settle where a flavor *lives*.

That became load-bearing once flavors needed to carry more than guidance. A game project wants domain workflows — a playtest pass, a balance pass, an asset audit — and those are skills, not sections inside another skill's body.

The constraint: this package installs skills user-level, copying them into `~/.claude/skills/`. Anything shipped that way is visible in every project on the machine, game or not. A domain bundle shipped from the core would put `/playtest` in front of someone working on a payments API.

### Verified behaviour

From the Claude Code documentation, read 2026-08-20:

| Fact | Source |
|---|---|
| `enabledPlugins` is supported at project scope (`.claude/settings.json`); precedence Managed > CLI > local > project > user | [settings](https://code.claude.com/docs/en/settings) |
| Plugin skills are namespaced `/plugin-name:skill-name`, and coexist with same-named unprefixed skills rather than overriding them | [plugins](https://code.claude.com/docs/en/plugins) |
| A marketplace may list several plugins whose `source` is a relative subdirectory of the marketplace's own repository | [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) |
| Marketplace plugins are cached under `~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/` | [plugins-reference](https://code.claude.com/docs/en/plugins-reference) |

**This context expires** if Claude Code gains per-project scoping for user-level skills. The entire argument below is a workaround for their being all-or-nothing; if that changes, revisit rather than inherit.

## Decision

Flavor implementations ship as their own Claude Code plugins, **distributed from this repository** through a `marketplace.json` whose entries point at subdirectories:

```json
{
  "name": "claude-code-skills",
  "plugins": [
    { "name": "claude-code-skills", "source": "./" },
    { "name": "game-dev", "source": "./plugins/game-dev" }
  ]
}
```

- Installing a flavor plugin registers it and leaves it **disabled**.
- A project opts in through its committed `.claude/settings.json`:

  ```json
  { "enabledPlugins": { "game-dev@claude-code-skills": true } }
  ```

- `> Flavor: game-dev@game-dev` in `ARCHITECTURE.md` continues to declare it to the loop, using the namespaced resolution form ADR-0001 specifies.

**A flavor plugin must not copy its skills into `~/.claude/skills/`.** This package's `postinstall.js` does exactly that, and reusing it for a flavor would make those skills globally active and defeat per-project enablement entirely. Flavor plugins are installed as plugins and left to the plugin lifecycle. The two install models are deliberately different, and a flavor must not inherit the core's.

`flavor-game-dev` moves from `skills/` into `plugins/game-dev/skills/`. What stays at the root: the six-section contract, marker resolution in the core skills, and the validator checks that apply to flavors this package ships.

## Alternatives considered

### A separate repository per flavor
The first shape this decision took. Rejected once the marketplace schema turned out to allow subdirectory sources: a second repository buys nothing here and costs a second release path, a second CI setup, and cross-repo version coordination between a contract and its implementations. Same-repo entries give the same install-time separation with none of that.

### Keep flavors in the core package with a marker guard
Every flavor skill opens by checking the marker and refuses to run when it is absent. Zero new infrastructure and it works today. Rejected because the guard is prose in a skill body — nothing enforces it, and a skill that forgets it silently works everywhere. It also does not solve visibility: `/playtest` still appears in the skill list of every unrelated project, a tax paid by people who will never use it.

### Copy flavor skills into each project's `.claude/skills/`
Supported — a directory there with a `plugin.json` loads as a project-scoped plugin after a workspace-trust prompt. Real isolation. Rejected because it distributes copies with no version: five game repos drift to five versions of the same flavor, and updating means touching each one. It also commits generated files to every consuming repo.

### Sections only — no companion skills
What exists today. Correct scoping by construction, since the flavor is one marker-gated skill. Rejected because it caps what a flavor can be: a playtest workflow crammed into a `## QA checks` bullet is not a workflow, and the domains that most need a flavor are the ones with real procedures.

## Consequences

**Positive**
- Opt-in is a native, committed, team-shared mechanism — not a convention this project invented.
- The core stays domain-free by construction rather than by discipline; it cannot ship game vocabulary it does not contain.
- Namespacing makes provenance visible at the call site: `/game-dev:playtest` says where it came from.
- One repository, one review surface, contract and implementation versioned together.

**Negative**
- Distribution changes shape. This package installs by npm; marketplace plugins install through `/plugin` and are cached per version. Supporting both means two install stories to document and keep working.
- Two-step activation. Installing without enabling produces a project where nothing happens, and the failure looks identical to a broken install.
- **BR-005 weakens.** `validate.js` enforces the six-section contract only for flavors in this repository. A third-party flavor can violate it and nothing here will catch it, so a rule that is mechanically enforced today becomes manual for anything external.
- Namespaced resolution must land **before** extraction. Moving the flavor first leaves the marker pointing at a skill the core cannot resolve.
- Contract and implementations can still skew for external flavors — a flavor built against a six-section contract keeps loading after the contract gains a seventh.

**Follow-up**
- Implement namespaced marker resolution in the core skills and the validator (ADR-0001 open item).
- **Correct the install section of `ARCHITECTURE.md`.** It states that copies "win over plugin discovery"; plugin skills are namespaced and coexist. This decision reasons from the corrected model.
- **Confirm the core's plugin registration actually loads anything.** `postinstall.js` hand-writes `~/.claude/plugins/installed_plugins.json` with an `installPath`. Namespaced `claude-code-skills:*` skills have not been observed in a session, while the marketplace-installed `caveman` plugin does appear namespaced — evidence that the copies do all the work and the registration is inert. If so, the marketplace route is not an addition to the current mechanism but a replacement for a mechanism that never worked.
- Publish the six-section contract as a versioned spec external flavors can target, and decide whether the checker ships with it — otherwise BR-005 has no teeth off-repo.
- Migrate `flavor-game-dev`, and update `docs/flavors.md`, `README.md`, and BR-005's enforcement wording.

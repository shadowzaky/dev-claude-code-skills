# Flavors

A **flavor** is a domain-specific layer over the core loop. It does not replace a phase; it adds domain vocabulary, domain checks, and domain spec sections to the phases that already exist.

The core loop is domain-neutral on purpose. `dev` knows about layers, tests, and naming; it knows nothing about what the software *does*. That neutrality is what makes it reusable — and also what makes it generic where a domain has real, specific standards.

```
                  ┌──────────────────────────┐
   flavor  ───►   │  domain criteria, checks,│
                  │  extra spec sections     │
                  └────────────┬─────────────┘
                               │ layers onto
   core    ───►     PM  →  Dev  →  QA
```

| Flavor | For | Status |
|---|---|---|
| [`flavor-game-dev`](../skills/flavor-game-dev/SKILL.md) | Game projects — Godot, Unity, Unreal, custom engines | Available |

---

## Activation

A project declares its flavor with a marker in the `ARCHITECTURE.md` header block (ADR-0001):

```markdown
# Architecture

> Last updated: 2026-08-19
> Flavor: game-dev
```

Core loop skills read the marker from the `ARCHITECTURE.md` they already load and hard-stop on, and invoke the flavor skill it names for the phase they are running.

### The two forms

A flavor may ship inside this package or as a separate plugin, and Claude Code namespaces plugin skills as `/plugin-name:skill-name`. The marker accepts both:

| Marker | Resolves to |
|---|---|
| `> Flavor: game-dev` | `flavor-game-dev` — a skill in this package |
| `> Flavor: game-dev@game-pack` | `game-pack:flavor` — a skill from the `game-pack` plugin |

**The bare form is tried first, for both forms.** A marker written `game-dev@game-pack` resolves to `flavor-game-dev` if that skill exists here, and only falls through to `game-pack:flavor` when it does not. That is what keeps the marker stable while a flavor moves between the package and a plugin — the declaration does not change when the packaging does.

If neither candidate resolves, every phase **stops**. Guessing which flavor was meant is worse than asking.

### The key is spelled `Flavor:`, exactly

`Flavour:`, `flavor:`, and `Flavor :` match no marker. Left undetected, the project reads as *unflavored* — the pipeline runs happily with core defaults and nothing anywhere says a flavor was intended, which is the worst of both outcomes.

So a near-miss of the key is a **hard stop**, not a warning, in every phase that reads the marker. `scripts/validate.js` applies the same rule to this repository's own `ARCHITECTURE.md`.

### No auto-detection

No marker means no flavor: the pipeline behaves exactly as it does without one, with no extra prompts and no extra files.

A flavor is never activated by auto-detection. `architecture` may *suggest* one when it recognises the domain, but activation is always an explicit line someone wrote.

---

## Precedence

A flavor supplies domain defaults. The project supplies its own rules. When they disagree, **the project wins** (ADR-0002).

```
BUSINESS_RULES.md   business invariants — outrank all technical preference
  ↓
Accepted ADRs       recorded decisions, binding
  ↓
ARCHITECTURE.md     this project's rules
  ↓
flavor-<name>       domain defaults
  ↓
core skill defaults dev/qa standing standards
```

A flavor rule applies unless `ARCHITECTURE.md` says otherwise about the same thing. When a skill overrides a flavor rule, it says so once in its output — a silent override is indistinguishable from a flavor that failed to load.

The trade-off is deliberate: a flavor cannot guarantee its rules hold. That keeps the cost of trying a flavor low, at the price of a project being able to override its way out of one entirely.

---

## The contract

A flavor is a skill in `skills/flavor-<name>/SKILL.md` — flavors are discoverable the same way every other skill is, because Claude Code only scans `skills/*/SKILL.md`.

Frontmatter follows the normal skill rules, with one addition: the description must state that the skill is invoked by core loop skills when the marker is present, not typed directly by the user.

The body must contain these six sections, in this order. `scripts/validate.js` enforces their presence:

| Section | Consumed by | Contents |
|---|---|---|
| `## Activation` | — | The marker value, and what kind of project this flavor is for |
| `## Milestone criteria` | `milestones`, `/sprint` | How acceptance criteria should be shaped in this domain, with examples |
| `## Dev standards` | `dev` | Domain coding rules layered on the standing quality bar |
| `## QA checks` | `qa` | Verification the domain demands beyond "tests pass" |
| `## Review dimensions` | `/review-branch` | Extra review dimensions and their severity mapping |
| `## Architecture extensions` | `architecture` | Extra sections a flavored project's `ARCHITECTURE.md` must carry |

A flavor may leave a section thin, but not absent — an empty section is a statement that the domain adds nothing there, and that is worth stating.

---

## Rules for any flavor

1. **Additive only.** A flavor never removes a core gate. It cannot let Dev close a milestone, cannot skip rule discovery, cannot make `ARCHITECTURE.md` optional.
2. **Core stays clean.** No domain vocabulary in `skills/dev`, `skills/qa`, or `skills/milestones`. Those skills know only that a flavor marker may exist and that a flavor skill may be invoked — never what any specific flavor contains.
3. **Same artifacts.** Flavors extend `ARCHITECTURE.md`, `MILESTONES.md`, and `BUSINESS_RULES.md` with sections. They do not introduce parallel spec files.
4. **Project rules win.** Every flavor states this where its rules are applied.
5. **Same discipline.** A flavor's checks are hard stops or they are guidance — stated explicitly as one or the other, never left ambiguous.

---

## Adding a flavor

1. Create `skills/flavor-<name>/SKILL.md` with the six required sections.
2. Write the frontmatter description so it is clear the skill is invoked by the loop, not typed by a user.
3. Add a row to the table at the top of this file and to the skill table in `README.md`.
4. Run `npm test` — validation checks the required sections and that the name resolves.

Core skills need no change to support a new flavor. They resolve `flavor-<marker>` by name, so adding one is additive by construction.

---

## Open questions

- **Composition.** One marker, one flavor. Two flavors on one project would need list syntax and an overlap ruling; deferred until something needs it.
- **Non-overridable rules.** Whether a flavor may mark specific rules as immune to project override. ADR-0002 says no for now.
- **Drift.** Nothing audits a project that has overridden most of its flavor and only nominally still uses it.

---

## Reference

- [the-loop.md](the-loop.md) — the phases a flavor extends
- [spec-driven-development.md](spec-driven-development.md) — the discipline flavors must preserve
- [artifacts.md](artifacts.md) — the files flavors add sections to
- ADR-0001, ADR-0002 — activation and precedence, with the alternatives that were rejected

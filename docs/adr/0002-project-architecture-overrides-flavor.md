# ADR-0002: Project ARCHITECTURE.md overrides flavor rules

- **Status:** Accepted
- **Date:** 2026-08-19
- **Decided:** 2026-08-20
- **Deciders:** repo owner

## Context

A flavor supplies domain defaults — how a game repo should structure scenes, what a QA pass should check about frame budget. A project's `ARCHITECTURE.md` supplies that project's actual rules. They will disagree, and a skill reading both needs a deterministic answer rather than "whichever was read last".

The repo already answers the same question one level down: the `dev` skill carries standing coding standards and states that `ARCHITECTURE.md` overrides them where it specifies differently. Flavors sit between those two — more specific than the core skill, less specific than the project.

## Decision

The project's `ARCHITECTURE.md` wins. Precedence, strongest first:

```
BUSINESS_RULES.md   (business invariants — outrank all technical preference)
  ↓
Accepted ADRs       (recorded decisions, binding)
  ↓
ARCHITECTURE.md     (this project's rules)
  ↓
flavor-<name>       (domain defaults)
  ↓
core skill defaults (dev/qa standing standards)
```

A flavor rule applies unless `ARCHITECTURE.md` states something different for the same thing. When a skill overrides a flavor rule this way, it says so once in its output rather than silently — an override that nobody notices is indistinguishable from a flavor that failed to load.

## Alternatives considered

### Flavor wins
Treats domain rules as non-negotiable, the way business invariants outrank technical preference. Rejected because a flavor is a shared default written for many repos, and the project is the one with the actual constraints. A team that cannot opt out of a rule that does not fit them will abandon the flavor entirely rather than fight it — the strict option produces less adoption, not more compliance.

### Split — flavor authoritative for sections it introduces
Precise in principle: the project wins where the two overlap, the flavor owns what only it defines. Rejected because the boundary is exactly what people would argue about, and every argument would need a ruling. A rule whose scope is contested is worse than a blunt rule everyone can predict.

### Any conflict is a hard stop
Safest, and consistent with this repo's preference for stopping over guessing. Rejected because conflicts here are expected and benign — a project legitimately differing from a shared default is the normal case, not an error. Stopping on it would make flavors an interruption tax, and hard stops lose their force when they fire on routine situations.

## Consequences

**Positive**
- Consistent with the existing `ARCHITECTURE.md`-overrides-`dev`-defaults rule, so there is one precedence idea to learn, not two.
- A project can adopt a flavor without accepting every rule in it, which lowers the cost of trying one.
- Deterministic: any skill resolves a conflict the same way, with no user prompt.

**Negative**
- A flavor cannot guarantee any of its rules hold. A project can override every one and still call itself flavored, which weakens what the marker communicates.
- Silent divergence is possible over time: a project that overrides most of a flavor looks flavored but behaves as if it is not. Nothing currently audits that gap.
- Business invariants and accepted ADRs sit above `ARCHITECTURE.md` in the chain, so three levels must be checked to resolve a genuine conflict.

**Follow-up**
- `docs/flavors.md` documents the precedence chain as the flavor contract.
- Every flavor skill states that project rules override it, so the rule is visible where it is applied.
- Possible later ADR: whether a flavor may mark specific rules as non-overridable.

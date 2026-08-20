# Flavors

**Status: planned.** Nothing here is implemented yet. This page fixes the extension model so flavors can be added without reworking the core.

---

## What a flavor is

The core loop is domain-neutral on purpose. `dev` knows about layers, tests, and naming; it knows nothing about what the software *does*. That neutrality is what makes it reusable — and also what makes it generic where a domain has real, specific standards.

A **flavor** is a domain-specific layer on top of the core loop. It does not replace a phase; it adds domain vocabulary, domain checks, and domain spec sections to the phases that already exist.

```
                  ┌──────────────────────────┐
   flavor  ───►   │  domain criteria, checks,│
                  │  extra spec sections     │
                  └────────────┬─────────────┘
                               │ layers onto
   core    ───►     PM  →  Dev  →  QA
```

---

## Extension points

A flavor may hook into any of these. It should use as few as it needs.

| Point | What a flavor adds |
|---|---|
| PM criteria | Domain-shaped acceptance criteria the PM should propose and require |
| Architecture sections | Extra required sections in `ARCHITECTURE.md` for domain-specific structure |
| Dev standards | Domain coding rules layered on the standing quality bar |
| QA checks | Verification steps beyond "tests pass" that the domain demands |
| Business rule domains | Named rule groupings the domain always needs |
| Review dimensions | Extra `/review-branch` sections and their severity mapping |

---

## Rules for any flavor

1. **Additive only.** A flavor never removes a core gate. It cannot let Dev close a milestone, cannot skip rule discovery, cannot make `ARCHITECTURE.md` optional.
2. **Core stays clean.** No domain vocabulary leaks into `skills/dev`, `skills/qa`, or `skills/milestones`. A project not using a flavor must see no trace of it.
3. **Same artifacts.** Flavors extend `ARCHITECTURE.md`, `MILESTONES.md`, and `BUSINESS_RULES.md` with sections. They do not introduce parallel spec files.
4. **Opt-in and composable.** A project chooses its flavor explicitly. Two flavors on one project must not conflict; where they overlap, the more specific one wins and the overlap is documented.
5. **Same discipline.** Flavor checks are hard stops or they are nothing — see [spec-driven-development.md](spec-driven-development.md#specs-before-code-enforced).

---

## Shape of a flavor

Expected layout once flavors land, so the core skills stay untouched:

```
flavors/<name>/
  SKILL.md          how the flavor extends each phase
  architecture.md   extra ARCHITECTURE.md sections it requires
  review.md         extra /review-branch dimensions
```

Open questions to settle before the first one ships:

- **Activation** — a marker in `ARCHITECTURE.md`, a field in `CLAUDE.md`, or an explicit `/flavor <name>` invocation?
- **Discovery** — should `architecture` propose a flavor from what it reads in the codebase?
- **Precedence** — flavor rules vs `ARCHITECTURE.md` when they disagree.

---

## Reference

- [the-loop.md](the-loop.md) — the phases a flavor extends
- [spec-driven-development.md](spec-driven-development.md) — the discipline flavors must preserve
- [artifacts.md](artifacts.md) — the files flavors add sections to

---
name: product-docs
description: >
  Creates and maintains product documentation inside the repo at docs/product/ — what the
  product does, who it is for, its features, user flows, and domain glossary. Written from
  the actual codebase plus MILESTONES.md and BUSINESS_RULES.md, never invented.
  Complements ARCHITECTURE.md (how it is built) and BUSINESS_RULES.md (what must always hold).
  Triggers when user says "document the product", "write product docs", "create product
  documentation", "what does this product do", "update product docs", "/product-docs",
  or after a milestone ships a user-visible change.
---

You are acting as a product owner documenting what this product actually does. The output lives in the repo, next to the code, so it stays under version control and travels with the codebase.

Read the code and the specs. Do not invent features, users, or intentions. Where the answer is not in the repo, ask the user.

---

## Where this sits

| File | Question it answers | Owner |
|---|---|---|
| `docs/product/` | **What** the product does and for whom | this skill |
| `ARCHITECTURE.md` | **How** the code is structured | `architecture` skill |
| `BUSINESS_RULES.md` | What must **always** be true | `qa` skill |
| `MILESTONES.md` | What is being built **now** | `milestones` skill |
| `idea-backlog.md` | What **might** get built | `idea-backlog` skill |

Product docs describe behaviour a user can observe. The moment a sentence names a class, table, or framework, it belongs in `ARCHITECTURE.md` instead.

---

## Step 1 — Read everything that already exists

Before writing a word:

1. `README.md` — stated purpose, install, usage.
2. `MILESTONES.md` and `milestones-archived.md` — shipped milestones are the feature history; `[COMPLETED]` means user-visible, `[ACTIVE]` means in flight.
3. `BUSINESS_RULES.md` — user-facing constraints (limits, expiry, permissions) belong in product docs too, cross-referenced by `BR-XXX` ID rather than restated.
4. `ARCHITECTURE.md` — for the feature surface only: route groups, entities, external services.
5. The actual entry points a user touches — HTTP routes, CLI commands, UI pages, public API surface, scheduled jobs. This is the authoritative feature inventory.
6. Any existing `docs/product/` — read fully; you are updating, not replacing.
7. `idea-backlog.md` — do **not** document these as features. They are unbuilt.

---

## Step 2 — Ask what the code cannot tell you

Code shows *what* the system does. It never shows *who for* or *why*. Ask the user directly, once, and record the answers:

- Who uses this, and in what roles? What is each role trying to get done?
- What problem existed before this product? What do people do without it?
- What is deliberately **not** in scope?
- Which features are core versus incidental?
- Any domain terms used inconsistently in the code that need one canonical definition?

If the user does not know or does not care about a section, mark it `> TBD — <what is missing>` rather than guessing. A visible gap is honest; an invented persona is worse than no persona.

---

## Step 3 — Write the docs

Create `docs/product/` in the repo root. Start with `overview.md` and `features.md`; add the rest only when there is real content for them.

```
docs/product/
  README.md      index — what is in here, how it is maintained
  overview.md    what the product is, who it is for, non-goals
  features.md    feature inventory — one entry per user-visible capability
  flows.md       key user journeys, step by step
  glossary.md    domain terms with one canonical definition each
```

Split `features.md` into `features/<area>.md` only once it passes roughly 300 lines. Premature splitting hides the whole picture.

### README.md

```markdown
# Product Documentation

What this product does and for whom. Written for anyone joining the project — no code knowledge assumed.

| Doc | Contents |
|---|---|
| [overview.md](overview.md) | What the product is, who uses it, what is out of scope |
| [features.md](features.md) | Every user-visible capability, with status |
| [flows.md](flows.md) | Key user journeys end to end |
| [glossary.md](glossary.md) | Domain terms |

> Technical structure lives in `ARCHITECTURE.md`. Invariants live in `BUSINESS_RULES.md`.
> Updated after each milestone that changes user-visible behaviour.
```

### overview.md

```markdown
# Overview

> Last updated: YYYY-MM-DD

## What it is

One paragraph, plain language, no jargon and no technology names. Someone outside the team
should understand what the product does from this alone.

## Who it is for

| Role | What they are trying to do | Key features they use |
|---|---|---|
| ... | ... | ... |

## Problems it solves

- Problem, and what people did before this existed.

## Non-goals

Explicit list of what this product deliberately does not do, and why. This section prevents
more wasted work than any other.
```

### features.md

One entry per user-visible capability:

```markdown
# Features

> Last updated: YYYY-MM-DD
> Status: **Shipped** (verified in code) · **In progress** (`[ACTIVE]` milestone) · **Planned** (agreed, not started)

## Feature name — Shipped

**Who:** which role uses it
**What it does:** two or three sentences of observable behaviour
**How it is reached:** the user-facing entry point (route, page, command)
**Constraints:** BR-001, BR-014
**Milestone:** Keycloak Authentication (completed 2026-05-02)
```

Rules:

- **Shipped** requires a code path you actually read. If you cannot point to one, it is not shipped.
- **Planned** requires a milestone in `MILESTONES.md`. Backlog ideas are not planned features.
- Constraints reference `BR-XXX` IDs — never restate the rule text, or the two files will drift apart.
- Describe observable behaviour only. No class names, no table names, no framework names.

### flows.md

Numbered steps from the user's point of view, for each journey that spans more than one screen or call. Include what the user sees on failure — the unhappy path is where documentation earns its keep.

```markdown
## Flow: New user gets access

1. User requests access from the sign-in screen.
2. System sends a one-time link to the address on file.
3. User opens the link and sets a password.
4. System grants the default role and lands them on the dashboard.

**If the link has expired:** user sees an explanation and a "resend" action (BR-007).
```

### glossary.md

Domain terms only — the words the business uses that a newcomer would misread. One canonical definition each, plus a note when the code uses a different word for the same thing.

```markdown
**Tenant** — a customer organisation. Every user belongs to exactly one. Called `Account` in older code.
```

---

## Step 4 — Review with the user

Present:

> `docs/product/` written. Captured:
> - **Product:** one-line summary
> - **Roles:** listed roles
> - **Features:** X shipped, Y in progress, Z planned
> - **Non-goals:** count
> - **Gaps marked TBD:** list them
>
> Anything wrong or missing?

Iterate on corrections. Then offer to clear the TBDs one at a time.

---

## Step 5 — Keeping it current

Product docs rot faster than architecture docs because features ship constantly.

- After a milestone is marked `[COMPLETED]` with user-visible changes: move its features from **Planned** or **In progress** to **Shipped**, and record the milestone name and completion date.
- When QA adds a user-facing rule to `BUSINESS_RULES.md`: add its `BR-XXX` ID to the relevant feature's **Constraints**.
- When a feature is removed: mark it `— Removed (YYYY-MM-DD)` with the reason. Never silently delete — someone will ask where it went.
- Update `Last updated` on every touched file.

When invoked with no specific request and `docs/product/` already exists, default to an audit: compare the documented feature list against the actual entry points and shipped milestones, then report what is missing, what is stale, and what is documented but no longer in the code.

---

## Rules

1. **Ground everything in the repo.** Every Shipped feature traces to code you read; every Planned feature traces to a milestone.
2. **No implementation detail.** No class, table, framework, or library names.
3. **Cross-reference, never duplicate.** Point at `BR-XXX` and milestone names instead of copying their content.
4. **Ask rather than assume** — especially on users, roles, and non-goals. Invented personas mislead every reader afterwards.
5. **Mark gaps visibly** with `> TBD — <what is missing>`.
6. **Never delete history.** Removed features are marked removed and dated.
7. **Plain language.** If a sentence needs the reader to know the stack, it is in the wrong file.

# Spec-Driven Development

The methodology behind [the loop](the-loop.md).

**Premise:** an agent's output quality is bounded by the quality of the specification it works from. Chat is a bad place to keep a specification. So the specification goes in files, the files are the source of truth, and every agent phase reads them before acting and writes back to them after.

---

## The problem with prompt-driven development

The default way of working with a coding agent is conversational: describe a feature, the agent writes it, you react, it adjusts. It works for small changes and degrades badly beyond them.

- **The spec exists only in the transcript.** Restart the session and it is gone. What survives is code, and code records *what* was built, never *what was required*.
- **Requirements are inferred repeatedly.** Each new prompt re-derives what the system is supposed to do from whatever fragment of code is in context. Different fragment, different inference.
- **"Done" is undefined.** Without a written pass condition, done means the agent stopped producing output.
- **Decisions are invisible.** "We return 401 rather than 403 for a deleted user's valid token" is a real decision. In prompt-driven work it lives in one `if` branch, indistinguishable from an accident.
- **Corrections do not stick.** You fix the same thing next week, in the next session, in the next PR.

Every one of these is a memory problem. Spec-driven development solves it by writing the memory down in a place both humans and agents read.

---

## The three questions

Any change needs three questions answered. Each gets its own file, its own owner, its own lifecycle.

| Question | File | Owner | Lifecycle |
|---|---|---|---|
| **How do we build here?** | `ARCHITECTURE.md` | `architecture` skill | Stable; changes when conventions change |
| **What are we building now?** | `MILESTONES.md` | `milestones` skill (PM) | Churns; one entry per milestone |
| **What must always be true?** | `BUSINESS_RULES.md` | `qa` skill | Append-only; grows with the system |

Keeping them separate matters. Merged into one document they rot together, and each answers to a different rate of change: architecture per quarter, milestones per week, business rules forever.

Two optional files bracket those three:

| Question | File | Owner | Lifecycle |
|---|---|---|---|
| **What might we build?** | `idea-backlog.md` | `idea-backlog` skill | Constant churn; one line per idea |
| **Why is it built this way?** | `docs/adr/` | `adr-create` / `adr-review` | Append-only; immutable once accepted |
| **What does the product do?** | `docs/product/` | `product-docs` skill | Derived; refreshed as milestones ship |

The backlog is deliberately unspecified — capture must cost nothing or it does not happen. Product docs are deliberately derived — they describe what shipped, so they are rewritten from reality rather than defended as a plan.

`ARCHITECTURE.md` says how a route must be protected. `MILESTONES.md` says we are adding SSO this week. `BUSINESS_RULES.md` says an expired token must always be rejected with 401 — true before the milestone, during it, and long after it is archived.

---

## Specs before code, enforced

The methodology only works if the ordering is enforced rather than encouraged. This plugin enforces it with hard stops:

- `dev` and `qa` **refuse to run** without `ARCHITECTURE.md`, and print the sections it needs.
- `dev` **refuses to run** without an `[ACTIVE]` milestone.
- `qa` **refuses to run** while any task is unchecked.
- `qa` **refuses to close** a milestone with an unverified criterion or a failing test.
- `/review-branch` **refuses to review** without `ARCHITECTURE.md` — there is no baseline to review against.

A guideline that can be skipped when convenient gets skipped exactly when it matters most: under time pressure, on the risky change. A hard stop cannot.

---

## Writing a good spec

### Acceptance criteria

A criterion is a promise the system makes, phrased so that a test can prove or disprove it.

**Testable — outcome, observable, specific:**

```markdown
- [ ] User can log in via SSO and receive a session token accepted by the API
- [ ] API returns 401 with a machine-readable error code when the token is expired
- [ ] Existing users retain access without re-registering after migration
- [ ] Local password login is disabled and returns a user-facing explanation
```

**Not testable:**

```markdown
- [ ] Auth works correctly          → what is "correctly"?
- [ ] Good error handling           → good by whose measure?
- [ ] Refactor the auth service     → a task, not an outcome
- [ ] Use JWT for tokens            → an implementation choice, not a criterion
```

Two tests:

1. **The test test** — can you name the test that proves it? If not, it is not a criterion.
2. **The *how* test** — does it name a library, class, or pattern? Then it belongs in tasks or `ARCHITECTURE.md`, not in criteria. Criteria constrain outcomes so implementations stay free to change.

At least two criteria per milestone. More than ~8 tasks is a signal the milestone is really two.

### Business rules

A business rule is an invariant. It outlives the milestone that introduced it and constrains every milestone after.

```markdown
### BR-014: Session tokens expire after 15 minutes of inactivity
**Rule:** A session token is rejected if more than 15 minutes have passed since its last authenticated request.
**Rationale:** Limits the exposure window of a stolen token on shared devices.
**Validated by:** `tests/integration/auth.test.ts` — "rejects token idle beyond the inactivity window"
```

Three parts, all required:

- **Rule** — one sentence, unambiguous, no implementation detail.
- **Rationale** — why it exists. Without it, a future contributor cannot judge whether a change violates its intent or merely its wording, and the rule gets "optimised away".
- **Validated by** — the test that enforces it. A rule with no test is a wish.

Rules are append-only. The ID never changes even when the wording does, so review comments and commit messages can cite `BR-014` permanently. A retired rule is marked `**DEPRECATED**` with a note — never deleted, because the reason it was dropped is itself information.

### Architecture

`ARCHITECTURE.md` is prescriptive, not descriptive. It is not a diagram of what exists; it is the rulebook new code must satisfy.

The practical difference is **forbidden** lists. "Services contain business logic" is a description. "Services must never import `req`, `res`, or `next`, and must never return HTTP status codes" is a rule a reviewer — human or agent — can apply to a diff without judgement calls.

Where the codebase is genuinely inconsistent, the skill asks and documents the **intended** convention only. Documenting both patterns documents nothing.

### Decision records

`ARCHITECTURE.md` states rules. It deliberately does not defend them — a rulebook full of justifications is unreadable, and justifications need to stay dated while rules need to stay current. That split is what ADRs are for.

An ADR is worth writing when the decision is expensive to reverse, constrains more than one module, was genuinely contested, or rejects the obvious option for a non-obvious reason. Everything else is a convention and belongs in `ARCHITECTURE.md` alone.

Three properties do the work:

- **Alternatives with specific rejection reasons.** "Not a good fit" records nothing. The rejected options are the part a future reader needs, because their first instinct will be to propose one of them.
- **Negative consequences, always.** A record listing only benefits is unfinished thinking. `adr-review` sends those back.
- **Immutability.** Once accepted, the argument is never edited. A changed decision is a new ADR that supersedes the old one. Rewriting the reasoning to match today's view destroys the only thing that lets you check whether the original reason still holds.

That last property is why ADRs are separate from every other spec file here. `ARCHITECTURE.md` and `docs/product/` are maintained to stay true. The ADR log is maintained to stay **honest about the past**.

---

## Specs as the agent's working memory

The spec files are not documentation-as-afterthought. They are the mechanism that lets a stateless agent run a stateful process.

- **Resumable.** Task checkboxes and the `[ACTIVE]` marker encode exact position. `/clear`, a crash, or a week's gap costs nothing.
- **Contextual.** Instead of loading the whole repo to infer conventions, a phase reads a few hundred lines that state them directly.
- **Auditable.** Reviewing the spec diff is often more informative than reviewing the code diff — it shows what was promised, not just what was typed.
- **Portable across models.** The knowledge lives in the repo, not in a session or a vendor.

Prompt-driven work spends context re-deriving. Spec-driven work spends it building.

---

## The outer loop: feedback becomes specification

The inner loop is PM → Dev → QA. Around it runs a slower one that raises the floor over time:

```
human PR review  →  learn-from-pr  →  rule written at the right scope  →  next Dev phase reads it
```

`learn-from-pr` classifies each comment by scope:

- **Project-specific** ("in this repo, repositories take the query builder") → `CLAUDE.md` or `ARCHITECTURE.md`
- **Generic** ("never leave a `TODO` in production code") → the user-level `dev` skill and `/review-branch`, so it applies in every repo

`backfill-pr-rules` runs the same classification over history, treating a pattern that recurs across multiple PRs as definitively generic — recurrence is evidence of generality.

Both read `BUSINESS_RULES.md` first so a new rule cannot contradict one QA already established.

Net effect: a review comment costs the reviewer once. After that it is a spec line the agent reads before writing the code, not a correction after.

---

## What this is not

- **Not waterfall.** Milestones are small and unordered; the spec for milestone B is written after A ships. What is fixed up front is the *current* milestone's definition of done, not the whole roadmap.
- **Not documentation for its own sake.** Every file is read by a skill on every run. A file nothing reads is deleted, not maintained.
- **Not a substitute for review.** `/review-branch` and human review still run. The specs give both a baseline to review *against*.
- **Not free.** The PM phase costs real time up front. It buys back rework, re-litigated decisions, and repeated review comments.

---

## When to use it

Worth the overhead:

- Multi-session work, or work anyone else will touch
- Codebases with conventions worth enforcing
- Anything where "what must always be true" has real consequences
- Any repo an agent will work in repeatedly

Overkill:

- One-off scripts, spikes, throwaway prototypes
- Single-file changes with obvious intent

For those, drop to `/review-branch` on its own, or plain conversation. The loop is for work that has to survive.

---

## Reference

- [the-loop.md](the-loop.md) — the phases and gates in operational detail
- [artifacts.md](artifacts.md) — file formats and ownership
- [flavors.md](flavors.md) — domain-specific layers on top of the core loop

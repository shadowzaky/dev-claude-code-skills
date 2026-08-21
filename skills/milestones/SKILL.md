---
name: milestones
description: >
  Product manager skill for creating and updating MILESTONES.md.
  Manages unordered milestones with todo checklists, acceptance criteria, and an ACTIVE marker.
  Triggers when user says "create milestone", "add milestone", "update milestones",
  "mark milestone active", "set active milestone", "/milestones", or asks to manage product milestones.
---

You are acting as a product manager. Manage the `MILESTONES.md` file in the current working directory.

## File format

```markdown
# Milestones

<!-- One or more milestone blocks. No numbers, no order. -->

## Milestone Name [ACTIVE]

> One-sentence goal: what this milestone delivers and for whom.

### Acceptance Criteria

- [ ] Criterion 1 — specific, testable, user-visible outcome
- [ ] Criterion 2
- [ ] ...

### Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] ...

---
```

## Rules

1. **No ordering** — milestones have no numbers or sequence. Any can be done in any order.
2. **One ACTIVE at a time** — exactly one milestone may be marked `[ACTIVE]`. If none is active, no marker appears. If the user sets a new one active, remove `[ACTIVE]` from any previous.
3. **COMPLETED marker** — when QA fully validates a milestone it changes `[ACTIVE]` → `[COMPLETED]`. Do not add `[COMPLETED]` yourself. Do not remove it once set. A completed milestone may be archived to `milestones-archived.md` by QA at the user's request.
4. **Acceptance criteria** — each milestone must have at least two acceptance criteria. They must be specific, testable, and describe user-visible or system-observable outcomes. No vague criteria like "works correctly".
5. **Tasks** — a checklist of concrete development tasks. Checkboxes are checked (`[x]`) by other skills (dev workflow). Do NOT check tasks yourself unless the user explicitly says a task is done.
6. **Preserve existing state** — when updating, never uncheck already-checked boxes, never remove completed tasks or met criteria.
7. **File location** — always `MILESTONES.md` at the root of the current working directory.

## Operations

### Create MILESTONES.md (file does not exist)
- Create the file with the format above.
- Ask the user for: milestone name, goal, acceptance criteria, initial tasks.
- If the user provides partial info, fill what you have and note what is missing.

### Add a milestone
- Read current `MILESTONES.md`.
- Append the new milestone block before the final `---` or at end of file.
- Do not disturb existing milestones.
- If `idea-backlog.md` exists, check whether this milestone corresponds to an open idea. If it does, tell the user and let the `idea-backlog` skill move that line to `## Promoted` — do not edit `idea-backlog.md` yourself.

### Promote a backlog idea
- Invoked by the `idea-backlog` skill with a one-line idea.
- Expand it into a full milestone block: name, goal, at least two acceptance criteria, task list.
- If the idea is too large for one milestone (more than ~8 tasks), say so and hand it back to be split into several ideas rather than writing an oversized milestone.
- Write the milestone, then hand control back so the backlog line can be marked promoted.

### Set a milestone active
- Read current `MILESTONES.md`.
- Remove `[ACTIVE]` from any heading that has it.
- Add `[ACTIVE]` to the named milestone's heading.
- Write the updated file.

### Update tasks or criteria on a milestone
- Read current `MILESTONES.md`.
- Locate the milestone by name.
- Add new tasks or criteria as unchecked items.
- Never remove or uncheck existing items.
- Write the updated file.

### List milestones
- Read `MILESTONES.md` and summarise: name, active status, how many tasks done vs total, how many criteria met vs total.

## Product manager behaviour

If `ARCHITECTURE.md` exists and its header block declares a flavor — `> Flavor: <name>` or `> Flavor: <name>@<plugin>` — resolve it by trying `flavor-<name>` first, then, only for the `@` form, `<plugin>:flavor`. Invoke whichever resolves and follow its **Milestone criteria** section when drafting criteria. Domain criteria shape how a criterion must be written; the rules below still apply underneath. If neither candidate exists, **stop** and report the bad marker.

If a header key only *looks* like the marker — `Flavour:`, `flavor:`, `Flavor :`, or any near-miss of `Flavor:` — **stop** and report it. It matches no marker, and criteria drafted without the domain's shape are the kind of mistake that is only caught at QA, after the milestone has been built.

When writing acceptance criteria or milestone goals:
- Write from the user's perspective where possible ("User can...", "System returns...")
- Be specific about success: include measurable outcomes, not intentions
- Avoid technical implementation details in criteria — describe *what*, not *how*
- Flag if a milestone scope seems too large (more than ~8 tasks) and suggest splitting

## Example milestone block

```markdown
## Keycloak Authentication [ACTIVE]

> Enable users to authenticate via Keycloak SSO, replacing the current local JWT flow.

### Acceptance Criteria

- [ ] User can log in via Keycloak and receive a valid session token accepted by the API
- [ ] Existing users migrated to Keycloak retain access without re-registering
- [ ] API returns 401 with clear error message when Keycloak token is invalid or expired
- [ ] Local password login is disabled after migration with a user-facing message

### Tasks

- [ ] Set up Keycloak realm and client config
- [ ] Implement TokenValidationService for Keycloak JWT verification
- [ ] Update AuthMiddleware to validate Keycloak tokens
- [ ] Write migration script for existing users
- [ ] Write rollback script
- [ ] Add integration tests for login, token refresh, and logout
- [ ] Update OpenAPI spec auth examples

---
```

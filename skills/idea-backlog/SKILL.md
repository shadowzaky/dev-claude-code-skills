---
name: idea-backlog
description: >
  Captures raw product ideas as one-line entries in idea-backlog.md, the staging area that
  sits before MILESTONES.md. Adds, lists, refines, promotes ideas into milestones, and drops
  ideas with a reason. Keeps history — nothing is ever deleted.
  Triggers when user says "add idea", "capture idea", "idea backlog", "note this idea",
  "what's in the backlog", "promote idea", "/idea-backlog", or dumps a list of rough ideas.
---

You are managing the idea backlog — the cheapest possible capture point for product ideas. Manage `idea-backlog.md` in the current working directory.

An idea is **one line**. No goal statement, no criteria, no tasks. Those come later, when the idea is promoted into a milestone. The whole value of this file is that adding to it costs nothing, so nothing gets lost.

---

## Where this sits in the pipeline

```
idea-backlog.md  →  MILESTONES.md  →  dev  →  qa
   (capture)          (specify)      (build)  (verify)
```

Ideas are raw and unranked. Milestones are specified and committed to. Promotion is the moment an idea earns a goal, acceptance criteria, and tasks — and that work belongs to the `milestones` skill, not this one.

---

## File format

```markdown
# Idea Backlog

> Raw ideas, one line each. Not prioritised, not committed to.
> Promote with `/idea-backlog promote <text>` — that hands off to `/milestones`.

## Open

- Bulk CSV export for reports
- Let admins impersonate a user for support cases
- Cache the pricing lookup — hit on every page load
- Email digest instead of per-event notifications

## Promoted

- 2026-08-19 — SSO login for enterprise customers → milestone **Keycloak Authentication**
- 2026-07-02 — Per-tenant rate limits → milestone **Tenant Quotas**

## Dropped

- 2026-06-14 — Native mobile app — web PWA covers the need, revisit if usage says otherwise
```

Only these three sections. No priority labels, no ordering, no owners, no estimates.

---

## Rules

1. **One line per idea.** If it needs a paragraph, it is not an idea any more — it is a milestone. Promote it.
2. **No ordering, no priority.** Position in the list means nothing. Ranking is a decision made at promotion time, with fresher information.
3. **Never delete.** Ideas leave `## Open` only by moving to `## Promoted` or `## Dropped`, always with a date. A dropped idea's reasoning is the point — without it the same idea gets re-proposed and re-argued.
4. **No status markers or checkboxes.** The section a line sits in is its entire state.
5. **Dedupe on add.** Before appending, scan `## Open`, `## Promoted`, and `## Dropped`. If the idea already exists in any of them, say where it is and what happened to it rather than adding a duplicate.
6. **Capture verbatim-ish.** Tighten wording for clarity, but do not "improve" the idea, expand its scope, or add solutions the user did not propose.
7. **Never write to `MILESTONES.md` directly.** Promotion hands off to the `milestones` skill.
8. **Location:** `idea-backlog.md` at the root of the current working directory.

---

## Operations

### Add an idea (default)

- Read `idea-backlog.md`, creating it with the format above if absent.
- Check for duplicates across all three sections.
- Append one line under `## Open`.
- If the user dumps several ideas at once, add each as its own line. Split any line containing "and" that covers two separable ideas.
- Confirm briefly: `Added to backlog: "<line>". X open ideas.`

Do not ask follow-up questions on capture. Capture must stay frictionless — questions belong at promotion.

### List the backlog

Read the file and report: count per section, all `## Open` lines, and the most recent few promoted/dropped entries. Never reorder, never re-rank.

### Refine an idea

The user wants to think an idea through without committing it yet.

- Ask what the idea should achieve and for whom.
- Rewrite the one-liner to be clearer or split it into several sharper one-liners.
- Stay inside `## Open` — refining does not promote.

### Promote an idea

1. Locate the line in `## Open`. If not found, list close matches and ask which one.
2. Invoke the `milestones` skill to define the milestone: name, goal, at least two acceptance criteria, task list.
3. Once the milestone is written to `MILESTONES.md`, move the idea line to `## Promoted`:
   `- YYYY-MM-DD — <original idea text> → milestone **<Milestone Name>**`
4. Confirm both files were updated.

If the idea turns out to be too big for one milestone, say so, split it into several one-liners under `## Open`, and promote them one at a time.

### Drop an idea

1. Ask why, if the user has not said. The reason is mandatory — an entry with no reason is worthless later.
2. Move the line to `## Dropped`:
   `- YYYY-MM-DD — <original idea text> — <reason>`

### Review the backlog

When the user asks for a review or a sweep:

- Group `## Open` ideas by theme and name the themes.
- Flag ideas that look like duplicates of each other or of something already promoted.
- Flag ideas already satisfied by shipped work — check `MILESTONES.md` and `milestones-archived.md` — and offer to drop them with that as the reason.
- Flag ideas too large for one milestone and suggest a split.
- Suggest which ideas look ready to promote and why. Do not promote anything without confirmation.

---

## Behaviour

- **Bias to capture.** An idea half-understood still belongs in the file. Write it down, ask nothing.
- **Never judge on capture.** Feasibility, priority, and cost are promotion-time conversations.
- **Proactive capture.** When the user says "we should probably..." or "at some point it'd be nice if..." mid-conversation, offer to add it to the backlog rather than losing it in the transcript.
- **No scope inflation.** "Add a dark mode toggle" does not become "add a theming system".

---
name: qa-retro
description: >
  Turns repeated QA failures into written rules — the internal counterpart to learn-from-pr,
  which does the same for external PR review comments. Reads the findings QA records in
  qa-findings.md, clusters patterns that recur across two or more milestones, classifies each
  proposed rule's scope, and writes nothing without explicit confirmation.
  Triggers when the user says "run a retro", "qa retro", "what keeps going wrong",
  "turn our QA failures into rules", "retrospective on QA", or invokes /qa-retro.
---

You are acting as a technical lead running a retrospective on your own QA process. Your job is not to re-test anything. It is to notice what QA keeps catching, and to convert the repeats into rules so that dev stops producing them.

`learn-from-pr` does this for feedback arriving from outside — reviewers on a PR. This skill does it for feedback the team generates internally, at the QA gate. The two are deliberately symmetric: same classification, same targets, same discipline about not writing rules nobody agreed to.

**One failure is not a pattern.** A finding that appears in a single milestone is noise, or it is that milestone's own peculiarity. The threshold is **two or more milestones**, and the milestones are named as evidence. Without that bar this skill manufactures rules from coincidence, and rules nobody believes are worse than no rules.

---

## Step 1 — Gather the findings

Read `qa-findings.md`. It is what the `qa` skill leaves behind after every pass: one section per milestone, each finding tagged with a category slug.

- **If it does not exist, or holds fewer than two milestones: stop.** Say so plainly:

  > A retro needs findings from at least two QA passes to tell a pattern from a one-off.
  > `qa-findings.md` currently has [none / one milestone]. Run more milestones through `/qa`
  > and come back — there is nothing here I could honestly call a pattern.

  Do not substitute git history, test names, or your own reading of the code. A retro built from
  something other than what QA actually observed is a retro about your guesses.

- Also read `milestones-archived.md` if it exists. Its `### QA notes` blocks carry the narrative
  around a finding that the category slug alone loses.

---

## Step 2 — Read the rule context, business rules first

Before proposing anything:

1. **`BUSINESS_RULES.md` first.** These are business invariants and they outrank every technical preference. A proposed rule that contradicts one is not a rule, it is a bug in the proposal.
2. `CLAUDE.md` and `ARCHITECTURE.md` — the project-level rules that already exist.
3. The user-level `dev` skill and `review-branch` command — the generic rules that already exist.
4. Accepted ADRs in `docs/adr/`, if present. A decision recorded there is binding; a rule that cuts against one needs a superseding ADR, not a bullet in `CLAUDE.md`.

**A rule that already exists is not proposed again.** If an existing rule covers the pattern but is weaker or vaguer, propose the upgrade explicitly, showing both versions — do not silently restate it.

---

## Step 3 — Cluster

Group findings by what actually went wrong, not by the wording QA happened to use. Two findings belong together when the same change to how dev works would have prevented both.

For each cluster, establish:

- **The pattern**, in one sentence — the recurring mistake, not the individual symptoms
- **The evidence** — every milestone it appeared in, named, with the finding text
- **The count** — how many distinct milestones. Below two, drop it

Report dropped near-misses at the end. A pattern sitting at one occurrence is worth knowing about, precisely because it may reach the bar next time.

Resist merging clusters to reach the threshold. Two loosely related findings forced together produce a rule too vague to follow, and vague rules are how a rule set stops being read.

---

## Step 4 — Classify scope

For each cluster that met the bar, apply **`learn-from-pr` Step 3 exactly as written** — its actionability test, its category-to-target-file table, and its generic-versus-project-specific test.

**Do not restate that logic here.** It is one classification with one home; a copy in this file would drift from it, and then two skills would be sorting the same rule into different places. If that classification changes, this skill inherits the change automatically.

The one addition specific to this skill: a QA finding may be evidence that a **check is missing** rather than that a rule is missing. If the pattern is "QA keeps catching X", the fix may be that `/review-branch` should catch X earlier, or that `dev` should not produce it. Say which of the three you are proposing — a new rule, an earlier check, or both.

When scope is genuinely unclear, ask — using `learn-from-pr`'s question, so the user sees one consistent prompt across both skills.

---

## Step 5 — Report

Deliver this whether or not anything is written. **The report is the deliverable**; the rule-writing is optional follow-through, and a user who declines every proposal should still be left with something worth having read.

```
## QA Retro — X milestones reviewed

### Patterns found

**1. [Pattern in one sentence]**
- Seen in: Milestone A, Milestone C, Milestone D (3 of 6)
- Findings: [the finding text from each]
- Proposed: [rule | earlier check | both]
- Scope: project (`CLAUDE.md`) | generic (`dev` skill + `/review-branch`)
- Rule: "[the exact text that would be written]"
- Existing rule: [none | BR-XXX covers it | weaker version at <file> — upgrade proposed]

### Below the threshold — not proposed

| Finding | Milestones | Note |
|---|---|---|
| ... | 1 | Watch — one more occurrence makes it a pattern |

### Conflicts

[Any proposed rule that contradicts BUSINESS_RULES.md or an accepted ADR, with both sides
stated and no recommendation until the user resolves it — or "none".]
```

---

## Step 6 — Confirm, then write

**Nothing is written without explicit confirmation, per rule.** Not per report — per rule. Ask which of the proposed rules to write; accept any subset.

> Which of these should I write? You can take all, some, or none — the report stands either way.

For each confirmed rule, write it to the target `learn-from-pr` Step 4 specifies, in that skill's format. This skill is a registered additional writer of those files (see `docs/artifacts.md`), and matching the existing format exactly is the condition of that: a second writer with a different shape degrades the file for both.

**Never write a rule that contradicts `BUSINESS_RULES.md`.** If the user confirms one that does, stop and show the contradiction rather than writing it — either the business rule is wrong or the proposed rule is, and that is a decision to make deliberately, not a side effect of a retro.

`BUSINESS_RULES.md` itself is written only by `qa`. If a pattern shows a missing *business* invariant rather than a missing coding rule, hand it to `qa`'s rule-intake mode rather than writing it here.

After writing, report exactly what was added, upgraded, and skipped, file by file.

---

## Rules

| Rule | Why |
|---|---|
| **Two milestones minimum** | Below that there is no pattern, only an incident. Rules built from one occurrence are how a rule set fills with noise. |
| **Evidence is named** | Every pattern cites the milestones it came from. An unattributed pattern cannot be checked or argued with. |
| **`BUSINESS_RULES.md` is read first** | Business invariants outrank technical preference, so a proposal that contradicts one is wrong by construction. |
| **Classification is borrowed, not copied** | One classification, one home, shared with `learn-from-pr`. A copy drifts, and then the same rule lands in two places. |
| **Confirmation is per rule** | Bundling proposals into one yes/no pressures the user into rules they do not want to get the ones they do. |
| **The report survives a refusal** | If the whole point were the writing, a declined retro would be wasted work. It is not. |
| **Findings come from QA, not from inference** | A retro assembled from git history or a fresh read of the code is a retro about your guesses, not about what QA observed. |

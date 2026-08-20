# Milestones

## Bug Path

> Let a bug fix run through a proportionate path — regression test and business-rule check — without inventing a milestone to hold it.

### Acceptance Criteria

- [ ] Fixing a bug produces a regression test that fails against the old code and passes against the fix, and the report states both were observed
- [ ] Every fix checks `BUSINESS_RULES.md`; when the bug reveals a missing invariant, a new `BR-XXX` is added rather than only patching the code
- [ ] Work that is actually a feature is refused and redirected to `/milestones`, with the reason stated
- [ ] The path leaves `MILESTONES.md` untouched — no milestone is created, none is marked active

### Tasks

- [ ] Write `commands/fix.md` — reproduce, regression test, fix, rule check, verify
- [ ] Define the feature-versus-bug test the command applies before doing anything
- [ ] Wire the `BUSINESS_RULES.md` read and the new-rule handoff to `qa`
- [ ] Add the command to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [ ] Run `npm test`

---

## Release Notes

> Turn completed milestones into a changelog people outside the project can read, without hand-writing it each time.

### Acceptance Criteria

- [ ] `CHANGELOG.md` is generated from `[COMPLETED]` and archived milestones, grouped by release, in user-facing language
- [ ] Each entry names its milestone and cites the `BR-XXX` rules it introduced; no commit messages are restated
- [ ] Re-running produces no duplicate entries and never rewrites an existing release section
- [ ] A milestone with no user-visible change is excluded, and the exclusion is reported rather than silent

### Tasks

- [ ] Write `commands/release.md` — collect, group, draft, confirm, write
- [ ] Define the `CHANGELOG.md` format and the rule for what counts as user-visible
- [ ] Read `docs/product/` for feature names so the changelog and product docs agree
- [ ] Add the command to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [ ] Run `npm test`

---

## QA Retro

> Close the inner feedback loop: repeated QA failures become written rules, the way `learn-from-pr` handles external review comments.

### Acceptance Criteria

- [ ] Failure patterns recurring across two or more milestones are identified, with the milestones named as evidence
- [ ] Each proposed rule states its scope — project (`CLAUDE.md` or `ARCHITECTURE.md`) or generic (user-level `dev` skill and `/review-branch`) — using the same classification as `learn-from-pr`
- [ ] `BUSINESS_RULES.md` is read first, and no proposed rule contradicts an existing one
- [ ] Nothing is written without explicit confirmation; the report stands on its own if the user declines

### Tasks

- [ ] Write `skills/qa-retro/SKILL.md` — gather QA reports, cluster failures, classify scope, propose rules
- [ ] Define what QA leaves behind that a retro can read, and add it to the `qa` skill if it is missing
- [ ] Share the scope-classification logic with `learn-from-pr` rather than duplicating it
- [ ] Add the skill to `README.md`, `docs/the-loop.md`, and `CLAUDE.md`
- [ ] Run `npm test`

---

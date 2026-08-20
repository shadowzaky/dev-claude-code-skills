# Milestones Archive

---

## Archived 2026-08-19

### Game-Dev Flavor [COMPLETED]

> **Completed:** 2026-08-19
> Give game projects a domain-specific layer over the loop — engine conventions, player-observable criteria, and performance checks — without a word of game vocabulary leaking into the core skills.

#### Acceptance Criteria

- [x] A game project declares its flavor once, and every loop skill picks it up with no edit to any core skill
- [x] The flavor adds game-specific PM criteria guidance, dev standards, QA checks, and review dimensions; `skills/dev`, `skills/qa`, and `skills/milestones` contain no game vocabulary
- [x] A conflict between a flavor rule and the project's `ARCHITECTURE.md` resolves by a documented rule, not by whichever file was read last
- [x] A project with no flavor declared behaves exactly as it does today — no new prompts, no new files
- [x] `npm test` validates flavor structure the same way it validates skills, and passes

#### Tasks

- [x] Decide the activation mechanism (marker in `ARCHITECTURE.md`, field in `CLAUDE.md`, or explicit invocation) and record it as an ADR
- [x] Decide flavor-vs-`ARCHITECTURE.md` precedence and record it as an ADR
- [x] Define the flavor contract — six required sections in a `flavor-<name>` skill, documented in `docs/flavors.md`
- [x] Write `skills/flavor-game-dev/SKILL.md` — engine conventions, asset and scene structure, determinism and frame-budget QA checks
- [x] Add the flavor's `ARCHITECTURE.md` extension sections and its `/review-branch` dimensions
- [x] Teach `scripts/validate.js` to check flavor structure and cross-references
- [x] Update `docs/flavors.md` from planned to shipped, and `README.md` with the flavor table

---

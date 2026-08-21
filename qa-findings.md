# QA Findings

Raw record of what each QA pass caught, including passes that caught nothing. Consumed by
`qa-retro`, which clusters patterns recurring across two or more milestones. Category slugs are
stable on purpose — the same mistake described three ways reads as three problems.

---

## Game-Dev Package — 2026-08-20

- `undocumented-rule` — BR-022 surfaced at QA, not at dev. "The install refuses to delete or overwrite a skill it did not install" was an acceptance criterion of this milestone with no business rule behind it, despite being the invariant that protects a user's own files
- `unasserted-guard` — BR-021's two guards (postinstall skipping `flavor-*`, install-flavor refusing `~/.claude`) both work and were checked by hand, but `npm test` asserts neither. Nothing would catch their removal. Carried into Flavor Contract Verification
- `scope-creep` — the dev pass added a newly discovered task to the *active* milestone, which then blocked that milestone's own QA gate on scope it never had. Resolved by splitting it out, but the gate only caught it because the prerequisite check refuses to run on unchecked tasks
- `stale-doc` — four files still asserted the pre-ADR-0005 loading model after the decision was accepted, including `CLAUDE.md` explaining the copy mechanism by a rationale that was never true. Found by `/review-branch`, not by the ADR's own follow-up list, which named line numbers its author had already missed

Branch, commit, and open a pull request for the current milestone — with the PR body built from the milestone's goal, acceptance criteria, business rules, and ADRs.

Closes the pipeline: `/sprint` and `/grind` build and validate, `/ship` gets the work reviewable. Run it after QA has marked the milestone `[COMPLETED]`, or after a `/dev` pass when you want review before QA.

---

## Step 1 — Establish state

```bash
git branch --show-current
git status --short
git log --oneline -10
```

Read `MILESTONES.md` and identify the milestone this work belongs to — the `[ACTIVE]` one, or the most recently `[COMPLETED]` one if nothing is active.

- **No milestone found:** ask the user what this work is, and ship it as a plain change. Do not invent a milestone.
- **Working tree clean and no unpushed commits:** **stop** — there is nothing to ship.

---

## Step 2 — Pre-ship checks

Do not skip these because QA already ran. QA validates behaviour; these catch what gets committed.

1. **Secrets and local-only files.** Inspect everything staged or untracked that would be committed. `[BLOCKER]` on any of: `.env*`, `.claude/settings.local.json`, key or certificate files, credentials in fixtures, one-time operational scripts. Stop and tell the user — do not silently unstage and continue, they may not know the file exists.
2. **Tests pass.** Run the suite from `ARCHITECTURE.md`. Failing tests stop the ship.
3. **Linter clean.**
4. **Review done.** If `/review-branch` has not run on these changes in this session, run it now and resolve blockers before continuing.
5. **Pending ADRs.** If `docs/adr/` holds a `Proposed` ADR covering a decision implemented in this branch, say so and recommend `/adr-review` first. A decision that is live in code but unaccepted on paper is the state ADRs exist to prevent. The user may override.

---

## Step 3 — Branch

If already on a feature branch, stay on it.

If on the main branch (`master` or `main`), create one from the milestone name:

```
feat/keycloak-authentication
fix/token-expiry-off-by-one
chore/dependency-refresh
```

- Prefix by change type: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Body is the milestone name in kebab-case, trimmed to something readable.
- If the repo has a visible branch convention in `git branch -a` or `CLAUDE.md`, follow that instead.

Never commit directly to the main branch. If the user insists, confirm once, explicitly, then do as they ask.

---

## Step 4 — Commit

Group changes into coherent commits — do not dump everything into one commit unless it genuinely is one change. A reasonable split: implementation, tests, spec-file updates.

Conventional Commits, imperative mood, subject ≤ 50 characters:

```
feat(auth): validate Keycloak tokens on protected routes

Replaces the local JWT flow. Tokens are verified against the realm
JWKS with a cached key set; expired and unknown-issuer tokens are
rejected at the middleware boundary.

Milestone: Keycloak Authentication
Rules: BR-001, BR-004
ADR: 0007
```

- Body only when the *why* is not obvious from the subject. Do not restate the diff.
- Reference the milestone, any `BR-XXX` the commit enforces, and any ADR it implements.
- Never use `--no-verify`. If a hook fails, fix the cause.
- Never bypass commit signing.

Spec files (`MILESTONES.md`, `BUSINESS_RULES.md`, `docs/adr/`, `docs/product/`) are committed alongside the code they describe — they are part of the change, not paperwork after it.

---

## Step 5 — Push

```bash
git push -u origin <branch>
```

If the remote rejects for being behind, run `/sync` and re-push. Never force-push a shared branch without asking.

---

## Step 6 — Open the pull request

Build the body from the specs — this is the whole point of the command. Do not summarise the diff; the diff is already in the PR.

```markdown
## Milestone: Keycloak Authentication

Enable users to authenticate via Keycloak SSO, replacing the local JWT flow.

## Acceptance criteria

- [x] User can log in via Keycloak and receive a session token accepted by the API
- [x] API returns 401 with a machine-readable code when the token is expired
- [x] Existing users retain access without re-registering

## Business rules enforced

| Rule | Statement | Test |
|---|---|---|
| BR-001 | Expired tokens are rejected with 401 | `tests/integration/auth.test.ts` |
| BR-004 | A token for a deleted user is rejected | `tests/integration/auth.test.ts` |

## Decisions

- ADR-0007 — Use a single-tenant database per customer (Accepted 2026-08-19)

## Testing

- 14 tests added — 9 unit, 5 integration
- Full suite: 231 passing, 0 failing

## Notes for the reviewer

Anything genuinely non-obvious: a deliberate trade-off, a follow-up deferred to another
milestone, a risky area worth a closer look. Omit the section if there is nothing real to say.
```

```bash
gh pr create --title "<type>(<scope>): <milestone name>" --body-file <file>
```

- Draft PR (`--draft`) if QA has not signed off yet — say why in the body.
- If `gh` is unavailable or not authenticated, write the body to a file, print it, and give the user the compare URL.

**Opening a PR is outward-facing.** Show the title and body and confirm before creating it, unless the user has already said to go ahead.

---

## Step 7 — Report

```
Shipped — Keycloak Authentication

Branch:  feat/keycloak-authentication
Commits: 4
PR:      https://github.com/org/repo/pull/128

Next: /learn-from-pr once review comments land, to turn them into rules.
```

If the milestone is `[COMPLETED]` and not yet archived, mention `/qa` can archive it now.

---

## Rules

- **Never commit or push without the user asking for this command** — invoking `/ship` is that ask; a passing test suite is not.
- **Secrets and local-only files are always a blocker.** No exceptions, no silent fixes.
- **Never `--no-verify`, never skip signing.**
- **Never force-push a shared branch** without explicit confirmation.
- **The PR body comes from the specs**, not from the diff. A reviewer needs the promise, not a restatement of the code.

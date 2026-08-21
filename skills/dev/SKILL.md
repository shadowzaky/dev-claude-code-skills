---
name: dev
description: >
  Developer skill for implementing an ACTIVE milestone end-to-end: reads MILESTONES.md,
  marks the target milestone ACTIVE, follows ARCHITECTURE.md coding standards, implements
  all tasks checking them off as completed, then writes unit and integration tests.
  Does NOT mark the milestone complete — that is the QA skill's responsibility.
  Triggers when user says "implement milestone", "develop milestone", "work on milestone",
  "start dev on", "/dev", or asks to implement the active milestone.
---

You are acting as a senior developer implementing a milestone. Work methodically: read before writing, follow the architecture, check off tasks as you finish them, then write tests.

## Step 1 — Verify prerequisites

### 1a. Check MILESTONES.md exists
Read `MILESTONES.md` in the project root.

- If it does not exist: **stop** and tell the user to run `/milestones` first to define milestones.
- If it exists but no milestone is marked `[ACTIVE]` and no milestone name was specified: **stop** and ask the user which milestone to work on, then mark it `[ACTIVE]` in `MILESTONES.md` before continuing.
- If a milestone name was specified (e.g. `/dev Keycloak Authentication`): mark that milestone `[ACTIVE]` (remove `[ACTIVE]` from any other) and proceed.

### 1b. Check ARCHITECTURE.md exists
Look for `ARCHITECTURE.md` in the project root.

- If it does not exist: **stop immediately** and tell the user:

  > No `ARCHITECTURE.md` found. Before implementing, the project architecture must be documented so dev work stays consistent.
  > Please run `/architecture` (or ask me to create an `ARCHITECTURE.md`) covering:
  > - Folder structure and layer responsibilities
  > - Naming conventions (files, classes, functions, routes, DB columns)
  > - Auth patterns and middleware usage
  > - Error handling and response shape conventions
  > - Testing strategy (unit vs integration, what to mock, test file locations)
  > - Any external service integration patterns
  >
  > Once `ARCHITECTURE.md` exists, re-run `/dev` to continue.

- If it exists: read it fully. All implementation decisions must conform to it.
- If the header block declares a flavor — `> Flavor: <name>` or `> Flavor: <name>@<plugin>` — resolve it by trying `flavor-<name>` first, then, only for the `@` form, `<plugin>:flavor`. Invoke whichever resolves and apply its **Dev standards** section on top of the standards below. Where a flavor rule and `ARCHITECTURE.md` conflict, `ARCHITECTURE.md` wins — say so once in your output rather than overriding silently. If neither candidate exists, **stop**: the marker is wrong and guessing which flavor was meant is worse than asking.
- If a header key only *looks* like the marker — `Flavour:`, `flavor:`, `Flavor :`, or any near-miss of `Flavor:` — **stop** and report it. It matches no marker, so the alternative is implementing the whole milestone against core defaults with nothing anywhere saying a flavor was meant to apply.
- If `docs/adr/` exists, read the `Accepted` ADRs too — they are binding, and they explain *why* the rules are what they are. If a task cannot be implemented without violating an accepted ADR, **stop** and tell the user: the ADR must be superseded via `/adr-create` and `/adr-review` first, not worked around in code.

### 1c. Read the active milestone
Extract from `MILESTONES.md`:
- Milestone name
- Goal statement
- All acceptance criteria
- All tasks (note which are already checked)

Read any relevant existing source files to understand the current codebase state before writing a single line of code.

---

## Step 2 — Plan before coding

Before touching any file, state:
1. Which files will be created or modified and why
2. Any database migrations needed
3. Any new dependencies needed
4. Any risks or blockers you see

If a task is ambiguous, ask the user to clarify before implementing it.

---

## Step 3 — Implement tasks

Work through each unchecked task in the milestone **one at a time**:

1. Implement the task following `ARCHITECTURE.md` strictly.
2. After finishing each task, update `MILESTONES.md`: change `- [ ] Task N` → `- [x] Task N`.
3. Move to the next task.

### Coding standards (always apply, ARCHITECTURE.md overrides if it specifies differently)

**Structure**
- Follow the layer separation defined in `ARCHITECTURE.md`. Business logic belongs in services, not controllers or routes.
- New entities must be registered wherever the data source is initialized.
- New routes must be mounted in the app entry point.

**Naming**
- Files: match the convention in `ARCHITECTURE.md` (e.g. `PascalCase.ts` for classes, `kebab-case.ts` for modules).
- Variables and functions: camelCase. Classes: PascalCase. Constants: SCREAMING_SNAKE_CASE only for true constants.
- Route URLs: kebab-case, plural nouns, no verbs.
- JSON properties: camelCase.

**Safety**
- Never put business logic in a migration.
- Never store secrets in code — use environment variables.
- Validate all external input at the boundary (HTTP request, message queue, webhook).
- Apply authentication and authorisation middleware on every protected route.
- No raw SQL unless the ORM genuinely cannot express the query — and even then, use parameterised queries.
- Never commit `.env.*` files or `.claude/settings.local.json` — both are local-only and must be in `.gitignore`.
- Never commit one-time operational/data-migration scripts — run them and discard.

**Quality**
- No unused imports, variables, or dead code.
- No commented-out code blocks left behind.
- No `console.log` left in production paths.
- `TODO` comments are not acceptable — either implement it or create a new milestone task.
- Keep functions small and single-purpose. If a function needs a long comment to explain what it does, it should be split.
- Replace inline comments that explain a magic number or duration with a named constant (e.g. `const JWKS_CACHE_TTL_MS = 600_000`, not `600_000 // 10 minutes`).
- Extract complex multi-step logic (chained finds, multi-condition checks) into named private methods — don't rely on inline comments to explain them.

**Error handling**
- Follow the error response shape defined in `ARCHITECTURE.md`.
- Never swallow errors silently. Every caught error must either be re-thrown, logged with context, or returned as a structured response.
- Use specific error types/classes rather than generic `Error` where the architecture defines them.

---

## Step 4 — Write tests

After all tasks are checked off, write tests. Check `ARCHITECTURE.md` for the project's testing strategy. If it does not specify, apply these defaults:

### Unit tests
- One test file per service/utility file changed or created.
- Test file location: mirror the source path under a `tests/unit/` directory, or alongside the source file as `*.spec.ts` — match the existing project convention.
- Mock all external dependencies (DB, external APIs, email, storage) at the boundary.
- Cover: happy path, edge cases, and each error branch.
- Do not test framework internals (e.g. do not test that Express parses JSON).

### Integration tests
- One test file per controller/route group changed or created.
- Test file location: `tests/integration/` or match existing convention.
- Use a real database (do not mock the DB in integration tests — mock divergence has burned production before).
- Cover: full request → response cycle including auth middleware, input validation, and DB state changes.
- Each test must clean up its own data (use transactions or teardown hooks).
- Cover: success response, validation errors (400), auth failures (401/403), and not-found (404) where applicable.

### Test quality rules
- No `expect(true).toBe(true)` or trivially-passing tests.
- Assertions must be specific: check response body shape, status codes, and DB state — not just "did not throw".
- Use realistic data in tests (proper UUIDs, ISO-8601 dates, plausible strings) — no `foo`, `bar`, `test123`.

---

## Step 5 — Final check

Before declaring dev work complete:

1. Run the linter (`npm run lint` or the command in `ARCHITECTURE.md`). Fix all errors.
2. Run all tests (`npm test` or the command in `ARCHITECTURE.md`). All must pass.
3. If the project has an OpenAPI spec, verify new or changed endpoints are reflected in it.
4. Read `MILESTONES.md` — confirm every task checkbox is checked `[x]`.
5. Confirm the milestone is still marked `[ACTIVE]` — do NOT remove `[ACTIVE]` or add any "complete" marker. That is the QA skill's job.
6. Run `/review-branch` for a deeper review of all branch changes against `ARCHITECTURE.md` standards before handing off to QA. Resolve any issues found.

Report to the user:
- Summary of what was implemented
- Test coverage added (files and what they cover)
- Any follow-up items that should become new milestone tasks
- Reminder that the milestone stays `[ACTIVE]` until QA signs off

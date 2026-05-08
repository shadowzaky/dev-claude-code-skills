Review all changes on the current branch against master. Evaluate correctness, security, architecture conformance, and every code quality dimension listed below. Every issue must be reported with file and line number.

---

## Step 1 — Identify scope

```bash
git branch --show-current
git diff master...HEAD --name-only
git log master...HEAD --oneline
```

List commits and changed files so scope is clear.

---

## Step 2 — Read ARCHITECTURE.md

Read `ARCHITECTURE.md` in the project root before reviewing a single line of diff.

- If it does not exist: **stop** — tell the user to create `ARCHITECTURE.md` before the branch can be reviewed. Architecture must be documented so the review has a baseline to evaluate against.
- Read it fully. Every architecture finding in the review must reference a specific rule from this file.

---

## Step 3 — Read the full diff

```bash
git diff master...HEAD
```

Read every changed file in full where context is needed. Do not review snippets in isolation.

---

## Step 4 — Evaluate all dimensions

Review every changed file against every dimension below. Do not skip dimensions because a file looks clean at a glance.

---

### A. Architecture conformance (ARCHITECTURE.md)

- Does the code follow the layer structure defined in `ARCHITECTURE.md`?
- Is business logic in the correct layer (services, not controllers or routes)?
- Are new entities, routes, or services registered where `ARCHITECTURE.md` requires?
- Are naming conventions (files, classes, functions, routes, DB columns) followed exactly?
- Does error handling match the response shape defined in `ARCHITECTURE.md`?
- Flag every deviation with the specific `ARCHITECTURE.md` rule it violates.

---

### B. Clean Architecture & SOLID

**Single Responsibility**
- Does each class/module have exactly one reason to change?
- Are controllers only handling HTTP concerns (parse request → call service → return response)?
- Are services only handling business logic, with no HTTP or DB framework leaking in?

**Open/Closed**
- Is new behaviour added by extension (new class, new method) rather than editing existing stable logic?
- Are `switch`/`if-else` chains on type/kind a sign a strategy or polymorphism is needed?

**Liskov Substitution**
- Do subclasses/implementations honour the contract of their parent/interface?

**Interface Segregation**
- Are interfaces/types fat (forcing implementors to depend on methods they don't use)?

**Dependency Inversion**
- Do high-level modules depend on abstractions, not concrete implementations?
- Are dependencies injected rather than instantiated inline?

---

### C. Clean Code

**Method length**
- Any method/function longer than ~20 lines is a candidate for extraction. Flag it.
- A method that needs a block comment to explain a section inside it should be split — that section should be its own named function.
- Rule of thumb: if you cannot read the entire method on one screen without scrolling, it is too long.

**Naming**
- Names must be self-explanatory. A reader should understand what a variable, function, or class does without reading its implementation.
- Flag: single-letter variables (except loop counters), abbreviations (`usr`, `cfg`, `mgr`), misleading names (`data`, `info`, `manager`, `helper`, `utils` used as dumping grounds), boolean names that don't read as a question (`isValid`, `hasPermission` — good; `valid`, `flag` — bad).
- Functions named with "and" or "or" are doing two things — flag for splitting.

**Comments**
- Code should be self-documenting. Comments that restate what the code does are noise — flag for removal.
- Acceptable comments: *why* something non-obvious is done (legal constraint, known bug workaround, performance reason). Not *what*.
- TODO comments are not acceptable in production code — flag every one found.
- Commented-out code blocks must be removed — flag every one found.
- If a comment explains a magic number or duration, it should be a named constant instead (`const CACHE_TTL_MS = 600_000`, not `600_000 // 10 minutes`).
- Complex multi-step logic (chained finds, multi-condition checks) must be extracted into named private methods, not explained by inline comments.

**Duplication (DRY)**
- Flag any logic that appears more than once and should be extracted into a shared function, helper, or base class.
- Pay special attention to: validation logic, error formatting, query building, response mapping.
- If two functions are structurally identical with different field names, they should be unified with a parameter.

**Readability**
- Flag deeply nested code (more than 3 levels of indentation). Suggest early returns, guard clauses, or extraction.
- Flag complex boolean expressions — they should be extracted into a named predicate function.
- Flag long parameter lists (more than 3–4 params) — suggest an options object or value object.

---

### D. KISS (Keep It Simple)

- Is the solution more complex than the problem requires?
- Are there abstractions introduced for hypothetical future requirements that don't exist yet?
- Are there design patterns applied where a simple function would have been enough?
- Flag over-engineering: unnecessary interfaces for single implementations, factory classes for objects constructed in one place, excessive configuration for non-configurable behaviour.

---

### E. Hardcoded strings

Flag **every** hardcoded string that belongs in a config, constant, enum, or translation file:

- Magic strings in conditionals: `if (status === 'active')` — should be an enum or constant.
- Error messages written inline as string literals — should be constants or a message catalogue.
- Route paths written as string literals more than once — should be constants.
- Any human-facing text (labels, messages, notifications, email subjects) written as a raw string — must go through the translation/i18n system.
- Hardcoded IDs, role names, status values, event names — should be enums or constants.

---

### F. Internationalisation (i18n / translations)

- Any string that will ever be seen by an end user must go through the project's translation system.
- Flag: raw strings in HTTP response bodies, email content, notification messages, validation error messages, log messages shown to users.
- Flag: date, time, number, or currency formatting not using a locale-aware formatter.
- Flag: hardcoded locale assumptions (e.g. `'en'` as a fallback buried in logic instead of config).

---

### G. Secrets and credentials

Flag **any** of the following appearing as literals in source code:

- API keys, tokens, passwords, connection strings
- Private keys or certificates
- Internal URLs or IP addresses that should be configuration
- Credentials in comments, test fixtures, or example data
- Environment variable values (only the variable *name* should appear in code, never its value)

These are `[BLOCKER]` — no exceptions.

Also flag as `[BLOCKER]`:
- `.env.*` files committed to the repository (even `.env.test`)
- `.claude/settings.local.json` committed to the repository (machine-local, must be in `.gitignore`)
- One-time operational/data-migration scripts committed as permanent code

---

### H. Security

- Is `authenticate()` / `authorize()` (or equivalent from `ARCHITECTURE.md`) applied on every protected route?
- Is all external input validated at the HTTP boundary before reaching service logic?
- Are there SQL injection risks (raw queries without parameterisation)?
- Are there command injection, XSS, or path traversal risks?
- Are error responses leaking stack traces, internal paths, or DB schema details?
- Are tokens or sensitive values appearing in logs?

---

### I. Correctness

- Does the logic match the intended behaviour?
- Are edge cases handled: empty arrays, null/undefined, zero, negative numbers, concurrent requests?
- Are async operations awaited? Are promise rejections caught?
- Are there off-by-one errors, incorrect comparisons (`<` vs `<=`), or wrong operator precedence?
- Are DB transactions used where multiple writes must be atomic?

---

### J. Tests

- Are new code paths covered by tests?
- Do tests assert specific outcomes (status codes, response body, DB state) — not just "did not throw"?
- Are integration tests using a real DB (no DB mocks)?
- Are tests using realistic data (proper UUIDs, ISO-8601 dates — no `foo`, `bar`, `test123`)?
- Do existing tests still reflect the current behaviour after the changes?

---

### K. OpenAPI spec

- Are new or changed endpoints reflected in `specs/openapi.yaml`?
- Do examples meet spec quality rules (realistic data, auth examples, error responses)?

---

## Step 5 — Report findings

Structure the report exactly as follows:

---

**Branch:** `branch-name`
**Commits:** X commits — one-line summary of what the branch does overall.

---

### Issues

Every issue must include: severity tag, file path, line number or function name, what the problem is, and a concrete suggestion for fixing it.

Severity levels:

- `[BLOCKER]` — must be fixed before merge: secrets in code, broken logic, security holes, missing migrations, architecture violations that corrupt the layer model
- `[CONCERN]` — should be addressed: missing tests, DRY violations, SOLID violations, hardcoded strings, untranslated user-facing text, methods too long
- `[MINOR]` — nice to fix: naming improvements, unnecessary comments, minor readability issues

Group issues by file. Example format:

```
#### src/services/AuthService.ts

- [BLOCKER] line 42 — `JWT_SECRET` hardcoded as string literal. Move to environment variable.
- [CONCERN] line 87–134 — `resetPassword()` is 48 lines. Extract token validation (lines 87–103) and email dispatch (lines 120–134) into private methods.
- [CONCERN] line 61 — `'active'` magic string. Define as `UserStatus.ACTIVE` enum value.
- [MINOR] line 29 — comment "// get the user from db" restates the code. Remove.
```

---

### Positives

Note what was done well — good naming, clean separation, well-tested, good use of abstractions.

---

### Recommended next steps

Ordered list of actions to take before this branch is ready to merge, highest priority first.

---

## Severity escalation rules

If 3 or more `[CONCERN]` items exist in a single file, escalate the file-level verdict to `[CONCERN — NEEDS REFACTOR]` and recommend addressing the file as a whole rather than patching individual lines.

If any `[BLOCKER]` exists: the branch **must not be merged** until resolved. State this explicitly at the top of the report.

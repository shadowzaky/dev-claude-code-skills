---
name: architecture
description: >
  Creates or updates ARCHITECTURE.md for the current project by reading the actual codebase.
  Documents folder structure, layer responsibilities, naming conventions, auth patterns,
  error handling, testing strategy, and external service patterns. On an empty or scaffold-only
  repo it switches to greenfield mode: designs the stack and layers from the user's intent and
  records the stack choices as ADRs. Offers ADRs for decisions, not for conventions.
  Triggers when user says "create architecture", "document architecture", "setup architecture",
  "write architecture doc", "bootstrap a new project", "/architecture", or when dev/qa skills
  detect ARCHITECTURE.md is missing.
---

<!-- validate: allow-refs coach-profiles -->


You are acting as a principal engineer documenting the architecture of this project. Your job is to produce an accurate, opinionated `ARCHITECTURE.md` that every developer (and every AI skill) can use as the single source of truth for how this codebase is structured and how to extend it correctly.

Read the actual code — do not invent or assume. If something is ambiguous, ask the user.

---

## Step 0 — Is there a codebase yet?

Check before anything else: does a source root with real application files exist?

Treat the project as **greenfield** when there is no source root, or it holds only scaffolding — a README, a `package.json`, a bare framework template, a `.gitignore`. Anything with real modules, routes, or entities is **existing** — go to Step 1.

Greenfield matters because the rest of this skill reads code to learn conventions, and there is none. Skipping the file entirely is not an option: `dev`, `qa`, and `/grind` all hard-stop without `ARCHITECTURE.md`, so a new project cannot start until it exists. Go to Step 0a.

---

## Step 0a — Greenfield: design instead of read

You are designing the architecture, not documenting one. Everything comes from the user plus your judgement, so ask before you propose.

### Gather intent

1. **What is being built?** One or two sentences, plain language.
2. **Who and what scale?** Users, expected load, growth — these decide far more than taste does.
3. **Hard requirements.** Compliance, data residency, offline support, existing systems that must be integrated, contractual constraints.
4. **Team and timeline.** Size, existing expertise, how soon something must run. A stack nobody on the team knows is a real cost, not a detail.
5. **Deployment target.** Where it runs, and who operates it.
6. **Anything already decided?** Sometimes the stack is not actually open — find out before proposing alternatives.

If the user does not know an answer yet, record it as an open question rather than deciding it for them.

### Propose the stack

For each major choice — language and runtime, framework, database, ORM or query layer, auth mechanism, test framework, deployment target — present **two or three real options** with the trade-off that separates them, and a recommendation with a reason tied to an answer from the intent gathering.

Do not present a single option as inevitable. If a choice genuinely has no alternative worth naming, say why in one line and move on.

Default to boring, well-supported technology unless a requirement forces otherwise. A greenfield project has enough unknowns without novel infrastructure adding more.

### Record the decisions

Every stack choice is exactly what an ADR is for: expensive to reverse, constrains every module, and a reasonable engineer could pick differently.

After the user confirms the stack, offer to record each significant choice via the `adr-create` skill — one ADR per choice, `Proposed`, with the alternatives you just discussed and the reasons they lost. That conversation is the most valuable ADR material the project will ever have, and it evaporates within a week if it is not written down now.

Do not block on `/adr-review`. Write `ARCHITECTURE.md` and let the records be accepted separately.

### Write the file

Use the same Step 3 structure. Two differences:

- Sections that cannot be answered yet get `> TBD — decided when the first [X] is built`, never a plausible guess. A guessed convention becomes a rule nobody agreed to.
- Add a banner under the title:

```markdown
> **Designed, not yet built.** This architecture was written before implementation.
> Re-run `/architecture` after the first milestone ships to reconcile it with the real code.
```

Then continue to Step 4.

### Hand off

Close with the actual next step:

> `ARCHITECTURE.md` is in place, so `/dev` and `/qa` are unblocked.
> Next: `/idea-backlog` to capture what you want to build, or `/milestones` to define the first one directly.
> `/sprint` runs the whole pipeline for that first milestone.

---

## Step 1 — Read the codebase

Scan the project to understand its actual structure before writing a single word:

1. Read the root directory listing.
2. Read `package.json` (or equivalent) — understand the tech stack, scripts, and dependencies.
3. Read the entry point file (e.g. `src/index.ts`, `main.ts`, `app.ts`).
4. Read the folder structure under `src/` (or equivalent source root).
5. Read 2–3 representative files from each major folder (controllers, services, entities/models, middleware, repositories, routes, etc.).
6. Read any existing config files: `tsconfig.json`, `jest.config.js`, `.eslintrc`, `docker-compose.yml`, ORM config, etc.
7. Check for any existing `ARCHITECTURE.md`, `CLAUDE.md`, `README.md` — read them for prior decisions.
8. Check the test directory structure and read 1–2 test files.
9. Check whether a flavor applies. If an existing `ARCHITECTURE.md` declares one — `> Flavor: <name>` or `> Flavor: <name>@<plugin>` — resolve it by trying `flavor-<name>` first, then, only for the `@` form, `<plugin>:flavor`. Invoke whichever resolves and include its **Architecture extensions** sections in the document; if neither exists, **stop** and report the bad marker. If a header key only *looks* like the marker — `Flavour:`, `flavor:`, `Flavor :`, or any near-miss of `Flavor:` — **stop** and report it rather than treating the project as unflavored; this skill owns the file, so it is the right place to get the spelling fixed. If none is declared but the codebase clearly belongs to a domain a flavor covers, **suggest** it — never activate one on the user's behalf (ADR-0001).
10. Read `docs/adr/` if it exists. Every `Accepted` ADR is binding — `ARCHITECTURE.md` must be consistent with all of them. If the code contradicts an accepted ADR, document the ADR's rule and flag the violation to the user; do not document the violation as the convention.

---

## Step 2 — Identify ambiguities and ask

Before writing, identify anything that is inconsistent or unclear in the codebase:

- Naming conventions that are mixed (some files PascalCase, some kebab-case)?
- Business logic appearing in both controllers and services?
- Multiple patterns for the same thing (e.g. two different error response shapes)?
- No clear test strategy visible from the existing tests?

For each ambiguity: ask the user which pattern is the **intended** standard going forward. Do not document both — pick one and document it as the rule.

Example questions:
- "I see some files named `AuthService.ts` (PascalCase) and some named `auth-service.ts` (kebab-case). Which is the convention for service files?"
- "Error responses in some controllers return `{ error: string }` and others return `{ message: string, code: number }`. Which shape should be the standard?"
- "I see no integration tests — is that intentional, or should the architecture mandate them?"

Record all answers before proceeding to Step 3.

---

## Step 2b — Capture the decisions worth recording

Some answers from Step 2 are conventions. Others are **decisions** — and the reasoning behind those dies in this conversation unless it is written down.

An answer deserves an ADR when any of these hold:

- It is expensive or slow to reverse (persistence, auth mechanism, deployment target, public API shape, tenancy model).
- It constrains work across more than one module.
- A reasonable engineer would choose differently — it was a genuine trade-off, not a coin flip.
- It rejects an obvious option for a non-obvious reason.

It does **not** deserve an ADR when it is a naming convention, a folder layout, a formatting rule, or anything confined to one file. Those are `ARCHITECTURE.md` rules and nothing more.

For each qualifying decision, offer:

> That is a real trade-off, not just a convention — worth an ADR so the reasoning survives.
> Record it as `ADR-000X: <decision as a title>`?

If the user agrees, invoke the `adr-create` skill for each one, one at a time. Those ADRs are written as `Proposed` and need `/adr-review` before they are binding — do not wait on that to finish `ARCHITECTURE.md`.

If `docs/adr/` does not exist yet and you found two or more qualifying decisions, mention the ADR log once and let the user opt in. Do not create it unprompted.

Write the file to the project root. Use the structure below exactly — do not omit sections. Fill every section from what you read in the code plus the user's answers to ambiguity questions.

```markdown
# Architecture

> Last updated: YYYY-MM-DD
> Flavor: <name>          <!-- or <name>@<plugin> for a flavor from a separate plugin.
                              Omit the line entirely when no flavor applies. The key is
                              spelled `Flavor:` exactly — a near-miss matches nothing. -->

## Stack

List the core technologies and their versions (from package.json or lockfile):
- Runtime, language, framework
- Database and ORM
- Auth mechanism
- External services (email, storage, payments, monitoring, etc.)
- Test framework

---

## Folder structure

Describe every top-level directory and its responsibility. Be specific — not "utils: utility functions" but "utils: pure functions with no side effects; no DB access, no HTTP calls, no business logic".

```
src/
  controllers/   HTTP layer only — parse request, call service, return response. No business logic.
  services/      Business logic and use cases. No HTTP framework imports.
  entities/      ORM entity definitions and plain domain models. No logic beyond field defaults.
  middleware/    Express middleware (auth, logging, error handling). No business logic.
  routes/        Route definitions and middleware wiring. No logic.
  repositories/  DB query abstractions. Only the ORM layer may appear here.
  migrations/    Database migrations. Schema changes only — no business logic.
  ...
```

---

## Layer rules

Define what each layer is allowed and not allowed to do. Be explicit about what is forbidden.

### Controllers
- **Allowed:** Parse req params/body/headers, call one service method, return HTTP response.
- **Forbidden:** Business logic, direct DB access, calling other controllers.
- **Rule:** One controller per route group. Methods map 1:1 to route handlers.

### Services
- **Allowed:** Business logic, calling repositories, calling external service clients, throwing domain errors.
- **Forbidden:** `req`, `res`, `next` imports or usage. HTTP status codes. Framework-specific code.
- **Rule:** Services may call other services. Services never call controllers.

### [Continue for each layer in the project]

---

## Naming conventions

Be exact. Include file names, class names, function names, variable names, DB columns, route URLs, JSON properties.

| Thing | Convention | Example |
|-------|-----------|---------|
| Service files | PascalCase | `AuthService.ts` |
| Controller files | PascalCase | `AuthController.ts` |
| Route files | kebab-case | `auth.routes.ts` |
| Entity files | PascalCase | `User.ts` |
| Test files | mirror source + `.spec.ts` or `.test.ts` | `AuthService.spec.ts` |
| Class names | PascalCase | `AuthService` |
| Method names | camelCase | `resetPassword()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| Enum values | SCREAMING_SNAKE_CASE | `UserStatus.ACTIVE` |
| Route URLs | kebab-case, plural nouns, no verbs | `/coach-profiles` |
| JSON response properties | camelCase | `{ createdAt, userId }` |
| DB column names | snake_case | `created_at`, `user_id` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

---

## Authentication and authorisation

Document exactly how auth works end-to-end:

- How tokens are issued and what they contain
- Which middleware enforces auth and how to apply it to a route
- How roles work and what each role can do
- What the request object looks like after auth middleware runs (e.g. `req.userId`, `req.userRole`)
- What type to use for authenticated route handlers

Example:
```typescript
// Protected route — authenticated users only
router.get('/profile', authenticate(), UserController.getProfile);

// Protected route — admin only
router.delete('/users/:id', authenticate(), authorize(RoleName.ADMIN), UserController.delete);

// Handler type for authenticated routes
async getProfile(req: AuthenticatedRequest, res: Response): Promise<void>
```

---

## Error handling

Document the exact error response shape the API returns:

```json
{
  "message": "Human-readable description",
  "code": "MACHINE_READABLE_CODE",
  "statusCode": 400
}
```

- Which HTTP status codes map to which situations
- How errors are thrown in services (custom error classes, or plain Error with a code field, etc.)
- Where errors are caught and formatted (global error handler middleware, per-controller try/catch, etc.)
- What happens to unexpected/unhandled errors (log + 500, or let crash handler deal with it)

---

## Database

- ORM and version
- How the data source / connection is initialized and where
- How new entities must be registered
- Migration workflow: how to generate, run, and revert migrations
- Whether migrations run automatically at startup
- SSL and environment-specific connection config

---

## External services

For each external service, document:
- What it is used for
- Where the client/SDK is initialized
- How it is injected into services that need it (constructor injection, singleton import, etc.)
- Any retry or error handling conventions

---

## Environment variables

List all environment variables the application requires, grouped by concern. For each:
- Variable name
- What it configures
- Whether it is required or optional (and the default if optional)

Never document actual values — names only.

---

## Testing strategy

### Unit tests
- What to test: services, utilities, pure business logic
- What to mock: all external dependencies (DB, external APIs, email, storage)
- File location: [e.g. alongside source as `*.spec.ts`, or under `tests/unit/`]
- Framework and key patterns used

### Integration tests
- What to test: full request → response cycle through the HTTP layer
- Database: real DB — never mock the DB in integration tests
- File location: [e.g. `tests/integration/`]
- How to set up and tear down test data
- Framework and key patterns used

### Running tests
```bash
npm test          # all tests
npm run test:watch  # watch mode
npx jest path/to/file  # single file
```

---

## Adding a new feature — checklist

Step-by-step for adding a new domain/resource to the API:

1. Create entity in `src/entities/` and register it in the data source
2. Generate and write migration
3. Create repository in `src/repositories/`
4. Create service in `src/services/` with business logic
5. Create controller in `src/controllers/`
6. Create route file in `src/routes/` and mount it in the entry point
7. Add OpenAPI spec entry (if applicable)
8. Write unit tests for the service
9. Write integration tests for the routes

---

## Decision records

Rules in this file state *what*. The *why* lives in `docs/adr/`. Accepted ADRs are binding —
if a rule here contradicts an accepted ADR, the ADR wins and this file is wrong.

| ADR | Decision | Affects |
|---|---|---|
| [0002](docs/adr/0002-typeorm.md) | Use TypeORM as the persistence layer | Repositories, migrations |
| [0007](docs/adr/0007-single-tenant-database.md) | One database per customer | Data source, migrations |

Rules derived from an ADR cite it inline, e.g.:
> All tenant queries go through the per-tenant connection factory (ADR-0007).

A changed decision means a new ADR that supersedes the old one, then an update here — never a
silent edit to a rule whose reasoning is recorded elsewhere.

---

## Flavor extensions

Only when a flavor is declared. Append the sections listed in that flavor's **Architecture
extensions**, filled from the codebase and the user's answers like every other section.

Flavor rules are defaults — anything stated in this file overrides them (ADR-0002).

---

## What does NOT belong in this file

- Decision rationale and rejected alternatives → `docs/adr/`
- Business rules → `BUSINESS_RULES.md`
- Milestone tracking → `MILESTONES.md`
- What the product does and for whom → `docs/product/`
- Deployment and infrastructure → `README.md` or `docs/`
- Secrets or credentials → environment variables only, never committed
```

---

## Step 4 — Review with the user

After writing the file, present a summary of the key decisions documented:

> `ARCHITECTURE.md` written. Key decisions recorded:
> - Layer structure: [summary]
> - Naming: [summary of any enforced conventions]
> - Auth: [how routes are protected]
> - Error shape: [the response shape]
> - Testing: [unit mock strategy + integration real DB]
> - ADRs recorded: [list, or "none — no decisions met the bar"]
>
> Anything incorrect or missing?

Iterate on any corrections the user requests. Update the file after each round of feedback.

---

## Step 5 — Confirm other skills can proceed

If this skill was invoked because `/dev` or `/qa` hard-stopped due to a missing `ARCHITECTURE.md`:

After the user confirms the document is correct, remind them:
> `ARCHITECTURE.md` is ready. You can now re-run `/dev` (or `/qa`) to continue where you left off.

---
name: architecture
description: >
  Creates or updates ARCHITECTURE.md for the current project by reading the actual codebase.
  Documents folder structure, layer responsibilities, naming conventions, auth patterns,
  error handling, testing strategy, and external service patterns.
  Triggers when user says "create architecture", "document architecture", "setup architecture",
  "write architecture doc", "/architecture", or when dev/qa skills detect ARCHITECTURE.md is missing.
---

You are acting as a principal engineer documenting the architecture of this project. Your job is to produce an accurate, opinionated `ARCHITECTURE.md` that every developer (and every AI skill) can use as the single source of truth for how this codebase is structured and how to extend it correctly.

Read the actual code — do not invent or assume. If something is ambiguous, ask the user.

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

## Step 3 — Write ARCHITECTURE.md

Write the file to the project root. Use the structure below exactly — do not omit sections. Fill every section from what you read in the code plus the user's answers to ambiguity questions.

```markdown
# Architecture

> Last updated: YYYY-MM-DD

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

## What does NOT belong in this file

- Business rules → `BUSINESS_RULES.md`
- Milestone tracking → `MILESTONES.md`
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
>
> Anything incorrect or missing?

Iterate on any corrections the user requests. Update the file after each round of feedback.

---

## Step 5 — Confirm other skills can proceed

If this skill was invoked because `/dev` or `/qa` hard-stopped due to a missing `ARCHITECTURE.md`:

After the user confirms the document is correct, remind them:
> `ARCHITECTURE.md` is ready. You can now re-run `/dev` (or `/qa`) to continue where you left off.

Fetch latest from remote, merge the main branch into the current branch, and resolve any conflicts. If a conflict resolution is ambiguous, stop and ask before proceeding.

---

## Step 1 — Check working tree state

```bash
git status
```

- If there are uncommitted changes (staged or unstaged): **stop** — tell the user to commit or stash their changes before syncing. Do not proceed with a dirty working tree.
- If working tree is clean: continue.

---

## Step 2 — Identify branches

```bash
git branch --show-current
git remote show origin | grep "HEAD branch"
```

- Note the current branch name.
- Identify the main branch (typically `master` or `main` — use whatever the remote HEAD points to).
- If already on the main branch: **stop** — tell the user to switch to a feature branch first. Merging main into main is a no-op and likely a mistake.

---

## Step 3 — Fetch

```bash
git fetch origin
```

Fetch all remote refs without modifying the working tree.

Report what was fetched (new commits on main, any other updated refs).

---

## Step 4 — Check if merge is needed

```bash
git log HEAD..origin/main --oneline
```

- If no commits: tell the user "Branch is already up to date with main. Nothing to merge." and stop.
- If commits exist: list them so the user can see what is coming in before the merge begins.

---

## Step 5 — Merge main into current branch

```bash
git merge origin/main --no-edit
```

- If merge succeeds with no conflicts: report success, list the commits merged, and stop.
- If merge produces conflicts: continue to Step 6.

---

## Step 6 — Resolve conflicts

For each conflicted file:

1. Read the file and locate every conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`).
2. For each conflict, analyse both sides:
   - **HEAD** (current branch) — what this branch changed
   - **origin/main** — what main changed
3. Determine the correct resolution:

**Resolve automatically when the intent is unambiguous:**
- One side added new code the other side didn't touch → keep both.
- One side deleted code the other side didn't touch → accept the deletion.
- Both sides made identical changes → keep one copy.
- One side is a formatting/whitespace-only change, other side is logic → keep the logic change.

**Stop and ask the user when:**
- Both sides modified the same logic differently — you cannot tell which is the intended behaviour.
- One side deleted something the other side modified — deleting may break the modification's intent.
- A conflict is in a migration file, schema definition, or configuration — these are high-risk and must not be guessed.
- Any conflict where resolving incorrectly would silently change business logic.

When asking, show the user exactly:
```
Conflict in: src/services/AuthService.ts (line 42)

<<<< CURRENT BRANCH (HEAD)
[code]

==== MAIN
[code]

Which should we keep, or how should these be combined?
```

Wait for the user's answer before resolving that conflict. Apply the answer and move to the next conflict.

4. After resolving each file: remove all conflict markers, ensure the file is valid (no syntax errors if detectable), and stage it:
```bash
git add <file>
```

---

## Step 7 — Complete the merge

Once all conflicts are resolved and all files staged:

```bash
git merge --continue
```

Or if `--continue` is not applicable:
```bash
git commit --no-edit
```

---

## Step 8 — Verify

```bash
git status
git log --oneline -5
```

- Confirm working tree is clean.
- Confirm merge commit exists (or fast-forward succeeded).
- Report to the user: which branch was merged, how many commits came in, which files had conflicts and how they were resolved.

---

## Conflict resolution rules

| Situation | Action |
|-----------|--------|
| Purely additive (new code on both sides, no overlap) | Merge both — automatic |
| One side untouched, other side changed | Accept the change — automatic |
| Both sides changed same lines differently | **Ask the user** |
| Conflict in migration, schema, or config file | **Always ask the user** |
| Conflict involves deleted code | **Ask the user** |
| Unsure for any reason | **Ask the user** |

Never guess on ambiguous conflicts. A wrong silent resolution is worse than a pause to ask.

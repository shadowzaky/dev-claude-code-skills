Fix a bug through a proportionate path — reproduce, regression test, fix, business-rule check — without inventing a milestone to hold it.

The milestone loop is built for planned work. A bug is not planned work, and forcing one through `/sprint` produces a milestone nobody wanted, an `[ACTIVE]` marker that displaces real work, and acceptance criteria written after the fact to describe a patch. This command is the smaller path: same discipline, no ceremony.

**This command never touches `MILESTONES.md`.** It creates no milestone, marks none active, completes none. If the work turns out to need one, it stops and says so.

---

## Step 1 — Is this actually a bug?

Apply this before reproducing anything, before reading code, before touching a file. Getting it wrong in the permissive direction is how features arrive with no criteria, no plan, and no record.

A **bug** is a gap between behaviour that is *already stated somewhere* and behaviour that actually happens. Answer all three:

1. **What happens, and what should happen instead?**
2. **What states that it should?** Name the source — a `BR-XXX` in `BUSINESS_RULES.md`, an acceptance criterion of a completed milestone, an accepted ADR, `docs/product/`, a type or interface contract, or an existing test. "It's obvious" is not a source.
3. **Does fixing it require deciding something new about what the product does?**

**It is a feature — stop — if** question 2 has no answer, or question 3 is yes.

> This looks like a feature rather than a bug: nothing currently states that [X] should happen, so
> fixing it means deciding it for the first time. That is a product decision, and it belongs in a
> milestone with acceptance criteria.
>
> Run `/milestones` to define it. I have not changed any files.

State the reason in those terms — *which* question failed. "This is a feature" without the why reads as a refusal to help.

### Always a bug, even when unstated

No one has to have written down that software must not do these. Question 2 is waived for:

- Crashes, hangs, unhandled exceptions
- Data loss or corruption
- Security failures — authz bypass, injection, credential or PII exposure
- A regression: behaviour that provably worked in an earlier commit

### The fix is bigger than the bug

Sometimes question 1 is a real bug but the repair is not proportionate — it needs a schema migration, a new endpoint, a new screen, or a change across several modules. **Stop and say so.** Offer the choice: a narrow fix now for the stated defect, with the rest as a milestone; or the whole thing as a milestone. Do not quietly build the large version because the small one was requested.

If the fix is expensive to reverse or crosses module boundaries, offer `/adr-create` before writing the fix, not after.

---

## Step 2 — Reproduce it

A bug you have not reproduced is a bug you are guessing at, and a fix for a guess is untestable.

1. Read `ARCHITECTURE.md` for the test layout, the runner, and the conventions the fix must follow. If it does not exist, **stop** — tell the user to run `/architecture` first; without it there is no baseline for where a test goes or how a fix should look.
2. Establish the exact trigger: inputs, state, sequence. Narrow it until it is minimal.
3. Reproduce it — by running the code, not by reading it.

**If it does not reproduce: stop.** Report what was tried and what happened instead. Ask for the missing condition — version, environment, data, ordering. Do not fix code you cannot demonstrate is broken; a fix with no failing case is indistinguishable from an unnecessary change.

---

## Step 3 — Write the regression test first

Write the test **before** the fix, against the unfixed code, and **run it**.

The test must fail — and fail *for the reason the bug describes*, not because of a typo, a missing import, or a bad fixture. A test that fails for the wrong reason proves nothing and will keep passing after the bug returns.

- Place it where `ARCHITECTURE.md` says tests of that kind live.
- Assert the specific defective behaviour, not a broad approximation of it.
- Name it for the bug, not for the fix.

**Record the observed failure output.** It goes in the report verbatim. If the test passes against unfixed code, the reproduction in Step 2 was wrong — go back; do not adjust the test until it fails.

---

## Step 4 — Fix it

1. Find the root cause. Fix that. A patch at the symptom leaves the cause free to surface elsewhere.
2. Follow `ARCHITECTURE.md` conventions — a fix is not licence to deviate.
3. If `docs/adr/` exists, the accepted ADRs are binding. A fix that can only be made by violating one is not a fix: **stop**, and say which ADR blocks it. The ADR gets superseded through `/adr-create` and `/adr-review` first.
4. Change what the bug requires and nothing else. Refactors, renames, and tidying belong in their own change — they make the diff unreviewable and hide the fix inside noise.

---

## Step 5 — Check the business rules

Every fix runs this step. A bug is often an invariant nobody wrote down.

Read `BUSINESS_RULES.md`. If it does not exist, note that and continue — its absence is not a reason to skip the question.

**Does an existing `BR-XXX` cover the behaviour that was broken?**

- **Yes** — name it in the report. The regression test is now a second enforcer of that rule; say so.
- **No** — the bug revealed an unstated invariant. Say what it is, in rule form, and offer to record it.

A missing rule is the more common case and the more important one. Patching the code and leaving the invariant unwritten means the next change has nothing to violate, so it will.

**`/fix` does not write `BUSINESS_RULES.md`.** That file is owned by the `qa` skill, and a second writer with a different format degrades it. To record a new rule, **invoke `qa`** with the proposed rule, the behaviour it constrains, and the regression test that enforces it. Let `qa` assign the `BR-XXX` number and write the entry.

Never write a rule that contradicts an existing one. If the fix appears to require contradicting a recorded rule, **stop** — either the rule is wrong or the fix is, and that is the user's call, not yours.

---

## Step 6 — Verify

1. Run the regression test — it must now pass.
2. Run the **full** suite. A fix that repairs one case and breaks another is not done. No skips, no `.only`.
3. Run the linter.
4. Re-read the diff. Confirm it contains the fix and nothing else.

If anything fails, the fix is incomplete. Do not report success with a caveat.

---

## Step 7 — Report

```
## Fix — [one-line bug description]

**Classified as:** bug — [which source states the intended behaviour]

**Root cause:** [what was actually wrong, not what the symptom was]

**Reproduction:** [the minimal trigger]

**Regression test:** `path/to/test` — `test name`
- Against unfixed code: FAILED — [the actual failure output]
- Against the fix:      PASSED

**Fix:** `path/to/file:line` — [what changed and why that is the cause, not the symptom]

**Business rules:**
- [Covered by BR-XXX] or [No existing rule covered this — proposed: "..."; recorded as BR-XXX via qa / declined by user]

**Suite:** X passed, 0 failed, 0 skipped · linter clean
```

State both observations in the regression-test line, explicitly. "Test added" without the before-and-after is the claim this whole path exists to make checkable — if the failing run was not observed, say that instead of implying it.

Nothing is committed. Run `/ship` when the fix is ready for review.

---

## Rules

| Rule | Why |
|---|---|
| **`MILESTONES.md` is never touched** | No milestone created, none activated, none completed. A bug fix that rewrites the plan file corrupts the record of what was planned. |
| **Feature work is refused, with the reason** | Naming which of the three questions failed is what makes the refusal actionable instead of obstructive. |
| **No fix without a reproduction** | A fix for an unreproduced bug cannot be verified and may be an unnecessary change to working code. |
| **The regression test fails first, and is seen to fail** | A test written after the fix proves only that the code does what it currently does. |
| **The rule check is not optional** | It runs on every fix, including when the answer is "already covered". |
| **`BUSINESS_RULES.md` is written by `qa` only** | Single ownership per artifact; `/fix` proposes, `qa` records. |
| **Nothing is committed** | `/ship` is the only command that commits, pushes, or opens a PR. |

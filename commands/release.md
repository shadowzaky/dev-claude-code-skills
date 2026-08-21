Generate release notes from completed milestones into `CHANGELOG.md`, in language someone outside the project can read.

The specs already contain everything a changelog needs. A completed milestone has a goal written as an outcome, acceptance criteria written as user-visible behaviour, and the `BR-XXX` rules it introduced. This command turns that into a changelog rather than asking anyone to hand-write one, and rather than restating commit messages — which describe how the code changed, not what the product now does.

**Re-running is safe.** Released sections are never rewritten, and a milestone already in the file is never added twice.

> **Naming note.** This repo's convention is that derived files are lowercase (`ARCHITECTURE.md` naming table). `CHANGELOG.md` is a deliberate exception: it is the only generated artifact with an audience outside the project, and its consumers — GitHub, release tooling, people looking for it — expect the conventional name.

---

## Step 1 — Collect

1. Read `MILESTONES.md` for milestones marked `[COMPLETED]`.
2. Read `milestones-archived.md` if it exists — archived milestones shipped too, and omitting them puts a hole in the history.
3. Read `BUSINESS_RULES.md` to resolve the `BR-XXX` rules each milestone introduced.
4. Read `docs/product/` if it exists. **Use its feature names verbatim.** A changelog that calls a feature one thing while the product docs call it another makes the two unreadable side by side.
5. Read the existing `CHANGELOG.md` if there is one, and list every milestone already recorded in it.

**Never read `git log` for changelog content.** Commit messages describe implementation; the changelog describes the product. Git is consulted in Step 2 for release boundaries only.

If no completed or archived milestones exist: **stop** — there is nothing to release. Say so; do not write an empty file.

---

## Step 2 — Group into releases

A release section needs a boundary. In order of preference:

1. **Git tags.** `git tag --sort=-creatordate` and `git log --tags`. A milestone completed before a tag belongs to that tag's release.
2. **No tags, or milestones after the newest tag.** Those go under `## [Unreleased]`.
3. **User-supplied.** If the user named a version when invoking (`/release 1.3.0`), the pending milestones go under that version, dated today.

Never invent a version number. If milestones are pending and the user did not name a version, they go under `[Unreleased]` — that is what it is for.

---

## Step 3 — Decide what is user-visible

Apply per milestone, before drafting anything.

**User-visible** means the milestone changed what a user of this product can do, sees, or must do differently. Evidence:

- Acceptance criteria phrased as user outcomes ("User can…", "System returns…")
- A change in `docs/product/` — features, flows, or glossary
- A new `BR-XXX` constraining user-facing behaviour
- New or changed commands, endpoints, screens, outputs, defaults, or error messages

**Not user-visible:** internal refactors, test infrastructure, CI, build tooling, dependency bumps, documentation-only changes, and work whose entire effect is on contributors.

The audience decides. A milestone that only contributors will ever notice is not a product change, however much work it was.

**Exclusions are reported, never silent.** Every excluded milestone is listed in Step 5 with its reason. A changelog that quietly drops a milestone is indistinguishable from one that forgot it, and the reader has no way to tell which.

Borderline: if a milestone is genuinely arguable, include it in the draft and say so at confirmation. The user decides — do not resolve it silently in either direction.

---

## Step 4 — Draft

Group each release's entries under [Keep a Changelog](https://keepachangelog.com) headings, omitting any that are empty:

`### Added` · `### Changed` · `### Fixed` · `### Deprecated` · `### Removed` · `### Security`

Each entry:

```markdown
- **Feature name** — what a user can now do, in one sentence, in their language.
  (Milestone: Milestone Name · BR-014, BR-015)
```

- Written for someone who has never read this repository. No file paths, no class names, no internal jargon.
- Present tense, describing the product as it now is.
- Name the milestone. It is the trail back to the goal, criteria, and rules behind the entry.
- Cite the `BR-XXX` rules the milestone introduced, if any. A milestone that introduced none simply omits them.
- **Never restate a commit message.** "Refactored the resolver" is not a changelog entry.

### File shape

```markdown
# Changelog

Notable user-visible changes, generated from completed milestones by `/release`.
Format follows Keep a Changelog. Released sections are never edited after the fact.

## [Unreleased]

### Added
- **Bug path** — fix a bug through a proportionate path without creating a milestone.
  (Milestone: Bug Path · BR-013, BR-014)

## [1.2.0] — 2026-08-20

### Changed
- **Flavor markers** — a flavor may now live in a separate plugin.
  (Milestone: Flavor Resolution Hardening · BR-011, BR-012)
```

---

## Step 5 — Confirm before writing

Show the user the full draft, then:

```
## Release draft

**Target:** [Unreleased] / [1.3.0]

**Included — X milestones:**
| Milestone | Section | Rules |
|---|---|---|
| Bug Path | Added | BR-013, BR-014 |

**Excluded — X milestones:**
| Milestone | Why |
|---|---|
| Flavor Resolution Hardening | No user-visible change — internal resolution and validation only |

**Already in CHANGELOG.md, skipped:** [names, or "none"]

Write this to CHANGELOG.md?
```

**Wait for confirmation.** Do not write on a draft the user has not seen — the exclusion list is the part most likely to be wrong, and it is invisible in the finished file.

---

## Step 6 — Write

- **Creating the file:** write the header, then the release sections newest first.
- **Updating:** insert the new section directly below the header, above the newest existing section. Append to `[Unreleased]` if that is the target and it already exists.
- **Never modify an existing dated release section.** Not to fix wording, not to add a milestone discovered later. A published release note is a record of what was announced; correcting it rewrites history readers already have. A correction belongs in the next release, stated as one.
- Preserve any hand-written content already in the file. This command adds; it does not take over.

Nothing is committed. Run `/ship` when the changelog is ready for review.

---

## Rules

| Rule | Why |
|---|---|
| **Idempotent** | A milestone already recorded is never added twice; re-running with nothing new writes nothing and says so. |
| **Released sections are immutable** | Rewriting an announced release desynchronises it from what readers already saw. |
| **Exclusions are always reported** | A silent omission is indistinguishable from a bug in this command. |
| **No commit messages** | Git describes the implementation; the changelog describes the product. |
| **No invented versions** | Pending work goes to `[Unreleased]` unless the user names a version. |
| **Product vocabulary wins** | `docs/product/` names the features; the changelog matches it, not the other way round. |
| **Nothing is committed** | `/ship` is the only command that commits, pushes, or opens a PR. |

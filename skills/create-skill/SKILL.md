---
name: create-skill
description: >
  Meta-skill for creating new Claude Code skills and commands.
  Guides the user through defining purpose, trigger phrases, behaviour, and scope,
  then writes the correct file to the correct location.
  Triggers when user asks to "create a skill", "create a command", "add a slash command",
  "automate this workflow", "make a skill that...", or describes a repetitive workflow
  they keep asking Claude to do manually.
  Also triggers proactively when the user has asked for the same type of task 2+ times
  in a conversation — suggest automating it with this skill. Invoked directly with /create-skill.
---

<!-- validate: allow-refs deploy, audit, scaffold, skill-name -->


You are acting as a Claude Code toolsmith. Your job is to design and write well-structured skills and commands so the user never has to describe the same workflow twice.

---

## When to trigger proactively

If the user has asked you to perform the same category of task more than once in this conversation (e.g. "review this file for X", "now do the same for Y"), suggest:

> You've asked me to do this more than once. Want me to create a skill or command to automate it so you can invoke it with a single slash command next time?

Only suggest once per conversation. Do not nag.

---

## Step 1 — Understand the workflow

Ask the user enough questions to fully understand what the skill should do. Do not write anything yet.

Ask:

1. **What does it do?** One sentence: what is the goal of this skill or command?
2. **How should it be invoked?** What slash command name do they want? (e.g. `/deploy`, `/audit`, `/scaffold`)
3. **What triggers it naturally?** What phrases would a user say that should auto-trigger this? (e.g. "deploy the app", "run an audit", "scaffold a new module")
4. **Is it a skill or a command?**
   - **Skill** — intelligent, multi-step behaviour with decision logic, conditionals, and stops for user input. Lives in a `SKILL.md` with a frontmatter description used for auto-triggering.
   - **Command** — a prompt/script that runs top-to-bottom with minimal branching. Simpler. Lives in a single `.md` file.
   - If unsure, recommend: use a skill when it needs to make decisions or ask questions; use a command when it follows a fixed sequence.
5. **User-level or project-level?**
   - **User-level** (`~/.claude/skills/` or `~/.claude/commands/`) — available in every project on this machine. Use for general-purpose workflows (code review, git ops, documentation).
   - **Project-level** (`.claude/commands/`) — only available in this project. Use for project-specific workflows (this project's deploy process, its specific OpenAPI workflow, etc.).
6. **What are the hard stops?** What conditions must be true before the skill can run? What missing files or states should cause it to stop and ask?
7. **What files does it read or write?** List them.
8. **Does it chain to other skills?** Should it invoke `/dev`, `/qa`, or another skill as part of its flow?

Gather all answers before proceeding to Step 2.

---

## Step 2 — Draft the skill or command

### If writing a SKILL

File location:
- User-level: `C:/Users/Matt-PC/.claude/skills/{skill-name}/SKILL.md`
- Project-level: `.claude/skills/{skill-name}/SKILL.md` (if the project has a skills dir)

Use this structure:

```markdown
---
name: skill-name
description: >
  One paragraph. First sentence: what it does.
  Second sentence: when it triggers.
  Trigger phrases: list the natural language phrases that should auto-invoke this skill.
---

Role statement: "You are acting as a [role]. Your job is to [goal]."

## Step 1 — [First phase name]

[What to do. What to read. What to check.]

[Hard stop conditions — when to stop and what to tell the user.]

## Step 2 — [Second phase name]

[...]

## Step N — [Final phase]

[What to report to the user when done.]
```

**Skill writing rules:**
- Lead every skill with a role statement so Claude has a clear perspective.
- Every hard stop must state: what triggers it, what to tell the user, and what they need to do to unblock.
- Gates between phases must be explicit — state "wait for user confirmation before continuing."
- Use second person imperative ("Read the file", "Ask the user") not passive ("The file should be read").
- Steps should be numbered and named, not just numbered. Names help Claude navigate long skills.
- Do not pad with generic advice. Every sentence must be an instruction.

---

### If writing a COMMAND

File location:
- User-level: `C:/Users/Matt-PC/.claude/commands/{command-name}.md`
- Project-level: `.claude/commands/{command-name}.md`

Use this structure:

```markdown
One sentence description of what this command does.

---

## Step 1 — [Phase name]

[Instructions. Bash blocks for commands to run. What to report.]

## Step 2 — [Phase name]

[...]
```

**Command writing rules:**
- Commands are linear — if a step requires complex branching or user Q&A, it should be a skill instead.
- Include exact bash commands with code blocks where shell execution is needed.
- State what to report to the user at the end of each major step.
- Hard stops are still allowed but should be rare — if a command has more than 2 hard stops, it should probably be a skill.

---

## Step 3 — Present the draft

Show the full draft to the user before writing any file:

> Here is the draft for `/skill-name`:
>
> [full file content in a code block]
>
> **Scope:** User-level (available in all projects)
> **Type:** Skill / Command
> **Invoked by:** `/skill-name` or phrases like "..."
>
> Does this look right? Any changes before I write it?

Wait for the user to confirm or request changes. Iterate until approved.

---

## Step 4 — Write the file

Write to the confirmed location. Report:

> Written to `~/.claude/skills/skill-name/SKILL.md`.
> Reload Claude Code for it to appear.
> Invoke with `/skill-name` or by saying "[trigger phrase]".

---

## Step 5 — Suggest related skills

After writing, briefly suggest if any complementary skill or command would complete a natural workflow:

- If the skill is a "create X" skill → suggest a "list X" or "delete X" command.
- If the skill is a "start workflow" skill → suggest a skill for the next phase.
- If the skill reads a file that doesn't have a creation skill yet → suggest one.

One suggestion max. Do not pad.

---

## Skill vs command quick reference

| Use a Skill when... | Use a Command when... |
|---------------------|----------------------|
| It needs to ask the user questions | It follows a fixed sequence |
| It has conditional logic (if X do Y, else Z) | Steps are always the same |
| It hard-stops on missing prerequisites | It has at most 1–2 hard stops |
| It chains to other skills | It is self-contained |
| It manages state in a file (MILESTONES.md, etc.) | It runs shell commands and reports |
| It needs a persistent role/persona | It is a one-shot operation |

## File locations quick reference

| Type | User-level | Project-level |
|------|-----------|---------------|
| Skill | `~/.claude/skills/{name}/SKILL.md` | `.claude/skills/{name}/SKILL.md` |
| Command | `~/.claude/commands/{name}.md` | `.claude/commands/{name}.md` |

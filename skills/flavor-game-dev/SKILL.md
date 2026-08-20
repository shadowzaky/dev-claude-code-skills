---
name: flavor-game-dev
description: >
  Game development flavor for the loop. Invoked by core loop skills — milestones, dev, qa,
  architecture, and /review-branch — when the project's ARCHITECTURE.md declares
  "Flavor: game-dev". Adds player-observable acceptance criteria, engine-layer separation,
  determinism and frame-budget QA checks, and game-specific review dimensions.
  Not typed directly by the user; the marker activates it. Users invoke /flavor-game-dev only
  to read what it enforces.
---

Game projects break the core loop's assumptions in one specific way: **the thing being validated is a running simulation, not a request/response**. A feature is correct when it feels right at 60 frames per second on the target hardware, which is not something a unit test asserts.

This flavor adds what that changes. Everything here is a default — **the project's `ARCHITECTURE.md` overrides any rule below** (ADR-0002). When a skill overrides one of these, it says so once rather than silently.

---

## Activation

Marker value: `game-dev`

```markdown
> Flavor: game-dev
```

For projects that ship an interactive real-time application: Godot, Unity, Unreal, Bevy, or a custom engine. Also applies to simulation-heavy tools with a frame budget.

Not for: game *backends* (matchmaking services, inventory APIs, leaderboards). Those are ordinary services and the core loop already fits them. A repo containing both should declare the flavor only if the client is the primary deliverable.

---

## Milestone criteria

Acceptance criteria must be **player-observable**. The player is the user, and the observable surface is what happens on screen and on the controller — not what a class does.

**Testable:**

```markdown
- [ ] Player can double-jump; the second jump is available only while airborne and only once per grounded state
- [ ] Damage numbers appear within 100 ms of the hit landing and never overlap the health bar
- [ ] Level 3 loads in under 2 seconds on the minimum spec target
- [ ] A dropped input during a frame spike is buffered and applied on the next frame, not discarded
```

**Not testable:**

```markdown
- [ ] Combat feels responsive          → whose feel, measured how?
- [ ] Movement is fun                  → not a criterion; a design goal
- [ ] Refactor the state machine       → a task
- [ ] Use a coyote-time buffer         → an implementation choice
```

Two additions to the core PM rules:

- **"Feel" criteria need a number.** "Responsive" becomes an input-to-response latency budget. If a quality genuinely cannot be reduced to a measurement, write it as an explicit **manual verification step** naming who checks it and on what hardware — never as an automated criterion nothing can prove.
- **Performance is a criterion, not a follow-up.** A milestone touching rendering, physics, spawning, or level loading states its frame-time and memory budget up front. Performance discovered at the end is a rewrite; performance stated at the start is a constraint.

---

## Dev standards

Layered on the core quality bar. Where the project's `ARCHITECTURE.md` specifies differently, follow it.

**Engine boundary**

- Game logic does not live in engine callbacks. `_process`, `Update`, `Tick`, and their equivalents parse input, advance state, and call into logic that can run without the engine loop.
- Logic that decides *what happens* is testable without a scene, a window, or a render target. If verifying a rule requires launching the game, the rule is in the wrong layer.
- Scene and node trees are composition, not logic. A node that both draws itself and owns the rules for whether it may act is doing two jobs.

**Frame budget**

- No allocation in the per-frame path. Pool anything spawned repeatedly — projectiles, particles, damage numbers, audio sources.
- No synchronous I/O in a frame: no file reads, no blocking asset loads, no network waits. Stream or preload.
- No per-frame search of a global collection. Cache the lookup or invert it into an event.
- Physics and simulation step at a fixed timestep; rendering interpolates. Frame-rate-dependent movement is a bug even when it looks fine on the dev machine.

**Determinism**

- Every random draw comes from an explicitly seeded generator, never a global one. A bug that cannot be reproduced from a seed cannot be fixed reliably.
- Simulation state never reads from wall-clock time; it reads from accumulated fixed steps.
- Save data is versioned from the first commit that writes it, with a stated migration path. Retrofitting a version field onto shipped saves is the expensive kind of mistake.

**Assets**

- Assets are referenced through identifiers or a manifest, not string paths scattered through code. A renamed file must fail at build or load, loudly.
- No asset binaries committed without the project's chosen large-file handling — state it in `ARCHITECTURE.md`.
- Placeholder art and debug scenes are marked as such and tracked as tasks. They ship otherwise.

---

## QA checks

In addition to the core QA pass — rules discovered, tests audited, criteria verified, suite green.

**Determinism**

- Simulation tests run from a fixed seed and produce identical results across runs. A flaky simulation test is a determinism bug, not a flaky test — do not retry it away.
- Save/load round-trips restore identical state. Verify with a real save file, not an in-memory object.

**Performance**

- Measure against the budget the milestone stated. No budget stated, no performance sign-off — send it back to PM.
- Measure on the minimum spec target, or state plainly that it was measured on dev hardware and the result is provisional. An unqualified number from a dev machine is misinformation.
- Check the allocation path for anything added to the per-frame loop this milestone.

**Playable verification**

- Some criteria can only be verified by playing. That is legitimate — record them in the QA report as manual steps, naming what was done, on what build, on what hardware.
- **Never mark a manual criterion verified without doing it.** "Presumably works" is a failed QA pass.

**Business rules in game terms**

Game invariants belong in `BUSINESS_RULES.md` like any other, with the same `BR-XXX` IDs. They read as rules about the simulation:

```markdown
### BR-021: A player cannot act while stunned
**Rule:** Input is consumed but produces no state change while the stun timer is above zero.
**Rationale:** Stun is the primary counterplay window; letting buffered input fire on recovery removes it.
**Validated by:** `tests/sim/status_effects_test` — "input during stun does not advance the action state"
```

Balance numbers are **not** business rules. A rule is "a stunned player cannot act"; the stun duration is tuning data, and encoding it as a rule makes every balance pass a spec change.

---

## Review dimensions

Added to `/review-branch`. Severity maps to the existing scale.

**Frame path** — `[BLOCKER]` for allocation in a per-frame loop, synchronous I/O in a frame, or a new per-frame scan of a global collection. These do not surface in review later; they surface as stutter in a build nobody can bisect.

**Determinism** — `[BLOCKER]` for an unseeded random source in simulation code or wall-clock time read by simulation state. `[CONCERN]` for a fixed-step assumption that is not enforced anywhere.

**Engine boundary** — `[CONCERN]` for game logic inside an engine callback that could live in testable code. `[BLOCKER]` when it makes a stated acceptance criterion impossible to verify without launching the game.

**Save compatibility** — `[BLOCKER]` for a change to a serialised structure with no version bump and no migration. Shipped saves cannot be un-broken.

**Asset references** — `[CONCERN]` for a string path to an asset where the project has a manifest or identifier system. `[MINOR]` for placeholder assets with no tracking task.

**Magic numbers** — the core rule applies, with a domain caveat: tuning values (damage, speeds, cooldowns) belong in data, not in code as named constants. Flag `[CONCERN]` when tuning is hardcoded in logic, and do not accept a `const` as the fix if the project has a data-driven tuning path.

---

## Architecture extensions

A project declaring this flavor carries these sections in `ARCHITECTURE.md`, in addition to the standard ones.

### Engine and target

- Engine and version, and the language layer used with it
- Target platforms and the **minimum spec** performance is measured against
- Target frame rate and the frame budget in milliseconds

### Simulation model

- Fixed timestep value and what runs on it versus what runs per rendered frame
- How determinism is maintained: seeding strategy, what may read wall-clock time
- What is authoritative in multiplayer, if applicable

### Scene and asset structure

- Scene or prefab organisation, and what a scene is allowed to own
- Asset directory layout and the naming convention
- How assets are referenced from code — manifest, identifiers, generated constants
- Large-file handling, and what may not be committed directly

### Data and tuning

- Where tuning data lives and its format
- How designers change values without a code change
- Save format, its versioning scheme, and the migration path

### Testing in an engine

- What is tested headlessly versus what requires a running engine
- How simulation tests are seeded and run
- What is verified manually, by whom, on which build
- The performance measurement procedure and where results are recorded

---

## Rules

1. **This flavor is defaults, not law.** The project's `ARCHITECTURE.md` overrides any rule here, and the overriding skill says so once.
2. **A criterion with no measurement is a manual step**, named as such, with hardware stated — never an automated criterion nothing can prove.
3. **Manual verification means someone played it.** Recording it as done without doing it fails the QA pass.
4. **Tuning is data, not rules.** Balance numbers never become `BR-XXX` entries.
5. **Nothing here removes a core gate.** Dev still cannot close a milestone; QA still discovers rules; `ARCHITECTURE.md` is still required.

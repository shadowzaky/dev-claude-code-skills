# Architecture Decision Records

Why the architecture is the way it is. Each record is immutable once accepted — a changed
decision means a new ADR that supersedes the old one, never an edit to the original.

Status: **Proposed** (awaiting `/adr-review`) · **Accepted** · **Rejected** · **Superseded** · **Deprecated**

| # | Title | Status | Date |
|---|---|---|---|
| [0001](0001-flavor-activation-marker.md) | Declare flavors with a marker in ARCHITECTURE.md | Accepted | 2026-08-20 |
| [0002](0002-project-architecture-overrides-flavor.md) | Project ARCHITECTURE.md overrides flavor rules | Accepted | 2026-08-20 |
| [0003](0003-flavors-ship-as-separate-plugins.md) | Ship domain flavors as separate plugins, enabled per project | Superseded by 0005 | 2026-08-20 |
| [0004](0004-plugin-skill-loading-unverified.md) | Plugin-registered skills do not load; ADR-0003's premise is unconfirmed | Accepted, superseded by 0005 | 2026-08-20 |
| [0005](0005-flavors-install-as-project-copies.md) | Install flavors as committed copies in the project's `.claude/skills/` | Accepted | 2026-08-20 |

# 0011: Research tree without resets; prestige deferred

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** #6
- **Decided by:** the user

## Context

asteroid-fleet has two reset layers: prestige pays research points into a
research tree, and the Admiralty pays Marks. This game keeps a persistent fleet
across an open-ended route of systems (ADR 0010), which already gives
long-term stakes. Reset layers tend to pull an RTS toward an idle game, but the
game still needs a sink for income and a way to unlock new modules and ship
types over time.

## Options

1. **None:** progression is only the fleet you build and keep.
2. **Research without resets:** spend income on permanent unlocks (modules,
   ship classes, carrier modules) that persist in the save.
3. **Full prestige:** reset the run for a meta currency, as asteroid-fleet does.

## Decision

Add a research tree with permanent unlocks and no run reset. Research state
lives in the sim and the save, like the fleet. The first nodes, their costs and
the research currency are settled in #56. Prestige is deferred, not rejected:
#57 revisits prestige and long-term balance once the tree and more systems
exist.

## Consequences

- Ship modules (#23) and carrier modules (ADR 0013, #59) can be gated behind
  research nodes.
- The save format gains research state, with a version bump and a reader for
  the previous version.
- A research panel joins the UI Toolkit HUD (ADR 0005).
- Revisit through #57 if late-game progress stalls or becomes trivial.

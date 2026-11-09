# 0013: Hangar types become carrier modules; implementation deferred

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** #10
- **Decided by:** the user

## Context

In asteroid-fleet the hangars are the autobattler board: slot sizes per ship
class, launch order per hangar, hangar types (launch bay, cargo bay, dry dock,
fabrication bay) and adjacency synergies. This game is an RTS with a build
queue, squadrons and direct orders (ADR 0009), so the board's spatial puzzle
doesn't carry over directly.

## Options

1. **Drop it:** a plain build queue and a fleet cap.
2. **Simplify:** carrier capacity in slots, with ship sizes; no adjacency.
3. **Carrier modules:** hangar types become upgrades you fit to the carrier,
   in the spirit of Homeworld's carrier and mothership modules.

## Decision

Hangar types become carrier modules that the player fits to the carrier. There
is no slot board, launch order or adjacency synergy. Implementation is deferred
to #59, which pairs the modules with a pass over the whole HUD that takes cues
from the Homeworld series' interfaces (with an original look). Until then the
build queue and fleet stay as they are.

## Consequences

- Module effects (launch rate, cargo, repair, build speed) and their unlocks
  are designed in #59, and can be gated by research (ADR 0011, #56).
- The HUD pass in #59 must keep the existing controls (ADR 0006, 0007, 0009).
- The save gains fitted modules when #59 lands.

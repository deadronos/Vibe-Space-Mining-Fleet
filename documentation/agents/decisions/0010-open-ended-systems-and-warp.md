# 0010: Open-ended route of revisitable systems

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** #5 (run structure), #18 (systems and warp)
- **Decided by:** the user

## Context

The fleet needs a structure beyond one asteroid field that fits deterministic
saves and the automation-focused asteroid-fleet design. A system map or an
authored campaign would introduce substantially more content and mechanics.

## Options

1. **Open-ended route:** seeded systems with richer resources and greater
   danger further out; the fleet can revisit fields.
2. **System node map:** a strategic network with neighbouring sectors and
   reinforcements, requiring a separate strategic layer.
3. **Mission campaign:** authored objectives and a persistent fleet, requiring
   substantial mission content.

## Decision

Use an open-ended route of seeded systems, roughly following asteroid-fleet.
There is no fixed end to the route. Start with two connected, revisitable
systems, leaving room for later destinations. Only one field runs at a time;
each field retains its state while the fleet is away. The second system has
richer ore and stronger pirate pressure.

Starting warp charges the drive and automatically recalls the fleet. Show the
countdown and ships still outside, and allow cancellation before departure. Only
docked ships carry over; ships that miss recall are lost. Tune the default
charge window so normal deployments rarely miss it. Players can avoid that
risk by recalling first, waiting for the HUD to show everyone aboard, and then
starting warp. Recall and docking cover miners, logistics ships and combat
squadrons. Fleet and resources carry between systems; field state, including
ore depletion and surveyed veins, belongs to each system. Existing saves must
migrate.

## Consequences

- #18 delivers a round trip between the first two systems with independent
  persisted fields and save/load between jumps.
- The route can grow without requiring a strategic map or authored campaign.
- Map revelation, later destinations and any eventual end condition beyond the
  open-ended route remain future design work. Carrier defeat continues to use
  the retreat rule in [0008](0008-pirate-waves-and-carrier-loss.md).

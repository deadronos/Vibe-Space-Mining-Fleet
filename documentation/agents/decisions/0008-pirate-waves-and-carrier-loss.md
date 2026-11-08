# 0008: Pirate waves first; a destroyed carrier jumps home and loses the fleet

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #9 (enemy design), for #16 (phase 4) and #21 (cargo heat)
- **Decided by:** the user (pirates first; the carrier can die; when it does, it retreats and the fleet is lost)

## Context

Phase 4 needs an opponent. #9 listed pirate waves (asteroid-fleet), a rival mining faction, or both. Combat also raises what happens when the player loses: the run structure (#5) and meta-progression (#6) are still open.

## Options

**Enemy**

1. **Pirate waves.** Simple AI that fits the logistics game: waves scale with cargo heat and distance, and go for full barges.
2. **A rival faction** with its own carrier, mining and expansion. A real RTS opponent, but much more AI work.
3. **Both, staged.**

**Losing the carrier**

1. **The carrier can't die.** No game over.
2. **Run over:** a summary screen, then a new game.
3. **Retreat:** the carrier jumps home at zero hull and the fleet in the field is lost. There's no game over, and it leaves room for a roguelike prestige later.
4. **Revert to the last save.**

## Decision

**Pirate waves now.** A rival faction stays possible as a later phase.

**Waves:**

- The first wave comes at 240 s.
- Each wave is announced 30 s ahead. The HUD shows a banner and a marker where it will appear.
- The next wave is scheduled only once the last one is beaten.
- The time until the next wave runs from 210 s down to 100 s as heat or distance from home rises.

**Wave size** is

```
2 + 0.5 × waves so far + 6 × heat + 4 × distance
```

capped at 24. In it:

- **heat** is ore held in drones out of the hangar, barges and haulers, divided by 5,000 t;
- **distance** is the carrier's distance from home divided by 400.

**Origin:** a wave appears 240 units away from the fullest barge out in the field (one at least a quarter full), or from the carrier if there is none.

**Raider targets:**

- A raider turns on any squadron that comes within 35 units.
- Otherwise it scores each target by distance × weight, where f is the target's cargo fraction:

  | Target | Weight |
  | --- | --- |
  | Barge | 1 − 0.75 f (a full barge is 0.25) |
  | Hauler | 1.1 − 0.6 f |
  | Drone | 1.3 |
  | Carrier | 1.8 |

- So full barges go first, then laden haulers.
- A raider keeps fighting until it is destroyed.

**The carrier:**

- It has 4,000 hull and four point-defence turrets (7 dps each, range 55).
- It regains 8 hull/s while no raider is within 150 units.
- Barges and haulers beside the carrier repair at 10 hull/s for free. Drones are patched up when they dock.
- A drone hit while on automation runs for the carrier.

**When the carrier reaches zero hull, it jumps home:**

- **Lost:** every drone outside the hangar, every barge and hauler, every squadron not docked, the raw ore and the build queue.
- **Kept:** refined ore, drones in the hangar and docked squadrons.
- The carrier comes back with full hull. The wave count drops by 2, and the next wave is 240 s away.
- The hangar is topped up to half the starting fleet, so the game can always go on.
- Separately, if every drone is lost, none is queued, and there isn't enough ore to buy one, the hangar gets one free drone.

**Destroyed units keep their slot** in the sim's lists (`Dead = true`). Orders, control groups and views hold indices, and these stay valid. The next unit of that kind built takes the slot. Selection and groups drop dead units.

**Save version 3:**

- It adds hulls, destroyed units, squadrons, raiders, waves and `of` on orders.
- Version 2 saves still load. Every unit gets a full hull, you get the starting squadron, and a fresh wave timer starts.
- The bridge's `ready` event now says `minSaveVersion`, and the page accepts any version from that to `saveVersion`.

## Consequences

- Run structure (#5) is still open, but a carrier loss is now a setback rather than an ending. A roguelike prestige can hang off the retreat later (#6).
- Heat (#21) is in, as ore held in the field. The defence panel shows it as a meter, and it drives wave size and timing.
- An idle player is under pressure. In a 40-minute headless run on automation:
  - with one squadron, early waves are beaten, then drones start to fall at wave 5 and the squadron dies by wave 9;
  - with three squadrons, about 8 drones were lost and nothing else.
- Tuning lives in `CombatSettings` (`FleetConfig.combat`). Tests use `CombatSettings.Peaceful` (no waves) unless they test waves.

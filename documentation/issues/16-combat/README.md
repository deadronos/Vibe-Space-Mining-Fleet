# #16 Phase 4: combat

GitHub: [#16](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/16).

This also settles [#9](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/9) (enemy design, [ADR 0008](../../agents/decisions/0008-pirate-waves-and-carrier-loss.md)). It covers most of [#21](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/21) (cargo heat) and the first part of [#20](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/20) (stances, [ADR 0009](../../agents/decisions/0009-squadrons-stances-formations.md)).

| | |
| --- | --- |
| git branch | `feature/16-combat` |
| UVCS branch | `/main/feature-16-combat` |
| Changeset | `cs:20` (30 added, 22 changed, 2 deleted; the deletes are the Volume profile the scene builder recreates) |

## Decisions (the user)

- **Opponent:** pirate waves first. A rival faction may come later.
- **Carrier loss:** the carrier can be destroyed. It then jumps home and the fleet in the field is lost; refined ore is kept. That could set up a roguelike prestige later.
- **Repair:** the carrier regains hull slowly when no raider is near.
- **Scope:** all of #16 in one pass, with simple per-squadron stances. The fleet and ship-class scopes stay in #20.

## What's in it

**Sim** (`Sim/FleetSim.Combat.cs`, new types in `SimTypes.cs`):

- `SimSquadron` and `SimPirate`.
- Hulls on the carrier, barges, haulers and drones.
- `CombatSettings` (`FleetConfig.combat`).
- Waves with warning, size and interval from heat and distance.
- Raider targeting: full barges first.
- Squadron automation: guard the carrier, chase within reach, dock to repair.
- Attack, escort and dock orders; stance and formation commands.
- Turrets, carrier regen, and dock repair for barges and haulers.
- Destroyed units keep their slot, and new builds reuse it.
- The carrier-loss retreat, and a free drone when the fleet is gone.
- Save version 3, which also loads version 2 saves.

**Views:**

- `SquadronView`: five fighters in formation, spread by stance.
- `PirateView`.
- `CombatFx`: pulsing beams for fighters, raiders and turrets, and explosion bursts.
- Turret domes on the carrier.
- Destroyed drones, barges and haulers are hidden.

**Controls** (`OrderController`, `SelectionController`):

- Right-click a raider to attack it, your barge or hauler to escort it, or the carrier to dock and repair.
- The hover hint shows Attack, Escort and "Unload + escort".
- Squadrons can be selected, go in control groups (shown as "S") and show path lines.
- Raiders can be picked with the pointer.

**HUD:**

- A defence panel: carrier hull, heat, the next wave or "under attack", and squadron count.
- A Squadron build button.
- Stance and formation buttons while squadrons are selected.
- Squadron rows in the selection list.
- Hull bars on raiders and on damaged selected units.
- An incoming-wave marker, pinned to the screen edge when the spawn point is off screen.
- A banner for combat news.

**Web:**

- The bridge state gains `squadrons`, `pirates`, `wave`, `retreats`, `carrierHull`, `carrierHullMax`, `heat` and `nextWaveIn`.
- `ready` gains `minSaveVersion`.
- The page loads any save from `minSaveVersion` to `saveVersion`.

## Tuning and measurements

**40 minutes headless,** on automation only. The bot queues a drone each minute and rebuilds squadrons up to its target.

| Squadrons kept | Result |
| --- | --- |
| 1 | Early waves beaten. Drones start to fall at wave 5 (13 lost by 23 min). The squadron is down to 2 fighters by wave 8 and dies at wave 9. |
| 3 | 10 waves, about 8 drones lost and nothing else. |

The first pass had fighters at 45 hull and 6 dps. One escorting squadron lost to 4 raiders, so fighters went up to 60 hull and 9 dps. Two more fixes came from the headless run:

- Squadrons on automation now dock to repair; without that they wore down wave after wave.
- Drones that are hit now run for the carrier.

**Perf:** 0.085 ms per tick with 114 drones, 8 squadrons and 24 raiders fighting (Editor). Phase 3 measured 0.055 ms at 500 ships.

## Tests

50 EditMode tests in total; 22 of them are new in `CombatTests.cs`:

- an escorting squadron beats a 4-raider wave at a far full barge;
- ignoring the wave costs the barge;
- raiders prefer a full barge over a closer empty one;
- passive holds fire and neutral fires;
- aggressive chases further than neutral;
- evasive breaks off to repair;
- docking repairs and replaces fighters for ore, and waits when there is no ore;
- an attack order chases beyond reach and kills;
- several squadrons move in formation, and formation slots are distinct;
- hold and stop work on squadrons;
- a squadron is built in the queue;
- carrier loss sends it home, loses the field fleet and keeps refined ore, and a lost slot is reused;
- the carrier regains hull out of combat;
- turrets defend the carrier;
- heat and distance raise wave size and shorten the interval;
- a wave is announced, arrives and clears;
- combat is deterministic;
- a save and load mid-battle continues identically;
- a version 2 save loads with full hulls and the starting squadron;
- losing every drone with no ore gets a free one.

## Checked in the browser

On the web build in Chrome with WebGPU, using DOM mouse events on the canvas:

- box-select picks up the squadron, with its ring and the tactics buttons;
- clicking its row in the selection list selects only it;
- Aggressive and Wall switch, and the row and button highlight update;
- right-clicking the hauler shows the "Escort" hint, draws the escort line and the row reads "escorting hauler 1";
- the wave warning shows ("Wave 1 incoming in 0:24: 2 raiders"), then the "Pirates are here" banner, then "Wave beaten" about 12 s later with nothing lost;
- no console errors.

In Editor play mode: beams, explosions, raider hull bars and the "Squadron 1 destroyed" banner.

**Not checked by hand:**

- right-clicking a raider: the first wave died off screen before I could;
- Shift+1 with the squadron: the synthetic key didn't reach the canvas;
- the wave marker pinned to the screen edge after it was moved above the panels (it was hidden behind the left panel before);
- a carrier loss in the browser;
- loading a real version 2 save from `localStorage`.

## Notes

- A raider fights until destroyed. An undefended fleet loses drones and then barges, but turrets keep raiders away from the carrier itself unless the wave is big.
- `FleetSim.TurretMounts` must match the turret domes in `MiningFleetSceneBuilder.CreateCarrier`.
- The UI Toolkit rule from ADR 0005 holds: marker positions are set from C#, the rest is styled with USS classes.

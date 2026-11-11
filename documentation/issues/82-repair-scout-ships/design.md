# Repair and scout ships: design

Written 11 Nov 2026 with the user. Builds on #14 (Foundry models, ADR 0017, PR #81). GitHub issue: #82.

## Intent

The fleet has miners, logistics and fighters, but nothing that looks after the fleet in the field, and surveying is a manual drone chore whose payoff is invisible. Two support ships fill that:

- **Repair ship:** keeps the fleet flying without trips back to the carrier. On automation it goes to damaged friendly ships and repairs their hull with a blue beam.
- **Scout:** surveys the belt on its own, finding veins. Veins now pay: a drone that finishes a load on a vein rock gets a **vein strike**, a bonus chunk of ore.

Success: you build one of each, leave them on automation, and see a damaged barge get patched up mid-wave, and gold bonus loads coming back from rocks your scout found.

## Goals

1. Two new buildable ship classes, Repair and Scout, using the Foundry models already imported (`foundry_repair.glb`, `foundry_scout.glb`).
2. Both work on automation by default and take direct orders like every other unit (ADR 0016: orders first, then automation).
3. Veins give a vein strike, and veins are visible in the world and in the sensors view.
4. Saves keep the new ships and vein state; old saves still load.

## Non-goals

- Harvester and gas giants (#25), hazards (#24), ship modules (#23).
- New research nodes for repair or scouting. Existing `SurveyRange` research applies to scouts.
- Rule cards for the new classes.
- Rebalancing existing units.

## Anti-goals (a failure even if it works)

- **Free healing.** Repair costs refined ore, at the dock's price, so it never beats docking for cost.
- **Every repair ship piling onto the same target** while others burn.
- **Vein strikes that drain rocks faster.** A strike is a find, not faster mining.
- **Notice spam.** No event-log line per strike.
- Breaking the deterministic fixed-tick sim (ADR 0001) or old saves.

## Decided with the user

| Point | Decision |
| --- | --- |
| Split | Models PR first (#81), these ships second |
| Repair behaviour | On automation, flies within range of damaged friendly ships and repairs hull with a blueish beam |
| Repair under fire | Keeps repairing by default (fire stance **Stand** at class scope); the player can change it |
| Scout behaviour | Tours the belt surveying for veins |
| Vein payoff | **Bonus ore drop** when a drone completes a load on a vein rock, shown as the vein strike below |
| Harvester | Not now |

## Behaviour

### Repair ship

- **Build:** Build menu, 1,500 refined ore, build time like a hauler. Launches from the carrier's bay like other built ships.
- **Hull:** 200 (between a drone and a hauler).
- **Automation:**
  1. Every second or so, pick a target: the friendly unit within **search range (150)** of the repair ship with the lowest hull fraction below 100%. Friendly units are drones, barges, haulers, squadrons and the carrier. Prefer a target no other repair ship has claimed; claim it while repairing.
  2. Fly to **beam range (20)** of the target, matching its movement, and repair at **15 hull/s**, paying **2.5 refined ore per hull point** (`CombatSettings.repairCost`). With no refined ore, stop repairing and hold.
  3. Stop when the target is at full hull, dead, docked, or out of search range; pick again.
  4. With nothing to repair, return to and hold station near the carrier.
  - Squadron hull is the sum of its fighters, so repairing it brings fighters back; that is consistent with docking, which replaces lost fighters for the same price.
- **Under fire:** fire stance axis. Class default **Stand**: keep repairing. Flee and Retreat behave as for haulers (`ShouldFlee`): drop the target and run for the carrier.
- **Direct orders:** Move; **Repair** a unit (right-click a friendly ship with only repair ships selected); Stop and Hold as usual. After a Repair order the target is repaired to full, then the ship goes back to automation.
- **Look:** a pulsing blue beam from the ship's nose to the target while repairing (`CombatFx`, new colour in `FleetPalette`).

### Scout

- **Build:** Build menu, 800 refined ore, short build time.
- **Hull:** 80. Fast: about 1.5× a hauler's speed.
- **Automation:**
  1. Pick the nearest active rock that is not **surveyed** (new per-rock flag, cleared when a rock respawns).
  2. Fly to it, hold for a **2 s scan**, then run the existing `FleetSim.Survey(center)`: it marks rich rocks within `SurveyRadius` as veins, emits `SurveyComplete` (the "Survey complete, N new veins" notice), and earns Data. Every active rock within the radius becomes surveyed.
  3. Repeat. With every rock surveyed, hold near the carrier and wait for respawns or a new system.
  - Survey notices from scouts on automation: keep them, since a survey finds veins only a few times per system. If testing shows them to be noisy, show only surveys that found veins.
- **Under fire:** class default fire stance **Flee**.
- **Direct orders:** Move, and the existing Survey order (V or the sensors panel's Survey button, then right-click a rock), which now works for scouts as well as drones.
- **Look:** while scanning, an expanding cyan ring at the survey radius.

### Veins and the vein strike

- **Visible veins:** a vein rock gets a gold glint in the world (emissive tint or a small sparkle) and a gold marker in the sensors view. Today veins only show in the notice, which makes scouts' work invisible.
- **Strike:** when a drone's load completes on a vein rock (automation or a Mine order), its cargo becomes **150% of capacity**. The bonus 50% does not come out of the rock.
- **Look:** a burst of gold sparks at the rock, and the drone's engine trail turns gold until it unloads.
- **Count:** a new "from veins" line in the HUD's ore chain panel, the total bonus ore found (`VeinOre`, saved).
- A rock stays a vein until it is mined out or respawns.

## Numbers (starting points, in settings)

| Setting | Value |
| --- | --- |
| Repair cost / build | 1,500 / like hauler |
| Repair hull, speed | 200, like hauler |
| Repair search range, beam range | 150, 20 |
| Repair rate, price | 15 hull/s, 2.5 refined/hull |
| Scout cost / build | 800 / short |
| Scout hull, speed | 80, 1.5× hauler |
| Scan time | 2 s |
| Vein strike bonus | +50% of drone capacity |

## Constraints

- Deterministic plain-C# sim at 20 Hz (ADR 0001); views read the sim only.
- Save format change: bump `SimSave.CurrentVersion` (9 → 10); version 9 saves still load with no support ships, no surveyed flags, `VeinOre` 0 and the class stance defaults applied. Extend the save round-trip test. Mirror new fields in `web/src/protocol.ts` (`documentation/agents/cross-boundary-changes.md`).
- Enums saved as int are append-only: `UnitKind` gets `Repair`, `Scout`; `OrderKind` gets `Repair`; `TargetKind` gets the new target kind; `SimEventKind` gets a vein strike event if the views need one.
- Web build size: models are already imported; no new packages.
- Both renderers (WebGPU, WebGL2) and touch (ADR 0015: a tap orders where a right-click would).

## How it gets built (the builder's call, with these recommendations)

- **One support unit type with a role**, not two full unit types. A unit type is threaded through about 30 files (commands, selection, picker, context orders, overlays, HUD, saves, bridge, damage, pirate targeting). Recommended: `SimSupport : SimUnit` with `Role` (`UnitKind.Repair` or `UnitKind.Scout`), one `Supports` list, one `TargetKind.Support`, one `Supports` array on `FleetCommand`, one `SupportView`. `UnitKind` still has both values, so build costs, class stances and the HUD treat them as two classes.
- Class stance defaults: the class scope for Repair starts with fire = Stand, for Scout fire = Flee (`StanceSet.Applies` lets the Fire axis apply to both).
- Pirates may target support ships with hauler-like priority.
- Prefabs: `MiningFleetSceneBuilder` builds `Repair.prefab` and `Scout.prefab` with `FoundryHulls.Build` and a slot map in the style of the other classes (choose colours that read apart from haulers and fighters: suggestion, repair white with blue glow, scout pale green with cyan glow).
- Tests (EditMode): repair picks the most damaged target in range and spreads across targets; repair costs refined ore and stops at zero; fire stance Stand vs Flee under damage; scout surveys each patch once and stops when all are surveyed; surveyed flags reset on respawn; vein strike gives 150% and leaves the rock's ore unchanged; save round trip v10 and loading a v9 save.

## Settled during review (Claude's calls; change them if they're wrong)

- Repair ships also repair scouts and other repair ships, never themselves.
- Warp and fleet recall: support ships go aboard like haulers. When the carrier is destroyed and jumps home, they are lost like the rest of the field fleet.
- The vein strike happens only when a load fills to capacity on a vein rock, not when a drone heads home early (far-out unload card, Safe mining, under fire).
- The throughput estimate (`ThroughputReport`) ignores vein strikes; the "from veins" line shows what they actually earned.
- Gold glint on vein rocks and gold sensors markers: added so the scouts' work is visible; not discussed in detail.

## Left open (builder decides, then records)

- Exact visuals: the glint, the ring, the spark burst.
- Whether scout survey notices need filtering after playtesting.
- Exact build times.

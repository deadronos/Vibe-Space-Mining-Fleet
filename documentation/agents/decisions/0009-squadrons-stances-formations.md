# 0009: Fighter squadrons, stances and formations

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** #16 (phase 4), first part of #20 (stance scopes)
- **Decided by:** the user (all of #16 in one pass, with simple stances; fleet and ship-class scopes for #20 later)

## Context

#16 asks for:

- fighters in squadrons that act as one unit;
- Homeworld-style stances and formations;
- an attack order;
- docking to repair.

#20 wants stances resolved by scope (fleet → class → group) with direct orders on top. That's more than phase 4 needs.

## Decision

**Squadrons:**

- A squadron is one unit with 5 fighters (60 hull and 9 dps each). Its hull is the sum of its fighters' hull, so losing hull loses fighters, and its damage scales with the fighters left.
- You build squadrons in the queue: 1,200 refined ore, 20 s, at most 8. You start with one.

**Docking:**

- A docked squadron repairs at 30 hull/s for 2.5 refined ore per hull point. That includes replacing lost fighters.
- With no ore, it waits in the bay.
- It launches once repaired, or straight away if it's given another order.

**Automation (no orders):**

- A squadron guards the carrier and chases raiders within reach of it.
- A damaged squadron docks to repair once no raider is within reach of the carrier.

**Orders** (right-click with squadrons selected):

| Right-click on | Order |
| --- | --- |
| A raider | **Attack** it. This chases beyond reach, and even a passive squadron fires. |
| Your barge or hauler | **Escort** it. It guards that unit instead of the carrier. If drones are selected too, they unload at the barge. |
| The carrier | **Dock** and repair. |
| Empty space | **Move.** It fires at raiders in range but doesn't chase. |

- S, H and A work as in [0007](0007-stop-hold-and-escape.md). A held squadron fires at what comes in range but doesn't move.

**Stances** (one per squadron, set with buttons while squadrons are selected):

| Stance | Reach (× guard radius 70) | Damage dealt | Damage taken | Formation spread |
| --- | --- | --- | --- | --- |
| Aggressive | 1.6 | ×1.25 | ×1.25 | ×1.4 |
| Neutral (default) | 1 | ×1 | ×1 | ×1 |
| Evasive | 0.7 | ×0.7 | ×0.6 | ×0.7; breaks off to repair below 40% hull |
| Passive | 0 (never chases) | none unless ordered to attack | ×0.8 | ×1 |

- The spread follows HW2: aggressive spreads out, evasive tightens.
- A direct order overrides the stance while it runs (#8, #20).

**Formations:**

- There are three: Delta (a V), Wall (a line abreast) and Sphere. Each is a set of slot offsets (`FleetSim.FormationSlot`).
- The slots lay out the fighters inside a squadron, as visuals only.
- They also spread several squadrons that are given one move order, facing the way they travel. The formation of the first squadron selected is used.

## Consequences

- **Not in this pass:** the fleet and ship-class scopes, and stance axes for miners (#20: "safe" mining, retreat at X% hull). #20 stays open for them. The one under-fire rule miners have is that a drone hit on automation runs for the carrier.
- Only squadrons fight. Barges, haulers and drones have hull but no guns.
- **Engagement model:** fighters are not individual sim units. A squadron is a point with a hull pool, and the fighters are laid out around it by `SquadronView`. Damage is continuous within weapon range, with no projectiles. This keeps the sim cheap (Burst isn't needed, see #37). Formations have no combat effect beyond spread.

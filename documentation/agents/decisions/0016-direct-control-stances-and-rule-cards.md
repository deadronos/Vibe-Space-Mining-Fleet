# 0016: Direct control, stance scopes and rule cards

- **Status:** Accepted
- **Date:** 2026-11-10
- **Issue:** #8 (settles it), #20 (stance scopes), #19 (rule cards)
- **Decided by:** the user (in chat, 10 Nov 2026: scope, after-order behaviour, precedence, sim-side groups, miner axes, unit overrides, the four presets and what "far out" does, one Fleet tab; accepted the draft as written)

## Context

Phase 2 shipped a hybrid: every selectable unit takes direct orders and falls back to automation when its queue is empty. [0007](0007-stop-hold-and-escape.md) added Stop and Hold, and [0009](0009-squadrons-stances-formations.md) gave squadrons a per-unit stance. #8 still asked whether miners take direct orders at all, what combat ships do after an order, and how stances (#20) and rule cards (#19) rank against a direct order.

Constraints:

- The sim is deterministic on a fixed tick ([0001](0001-deterministic-fixed-tick-sim.md)): everything a stance or card changes must come in as a `FleetCommand` and live in the save.
- Control groups lived in `SelectionController` (view side) and were cleared on load ([0006](0006-control-group-keys.md)), so the sim couldn't resolve a group scope.

## Options

For each question the user chose from two or three options in chat:

1. **After an order**, combat ships go back to automation (chosen), hold where the order ended (Homeworld), or it depends on the order.
2. **Precedence**: order > card > scopes (chosen), cards above orders, or cards only where no stance is set.
3. **Group scope**: move control groups into the sim and the save (chosen), drop the group scope, or apply a group stance to its units once without saving it.
4. **Miner axes**: mining and under-fire (chosen), mining only, or mining, under-fire and "unload first".
5. **Selection buttons** set a unit override (chosen), or stances are set only by scope.

## Decision

### Direct control (#8)

- **Every unit keeps taking direct orders**, miners included. Stances and cards shape automation; they never stop the player giving an order.
- **After its last order, every unit returns to automation**, combat ships included. A squadron goes back to guarding the carrier. **H** (Hold) is how you park a unit.
- **Hold counts as an order** for precedence. A held unit ignores stances and cards until its next order, **S** or **A**. Changing a stance does not release a hold; the new stance applies once the unit is back on automation.

### Precedence

For each unit and each axis, the first of these that applies wins:

1. a **direct order** in its queue, or Hold;
2. an enabled **rule card** whose scope covers the unit (cards change behaviour, not stance values);
3. the **unit override** (set from the selection);
4. a **control group** stance, from the lowest-numbered group the unit is in that sets this axis (1 before 2 … before 0);
5. the **class** stance (drones, haulers, squadrons);
6. the **fleet** stance, which always has a value.

Every scope below the fleet can be **Default** (inherit) per axis.

### Stance axes (#20)

| Axis | Applies to | Values (fleet default first) |
| --- | --- | --- |
| Engagement | squadrons | Neutral, Aggressive, Evasive, Passive (as in 0009) |
| Mining | drones | **Greedy**: any rock, as today. **Safe**: only rocks within 80 of the carrier or 45 of an active squadron |
| Under fire | drones, haulers | **Flee**: run for the carrier. **Stand**: keep working. **Retreat**: flee only below 50% hull |

- A Safe drone with no safe rock to mine goes home and stays docked; auto-launch skips it until a safe rock exists.
- **Haulers gain the flee rule.** A hauler hit on automation drops its job and heads for the carrier with its cargo, then goes back to work. Before this a hauler had no under-fire rule. Set haulers to Stand to get the old behaviour.
- Barges have no automation, so no axis applies to them.

### Control groups move into the sim

- The ten groups are sim state. Assigning a group is a `FleetCommand`; recalling one is still a view-side selection.
- They are saved, so **groups now survive a load** (this replaces that part of 0006).
- A destroyed unit leaves every group in the sim, so a reused slot never inherits a dead unit's group.
- Each group carries its own stance set (one value or Default per axis).

### Rule cards (#19)

- A card is a **preset**, a **scope** (fleet, a class, or a group) and an **on/off** switch. Up to 12 cards; the player adds, removes, toggles and reorders them. Presets only: no custom conditions yet.
- Cards only steer units on automation (no orders, not held).
- The four presets:

| Card | Units | Effect while the condition holds |
| --- | --- | --- |
| Wave warned → escort barges | squadrons | From the wave warning until the wave is cleared, squadrons guard the live barges (spread across them) instead of the carrier |
| Wave warned → drones dock | drones | From the warning until the wave is cleared, drones go home and stay docked |
| Barge ≥ 80% → call hauler | haulers | A barge at 80% or more is a job even below the usual minimum load, and it comes before other barges |
| Drone far out → unload at barge | drones | A drone more than 100 from the carrier unloads at the nearest usable barge once it is half full, instead of filling up |

- With presets that each touch one behaviour, cards can't contradict each other, except that "drones dock" beats "unload at barge" (a docking drone doesn't unload out there). Card order is kept and saved for when custom cards can conflict: then the most specific scope wins, then the card higher in the list.

### UI

- A fourth **Fleet** tab in the manager, next to Build, Research and Modules, with a rail button and a key. At the top, a scope picker (Fleet, Drones, Haulers, Squadrons, Groups 1 to 0) and the axes for that scope. Below it, the card list and the presets to add.
- The selection panel shows unit-override buttons for the axes that apply to the selected units, with Default to clear them, and the effective stance with where it comes from.

### Save

- `SimSave.CurrentVersion` becomes 8: control groups, fleet/class/group stances, unit overrides and the card list.
- A version 7 or older save loads with no groups, no cards and fleet defaults. A squadron whose saved stance isn't Neutral keeps it as a unit override.

## Consequences

- #8 is settled. #20 and #19 are built on this branch.
- Groups surviving a load means group stances and group-scoped cards keep working after a reload.
- Haulers fleeing under fire is a balance change. Watch for haulers that never finish a run during long waves.
- Custom cards (conditions, actions, parameters) are a follow-up. The card model already stores a scope and an order for them.
- Revisit if players want combat ships to hold after a move (Homeworld style): that would be a new engagement value or a per-order flag, not a change to the precedence.

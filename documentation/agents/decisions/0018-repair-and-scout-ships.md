# 0018: Repair and scout ships as one support unit type; veins pay with a vein strike

- **Status:** Accepted
- **Date:** 2026-11-11
- **Issue:** none yet (see `documentation/issues/repair-scout-ships/`)
- **Decided by:** the user (behaviour, vein payoff, under-fire default), Claude (unit model, numbers), in the design review

## Context

The fleet had no way to repair ships in the field, and surveying was a manual drone order whose result (veins) only biased rock choice. Every unit type in the sim is threaded through about 30 files: commands, selection, picking, context orders, overlays, HUD, saves, the bridge, damage and pirate targeting.

## Options

1. **Two full unit types** (`SimRepair`, `SimScout`): clean names, but every one of those 30 sites twice.
2. **One support type with a role** (`SimSupport.Role`): one list, one `TargetKind`, one command array, one view type; `UnitKind` still has both values, so build costs, caps, class stances and the HUD treat them as two classes.
3. **Vein payoff as faster mining** vs **a bonus chunk on a full load**.

## Decision

- Option 2: `SimSupport` with `Role` = `UnitKind.Repair` or `UnitKind.Scout`, one `Supports` list, `TargetKind.Support`, `FleetCommand.Supports`, `SupportView`. Behaviour in `FleetSim.Support.cs`, numbers in `SupportSettings`.
- Repair ships repair the most damaged friendly ship in range at the dock's price in refined ore; class fire stance **Stand** (keep repairing under fire). Scouts survey rocks not surveyed since they spawned; class fire stance **Flee**.
- **Vein strike** (the user's choice): a full load from a vein rock adds 50% of capacity on top, not taken from the rock. Shown as gold sparks, a gold trail until unloaded, gold vein rocks and a "From veins" total.
- Save version 10; versions 2 to 9 still load, with the new classes' default stances.

## Consequences

- New support roles (the harvester for #25, a tug for #26) can be a new `Role` value with its own automation, without touching the plumbing again.
- Code that switches on `UnitKind` for support ships must handle both values (`Repair`, `Scout`), and code that indexes by `TargetKind` uses `Support`.
- A repair target is any friendly unit except the ship itself; claiming spreads repair ships across targets.
- Revisit if a support role needs data the others don't (cargo, modules): split it out then.

# Code quality 1/4: extract duplicate logic into helpers

[GitHub issue #71](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/71). Phase 1 of the code-quality pass (#71 helpers, #72 magic values, #73 file splits, #74 folder layout).

- **UVCS branch:** `/main/feature-71-duplicate-helpers`, from cs:58. Changeset: cs:59 (14 changed, 2 added: `UnitViewMotion.cs` and its `.meta`). Merged to `/main` as cs:60.
- **Git:** these notes only.

## What changed

The code moved, but behaviour should be the same. Save format, tuning values and tests are unchanged.

**Sim (`Scripts/Sim`).**

- `SimTypes.cs`: new `abstract class SimUnit` with `Index`, `Position`, `PrevPosition`, `Velocity`, `Hull` and `Dead`. `SimDrone`, `SimBarge`, `SimHauler`, `SimSquadron` and `SimPirate` derive from it and no longer declare those fields. `Groups` stays on the four classes that have it (pirates don't).
- `FleetSim.cs`:
  - `CountLive<T>`, `InRange<T>` and `TryLive<T>(list, i, out unit)` replace the hand-written `i < 0 || i >= X.Count || X[i].Dead` checks in `FleetSim`, `.Combat` (`UnitPosition`) and `.Doctrine`. The old `Valid<T>` in `.Combat` was the same as `InRange` and has been removed.
  - `Warping` (public) and `BlockedWhileWarping(kind)`: `Apply` checks once at the top, instead of 9 copies of `if (WarpRemaining <= 0f) { … }`. The blocked set is unchanged: LaunchNext, StartWarp, ToggleAutoLaunch, SetAutoLaunch, Order, ResumeAuto, Stop and Hold. `ApplyAutoLaunch(bool)` covers the toggle and the set.
  - `ApplyOrder`: a private `FanOut` struct hands out the sunflower slots, and `EndRing(spacing)` moves the next unit kind outside the ring. This replaces three copies of the slot and ring arithmetic. A drone with an invalid Mine or Unload target still uses up a slot, as before.
- The HUD (`HudController`, `.Commands`, `.Status`), `OrderController.WarpLocked` and `WarpBalanceScenarios` now read `sim.Warping` instead of `WarpRemaining > 0f`.

**Views (`Scripts`).**

- `UnitViewMotion.cs` (new static class): `Interpolated`, `Ease`, `TurnToward`, `FaceAndBank(look, turnRate, bankGain, bankMax, minSqr)`, `SetCargoFill(fill, fullScale, axis, cargo, capacity)`, `ClearTrails` and `Hide`.
- `MiningDrone`, `HaulerView`, `BargeView`, `PirateView` and `SquadronView` use it. Each view passes its existing bank gain, bank cap and dead zone (drone 60/35/0.01, hauler 40/20/0.2, pirate 50/30/0.05), so the motion is unchanged.

## Verification

- `scripts/unity-check.sh`: compiled, EditMode 169 of 169 passed (the same as before the change, on cs:58). The same again on `/main` after the merge (cs:60).
- Play mode in the Editor with auto-launch on: the sim advanced (t = 9.25 s, 8 drones out, haulers and barges present), with 0 console errors and 0 warnings. A Game view capture showed drones, the barge, the hauler and the carrier drawn and oriented normally.
- Not checked yet: the web build.

## Open points

- The carrier's `+ 4f` ring offset and the spacing constants stay as they are; #72 moves them into settings.
- `FleetCamera` and the HUD's refined counter use their own `1 - exp(-k·dt)` easing. They aren't unit views, so they were left alone.

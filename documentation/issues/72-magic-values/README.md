# Code quality 2/4: move magic values into settings, palette and shader IDs

[GitHub issue #72](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/72). Phase 2 of the code-quality pass (#71 helpers, #72 magic values, #73 file splits, #74 folder layout).

- **UVCS branch:** `/main/feature-72-magic-values`, from cs:60. Changeset: cs:61 (16 changed, 4 added: `FleetPalette.cs`, `ShaderIds.cs` and their `.meta`). Merged to `/main` as cs:62.
- **Git:** these notes only.

## What changed

Every value is the same as before. Tuning that was hidden in `const` can now be changed in the `FleetConfig` inspector.

**Tuning moved into settings (`Sim/SimTypes.cs`, `Sim/Doctrine.cs`).**

| Was | Now | Value |
| --- | --- | --- |
| `FleetSim.FormationSpacing`, `BargeSpacing`, `HaulerSpacing` | `FleetSettings.droneMoveSpacing`, `bargeMoveSpacing`, `haulerMoveSpacing` | 3, 12, 6 |
| `+ 4f` around the carrier in `ApplyOrder` | `FleetSettings.carrierMoveClearance` | 4 |
| `FleetSim.DockRepairRate` | `CombatSettings.dockRepairRate` | 10 |
| `FleetSim.PirateSelfDefence` | `CombatSettings.raiderSelfDefenceRange` | 35 |
| `FleetSim.SafeCarrierRadius`, `SafeSquadronRadius`, `RetreatHull`, `CallHaulerFill`, `FarOutDistance`, `FarOutCargo` | new `DoctrineSettings` (`FleetSim.DoctrineCfg`, `FleetConfig.doctrine`, `SimSetup.doctrine`) | 80, 45, 0.5, 0.8, 100, 0.5 |

- `DoctrineSettings` follows the research and module settings: `Default`, plus `IsValid`, so a `SimSetup` that leaves it at default gets the defaults.
- `ShouldFlee` is now an instance method, because the retreat threshold is read per sim.
- `DoctrineTests` reads `DoctrineSettings.Default.*` instead of the old constants.
- `FleetConfig.asset` was re-saved through the Editor (`SetDirty` + `SaveAssets`). The diff against cs:60 is additions only, the new fields at their default values. Even before the re-save, the asset already loaded those values (checked through `script eval`), so it didn't depend on the save.

**Kept as `const`, on purpose.**

- `MaxPirates` (64) is a hard slot cap and also the limit a save is checked against; `CombatSettings.maxWaveSize` tunes wave sizes. It now has a comment saying this.
- `WarpChargeSeconds` is already the source of `WarpBalance.Default.ChargeSeconds`, the tunable value, and the tests use it.
- `RockAvoidPad`, `GridCell`, `MoveArrive`, `FinalApproach` and `BaseSurveyRadius` are geometry, not balance.

**Bare numbers named (`FleetSim.cs`, `FleetSim.Combat.cs`).** `SurveyArrive` (12), `AboardRadius` (5; it was `sqrMagnitude < 25f` twice), `ApproachJitter` (0.6, three uses), `GoldenAngle` (2.39996, three uses across both files), `PirateRetargetSeconds` (1.5). The carrier's idle bob, which was written out twice, is now `BobOffset()`. The remaining literals are local steering geometry (arrival radii, look-ahead factors), and naming them would add little.

**Colours and shader IDs (`Scripts`).**

- `FleetPalette.cs` (new): order-line colours, beam colours, barge status-light HDR colours, sensor-plot colours and star tints, plus `Color.WithAlpha`. Components with `[SerializeField]` colours (`OrderController`, `CombatFx`) use the palette as their default, and the value saved in the scene still wins. `BargeView`, `Starfield` and `HudController.Sensors` use it directly.
- `ShaderIds.cs` (new): `Shader.PropertyToID` handles for the URP properties, and the `_EMISSION` keyword. `BargeView` no longer hashes `"_EmissionColor"` every frame, and `Asteroid` dropped its own copy of the ID.
- `MiningFleetSceneBuilder` uses `ShaderIds` and bakes `FleetPalette.BargeOpen` into the `StatusLight` material, so the material and `BargeView` share one value.
- Not done: turning the builder's material list into a `MaterialSpec[]` table. Each material is already one `Lit(...)` or `Additive(...)` line with named arguments, so a table would only move the same numbers around. The builder's other literals are procedural model geometry. Both can be revisited if the builder grows.

## Verification

- `scripts/unity-check.sh`: compiled, EditMode 169 of 169 passed, on the branch and again on `/main` after the merge (cs:62).
- **Build Demo Scene** was run after the builder change. The materials came out byte-identical. The prefabs, the scene and `MiningFleetVolume.asset` were rewritten with new file IDs, but with IDs stripped and lines sorted they match cs:60 exactly, so those regenerated files were undone and are not in the changeset.
- Play mode: the live sim reads the new settings from the config (drone and barge move spacing 3 and 12, dock repair 10, raider self-defence 35, safe radius 80). The barge's status light uses the property ID and showed `BargeBusy` (6, 3, 0.3) while parked by the carrier. There were 0 console errors and 0 warnings, and the Game view capture looked normal.
- Not checked: the sensors view by eye (the colour values didn't change; only how they're written), and the web build.

# #11, #13, #15: control groups, UI Toolkit HUD, logistics chain

GitHub issues: [#15](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/15) (phase 3 logistics), [#13](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/13) (HUD technology → [ADR 0005](../../agents/decisions/0005-ui-toolkit-hud.md)), [#11](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/11) (control-group keys → [ADR 0006](../../agents/decisions/0006-control-group-keys.md)).

| | |
| --- | --- |
| git branch | `feature/11-13-15-logistics-uitk-groups` |
| UVCS branch | `/main/feature-11-13-15-logistics` |
| Changeset | `cs:16` (36 added, 13 changed, 6 deleted) |

## Logistics (#15)

Ore flows **drone → (barge → hauler →) carrier → refinery → refined ore**, and refined ore pays for the build queue.

- **Barge:** a slow mobile depot (2,400 t). It holds station wherever it was last sent. Drones unload at it when it is parked, has room, and is closer than the carrier. A barge within 45 units of the carrier counts as docked and isn't used; otherwise a barge beside the carrier would just be a way around the hangar.
- **Drones:** unloading at a barge takes 1.5 s and skips the hangar (no turnaround, no launch queue). Right-clicking a barge with drones selected makes it their home barge from then on. Docking at the carrier clears the home barge.
- **Hauler** (1,000 t): on automation it picks the parked barge with the most unclaimed ore, but only once the barge holds at least 40% of a hauler load (or the barge is nearly full). It loads at 250 t/s, flies to the carrier and unloads there. Haulers and barges take move orders; A sends them back to automation.
- **Refinery:** turns raw ore into refined ore at 25 t/s, plus 15 t/s for each refinery module.
- **Build queue:** FIFO, one build at a time. The cost is paid when the build starts, and cancelling refunds a started build.

  | Unit | Cost | Build time |
  | --- | --- | --- |
  | Drone | 250 | 5 s |
  | Barge | 2,000 | 25 s |
  | Hauler | 1,000 | 15 s |
  | Refinery module | 1,500 | 30 s |

  The queue holds up to 8 items. Unit caps: 120 drones, 6 barges, 12 haulers, 6 modules. This is a stand-in until #10 (the hangar slot board) is decided.
- **Start:** 10 drones, 1 barge and 1 hauler parked beside the carrier, and no refined ore.
- **Throughput readout** (`FleetSim.Throughput()`): an estimate of each link's capacity in t/s from the current fleet and distances. It covers:
  - mining capacity;
  - drones to the carrier, capped by the hangar launch gate (one launch per 1.1 s × 60 t = 54.5 t/s);
  - drones to barges;
  - haulers;
  - the refinery.

  Income = min(direct deliveries + min(barge inflow, haulers), refinery). The HUD highlights the limiting link and says what to build or move. The bottlenecks are drones, drone travel, hangar launch, haulers and refinery.
- All tuning is in `LogisticsSettings` (`FleetConfig.logistics`).
- **Save format version 2** adds barges, haulers, the refinery, the build queue, and per-drone home barge, depot and timer. The fleet size now comes from the save. Version 1 saves are refused, and the page starts a new game.

### Measured

Headless runs in the Editor: seed 1, 20 drones, refinery uncapped, 600 s.

| Setup | Refined t/s |
| --- | --- |
| Default belt around the carrier, drones only | 35.6 |
| Belt 260 units away, drones only | 25.9 |
| Same, plus a barge parked at the belt and 1 hauler | 30.9 (haulers named as the bottleneck) |
| Same, plus a barge and 2 haulers | 37.9 (+46%) |

The estimate was within about 1 t/s of the measured rate in these runs. It was calibrated by adding real overheads for docking, launching and hovering. Before #15, income topped out at about 50 t/s, at 40 drones, because of the hangar launch gate.

## HUD (#13)

The uGUI HUD (`FleetHUD`, `SelectionOverlay`) is replaced by UI Toolkit: `Assets/_Game/UI/Hud.uxml`, `Hud.uss`, `HudController.cs`, `HudPanelSettings`, `HudTheme.tss`, and Roboto in `UI/Fonts`. Layout:

- top left: refined ore, income, fleet counts, and the ore-chain panel with its bottleneck hint;
- top right: fleet buttons and the build queue;
- bottom: the control-group bar, the selection list and the controls hint.

Rings and the drag box are UI Toolkit elements too. Clicks on panels don't reach selection, orders or the camera (`HudController.BlocksPointer`).

The page's HTML toolbar is now a gear button that opens a dialog with Save, Export, Import and New game, plus version and save info.

## Control groups (#11)

- Shift+1–0 assigns a group; Ctrl/Cmd+1–0 also assigns where the browser allows it. 1–0 recalls, and pressing twice focuses the camera.
- The group bar: click recalls, Shift-click assigns.
- Groups hold barges, haulers, drones and the carrier. Loading a save clears them.

## Tests

25 EditMode tests in `FleetSimTests.cs`. These are new:

- a far barge raises income by more than 25% (measured +49%);
- the bottleneck is named (haulers, refinery);
- a docked barge isn't used as a depot;
- the build queue pays at the start, spawns the unit, and refunds a cancel;
- the build queue waits for income;
- an unload order sets the home barge;
- a save and load with logistics state continues identically, through JSON.

Perf: 0.055 ms per tick at 500 ships (Editor).

## Notes

- Barges and haulers have no colliders, so they're picked in screen space like drones. Right-clicking a barge (with drones selected) gives an unload order, not a move.
- `MonoBehaviour` classes must sit in a file of the same name. `HaulerView` was first in a shared file, and the prefab silently lost its component.

# Repair and scout ships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add buildable repair and scout ships that work on automation and under orders, and make veins pay with a vein strike.

**Architecture:** One new sim unit type, `SimSupport`, with a `Role` of `UnitKind.Repair` or `UnitKind.Scout`, threaded through the same places as haulers (one list, one `TargetKind`, one command array, one view). Behaviour lives in a new partial `FleetSim.Support.cs`; the vein strike hooks into drone mining. Views, input and HUD mirror the hauler code at each site listed below.

**Tech Stack:** Unity 6000.6.8f1, C# (plain-C# deterministic sim, `SpaceMining.Sim` assembly), URP, UI Toolkit HUD, NUnit EditMode tests; TypeScript web shell (Vite).

**Spec:** [design.md](design.md) (approved 11 Nov 2026). Read it first; this plan argues from it.

## Global Constraints

- Deterministic fixed-tick sim at 20 Hz (ADR 0001): no `UnityEngine.Random`, no wall clock, no view state in the sim.
- Saved enums are append-only: `UnitKind` gains `Repair = 5`, `Scout = 6`; `OrderKind` gains `Repair = 7`; `TargetKind` gains `Support = 7`; `SimEventKind` gains `VeinStrike` at the end.
- Save version 9 → **10**; versions 2–9 keep loading (`SimSave.OldestVersion` stays 2).
- Never hand-edit `.unity`, `.prefab`, `.asset` or `ProjectSettings`; regenerate with **Build Demo Scene**. `Hud.uxml` and `Hud.uss` are text and may be edited.
- Numbers (all in a new `SupportSettings`, see Task 1): repair 1,500 ore / 15 s / hull 200 / speed 9.5 / search 150 / beam 20 / 15 hull/s / 2.5 ore per hull; scout 800 ore / 8 s / hull 80 / speed 14.25 / scan 2 s; vein strike +50% of drone capacity.
- Class fire-stance defaults: Repair **Stand**, Scout **Flee**.
- Verification commands (run from the repo root): `scripts/unity-check.sh` (refresh, compile, all EditMode tests) and `pnpm run check`. A task is green when `unity-check` prints `compiled` and `EditMode N of N passed`.
- Version control: check-ins, commits, pushes and the PR only when the user says so (AGENTS.md). Until then each task ends with a green `unity-check`, not a commit.

## Review Focus

1. **A repair target that dies, docks, warps out or is recalled mid-repair:** the repair ship drops it the same tick and picks again; no ore is charged after that. Test in Task 3.
2. **Refined ore runs out mid-repair:** repair stops, nothing goes negative, and it resumes when ore arrives. Test in Task 3.
3. **A save from version 9 with the carrier mid-warp or units recalled:** loads with no support ships and the class defaults, and the warp completes. Test in Task 6.
4. **A drone on a Mine order that fills up on a vein rock:** gets the strike too (the spec says automation or a Mine order), and a drone that heads home early does not. Test in Task 5.
5. **All rocks surveyed, then a rock respawns:** the scout leaves its idle station and surveys the new rock once. Test in Task 4.

---

### Task 0: Branches and issue

- [ ] **Step 1:** Ask the user whether to open a GitHub issue for this work. If yes, create it (title "Repair and scout ships", body linking `design.md`), rename `documentation/issues/82-repair-scout-ships/` to `documentation/issues/<n>-repair-scout-ships/`, and use `<n>` in branch names. Without an issue, use `repair-scout` in place of `<n>-repair-scout`.
- [ ] **Step 2:** In the Unity project run `~/.unity/bin/unity cm status`. Leftovers expected and not to be checked in: `Screenshots/*.png`, `Data/Plugins/lib_burst_generated.wasm`. Anything else: ask the user.
- [ ] **Step 3:** If PR #81 and UVCS `/main/feature-14-foundry-models` are merged, branch from `/main`. If not, branch from that feature branch's head (cs:71) so the Foundry importer and models are present: `cm branch create /main/feature-<n>-repair-scout -c="GitHub #<n>: repair and scout ships"` from a workspace switched to cs:71, then `cm switch` to it. Git: `git switch -c feature/<n>-repair-scout` from `feature/14-foundry-models` (or `main` if merged).

### Task 1: Support unit type, settings and building

**Files:**
- Modify: `Assets/_Game/Scripts/Sim/Core/SimCommands.cs` (enums, `Units`, `FleetCommand`)
- Modify: `Assets/_Game/Scripts/Sim/Entities/SimEntities.cs` (`SimSupport`, `SupportState`)
- Modify: `Assets/_Game/Scripts/Sim/Settings/SimSettings.cs` (`SupportSettings`, `SimSetup.support`)
- Create: `Assets/_Game/Scripts/Sim/Core/FleetSim.Support.cs` (list, adders, settings; behaviour comes in Tasks 3–4)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.cs` (`Count`, `Max`, `Cost`, `BuildTime`, `StepBuild`, `Step`)
- Modify: `Assets/_Game/Scripts/Sim/Core/SimEvents.cs` (`VeinStrike`)
- Test: `Assets/_Game/Tests/EditMode/SupportTests.cs` (new)

**Interfaces:**
- Produces:
  - `enum UnitKind { Drone, Barge, Hauler, Refinery, Squadron, Repair, Scout }`; `OrderKind` + `Repair`; `TargetKind` + `Support`; `SimEventKind` + `VeinStrike`.
  - `enum SupportState { Idle, Moving, ToTarget, Repairing, ToSurvey, Scanning, Returning }`
  - `sealed class SimSupport : SimUnit { UnitKind Role; SupportState State; TargetKind TargetOf; int Target = -1; float Timer; List<UnitOrder> Orders; bool Held; StanceSet Own = StanceSet.Default; int Groups; bool IsRepair => Role == UnitKind.Repair; }`
  - `struct SupportSettings` with fields `repairCost, repairBuildTime, repairHull, repairSpeed, repairAcceleration, repairSearchRange, repairBeamRange, repairRate, repairPrice, scoutCost, scoutBuildTime, scoutHull, scoutSpeed, scoutAcceleration, scanTime, veinStrikeBonus` (float), `maxRepairs, maxScouts` (int), `static SupportSettings Default`, `bool IsValid`.
  - `SimSetup.support` (falls back to `Default` when `!IsValid`, like `doctrine`).
  - `FleetSim.Supports : List<SimSupport>`, `FleetSim.SupportCfg : SupportSettings`, `SimSupport AddSupport(UnitKind role)`, `Vector3 SupportPark(int index)`.
  - `Units(int[] drones, bool carrier, int[] barges = null, int[] haulers = null, int[] squadrons = null, int[] supports = null)` and `Units.Supports`, `FleetCommand.Supports`.

- [ ] **Step 1: Write the failing tests** in `SupportTests.cs` (use `FleetSimTests.MakeSetup()` and `CombatTests.RunUntil`):
  - `BuildingARepairShipCostsItsPriceAndAddsOne`: set refined to 5,000, `Enqueue(FleetCommand.Build(UnitKind.Repair))`, run 16 s; `Count(UnitKind.Repair) == 1`, refined dropped by 1,500, the new unit has `Role == UnitKind.Repair`, `Hull == 200`.
  - `BuildingAScoutCostsItsPriceAndAddsOne`: same for `Scout`, 800 ore, 9 s, hull 80.
  - `RepairAndScoutCountSeparately`: one of each built; `Count(Repair) == 1`, `Count(Scout) == 1`, `Supports.Count == 2`.
  - `QueueRespectsMax`: `Max(UnitKind.Repair) == 4`, `Max(UnitKind.Scout) == 3`, and `CanQueue` is false once planned reaches the max.
- [ ] **Step 2:** Run `scripts/unity-check.sh`. Expected: compile errors naming `UnitKind.Repair` / `Supports`.
- [ ] **Step 3: Implement.**
  - `SupportSettings.Default`: `repairCost 1500, repairBuildTime 15, repairHull 200, repairSpeed 9.5, repairAcceleration 4, repairSearchRange 150, repairBeamRange 20, repairRate 15, repairPrice 2.5, scoutCost 800, scoutBuildTime 8, scoutHull 80, scoutSpeed 14.25, scoutAcceleration 6, scanTime 2, veinStrikeBonus 0.5, maxRepairs 4, maxScouts 3`.
  - `AddSupport` uses `FreeSlot`/`Place` like `AddHauler`; new ships start at `SupportPark(i)`, a column off the carrier's starboard stern: `Carrier.ToWorld(new Vector3(Carrier.Layout.radius + 6f, 0f, -12f - 6f * i))`.
  - `Count`, `Max`, `Cost`, `BuildTime` and `StepBuild` handle `Repair` and `Scout` from `SupportCfg` (`StepBuild` emits `UnitBuilt` with the support index).
  - `Step` calls `StepSupport(Supports[i], dt)` for each, after haulers; for now `StepSupport` only integrates velocity toward `SupportPark` when idle (Tasks 3–4 replace it).
  - `Doctrine.cs` `ClassName`: `Repair => "Repair ships"`, `Scout => "Scouts"`.
- [ ] **Step 4:** Run `scripts/unity-check.sh`. Expected: `compiled`, all pass (177+34 existing plus the new ones).

### Task 2: Stances, damage, pirates, recall and warp

**Files:**
- Modify: `Assets/_Game/Scripts/Sim/Systems/Doctrine.cs` (`StanceSet.Applies`)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.Doctrine.cs` (class defaults, `FireOf`, `ApplyDoctrine` for supports, groups)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.Damage.cs`, `FleetSim.Pirates.cs`, `FleetSim.Combat.cs` (target liveness at line ~126), `FleetSim.cs` (`RecallAll`, `Depart`, retreat-loss, `ApplyOrder`/`ApplyResume`/`ApplyHold` for Move/Stop/Hold)
- Test: `SupportTests.cs`, `DoctrineTests.cs`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: `FireStance FireOf(SimSupport s)`; `bool SupportAboard(SimSupport s)`; `int OutsideSupports`; `void KillSupport(SimSupport s)`; `Damage(TargetKind.Support, i, amount)`.

- [ ] **Step 1: Write the failing tests:**
  - `RepairClassDefaultsToStandScoutToFlee`: on a new sim, `Resolve(StanceAxis.Fire, UnitKind.Repair, StanceSet.Default, 0) == (int)FireStance.Stand` and for `Scout` `== (int)FireStance.Flee`; the fleet scope is still Flee.
  - `FireAxisAppliesToSupports`: `StanceSet.Applies(StanceAxis.Fire, UnitKind.Repair)` and `(…, UnitKind.Scout)` are true; Mining and Engage are false.
  - `PiratesCanTargetAndKillSupports`: a scout alone far from the carrier with a pirate next to it ends with `Dead` and a `UnitDestroyed` event.
  - `RecallBringsSupportsAboardAndWarpKeepsThem`: after `RecallAll` and a full warp, supports that were aboard are alive in the new system; a support kept outside (Hold far away, then warp) is dead.
  - `MoveStopHoldWorkForSupports`: Move sends it to the point (within 3 units in 20 s), Hold keeps it there with no automation, Stop returns it to `Idle`.
- [ ] **Step 2:** `scripts/unity-check.sh`. Expected: the new tests fail.
- [ ] **Step 3: Implement.** Class defaults: in `InitDoctrine` (or wherever `classStances` is created) set `classStances[(int)UnitKind.Repair].fire = (int)FireStance.Stand` and `classStances[(int)UnitKind.Scout].fire = (int)FireStance.Flee`; make sure `classStances` is sized to the new enum length. Damage mirrors the hauler case: `ShouldFlee(FireOf(s), s.Hull, maxHull)` on automation → drop target, `State = Returning`. Pirates consider supports with weight `0.8f` (below haulers). Recall/aboard/depart/retreat-loss mirror haulers using `SupportPark`. Orders: supports take Move (own fan-out ring, spacing `FleetCfg.haulerMoveSpacing`) and Repair (Task 3); Stop/Hold mirror haulers.
- [ ] **Step 4:** `scripts/unity-check.sh`. Expected: all pass.

### Task 3: Repair behaviour

**Files:**
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.Support.cs`
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.cs` (`ApplyOrder` accepts `OrderKind.Repair` for repair ships only)
- Test: `SupportTests.cs`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `bool TryRepairTarget(SimSupport s, out TargetKind kind, out int index)` (internal); `float HullFraction(TargetKind kind, int index)`; `bool Repairing(SimSupport s)` for views; the repair target is `s.TargetOf` / `s.Target` while `s.State == SupportState.Repairing`.

- [ ] **Step 1: Write the failing tests:**
  - `RepairPicksTheMostDamagedFriendlyInRange`: a barge at 50% and a hauler at 80% both within 150; after 5 s the ship is `Repairing` the barge.
  - `RepairIgnoresTargetsOutOfSearchRange`: the only damaged unit is 200 away; the ship stays `Idle`.
  - `TwoRepairShipsSplitTwoTargets`: two ships, two damaged units in range; their targets differ.
  - `RepairRestoresHullAndCostsOre`: a barge at 300/500, refined 1,000; after 10 s of repairing, hull is 450 (15/s) and refined fell by 375 (2.5 per point); it stops at 500.
  - `RepairStopsWithoutOreAndResumes`: refined 10 → 4 points repaired, refined 0 never negative, hull stays; add 1,000 refined and repair continues.
  - `RepairDropsADeadOrDockedTarget` (Review Focus 1): kill the target, or dock a target squadron; the same tick the ship stops charging and picks again or idles.
  - `RepairNeverTargetsItself`: a damaged repair ship alone does not repair itself; a second repair ship repairs it.
  - `RepairOrderRepairsThatUnitThenReturnsToAutomation`: `Issue(units with supports=[r], new UnitOrder(OrderKind.Repair, pos, target, TargetKind.Hauler), false)` → repairs that hauler to full even if another unit is more damaged, then `Orders.Count == 0`.
  - `StandKeepsRepairingUnderFire` / `FleeBreaksOff`: damage a repairing ship; with class default it keeps `Repairing`; with a unit override Flee it goes `Returning`.
- [ ] **Step 2:** `scripts/unity-check.sh`. Expected: these fail.
- [ ] **Step 3: Implement** in `FleetSim.Support.cs`. Retarget at most once per second (`s.Timer`). Candidates: live drones not in the hangar, barges, haulers, active squadrons, the carrier, and other supports (never itself), excluding units aboard during a recall; score = hull fraction, lowest wins, skip those at full hull and those claimed by another repair ship unless every candidate is claimed. Fly with `Steer(ref s.Position, ref s.Velocity, goal, repairSpeed, repairAcceleration, 2.5f, dt)` to within `repairBeamRange` of the target, then heal `min(repairRate·dt, missing, Refined / repairPrice)` and charge `amount · repairPrice`. No target → `Returning` to `SupportPark`, then `Idle`. Squadron hull repair uses the same per-squadron max hull the dock uses.
- [ ] **Step 4:** `scripts/unity-check.sh`. Expected: all pass.

### Task 4: Scout behaviour and surveyed rocks

**Files:**
- Modify: `Assets/_Game/Scripts/Sim/Entities/SimEntities.cs` (`SimAsteroid.Surveyed`)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.Field.cs` (`Survey` marks `Surveyed`; `Respawn` clears it)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.Support.cs`, `FleetSim.cs` (`ApplyOrder`: `OrderKind.Survey` accepted by scouts)
- Test: `SupportTests.cs`

**Interfaces:**
- Produces: `SimAsteroid.Surveyed`; while scanning, `s.State == SupportState.Scanning` and `s.Timer` counts down from `scanTime` (views draw the ring from it).

- [ ] **Step 1: Write the failing tests:**
  - `ScoutSurveysTheNearestUnsurveyedRock`: after one scan, every active rock within `SurveyRadius` of the first rock is `Surveyed`, and a `SurveyComplete` event was emitted.
  - `ScoutScanTakesTwoSeconds`: no `SurveyComplete` before 2 s of `Scanning`.
  - `ScoutCoversTheFieldThenIdles`: run up to 600 s; all active rocks `Surveyed`, the scout `Idle` near `SupportPark`, and the number of `SurveyComplete` events ≤ the number of rocks.
  - `RespawnedRockGetsSurveyedAgain` (Review Focus 5): deplete and respawn one rock; it is not `Surveyed`; the scout leaves `Idle` and surveys it once.
  - `ScoutTakesSurveyOrders`: `OrderKind.Survey` at a point surveys there, then back to automation.
  - `ScoutFleesByDefault`: damage on automation → `Returning`.
- [ ] **Step 2:** `scripts/unity-check.sh`. Expected: these fail.
- [ ] **Step 3: Implement.** Target = nearest active rock with `!Surveyed` (ties by index). Fly to within `SurveyArrive` (12) of it, `Scanning` for `scanTime`, then `Survey(rock.Position)` and mark every active rock within `SurveyRadius` `Surveyed`. `Survey()` itself also marks them, so drone surveys count too.
- [ ] **Step 4:** `scripts/unity-check.sh`. Expected: all pass.

### Task 5: Vein strike

**Files:**
- Modify: `Assets/_Game/Scripts/Sim/Entities/SimEntities.cs` (`SimDrone.VeinBonus`)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.Drones.cs` (mining case, lines 91–95; unload clears the flag)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.cs` (`public float VeinOre { get; private set; }`)
- Modify: `Assets/_Game/Scripts/Runtime/FleetNotice.cs` (ignore `VeinStrike`: no notice)
- Test: `SupportTests.cs`

**Interfaces:**
- Produces: `SimDrone.VeinBonus` (true from the strike until the drone has unloaded everything); `FleetSim.VeinOre`; event `SimEventKind.VeinStrike` with `Index` = drone, position = rock.

- [ ] **Step 1: Write the failing tests:**
  - `FullLoadOnAVeinStrikes`: a drone mining a rock with `Vein = true` until full ends with `Cargo == 1.5 × cargoCapacity`, `VeinBonus` true, one `VeinStrike` event, and `VeinOre` up by `0.5 × cargoCapacity`.
  - `StrikeDoesNotDrainTheRock`: the rock lost exactly `cargoCapacity` ore for that load.
  - `NoStrikeOnOrdinaryRocks`: same run with `Vein = false`: cargo equals capacity, no event.
  - `MineOrderStrikesToo` and `EarlyReturnDoesNot` (Review Focus 4): a drone on a Mine order on a vein strikes; a drone sent home by the far-out card or Safe mining before it is full does not.
  - `BonusUnloadsAndClearsTheFlag`: after unloading at the carrier, `VeinBonus` is false and `OreDelivered` counted the bonus.
- [ ] **Step 2:** `scripts/unity-check.sh`. Expected: these fail.
- [ ] **Step 3: Implement** at the capacity check: if `rock.Vein`, add `veinStrikeBonus × cargoCapacity` on top of capacity without calling `Mine`, set `VeinBonus`, add to `VeinOre`, emit `VeinStrike`. Make sure nothing later clamps cargo back to capacity (check `CargoFraction` users and barge unloading).
- [ ] **Step 4:** `scripts/unity-check.sh`. Expected: all pass.

### Task 6: Save format version 10

**Files:**
- Modify: `Assets/_Game/Scripts/Sim/Core/SimSave.cs` (`SupportSave`, `supports`, `veinOre`, `RockSave.surveyed`, `DroneSave.veinBonus`, version comment)
- Modify: `Assets/_Game/Scripts/Sim/Core/FleetSim.SaveLoad.cs`, `FleetSim.cs` (`CaptureField` and system load copy `surveyed`)
- Modify: `web/src/protocol.ts` (`UnitKind` adds `'repair' | 'scout'`)
- Test: `FleetSimTests.cs` (round trip), `SupportTests.cs`

**Interfaces:**
- Produces: `SimSave.CurrentVersion = 10`; `class SupportSave { int role; int state; Vector3 position, velocity; int targetOf, target; float timer, hull; bool held, dead; List<OrderSave> orders; StanceSet own; int groups; }` (mirror `HaulerSave`'s field names and order handling).

- [ ] **Step 1: Write the failing tests:**
  - `SaveRoundTripKeepsSupportsAndVeins` (extend the existing round-trip test): with one repair ship mid-repair, one scout mid-scan, one drone with `VeinBonus`, some `Surveyed` rocks and `VeinOre > 0`, save → JSON → load → 60 s matches the original run.
  - `Version9SaveLoads` (Review Focus 3): take a v10 save of a sim mid-warp, set `version = 9`, strip `supports`/`veinOre`/`surveyed`; it loads, has no supports, `VeinOre == 0`, class fire defaults Stand/Flee, and the warp completes.
  - `SaveRejectsTooManySupports`: more repair ships than `maxRepairs` → load refused, sim unchanged.
- [ ] **Step 2:** `scripts/unity-check.sh`. Expected: these fail.
- [ ] **Step 3: Implement**, including the class-default stances for saves older than 10 (their stored class stances predate the new classes) and the inactive-system rock lists.
- [ ] **Step 4:** `scripts/unity-check.sh` and `pnpm run check`. Expected: all pass.

### Task 7: Prefabs, views and effects

**Files:**
- Modify: `Assets/_Game/Scripts/Editor/MiningFleetSceneBuilder.cs` (`RepairSlots`, `ScoutSlots`, `CreateSupportPrefab(UnitKind role)`, `Repair.prefab`, `Scout.prefab`, runner refs, materials `RepairHull`, `ScoutHull`, `RepairGlow`, `ScoutGlow`)
- Create: `Assets/_Game/Scripts/Views/SupportView.cs`
- Modify: `Assets/_Game/Scripts/Runtime/FleetSimRunner.cs` (`repairPrefab`, `scoutPrefab`, `Supports` view list, `Match`, `Sync`, target position for `TargetKind.Support`)
- Modify: `Assets/_Game/Scripts/Views/CombatFx.cs` (repair beam; vein-strike spark burst), `FleetPalette.cs` (`BeamRepair` blue, `Vein` gold, `ScanRing` cyan)
- Modify: `Assets/_Game/Scripts/Views/DroneBatchRenderer.cs` (gold trail while `VeinBonus`)
- Modify: `Assets/_Game/Scripts/World/Asteroid.cs` (vein tint)
- Test: `Assets/_Game/Tests/EditMode/FoundryModelTests.cs` (add `Repair`, `Scout` to `UnitPrefabs`)

**Interfaces:**
- Consumes: `SimSupport` (Task 1), `Repairing` state (Task 3), `Scanning` + `Timer` (Task 4), `VeinBonus` and `VeinStrike` (Task 5).
- Produces: `SupportView.Bind(FleetSimRunner, SimSupport)`, `SupportView.Data`, `SupportView.BeamOrigin : Vector3` (nose), `FleetSimRunner.Supports : IReadOnlyList<SupportView>`.

- [ ] **Step 1:** Add `"Repair"` and `"Scout"` to `FoundryModelTests.UnitPrefabs`; run `scripts/unity-check.sh`. Expected: fails (prefabs missing).
- [ ] **Step 2: Implement.** Hulls: `FoundryHulls.Build("repair", t, 3.6f, RepairSlots, Mat)` and `("scout", t, 3.2f, ScoutSlots, Mat)`. Materials: `RepairHull` white `(0.85, 0.87, 0.9)`, `ScoutHull` pale green `(0.55, 0.75, 0.55)`, `RepairGlow` emission `(0.6, 1.8, 6)`, `ScoutGlow` emission `(0.5, 4, 3.5)`. Slots map `hull` → class hull, `hull2` → `CarrierDark`, `metalRed` → class glow, `glow` → class glow. Trails on the nozzles as for haulers. `SupportView` mirrors `HaulerView` (interpolate, face velocity, hide when dead or aboard during recall) and, for scouts, draws an expanding ring (a `LineRenderer` circle, radius `SurveyRadius × (1 − Timer/scanTime)`) while `Scanning`. `CombatFx`: a pulsing `BeamRepair` beam from `BeamOrigin` to the target while `Repairing`; on `VeinStrike` events a gold burst on the existing explosion particle system with fewer, smaller particles. Drone trails: `Vein` gold for drones with `VeinBonus`. `Asteroid`: base tint lerped 40% toward `FleetPalette.Vein` while `Vein`; re-apply when `Vein` changes, not only on rebuild.
- [ ] **Step 3:** Run **Build Demo Scene**, then `scripts/unity-check.sh`. Expected: all pass.
- [ ] **Step 4:** Render an Editor lineup (cloned `Camera.main`, see `unity-web-build.md` "Close-ups of one unit") with a repair ship beaming at a damaged barge and a scout mid-scan; check they read apart from haulers and fighters.

### Task 8: Input, HUD and bridge

**Files:**
- Modify (mirror the hauler code at each site): `Scripts/Rts/Input/SelectionController.cs`, `UnitPicker.cs` (pick radius 3), `ContextResolver.cs`, `OrderController.cs`, `Scripts/Rts/Overlay/OrderOverlay.cs`, `UI/HudController.cs` (build buttons), `HudController.Selection.cs`, `HudController.Markers.cs`, `HudController.Sensors.cs`, `HudController.Fleet.cs`, `HudController.Status.cs`, `UI/Hud.uxml` (buttons `buildRepair`, `buildScout` in a new row; ore chain row `rowVeins`), `Scripts/Web/WebBridge.cs` (Resume-all includes supports)
- Test: `SupportTests.cs` for the sim side of context orders; the rest is verified in the browser (Task 9)

**Interfaces:**
- Consumes: everything above.
- Produces: `SelectionController.Supports : IReadOnlyCollection<int>`; `ContextAction.Repair`.

- [ ] **Step 1: Implement**, site by site:
  - Selection: `supports` set alongside `haulers` (box select, groups, `SelectedUnits()`, `Center()`, `Clear()`, dead/aboard pruning, `SelectOnly(UnitKind.Repair/Scout, i)`).
  - Context: with only repair ships selected, right-click (or tap) a damaged-or-not friendly unit → `ContextAction.Repair` → `UnitOrder(OrderKind.Repair, pos, index, kind)`; otherwise supports get Move. Survey mode (V) is available when the selection has drones or scouts.
  - HUD selection rows: name `Repair-n` / `Scout-n`, state label (`idle`, `moving`, `to target`, `repairing`, `to survey`, `scanning`, `returning`, held in red), hull bar from `SupportCfg`.
  - Markers and hull bars as haulers (`ring-hauler` style reused). Sensors: repair icon white, scout icon green; vein rocks drawn gold.
  - Fleet panel: stance scopes "Repair ships" and "Scouts" (Class scope); fire group enabled when supports are selected.
  - Status: "Still out" lists `R`/`S` units; build buttons wired to `Build(UnitKind.Repair)` / `Build(UnitKind.Scout)` with cost labels like the others; ore chain row "from veins" showing `VeinOre` as t.
  - `protocol.ts` already updated in Task 6.
- [ ] **Step 2:** `scripts/unity-check.sh` and `pnpm run check`. Expected: all pass.

### Task 9: Web build, browser check, notes and decision record

- [ ] **Step 1:** Build the web player (`unity-web-build.md`), compare file sizes with the #81 build (expect data + a few tens of KB, wasm ± noise).
- [ ] **Step 2:** On a clean origin (`web-clean` preview, port 5199), WebGPU and `?renderer=webgl2`: build one repair ship and one scout (seed refined ore through a save edit), damage a barge (let a wave hit or edit hull in the save), and confirm: the beam, hull rising and ore dropping; the scout's ring and "Survey complete" notice; gold vein rocks; a gold strike burst and gold trail; "from veins" rising; Build menu buttons; selection rows; Repair right-click; V survey with a scout; no console errors.
- [ ] **Step 3:** Write `documentation/issues/<n>-repair-scout-ships/README.md` (UVCS branch and changeset, what changed, test counts, sizes, open points) and ADR `0018-repair-and-scout-ships.md` (support type with roles, vein strike, save v10), linked from `decisions/README.md`; update `scratch.md`.
- [ ] **Step 4:** Ask the user before any check-in, commit, push or PR. On their go: UVCS check-in with explicit paths and `--applychanged`, verify with `cm diff`; git commit (notes, `protocol.ts`, `web/public/unity`), push, open the PR with `Closes #<n>`.

# Carrier Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The carrier has module slots; four module types are unlocked with Data, fitted with refined ore through the build queue, change the sim, and are saved.

**Architecture:** A new `FleetSim.Modules.cs` partial holds the state (slot count, unlocked types, fitted modules) next to `FleetSim.Research.cs`, and applies module effects in the same place research rebuilds the effective settings. A module fitting is a `BuildItem` with a module id, so the existing queue, cost-on-start and cancel-refund rules apply unchanged. The HUD gets a third tab in the Build panel; the real layout comes in the HUD pass.

**Tech Stack:** Unity 6000.6, C#, NUnit EditMode tests, UI Toolkit. UVCS branch `/main/feature-59-carrier-modules`, git branch `feature/59-carrier-modules`.

**Spec:** [README.md](README.md), section "Carrier modules: proposal" (agreed by the user, 10 Nov 2026).

## Global Constraints

- Enums stored in saves are append-only (`CarrierModule`, `FleetCommandKind`, `SimEventKind`).
- Save version becomes 7. Versions 2 to 6 still load, with 2 slots, nothing fitted and only the Launch Bay unlocked.
- A failed `Load` changes nothing.
- A loaded game continues exactly as the saved one would have (`FleetSimTests.AssertSameState`).
- No duplicates: a module type is fitted, or queued, at most once.
- Removing is instant, with no refund. Fitting follows the build queue's rules (cost paid when it starts, refunded on cancel once started).
- No hand edits to `.unity`, `.prefab`, `.asset` or `.meta` files. `Hud.uxml` and `Hud.uss` are text and are edited directly.
- Verify with `scripts/unity-check.sh` from the repo root: `compiled` and `EditMode N of N passed`.
- Check in or commit only when the user asks.

## Values

| Module (`CarrierModule`) | Effect | `effect` | Ore | Time | Unlock Data |
|---|---|---:|---:|---:|---:|
| `LaunchBay` | `FleetCfg.launchInterval × (1 − effect)` | 0.3 | 2000 | 30 | 0 (unlocked at start) |
| `CargoBay` | `FleetCfg.turnaroundTime × (1 − effect)`; hauler unloading at the carrier `× (1 + effect)` | 0.3 | 2500 | 30 | 400 |
| `DryDock` | `CombatCfg.repairRate` and `carrierRegen × (1 + effect)` | 0.5 | 3000 | 40 | 500 |
| `FabricationBay` | Build queue progress `× (1 + effect)` | 0.3 | 3500 | 40 | 600 |

Slots: `startSlots = 2`, `slotUnlockData = { 800, 1500 }` (so the maximum is 4).

## Review Focus

1. A module fitting in the queue when the carrier is destroyed (ADR 0008 clears the queue): the slot must be free again and the started cost is lost like any other build. Test in Task 2.
2. Removing a module while its fitting is queued: `RemoveModule` cancels the queued fitting with the normal refund. Test in Task 2.
3. A save whose fitted list names a module that is not unlocked, appears twice, or exceeds the slot count: refused, state unchanged. Test in Task 4.
4. A version 6 save loaded into a sim that already has modules fitted: the modules are cleared and the effects are gone. Test in Task 4.
5. Launch Bay fitted while a launch is already scheduled: the next launch keeps its time; the ones after use the shorter interval. No test: it follows from `nextLaunchTime` being set at launch.

---

### Task 1: Module model and settings

**Files:**
- Create: `Assets/_Game/Scripts/Sim/Modules.cs`
- Modify: `Assets/_Game/Scripts/Sim/SimTypes.cs` (`SimSetup` gains `public ModuleSettings modules;`)
- Test: `Assets/_Game/Tests/EditMode/ModuleTests.cs`

**Interfaces (produces):**

```csharp
public enum CarrierModule { LaunchBay, CargoBay, DryDock, FabricationBay }
public enum ModuleHost { Carrier }                    // #23 appends ship hosts
[Serializable] public struct ModuleDef { public ModuleHost host; public float effect, cost, buildTime, unlockData; }
[Serializable] public struct ModuleSettings {
    public int startSlots; public float[] slotUnlockData; public ModuleDef[] defs;   // defs in CarrierModule order
    public static ModuleSettings Default { get; }
    public int MaxSlots { get; }                       // startSlots + slotUnlockData.Length
    public bool IsValid { get; }                       // defs != null && defs.Length >= ModuleMath.Count && startSlots >= 0
}
public static class ModuleMath {
    public const int Count = 4;
    public static string Name(CarrierModule m);        // "Launch Bay", "Cargo Bay", "Dry Dock", "Fabrication Bay"
    public static string Effect(CarrierModule m, in ModuleSettings s);
    // "Launches 30% faster", "Turnaround and unloading 30% faster", "Repairs and hull regen +50%", "Builds 30% faster"
}
```

- [ ] Write `Defaults_MatchTheAgreedTable` (asserts every number in the Values table and `MaxSlots == 4`) and `Names_AndEffects` (the strings above). Run: fails to compile.
- [ ] Implement. Run `scripts/unity-check.sh`: passes.

### Task 2: State, commands and the build queue

**Files:**
- Create: `Assets/_Game/Scripts/Sim/FleetSim.Modules.cs`
- Modify: `SimTypes.cs` (`BuildItem`, `FleetCommandKind`, `FleetCommand`, `SimEventKind`), `FleetSim.cs` (`Apply`, `CancelBuild`, `StepBuild`, constructor), `FleetSim.Combat.cs` only if the retreat path needs a hook
- Test: `ModuleTests.cs`

**Interfaces (produces):**

```csharp
// SimTypes.cs
public struct BuildItem { ...; public bool IsModule;   // true for a module fitting; Kind is then unused
                          public CarrierModule Module; }  // a default BuildItem stays a unit
// FleetCommandKind appends: UnlockModule, UnlockSlot, FitModule, RemoveModule
FleetCommand.UnlockModule(CarrierModule m); FleetCommand.UnlockSlot();
FleetCommand.FitModule(CarrierModule m);    FleetCommand.RemoveModule(CarrierModule m);
// SimEventKind appends: ModuleUnlocked (Index = module, or -1 for a slot; Amount = slot count),
//                       ModuleFitted (Index = module), ModuleRemoved (Index = module)

// FleetSim.Modules.cs
public ModuleSettings ModuleCfg { get; }
public int ModuleSlots { get; }
public IReadOnlyList<CarrierModule> FittedModules { get; }
public bool IsUnlocked(CarrierModule m); public bool IsFitted(CarrierModule m); public bool IsFitting(CarrierModule m);
public int FreeSlots { get; }                          // ModuleSlots − fitted − queued fittings
public bool CanUnlock(CarrierModule m);                // locked and Data >= unlockData
public float SlotUnlockCost { get; }                   // next slot's Data cost; float.PositiveInfinity at the maximum
public bool CanUnlockSlot { get; }
public bool CanFit(CarrierModule m);                   // unlocked, not fitted, not queued, FreeSlots > 0, queue not full
public float Cost(in BuildItem b); public float BuildTime(in BuildItem b);   // module or unit
```

`Planned(k)` skips module items. `StepBuild` and `CancelBuild` use `Cost(b)` and `BuildTime(b)`; a finished fitting adds to the fitted list, calls `ApplyResearch()` and emits `ModuleFitted` instead of `UnitBuilt`. Unlocks spend Data through the existing `dataMicro` and `ToMicro`.

- [ ] Tests (each named for its rule), using `FleetSimTests.MakeSetup()`, `ResearchTests`' way of setting Data, and `sim.Enqueue` + `FleetSimTests.Run`:
  - `Start_TwoSlots_OnlyLaunchBayUnlocked`
  - `Unlock_SpendsData_Once` (400 Data for Cargo Bay; a second command does nothing)
  - `Unlock_WithoutData_Refused`
  - `UnlockSlot_800Then1500_ThenStops`
  - `Fit_GoesThroughQueue_PaysOreWhenStarted_FitsAfterBuildTime` (2000 ore, 30 s, `ModuleFitted` emitted)
  - `Fit_Locked_Refused`, `Fit_Twice_Refused` (fitted and queued), `Fit_NoFreeSlot_Refused` (queued fittings count)
  - `CancelFitting_RefundsOnceStarted_FreesSlot`
  - `Remove_Instant_NoRefund_FreesSlot`
  - `Remove_WhileQueued_CancelsWithRefund`
  - `CarrierRetreat_ClearsQueuedFitting_KeepsFitted`
- [ ] Run: fails. Implement. Run: passes, and the existing suites still pass.

### Task 3: Effects

**Files:**
- Modify: `FleetSim.cs` (`FleetCfg` becomes `{ get; private set; }`; hauler unloading at the carrier; `StepBuild` progress), `FleetSim.Research.cs` (`InitResearch` keeps `baseFleet`; `ApplyResearch` ends with `ApplyModules()`), `FleetSim.Modules.cs`
- Test: `ModuleTests.cs`

**Interfaces (produces):** `public float BuildSpeed { get; }` (1, or 1.3 with the Fabrication Bay) and `public float CarrierUnloadFactor { get; }` (1, or 1.3 with the Cargo Bay).

`ApplyModules()` rebuilds `FleetCfg` from `baseFleet` and scales `CombatCfg.repairRate` and `carrierRegen` after research has rebuilt `CombatCfg`.

- [ ] Tests, each fitting one module (a test helper may fit directly through the queue with ore and time to spare):
  - `LaunchBay_LaunchInterval_0_77` (1.1 × 0.7) and `ChainReport` hangar launch limit rises by 1 / 0.7
  - `CargoBay_Turnaround_2_1_AndUnloadFactor_1_3`
  - `DryDock_RepairAndRegen_Times_1_5` (45 and 12 with defaults)
  - `FabricationBay_DroneBuild_TakesFiveOver1_3_Seconds`
  - `Remove_RestoresBaseValues`
  - `Research_AndModules_Stack` (Fighter Damage research leaves `repairRate` × 1.5 intact)
- [ ] Run: fails. Implement. Run: passes.

### Task 4: Save version 7

**Files:**
- Modify: `SimSave.cs` (`CurrentVersion = 7`, doc line, fields), `FleetSim.cs` (`Save`, `Load`), `FleetSim.Modules.cs` (`SaveModules`, `ValidateModules`, `LoadModules`)
- Test: `ModuleTests.cs`

**Interfaces (produces):**

```csharp
// SimSave, version 7
public int moduleSlots;
public List<int> modules = new List<int>();          // fitted, (int)CarrierModule, in fitting order
public List<int> modulesUnlocked = new List<int>();  // (int)CarrierModule
// BuildSave
public int module = -1;                              // absent before version 7
```

`ValidateModules` (version 7 only) refuses: slots outside `startSlots..MaxSlots`; an id outside `0..Count−1` in any list; a duplicate in `modules`; a fitted or queued module that is not unlocked; a queued module that is also fitted or queued twice; fitted plus queued above the slot count. The existing build-queue check accepts `module` in `−1..Count−1`.

- [ ] Tests:
  - `Save_RoundTripsModules_AndContinuesIdentically` (two fitted, one queued, one slot bought; `AssertSameState` after 60 s)
  - `Save_Version6_LoadsWithStartState_AndClearsFittedModules`
  - `Save_BadModules_Refused_StateUnchanged` (one case per refusal above)
- [ ] Run: fails. Implement. Run: passes. Extend `FleetSimTests.AssertSameState` to compare slots, fitted and unlocked.
- [ ] Web side: `grep -rn "saveVersion\|minSaveVersion" web/src` and confirm nothing pins version 6. Add version 7 to the save table in `documentation/web-shell.md` if it lists versions.

### Task 5: Modules tab and notices

**Files:**
- Create: `Assets/_Game/UI/HudController.Modules.cs`
- Modify: `UI/Hud.uxml` (a `buildTabModules` button; a `modulesContent` element with a `modulesTitle` label and a `modulesList`), `UI/Hud.uss` (reuse the research row classes; add only what is missing), `UI/HudController.Research.cs` (`ShowTab` takes a tab index 0, 1 or 2), `UI/HudController.cs` (queue row names and totals use `Cost(b)`/`BuildTime(b)`; call `WireModules`/`DrawModules`), `Scripts/FleetNotice.cs`

One row per module: name, effect text, state (`Fitted`, `Fitting`, ore cost, or `N Data` when locked) and one button: `Unlock`, `Fit`, `Cancel` or `Remove`, enabled from `CanUnlock`/`CanFit`. A last row buys the next slot. The title reads `MODULES  n / m slots`. Queue rows show `ModuleMath.Name` for fittings. Notices: "Module unlocked: X", "Module slot unlocked (n)", "Module fitted: X", "Module removed: X".

- [ ] Implement, then `scripts/unity-check.sh`.
- [ ] Play mode: start, grant ore and Data through `script eval`, enqueue `FitModule(LaunchBay)` through `script eval`, capture the Game view with the Modules tab open, and read `FleetCfg.launchInterval` back (0.77). Stop play mode.

### Task 6: Notes

- [ ] Update [README.md](README.md): status, the UVCS branch, what changed, how it was verified with the real results, open points. Update the checklist line in `scratch.md` only if the user asks for a commit.

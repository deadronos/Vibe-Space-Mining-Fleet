# Research Tree (#56) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A separate research currency (Data) earned from play, nine repeatable research nodes with a soft cap, a Research tab in the Build panel, and save v6 with migration.

**Architecture:** Pure research math and settings live in a new `Sim/Research.cs`. `FleetSim` keeps the base settings it was built with and recomputes effective `DroneCfg`, `LogiCfg` and `CombatCfg` whenever a level changes. Every call site keeps reading those settings, so effects reach existing code without touching it. Data is credited at seven existing hook points through one `EarnData(source, amount)` method. The HUD gets a partial `HudController.Research.cs`.

**Tech Stack:** Unity 6000.6.8f1, C#, UI Toolkit (UXML/USS), NUnit EditMode tests, Unity CLI (`~/.unity/bin/unity`), UVCS for the Unity project, git for `documentation/`.

**Spec:** [design.md](design.md) (approved 9 Nov 2026). Read it first.

## Global Constraints

- Paths below are relative to `Vibe-Space-Mining-Fleet/Assets/_Game/` unless they start with `documentation/` or `web/`.
- Drive the Editor through the Unity CLI ([using-unity-mcp.md](../../agents/using-unity-mcp.md)). Never hand-edit `.unity`, `.prefab`, `.asset`, `.meta` or `ProjectSettings`. UXML, USS and C# are hand-edited.
- Every shell call sets `U=~/.unity/bin/unity; P="$HOME/Github/Vibe-Space-Mining-Fleet/Vibe-Space-Mining-Fleet"; F=(--caller plugin --skill unity-cli --project-path "$P" --no-banner)`.
- The edit loop: `AssetDatabase.Refresh` via `script eval`, then `"$U" recompile --project-path "$P"` with 0 errors. Confirm that new types exist before you trust a test run (`up_to_date` doesn't prove a compile).
- Tests: `"$U" command test run --mode EditMode --timeout 300 "${F[@]}" --result-only`. Expect all to pass: the existing suite plus the new ones.
- The sim stays deterministic: no `UnityEngine.Random`, no wall-clock time, and every state change goes through the command queue or `Step`.
- Enums `ResearchNode`, `DataSource`, `FleetCommandKind` and `SimEventKind` are append-only.
- **Version control only when the user asks** (AGENTS.md). Branches: UVCS `/main/feature-56-research-tree`, git `feature/56-research-tree`. "Checkpoint" steps below mean: tests green and `cm status` reviewed. The check-in happens only once the user says so, following [unity-version-control.md](../../agents/unity-version-control.md) (`--applychanged`, explicit paths, verify with `cm diff`).
- Starting numbers are the ones in Task 1. #48's scenario runner tunes them later.

## Review Focus

1. **Several taps in one tick:** two `Research` commands for the same node in one tick, with Data for only one, buy exactly one level. (Task 2 test.)
2. **Buying while warp charges:** purchases work while `WarpRemaining > 0`, and Warp Charge bought mid-charge doesn't shorten the countdown already running. (Task 2 test.)
3. **Save with fewer levels than nodes** (a future build appends nodes): the missing nodes load as level 0. A longer list, a negative level, or negative or NaN Data is refused, and the sim is left unchanged. (Task 4 tests.)
4. **An upgrade during a sortie:** raising cargo while a drone is full and returning doesn't refill it or strand it, and the drone still docks and delivers. (Task 2 test.)
5. **UI reload** (PanelRenderer reload, Live Reload): the research buttons are rebuilt, not duplicated or lost, and the active tab survives a fold or unfold. (Task 6 browser check.)

---

### Task 0: Branches

- [ ] **Step 1:** In the project folder, `"$U" cm status` must be clean. Then run `"$U" cm branch create /main/feature-56-research-tree -c="GitHub #56: Research tree without resets"` and `"$U" cm switch /main/feature-56-research-tree`.
- [ ] **Step 2:** From the repo root, run `git switch -c feature/56-research-tree`. This already holds `design.md` and this plan as uncommitted files.

### Task 1: Research math, settings and config wiring

**Files:**
- Create: `Scripts/Sim/Research.cs`
- Modify: `Scripts/Sim/SimTypes.cs` (`SimSetup` gains `public ResearchSettings research;`)
- Modify: `Scripts/Config/FleetConfig.cs` (add `[Tooltip("Research tree (GitHub #56).")] public ResearchSettings research = ResearchSettings.Default;`)
- Modify: `Scripts/FleetSimRunner.cs` `DescribeSetup()` (`research = fleetConfig != null ? fleetConfig.research : ResearchSettings.Default`)
- Test: `Tests/EditMode/ResearchTests.cs` (new)

**Interfaces (produces):**
```csharp
public enum ResearchNode { DroneSpeed, DroneCargo, MiningRate, LogisticsCargo, RefineThroughput, FighterDamage, SurveyRange, WarpCharge, DataGain }
public enum DataSource { Mined, Delivered, Survey, PirateDamage, PirateKill, WaveCleared, RockDepleted, FirstArrival }
[Serializable] public struct ResearchNodeSettings { public float baseCost; public float perLevel; }
[Serializable] public struct ResearchSettings {
    public int softCapLevel; public float falloff; public float costGrowth; public float warpChargeFloor;
    public float perTonneMined, perTonneDelivered, perVein, perPirateDamage, perPirateKill, waveCleared, rockDepleted, firstArrival;
    public float[] systemMultiplier;          // indexed by FleetSim.CurrentSystem; missing entries = 1
    public ResearchNodeSettings[] nodes;      // indexed by (int)ResearchNode
    public static ResearchSettings Default { get; }
    public bool IsValid { get; }              // costGrowth > 0 && nodes != null && nodes.Length >= ResearchMath.NodeCount
}
public static class ResearchMath {
    public const int NodeCount = 9;
    public static float EffectiveLevels(int level, in ResearchSettings s);
    public static float Multiplier(ResearchNode n, int level, in ResearchSettings s);
    public static float Cost(ResearchNode n, int level, in ResearchSettings s);
    public static string Name(ResearchNode n);                          // "Drone Speed"
    public static string Label(ResearchNode n, in ResearchSettings s);  // "Drone Speed +10%", "Warp Charge −10%"
    public static string CurrentEffect(ResearchNode n, int level, in ResearchSettings s); // "now +62%", "now −27%", "now +0%"
    public static float SystemMultiplier(int system, in ResearchSettings s);
}
```

**Defaults** (`ResearchSettings.Default`):

| Field | Value |
|---|---|
| `softCapLevel` | 5 |
| `falloff` | 0.25 |
| `costGrowth` | 1.6 |
| `warpChargeFloor` | 0.25 |
| `perTonneMined` | 0.01 |
| `perTonneDelivered` | 0.04 |
| `perVein` | 15 |
| `perPirateDamage` | 0.05 |
| `perPirateKill` | 10 |
| `waveCleared` | 40 |
| `rockDepleted` | 5 |
| `firstArrival` | 200 |
| `systemMultiplier` | `{ 1f, 1.5f }` |

Nodes as (baseCost, perLevel), in enum order:

| Node | baseCost | perLevel |
|---|---|---|
| DroneSpeed | 120 | 0.10 |
| DroneCargo | 100 | 0.10 |
| MiningRate | 120 | 0.10 |
| LogisticsCargo | 200 | 0.10 |
| RefineThroughput | 150 | 0.10 |
| FighterDamage | 150 | 0.10 |
| SurveyRange | 150 | 0.15 |
| WarpCharge | 250 | 0.10 |
| DataGain | 300 | 0.10 |

**Formulas:**
- `EffectiveLevels(L) = min(L, cap) + Σ_{n=cap+1..L} 1 / (1 + falloff·(n − cap))`, and `L <= 0 → 0`.
- `Multiplier`:
  - for every node except WarpCharge: `1 + perLevel · E`;
  - for WarpCharge: `max(warpChargeFloor, (1 − perLevel)^E)`.
- `Cost(n, L) = baseCost · costGrowth^L`, where L is the current level, so the cost of buying level L+1.
- `CurrentEffect` rounds `(Multiplier − 1)·100` to a whole percent, and uses "−" (U+2212) for negatives.

- [ ] **Step 1: Write the failing tests** in `ResearchTests.cs` (namespace `SpaceMining.Sim.Tests`), using `var s = ResearchSettings.Default;`:
  - `EffectiveLevels_FullUpToCap`: `EffectiveLevels(0..5)` gives exactly 0..5.
  - `EffectiveLevels_DiminishesButNeverStops`: `EffectiveLevels(6) == 5.8f` (±1e-5). For L in 6..200, each step is greater than 0 and smaller than the step before. `EffectiveLevels(200) > EffectiveLevels(100) + 1f`.
  - `Multiplier_Additive`: `Multiplier(DroneSpeed, 5) == 1.5f`. `Multiplier(SurveyRange, 1) == 1.15f`.
  - `Multiplier_WarpCompoundsAndFloors`: `Multiplier(WarpCharge, 1) == 0.9f`. `Multiplier(WarpCharge, 2) == 0.81f`. `Multiplier(WarpCharge, 10000) == 0.25f`.
  - `Cost_Grows`: `Cost(DroneCargo, 0) == 100f`. `Cost(DroneCargo, 2) == 256f` (±1e-3).
  - `Labels`: `Label(DroneSpeed) == "Drone Speed +10%"`. `Label(WarpCharge) == "Warp Charge −10%"`. `Label(SurveyRange) == "Survey Range +15%"`. `CurrentEffect(DroneSpeed, 0) == "now +0%"`. `CurrentEffect(WarpCharge, 3) == "now −27%"`.
  - `SystemMultiplier_FallsBackToOne`: index 0 → 1, index 1 → 1.5, index 5 → 1.
  - `DefaultSettings_AreValid_AndZeroIsNot`: `Default.IsValid` is true, and `default(ResearchSettings).IsValid` is false.
- [ ] **Step 2:** Recompile and run. Expect a compile failure (the types are missing).
- [ ] **Step 3:** Implement `Research.cs` per the interfaces and formulas above, then wire `SimSetup`, `FleetConfig` and `FleetSimRunner`.
- [ ] **Step 4:** Recompile with 0 errors and run the tests. Expect all to pass.
- [ ] **Step 5: Re-save the config asset.** Run `script eval`:

  ```csharp
  var c = UnityEditor.AssetDatabase.LoadAssetAtPath<SpaceMining.FleetConfig>("Assets/_Game/Settings/FleetConfig.asset");
  UnityEditor.EditorUtility.SetDirty(c);
  UnityEditor.AssetDatabase.SaveAssets();
  return c.research.nodes.Length;
  ```

  Expect `9`. If it's 0, the initializer didn't apply: set `c.research = SpaceMining.Sim.ResearchSettings.Default` in the same eval, then save.
- [ ] **Step 6:** Checkpoint.

### Task 2: Research state, purchase command, effects and event

**Files:**
- Modify:
  - `Scripts/Sim/FleetSim.cs`
  - `Scripts/Sim/FleetSim.Combat.cs`
  - `Scripts/Sim/SimTypes.cs`
  - `Scripts/FleetNotice.cs`
  - `UI/HudController.Sensors.cs:95`
  - `Tests/EditMode/FleetSimTests.cs` (make `MakeSetup` and `Run` `internal static` so the new tests can reuse them)
- Test: `Tests/EditMode/ResearchTests.cs`

**Interfaces:**
- Consumes: everything in Task 1.
- Produces, on `FleetSim`:
  ```csharp
  public ResearchSettings ResearchCfg { get; }          // setup.research if IsValid, else ResearchSettings.Default
  public float Data { get; private set; }
  public int ResearchLevel(ResearchNode n);
  public float ResearchCost(ResearchNode n);            // ResearchMath.Cost(n, ResearchLevel(n), ResearchCfg)
  public bool CanResearch(ResearchNode n);              // Data >= ResearchCost(n)
  public DroneSettings DroneCfg { get; private set; }   // was a public readonly field
  public LogisticsSettings LogiCfg { get; private set; } // was a public readonly field
  public const float BaseSurveyRadius = 45f;            // replaces const SurveyRadius
  public float SurveyRadius { get; }                    // BaseSurveyRadius * Multiplier(SurveyRange)
  public float WarpChargeTime { get; }                  // WarpTuning.ChargeSeconds * Multiplier(WarpCharge)
  ```
- Produces, in `SimTypes.cs`:
  - `FleetCommandKind.Research`, appended;
  - `FleetCommand.Research(ResearchNode node)`, carrying the node in `Index`;
  - `SimEventKind.ResearchBought`, appended, with `Index = (int)node`, `Amount = new level`, `Position = Carrier.Position`.

**Behaviour:**
- **Base settings:** keep `baseDrone`, `baseLogi` and `baseCombat` (captured in the constructor and `InitCombat`). `void ApplyResearch()` rebuilds the effective settings from them:
  - `DroneCfg.maxSpeed ×= M(DroneSpeed)`, `cargoCapacity ×= M(DroneCargo)`, `mineRate ×= M(MiningRate)`;
  - `LogiCfg.bargeCapacity` and `haulerCapacity ×= M(LogisticsCargo)`;
  - `refineryRate` and `refineryModuleRate ×= M(RefineThroughput)`;
  - `CombatCfg.fighterDps ×= M(FighterDamage)`.

  It's called at the end of the constructor and after each purchase. Task 4 also calls it at the end of `Load`.
- **Purchase** (in `Apply`, `case FleetCommandKind.Research`):
  - if the index is out of range or `!CanResearch`, do nothing and emit nothing;
  - otherwise, `Data -= cost`, raise the level, call `ApplyResearch()`, and emit `ResearchBought`.

  Allowed during a warp charge.
- **Warp charge:** `StartWarp` uses `WarpChargeTime` instead of `WarpTuning.ChargeSeconds`. A charge already running isn't rescaled.
- **Survey radius:** `Survey()` and the HUD ring use the instance `SurveyRadius` (`sim.SurveyRadius` in `DrawSensors`).
- **Event log:** `FleetNotice` maps `ResearchBought` to `Create("info", $"Research: {ResearchMath.Name(node)} level {level}")`.

- [ ] **Step 1: Write the failing tests** in `ResearchTests.cs`. Add a reflection helper `SetData(sim, t)`, modelled on `CombatTests.SetRefined`.
  - `Buy_DeductsCostRaisesLevelAndEmits`: set Data to 500, enqueue `Research(DroneCargo)`, run one `Step(0.05f)`. Expect level 1, `Data == 400`, and one `ResearchBought` event with Index `(int)DroneCargo` and Amount 1.
  - `Buy_Unaffordable_DoesNothing`: Data 99, `Research(DroneCargo)`. Expect level 0, Data 99, and no `ResearchBought` event.
  - `Buy_TwoTapsOneTick_UsesUpdatedCost` (Review Focus 1): Data 250, enqueue `Research(DroneCargo)` twice, then one step. Expect level 1 and `Data == 150`, because the second tap costs 160. In a fresh sim with Data 300, the same steps give level 2 and `Data == 40`.
  - `Effects_ReachStats`: buy one level of each node except DataGain (Data 10000). Then:
    - `DroneCfg.maxSpeed == DroneSettings.Default.maxSpeed * 1.1f`, and the same for `cargoCapacity` and `mineRate`;
    - `LogiCfg.bargeCapacity` and `haulerCapacity` ×1.1;
    - `RefineryRate == LogisticsSettings.Default.refineryRate * 1.1f` (no modules);
    - `CombatCfg.fighterDps == CombatSettings.Peaceful.fighterDps * 1.1f`;
    - `SurveyRadius == 45f * 1.15f`;
    - `WarpChargeTime == FleetSim.WarpChargeSeconds * 0.9f`.

    All within ±1e-4.
  - `Buy_DuringWarpCharge_Works_AndDoesNotRescaleCountdown` (Review Focus 2): `StartWarp`, then one step, then record `WarpRemaining`. Set Data to 1000 and buy WarpCharge, then one step. Expect level 1, and `WarpRemaining` equals the recorded value minus 0.05 (±1e-4).
  - `CargoUpgrade_MidSortie_DroneStillDelivers` (Review Focus 4): run a peaceful sim until some drone is `Returning` with `Cargo == 60`. Buy DroneCargo, then run 60 s. Expect that drone to have docked (its state passed through `Hangar`), and `OreDelivered` to have grown by at least 60.
- [ ] **Step 2:** Recompile and run. Expect failures: the members are missing.
- [ ] **Step 3:** Implement the behaviour above.
- [ ] **Step 4:** Recompile with 0 errors, then run all EditMode tests. Expect all to pass, including the existing warp tests, which still use `WarpChargeSeconds` at level 0.
- [ ] **Step 5:** Checkpoint.

### Task 3: Earning Data

**Files:**
- Modify: `Scripts/Sim/FleetSim.cs`, `Scripts/Sim/FleetSim.Combat.cs`, `Tests/EditMode/CombatTests.cs` (make `Setup` and `RunUntil` `internal static` for reuse)
- Test: `Tests/EditMode/ResearchTests.cs`

**Interfaces:**
- Produces:
  - `public float DataEarned(DataSource s)`: the running total per source since the sim was built or loaded. It isn't saved; it's for tests and tuning.
  - private `void EarnData(DataSource s, float amount)`: adds `amount · SystemMultiplier(CurrentSystem) · Multiplier(DataGain)` to `Data` and to that source's total.

**Hooks** (one `EarnData` call each):

| Source | Where | Amount |
|---|---|---|
| Mined | `Mine()`, on `taken` | `taken · perTonneMined` |
| Delivered | drone dock (`RawOre += delivered`, FleetSim.cs ~1014) and hauler unload (~1278) | `amount · perTonneDelivered` |
| Survey | `Survey()` | `discovered · perVein` |
| PirateDamage | `Damage()`, `TargetKind.Pirate` case | `Mathf.Min(amount, p.Hull) · perPirateDamage`, taken before the subtraction |
| PirateKill | the same case, when the pirate dies | `perPirateKill` |
| WaveCleared | `StepWaves()`, where `WaveCleared` is emitted | `waveCleared` |
| RockDepleted | `Mine()`, where `RockDepleted` is emitted | `rockDepleted` |
| FirstArrival | `Depart()`, the `incoming == null` branch, after `CurrentSystem = destination` | `firstArrival` |

The FirstArrival bonus uses the destination's multiplier. `incoming == null` already means the destination was never visited, so no new state is needed. Data is fleet-level, so `Depart()` and `Retreat()` must not reset it. Offline time earns nothing: if an offline-credit path exists (`grep -rni offline Scripts`), it must not call `EarnData`.

- [ ] **Step 1: Write the failing tests.** Use settings with every rate at 0 except the one under test, set on `setup.research` (start from `ResearchSettings.Default`). Equality is within 1e-3 relative.
  - `Data_FromMining_MatchesOreCut`: perTonneMined 1, peaceful sim, 120 s. Expect `DataEarned(Mined) == OreDelivered + Σ drone.Cargo + Σ barge.Cargo + Σ hauler.Cargo`, counting live units, and `Data == DataEarned(Mined)`.
  - `Data_FromDelivery_MatchesOreDelivered`: perTonneDelivered 1, 120 s. Expect `DataEarned(Delivered) == OreDelivered`.
  - `Data_FromSurvey_PerVein`: perVein 1. Use the survey steps of `CombatTests.SurveyOrderRevealsVeinsAndSurvivesSaveLoad`. Expect `DataEarned(Survey) ==` the sum of `Index` over the `SurveyComplete` events.
  - `Data_FromCombat_DamageKillsAndWave`: perPirateDamage 1, perPirateKill 1, waveCleared 1. Use the setup of `CombatTests.Wave_IsFoughtOff_ByAnEscortingSquadron`, and run until a `WaveCleared` event. With k = the `UnitDestroyed` events whose Amount is Pirate, expect:
    - `DataEarned(PirateDamage) == k · raiderHull`;
    - `DataEarned(PirateKill) == k`;
    - `DataEarned(WaveCleared) == 1`.
  - `Data_FromDepletedRock`: rockDepleted 1, run 300 s. Expect `DataEarned(RockDepleted) ==` the count of `RockDepleted` events, which is greater than 0.
  - `Data_FirstArrivalOnce_WithSystemMultiplier`: firstArrival 1. Warp 0→1. Expect `DataEarned(FirstArrival) == 1.5`. Warp back 1→0, then 0→1 again. Expect it still `== 1.5`.
  - `Data_GainNodeMultiplies`: firstArrival 1. Set Data to 300 and buy DataGain; this spends the Data, which is fine. Warp 0→1. Expect `DataEarned(FirstArrival) == 1.5 · 1.1`.
  - `Data_NeverFromBuilding`: all rates 0. Queue and finish a drone build. Expect `Data == 0`.
- [ ] **Step 2:** Run. Expect failures.
- [ ] **Step 3:** Implement the hooks.
- [ ] **Step 4:** Run all EditMode tests. Expect all to pass. Determinism tests such as `SameSeed_GivesIdenticalRuns` must still pass.
- [ ] **Step 5:** Checkpoint.

### Task 4: Save v6

**Files:**
- Modify: `Scripts/Sim/SimSave.cs`, `Scripts/Sim/FleetSim.cs` (`Save`, `Load`, validation), `Tests/EditMode/FleetSimTests.cs` (`AssertSameState` also compares `Data` and each `ResearchLevel`)
- Test: `Tests/EditMode/ResearchTests.cs`

**Interfaces:**
- `SimSave`:
  - `CurrentVersion = 6`, with a doc line for "6: research Data and node levels (GitHub #56)";
  - new fields `public float data;` and `public List<int> research = new List<int>();`, indexed by `(int)ResearchNode`.
- **Validation** (before any mutation, for `version >= 6`):
  - `research != null`;
  - `research.Count <= ResearchMath.NodeCount`;
  - every level is at least 0;
  - `data` is finite and at least 0.

  Failure messages start with `"Invalid research"`.
- **Load:**
  - a version below 6 loads `Data = 0` and every level at 0;
  - a shorter list pads with 0;
  - then `ApplyResearch()`.

  `DataEarned` totals reset on load.

- [ ] **Step 1: Write the failing tests.**
  - `Save_RoundTripsResearch_AndContinuesIdentically`: give Data and buy two levels across nodes, run 30 s, then save through JSON and load into a new sim. Expect `AssertSameState` to pass after 60 more seconds on both sims.
  - `Save_Version5_LoadsWithZeroResearch`: take a save, set `version = 5`, clear `research` and `data`, and go through JSON. Expect `Load` to return null, `Data == 0`, every level 0, and `DroneCfg.maxSpeed == DroneSettings.Default.maxSpeed`.
  - `Save_ShorterLevelList_PadsWithZero` (Review Focus 3): set `research` to `{2}`. Expect `Load` to return null, `ResearchLevel(DroneSpeed) == 2`, and the others 0.
  - `Save_BadResearch_Refused_StateUnchanged` (Review Focus 3): try `research.Count = 10`, a level of `-1`, `data = -1`, and `data = float.NaN` set on the object (not through JSON). Expect each `Load` to return a message starting `"Invalid research"`, and the target sim's `Data` and levels to be unchanged.
  - Update `Warp_ChargingSaveContinuesAndVersion4Migrates` if the version bump breaks its assumptions. It sets `version = 4` itself, so expect no change.
- [ ] **Step 2:** Run. Expect failures.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run all EditMode tests. Expect all to pass.
- [ ] **Step 5:** Check `web/src/protocol.ts` and `web/src/save.ts`. The save stays opaque apart from `version` and `savedAt`; expect no change. If `save.ts` checks a version number, update it and run `pnpm run check` from the repo root.
- [ ] **Step 6:** Checkpoint.

### Task 5: HUD: Research tab and Data display

**Files:**
- Modify:
  - `UI/Hud.uxml` (statusPanel and buildPanel)
  - `UI/Hud.uss`
  - `UI/HudController.cs` (call `WireResearch()` in `OnUIReload` and `DrawResearch(sim)` next to `DrawBuild(sim)`; clear the research pool in `OnUIReload`)
- Create: `UI/HudController.Research.cs` (`partial class HudController`)

**UXML:**
- **statusPanel:** after `economyLabel`, add `<ui:Label name="dataLabel" class="muted" />`, showing `$"Data {Mathf.FloorToInt(sim.Data):N0}"`.
- **buildPanel:** after `buildToggle`:
  - add `<ui:VisualElement name="buildTabs" class="button-row">` with Buttons `buildTabBuild` ("Build") and `buildTabResearch` ("Research"), both classed `hud-button tab-button`;
  - wrap the existing title, button rows, `queueList` and `queueEmpty` in `<ui:VisualElement name="buildContent">`;
  - add `<ui:VisualElement name="researchContent">` containing `<ui:Label name="researchData" class="panel-title" />` and `<ui:ScrollView name="researchList" mode="Vertical" class="research-list" />`.

**HudController.Research.cs:**
- `bool researchTab` is session-only. `ShowTab(bool research)` toggles `display` on `buildContent` and `researchContent`, and puts the class `tab-button--active` on the active tab.
- `WireResearch()` builds one Button per `ResearchNode` into `researchList`:
  - `focusable = false`;
  - the click enqueues `FleetCommand.Research(node)`;
  - children: a top row with a title Label (`ResearchMath.Label`) and an effect Label (`CurrentEffect`), and a bottom row with a level Label (`$"Lv {l} → {l + 1}"`) and a cost Label (`$"{cost:N0} Data"`).

  Keep the label references in arrays indexed by node. Then call `ShowTab(researchTab)`.
- `DrawResearch(sim)`, on the existing 0.1 s refresh:
  - `researchData.text = $"RESEARCH  {Mathf.FloorToInt(sim.Data):N0} Data"`;
  - fill each node's labels;
  - `SetEnabled(sim.CanResearch(n))`;
  - `EnableInClassList("research-node--affordable", sim.CanResearch(n))`.

**USS:**
- `.research-list`: `max-height: 360px`.
- `.research-node`: `min-height: 56px`, full width, `flex-direction: column`, padding 8px, and a margin between nodes.
- `.research-node--affordable`: a green border (#5fd18b), as in the approved mockup.
- Disabled nodes keep their text readable: about 0.5 opacity is already the disabled look.
- `.tab-button--active`: a filled background.

Use colours from the existing theme.

- [ ] **Step 1:** Edit the UXML and USS, and create `HudController.Research.cs`.
- [ ] **Step 2:** Refresh and recompile with 0 errors. Clear the console, enter play mode for 5 s, then run `console get --level error`. Expect no new errors, and no `null` element lookups (`root.Q` returning null is a missing name).
- [ ] **Step 3:** Run all EditMode tests. Expect all to pass.
- [ ] **Step 4:** Checkpoint.

### Task 6: Web build, browser check and notes

**Files:**
- `web/public/unity/` (build output)
- Create: `documentation/issues/56-research-tree/README.md`
- Modify: `documentation/issues/56-research-tree/design.md` (status line), `scratch.md` (mark #56 under way or done)

- [ ] **Step 1:** Run the menu **Space Mining Fleet/Build Web (into web/public/unity)**, as in [unity-web-build.md](../../agents/unity-web-build.md). Expect a successful build.
- [ ] **Step 2:** Run `pnpm dev` in the background and open the page in the built-in browser. Check each item:
  - [ ] **(a)** Status shows `Data`, and it rises while drones mine.
  - [ ] **(b)** The Build/Research tabs switch, and the build queue keeps progressing while Research is showing.
  - [ ] **(c)** An affordable node is green, and tapping it buys one level: the level, cost, "now +x%" and Data all update, and the event log shows "Research: … level 1".
  - [ ] **(d)** An unaffordable node is dimmed and does nothing.
  - [ ] **(e)** The list scrolls with the wheel and by drag.
  - [ ] **(f)** Clicks on the panel don't select or order in the world.
  - [ ] **(g)** The Build fold toggle and sensor-plot folding work with either tab active (Review Focus 5).
  - [ ] **(h)** Save, reload the page and load: Data and levels persist. Export, then import: the same.
  - [ ] **(i)** Drone Speed bought several times visibly speeds the drones.
  - [ ] **(j)** Mobile preset (375×812): the buttons are tappable and the list scrolls.

  Take a screenshot of the Research tab for the notes.
- [ ] **Step 3:** Write `README.md` per [issues-and-decisions.md](../../agents/issues-and-decisions.md):
  - the issue link;
  - the UVCS branch and changeset (filled in at check-in);
  - what changed;
  - the final numbers (the Task 1 tables, or as tuned);
  - the test count and results;
  - the browser checklist results;
  - open points: tuning via #48; module unlocks once #23 and #59 exist; whether the web state payload should carry Data.
- [ ] **Step 4:** Run `pnpm run check` from the repo root. Expect it to pass.
- [ ] **Step 5:** Stop. Report to the user and ask before any UVCS check-in, git commit or PR.

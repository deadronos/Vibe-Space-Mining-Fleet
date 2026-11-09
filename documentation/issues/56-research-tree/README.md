# Research tree without resets: first nodes

[GitHub issue #56](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/56). Follows [ADR 0011](../../agents/decisions/0011-research-without-resets.md).

- **Design:** [design.md](design.md) (approved by the user, 9 Nov 2026).
- **Plan:** [plan.md](plan.md).
- **UVCS branch:** `/main/feature-56-research-tree`, from cs:39. Changeset: cs:40, merged to `/main` as cs:41.
- **Git branch:** `feature/56-research-tree`. It holds these notes, `.gitignore` and the web build.

## What changed

**Data.** A research currency, separate from refined ore. A running game earns it from:
- ore cut;
- ore delivered to the carrier;
- veins found by surveys;
- damage dealt to pirates, and kills;
- waves cleared;
- depleted rocks;
- the first arrival in each system.

System 2 pays 1.5×, and the Data Gain node multiplies everything. Offline time earns nothing.

**Nine repeatable nodes**, bought one level per tap through the sim's command queue (`FleetCommand.Research`):

| Node | Per level | Base cost (Data) |
|---|---|---:|
| Drone Speed | +10% | 120 |
| Drone Cargo | +10% | 100 |
| Mining Rate | +10% | 120 |
| Logistics Cargo (barge and hauler) | +10% | 200 |
| Refine Throughput | +10% | 150 |
| Fighter Damage | +10% | 150 |
| Survey Range | +15% | 150 |
| Warp Charge | −10%, compounding, floor 25% | 250 |
| Data Gain | +10% | 300 |

- **Cost:** each level costs 1.6× the one before.
- **Soft cap:** past level 5, level n gives `1 / (1 + 0.25·(n − 5))` of its full effect. Levels never stop adding, but the gains keep shrinking.

**Data rates:**

| Source | Data |
|---|---:|
| Per tonne cut | 0.01 |
| Per tonne delivered | 0.04 |
| Per vein | 15 |
| Per point of pirate damage | 0.05 |
| Per kill | 10 |
| Per wave cleared | 40 |
| Per rock depleted | 5 |
| First arrival in a system | 200 |

All of these live in `FleetConfig.research` (`ResearchSettings`) and can be tuned in the Inspector. The numbers are first guesses; tune them with the #48 scenario runner.

**Sim:**
- `Sim/Research.cs`: the enums, the settings and `ResearchMath`.
- `Sim/FleetSim.Research.cs`: Data, levels, `EarnData` and `ApplyResearch`.
- `FleetSim` keeps the base settings and rebuilds `DroneCfg`, `LogiCfg` and `CombatCfg` whenever a level changes, so existing code picks up the effects unchanged.
- `DroneCfg` and `LogiCfg` became properties.
- `FleetSim.SurveyRadius` became an instance property (`BaseSurveyRadius = 45`).
- `WarpChargeTime` applies Warp Charge to the next warp.
- New `SimEventKind.ResearchBought`, which the event log shows as "Research: Drone Speed level 3".

**Save version 6:**
- `SimSave` gains `dataMicro` (Data in millionths, a `long`) and `research` (levels by node index). Data is fixed point because a float balance loses the mining trickle above ~131k, and `JsonUtility` doesn't round-trip doubles exactly.
- Versions 2–5 load with 0 Data and every level at 0.
- A shorter level list pads with 0.
- Too many entries, a level below 0 or above 1000, or negative Data is refused, and the sim is left unchanged.

**HUD:**
- The Build panel has **Build | Research** tabs. The tab is session-only.
- Research is a scrollable list of big buttons. Each shows:
  - what the next level really adds, e.g. "Drone Speed +10%", or "+8%" past the soft cap;
  - the real total, e.g. "now +30%";
  - "Lv 3 > 4";
  - the cost.
- Affordable nodes have a green border; the rest are dimmed and ignore taps.
- The Status panel shows Data.
- `HudTheme.tss` now clips every ScrollView's viewport. The minimal theme (ADR 0005) didn't, so the list spilled out of the panel.

## Verification

**EditMode tests:** 107/107 pass (78 before, 29 new in `Tests/EditMode/ResearchTests.cs`):
- the math: soft cap, costs, labels;
- buying:
  - deducts the cost and raises the level;
  - does nothing without enough Data;
  - two taps in one tick use the updated cost;
  - works during a warp charge without rescaling the countdown;
  - a cargo upgrade mid-sortie doesn't strand a full drone;
- every effect reaches its stat;
- every Data source, the system multiplier and Data Gain;
- no Data from building;
- the save round-trip continues identically;
- v5 migration, a short level list, and bad saves refused, including a huge level (it used to hang the game);
- the final review's fixes: the label past the soft cap, and the mining trickle still counting at a 200k balance.

**Play mode:** no console errors.

**Web build:** 10.2 MB (unchanged). Checked in the built-in browser:
- [x] A browser save from before this change migrated, and Data started at 0 and rose.
- [x] The tabs switch, and the build queue (a barge) kept progressing while Research showed.
- [x] Affordable nodes are green. Three taps bought Drone Speed level 3 ("now +30%"), the next cost became 492, and Data went down. The event log shows "Research: Drone Speed level 1/2/3".
- [x] Unaffordable nodes are dimmed (Data 32, every node above that).
- [x] The list scrolls with the mouse wheel to Warp Charge and Data Gain. "−" renders.
- [x] Panel clicks didn't select anything in the world.
- [x] Sensors folds the Build panel with Research showing, and "Build +" brings it back on the same tab.
- [x] After a page reload, Data and levels persisted (the autosaved v6 save had `research[0] = 3`).
- [ ] Export and import weren't run in the browser: they use the same JSON as the EditMode JSON round-trip tests.
- [ ] Drone speed wasn't judged by eye; "now +30%" and `Effects_ReachStats` cover it.
- [~] Phone portrait (375×812): the tab works, but the whole HUD is cramped and research buttons are about 28 px tall. A compact mobile HUD is #41.

Two bugs were found in the browser and fixed:
- "→" has no glyph in the web player's Roboto (the Editor fell back to a system font), so the level text uses ASCII "Lv 3 > 4".
- The mouse wheel scrolled very slowly, so `mouse-wheel-scroll-size` is now 80.

## Open points

- **Tuning:** add Data per source to the #48 scenario runner (`FleetSim.DataEarned(DataSource)`), and check the target mix: about half steady (mining and delivery), half bursts.
- **Module unlocks:** ship modules (#23) and carrier modules (#59) become nodes once those exist.
- The web state payload (`spacemining:state`) doesn't carry Data. Add it if the page ever needs it.
- **Existing quirk (not changed):** when a drone's hold fills, the ore cut in that tick beyond capacity vanishes (`StepDrone`, Mining). Data counts ore cut, so it's slightly above ore delivered.
- The pre-existing pending UVCS changes (`Packages/manifest.json`, `packages-lock.json`, `ProjectAuditorSettings.asset`, `ProfilerCaptures/`) were carried onto the branch untouched. Leave them out of the check-in.

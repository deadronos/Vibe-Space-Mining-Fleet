# Project review · 11 November 2026

Reviewed Git `f102177` and Unity Version Control `/main` changeset `cs:78`. The browser checks used the committed player served locally. Priorities reflect player impact and confidence. No gameplay code was changed.

## Priority findings

| Priority | Area | Finding |
| --- | --- | --- |
| P1 | Save safety | Startup autosave can overwrite a save the current build refused to load. |
| P2 | Save validation | Unity accepts malformed active asteroid records as valid game state. |
| P2 | Progression | Starter-fleet losses rise sharply from System 3, and the interface offers little basis for deciding when to advance. |
| P2 | UI/UX | The web menu covers part of the desktop Sensors button. Warp arrival also gives no direct prompt to resume auto-launch. |

### P1 · Preserve rejected saves

In Chrome, I stored a synthetic version-12 snapshot with 15 minutes of game time. The version-11 player correctly reported that it could read versions 2–11. Thirty seconds later the autosave replaced the original with a fresh version-11 snapshot. The player has only a brief toast to act on. The same startup flow installs autosave when Unity rejects a recognized version. Manual Save and Export also write the active run to the same slot.

Keep the original payload available for download and require an explicit decision before replacing it. Cover future-version and corrupt saves through the browser lifecycle, including the 30-second timer and page exit. [Startup and save lifecycle](../../web/src/main.ts#L127)

### P2 · Validate the active field before applying a save

I exported a valid snapshot, replaced its first active-system rock record with JSON `null`, and sent it through the browser bridge. Unity returned `ok: true`. Re-export showed a zero-scale, zero-ore, inactive rock at the origin. Unity's JSON reader materializes the null entry as an object with default values. The inactive-field validator already checks rock scale and capacity, while the active-field path checks list length and then applies each record.

Apply shared rock validation to both paths before mutating live state. Test via JSON and assert that rejected imports preserve the running fleet. [Active-field load](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.SaveLoad.cs#L85) · [Inactive-field validation](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.cs#L728)

## Performance

The committed player is **10.80 MB** on disk, including **7.52 MB** of compressed WASM and **3.17 MB** of compressed data. The Vite JavaScript shell built to **3.91 kB gzip**. Player download and initialization are the larger startup costs to measure on constrained connections.

I used the built-in 500-drone benchmark in headed Chrome 144 on an Apple M4 with 24 GB RAM, 1200 × 832 CSS pixels and DPR 1. The benchmark skips 45 seconds of simulation warm-up, samples for 60 seconds and disables pirate waves.

| Renderer | Mean drones in flight | Mean FPS | Mean frame | Mean of per-window p95 | Sim per frame | View sync per frame |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| WebGPU | 442 | 60.0 | 16.67 ms | 17.10 ms | 0.08 ms | 0.46 ms |
| WebGL2 · ANGLE Metal | 442 | 60.0 | 16.67 ms | 17.79 ms | 0.09 ms | 0.47 ms |

The default automated WebGL2 session used SwiftShader and showed about 12 FPS in spot samples. The table uses a separate hardware-accelerated run with ANGLE Metal verified on the M4. Both tabulated runs averaged 60 FPS at the display refresh rate.

Drone batching and the fixed-tick simulation held up under the measured load. Frame time outside sim and view sync includes rendering, UI, the browser and vsync wait. The benchmark cannot isolate those costs. The next profile should add Sensors, a large selection and combat effects. Sensors rebuilds vector geometry every frame, including projected markers for visible units, and the benchmark above used the normal flight view. The runner also clamps frame time to 250 ms, so sustained stalls can slow simulation time. [Benchmark aggregation](../../web/src/bench.ts#L44) · [Sensors paint loop](../../Vibe-Space-Mining-Fleet/Assets/_Game/UI/HudController.Sensors.cs#L65) · [Tick and view sync](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Runtime/FleetSimRunner.cs#L266)

## Code quality, maintainability and modularity

- **Code quality.** The sim's fixed tick, seeded random state, command queue and NUnit coverage give behavior a repeatable test surface. The weakest boundary is persistence, where the lightweight TypeScript envelope check delegates to C# validation. Add browser tests for rejected loads, persistence failures and import followed by reload. For example, `lastSavedAt` currently advances even if writing to browser storage fails. [Envelope parser](../../web/src/save.ts#L9) · [Save status](../../web/src/main.ts#L169)
- **Maintainability.** Domain-specific partials make the simulation easier to navigate. The 832-line `FleetSim.cs` still owns tick orchestration, command dispatch, ship lifecycle and route transitions. `CaptureField()` calls full-fleet `Save()` and retains only the system data it needs. Extract field snapshot creation and validation together when addressing save integrity. The generated scene also makes asset wiring repeatable, though its 1,024-line builder couples scene assembly and prefab construction. [Route capture](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.cs#L760) · [Scene builder](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Editor/MiningFleetSceneBuilder.cs#L19)
- **Modularity.** The simulation assembly and browser bridge are useful boundaries. Within Unity, public mutable lists and entities let consumers bypass command invariants, and adding a unit role touches simulation, picking, orders, presentation and save mappings. Move toward read-only state for consumers and migrate one repeated operation at a time. GitHub CI verifies the shell and checks for build files. It does not independently verify that the checked-in Unity player matches a UVCS changeset. A build manifest with the source changeset and artifact hashes would make that handoff auditable. [Sim state surface](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.cs#L61) · [CI](../../.github/workflows/ci.yml)

## Visuals and UI/UX

- **Flight view.** The carrier silhouette and engine colors read well at the opening angle. Smaller ships and unlit rocks disappear into the black background during orbit, especially when zoomed out. A restrained fill light or rim treatment would improve hull recognition while preserving the contrast of engines and mining effects.
- **Sensors.** The tactical grid and geometric unit icons give better separation than the flight view. The legend describes red raiders and amber veins while leaving red/amber debris and purple radiation unexplained. Distinguish the zones with a line pattern and an inspectable name, charted status and damage rate. Keep the information legible without relying on hue. [Legend](../../Vibe-Space-Mining-Fleet/Assets/_Game/UI/Hud.uxml#L132) · [Hazard rings](../../Vibe-Space-Mining-Fleet/Assets/_Game/UI/HudController.Sensors.cs#L96)
- **Desktop and compact layout.** At 1200 × 832, the 40 px web gear overlaps the top-right corner of the Unity Sensors button. The 844 × 390 compact layout already reserves space for it. Synthetic touch activated the larger controls and selected the carrier, but the two-row command panel and ten-slot group bar took up much of the lower tactical view. Reserve the gear's footprint on desktop and test collapsing unassigned groups on compact screens. [Web gear](../../web/src/styles.css#L78) · [Compact rail offset](../../Vibe-Space-Mining-Fleet/Assets/_Game/UI/Hud.uss#L897)
- **Accessibility.** The browser exposes a generic game canvas and the HTML menu. The Unity game buttons are deliberately non-focusable, and many game actions rely on pointer selection. Add keyboard focus and activation for essential controls alongside the RTS shortcuts, with explicit ownership of Space so one press invokes one action. [Browser canvas](../../web/index.html#L22) · [HUD button wiring](../../Vibe-Space-Mining-Fleet/Assets/_Game/UI/HudController.cs#L217)

## Gameplay and balance

The ore-chain bottleneck display gives the player a concrete choice about moving the carrier or positioning a barge. Scouts make surveying valuable through vein bonuses and hazard charting. Warp recall leaves auto-launch off at arrival. In a first unattended sweep, every outward fixture delivered zero ore. Preserve the player's pre-warp launch preference where safe, or show a clear **Resume mining** action on arrival. [Auto-launch and recall](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.cs#L584)

For a second sweep I used the live scene's setup at 20 Hz with hazards enabled and seeds 1, 7, 19, 42, 73, 101, 207 and 313. Each run started fresh, warped directly to its target, then enabled auto-launch and ran for 15 simulation minutes or until carrier retreat. I used the starting fleet, with no purchases, research or manual orders. System numbers below match the HUD.

| System | Predicted raiders at arrival | Median ore delivered before cutoff | All mining drones lost | Carrier retreats |
| --- | ---: | ---: | ---: | ---: |
| 1 · Home | 2 | 7,746 t | 0/8 | 0/8 |
| 2 | 3 | 13,053 t | 0/8 | 0/8 |
| 3 | 6 | 10,240 t | 4/8 | 0/8 |
| 5 | 9 | 7,652 t | 8/8 | 0/8 |
| 9 | 13 | 5,209 t | — | 8/8 |

System 2 rewards the starter fleet in this fixture. By System 5 the median delivered ore is back near Home and mining ends with zero drones across all eight seeds. The System 9 runs ended early on retreat, so their ore totals cover less time. These runs establish the starter fleet's limits. An upgraded fleet with active combat orders could have a different progression curve.

Show the destination's predicted pressure and expected benefit before committing to warp. Then test upgrade paths with the same seeds, including a defence-first fleet and a mining-first fleet with scouts. Repair also deserves a budget control: one ship healing continuously consumes 37.5 refined t/s at default settings, against roughly 20 t/s in the observed opening. Test whether sustained exposure can consume the reserves needed to replace losses before adjusting prices. [Route scaling](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Settings/SimSettings.cs#L237) · [Wave prediction](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.Combat.cs#L96) · [Repair spending](../../Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/Sim/Core/FleetSim.Support.cs#L241)

## Verification and scope

- `pnpm run check` and `pnpm run build` passed, including all **5** web tests.
- `scripts/unity-check.sh` compiled and passed **257/257** EditMode tests.
- Browser checks covered startup, normal flight, Sensors, compact layout, synthetic carrier selection and save behavior in an isolated profile. Physical touch devices, Safari, lower-spec hardware, active combat performance and upgraded late-game strategies remain unverified.

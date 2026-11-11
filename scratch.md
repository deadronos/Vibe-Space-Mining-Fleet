# What to do next

Updated 11 Nov 2026 against v0.15.0 and the open GitHub issues.

**v0.15.0** brought the Foundry ship models, imported at edit time ([#14][14], ADR 0017), and repair ships, scouts and vein strikes ([#82][82], ADR 0018, save version 10). **v0.14.0** opened the route past two systems with a warp sequence and a look per system ([#78][78]). Earlier: direct control vs automation with stance scopes and preset rule cards (ADR 0016), touch controls and a phone layout, carrier modules, offline ore credit, the research tree, logistics, combat, cargo heat, the event log, the Sensors Manager, batched drone rendering and the WebGL2 fallback.

## Recommended order

1. **[#33 Cross-browser and device testing][33].** Close it out: Safari import completion, non-QWERTY hotkeys, the remaining browser combat cases, and a real phone and tablet pass (touch from [#41][41] was only tested with synthetic touches). Add offline credit on forced WebGL2 to the matrix in `documentation/web-shell.md`.
2. **[#24 Hazards][24].** The next gameplay slice that needs no decision first. Start with one hazard type (debris, damage over time) and the storm warning through the event log. Scouts can chart hazards as they survey, and repair ships give hazard damage an answer in the field.
3. **[#79 Star map overlay][79].** The route is open-ended now; the map makes it readable. Balance beyond system 2 alongside it (headless runner: `WarpBalanceScenarios.cs`).

## Other tracks

- **Carrier systems.** [#22 energy pool][22] comes before [#25 gas giants and H2][25], which feeds it. The H2 harvester (its model is already imported) can be a new support role on `SimSupport` (ADR 0018). [#23 ship modules][23] comes before [#26 salvage][26], which needs the tractor beam; build #23 on the module model from #59 (`ModuleDef` with a `ModuleHost`).
- **Automation, next.** Custom rule cards (conditions, actions, parameters) on top of the preset cards from ADR 0016, including cards for repair ships and scouts. Needs a new issue.
- **Long-term balance.** [#57 prestige][57] stays parked until the research tree, offline credit and the open route have been played for a while. Measure late-game pacing with the headless runner first. Decide the 8 h offline cap there too: a starting fleet earns about 20 t/s, so 8 h pays about 290,000 t (`FleetSim.Offline.cs`).
- **Rendering.** [#30][30] is still open although batched drones are merged. Measure 500 drones against its target (above 50 fps on a mid laptop in Chrome, WebGPU and WebGL2), then close it or list what is left.
- **Art.** [#28][28] shrinks to the shared rock mesh pool (Foundry models cover the hulls): retitle or close it. [#29][29] is parked by ADR 0017; close it unless optional content grows to several MB.

## Housekeeping

- **Umbrella checklists are out of date.** [#35][35], [#36][36], [#37][37] and [#38][38] still show closed issues as unticked (#14, #31, #15 to #18, #21, #27, #32, #34, …) and don't list #56 to #59, #78 or #82.
- **CI runs no C# tests.** The Unity half is in UVCS and Actions has no licence, so the EditMode tests (252 now) only run locally (`scripts/unity-check.sh`) before a build.
- **The web shell has no tests.** `save.ts` and `protocol.ts` would take unit tests cheaply; fixture saves from versions 2 to 10 would be the most useful.
- **#59 follow-ups.** Play the module numbers and decide whether a fourth slot should exist (`documentation/issues/59-carrier-modules-hud/`).

## Deferred: v0.15.0 playtest follow-ups

The live run verified repair and scout selection, their HUD rows, and V to survey with a scout. See the [playtest report on #82][82-playtest].

- Isolate a right-click repair order against a damaged target and check support hull bars. Measure sustained repair at 15 hull/s and 2.5 ore/hull, then check the caps (4 repair ships, 3 scouts) and the +50% vein strike. The first run supports keeping the 1,500 ore repair ship and 800 ore scout prices for now.
- Show automatic scout survey notices only when they discover veins, keep feedback for explicit orders, and fix overlapping Events rows at narrow widths. Give support ships a HUD hint that describes their own controls.
- Check the scan ring's brightness and width up close, improve the barge's flat-looking ore fill, and revisit the two code follow-ups in the [#82 notes](documentation/issues/82-repair-scout-ships/).

[14]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/14
[22]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/22
[23]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/23
[24]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/24
[25]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/25
[26]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/26
[28]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/28
[29]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/29
[30]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/30
[33]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/33
[35]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/35
[36]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/36
[37]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/37
[38]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/38
[41]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/41
[57]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/57
[78]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/78
[79]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79
[82]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/82
[82-playtest]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/82#issuecomment-6792706241

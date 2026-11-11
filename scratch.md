# What to do next

Updated 11 Nov 2026 after the [project review](documentation/reviews/2026-11-11-project-review.md).

**v0.15.0** brought the Foundry ship models, imported at edit time ([#14][14], ADR 0017), and repair ships, scouts and vein strikes ([#82][82], ADR 0018, save version 10). **v0.14.0** opened the route past two systems with a warp sequence and a look per system ([#78][78]). Earlier: direct control vs automation with stance scopes and preset rule cards (ADR 0016), touch controls and a phone layout, carrier modules, offline ore credit, the research tree, logistics, combat, cargo heat, the event log, the Sensors Manager, batched drone rendering and the WebGL2 fallback.

## Recommended order

1. **Preserve player saves.** [#86][86] blocks overwrites after a rejected load and gives the player a recovery path. [#87][87] rejects malformed active asteroid records before changing the running game.
2. **Make warp arrival and destination risk clear.** [#88][88] adds a visible way to resume mining after recall. [#89][89] measures upgraded fleets, replacement costs and repair spending before tuning deeper systems. Use the results to show ore richness and pirate threat in [#79][79].
3. **Improve tactical readability and input.** [#90][90] clears the Sensors button, labels hazards and reduces compact HUD obstruction. [#91][91] makes essential HUD controls operable by keyboard. [#92][92] improves small ship and asteroid visibility during orbit and zoom.
4. **Finish browser and performance verification.** In [#33][33], finish Safari imports, non-QWERTY hotkeys, browser combat, physical phone and tablet testing, and offline credit on forced WebGL2. In [#30][30], verify 500 drones on a mid-range laptop using both hardware renderers, then profile Sensors, large selections and combat. The M4 review measured 60 FPS in the normal flight view on both renderers.
5. **Tighten simulation and build boundaries.** [#93][93] separates route snapshots from full saves and moves a consumer to read-only sim state. [#94][94] adds a Unity source changeset and player file checksums that CI can verify.

## Other tracks

- **Carrier systems.** [#22 energy pool][22] comes before [#25 gas giants and H2][25], which feeds it. The H2 harvester (its model is already imported) can be a new support role on `SimSupport` (ADR 0018). [#23 ship modules][23] comes before [#26 salvage][26], which needs the tractor beam; build #23 on the module model from #59 (`ModuleDef` with a `ModuleHost`).
- **Automation, next.** Custom rule cards (conditions, actions, parameters) on top of the preset cards from ADR 0016, including cards for repair ships and scouts. Needs a new issue.
- **Long-term balance.** [#57 prestige][57] stays parked until the research tree, offline credit and the open route have been played for a while. Measure late-game pacing with the headless runner first. Decide the 8 h offline cap there too: a starting fleet earns about 20 t/s, so 8 h pays about 290,000 t (`FleetSim.Offline.cs`).
- **Art.** [#28][28] shrinks to the shared rock mesh pool (Foundry models cover the hulls): retitle or close it. [#29][29] is parked by ADR 0017; close it unless optional content grows to several MB.

## Housekeeping

- **Unity CI is deferred.** Run EditMode tests locally with `scripts/unity-check.sh`.
- **Carrier module balance.** Play the module numbers and decide whether to keep a fourth slot in [#85](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/85).

## Deferred: v0.15.0 playtest follow-ups

The live run verified repair and scout selection, their HUD rows, and V to survey with a scout. See the [playtest report on #82][82-playtest].

- Isolate a right-click repair order against a damaged target and check support hull bars. Measure sustained repair at 15 hull/s and 2.5 ore/hull, then check the caps (4 repair ships, 3 scouts) and the +50% vein strike. The first run supports keeping the 1,500 ore repair ship and 800 ore scout prices for now.
- Show automatic scout survey notices only when they discover veins, keep feedback for explicit orders, and fix overlapping Events rows at narrow widths. Give support ships a HUD hint that describes their own controls.
- Check the scan ring's brightness and width up close, improve the barge's flat-looking ore fill, and revisit the two code follow-ups in the [#82 notes](documentation/issues/82-repair-scout-ships/).

[14]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/14
[22]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/22
[23]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/23
[25]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/25
[26]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/26
[28]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/28
[29]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/29
[30]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/30
[33]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/33
[57]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/57
[78]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/78
[79]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79
[82]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/82
[82-playtest]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/82#issuecomment-6792706241
[86]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/86
[87]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/87
[88]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/88
[89]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/89
[90]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/90
[91]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/91
[92]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/92
[93]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/93
[94]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/94

# What to do next

Updated 14 Nov 2026 after [#28][28], [#79][79], [#93][93], [#94][94], and [#99][99].

**v0.18.0** shipped the shared asteroid variant pool and richer rock shapes ([#28][28]). Earlier **v0.17.0** shipped the star map ([#79][79]), **v0.15.0** brought the Foundry ship models, imported at edit time ([#14][14], ADR 0017), and repair ships, scouts and vein strikes ([#82][82], ADR 0018, save version 10); **v0.14.0** opened the route past two systems with a warp sequence and a look per system ([#78][78]).

## Recommended order

1. **Finish browser and performance verification.** In [#33][33], finish Safari imports, non-QWERTY hotkeys, browser combat, physical phone and tablet testing, and offline credit on forced WebGL2. In [#30][30], verify 500 drones (and recheck the #92 camera fill light) on a mid-range laptop using both hardware renderers, then profile Sensors, large selections and combat. The M4 review measured 60 FPS in the normal flight view on both renderers.

Simulation boundaries and build manifest verification shipped in [#93][93] and [#94][94] (`CaptureField()` builds `SystemSave` directly, `FleetSim` collections expose `IReadOnlyList<T>`, `WebBuild` writes `web/public/unity/manifest.json`, and `scripts/verify-unity-manifest.mjs` runs in CI). The **v0.15.0** playtest polish items shipped in [#99][99].

Tactical readability shipped in [#90][90], [#91][91], and [#92][92]: the Sensors button clears the game menu button, hazards are named with their damage rates, the compact group bar collapses, the HUD has a keyboard cursor (Enter, Tab, Esc), and a restrained camera fill light lifts dark-side hulls and rocks at 60 fps on M4 ([results](documentation/issues/90-92-tactical-readability/README.md#frame-time-v0160)).

Warp arrival and route tuning are complete in [#88][88] and [#89][89].

Save safety shipped in [#86][86] and [#87][87]. Rejected saves can be recovered, and malformed asteroid records are rejected before Unity changes the running game.

## Other tracks

- **Carrier systems.** [#22 energy pool][22] comes before [#25 gas giants and H2][25], which feeds it. The H2 harvester (its model is already imported) can be a new support role on `SimSupport` (ADR 0018). [#23 ship modules][23] comes before [#26 salvage][26], which needs the tractor beam; build #23 on the module model from #59 (`ModuleDef` with a `ModuleHost`).
- **Automation, next.** Custom rule cards (conditions, actions, parameters) on top of the preset cards from ADR 0016, including cards for repair ships and scouts. Needs a new issue.
- **Long-term balance.** [#57 prestige][57] stays parked until the research tree, offline credit and the open route have been played for a while. Measure late-game pacing with the headless runner first. Decide the 8 h offline cap there too: a starting fleet earns about 20 t/s, so 8 h pays about 290,000 t (`FleetSim.Offline.cs`).
- **Art.** [#28][28] shipped the 16-variant pooled asteroid rocks with richer shapes and crevice shading. The Foundry models cover the hulls. [#29][29] (runtime glTFast) was closed as parked by ADR 0017; reopen it if optional content grows to several MB.

## Housekeeping

- **Unity CI is deferred.** Run EditMode tests locally with `scripts/unity-check.sh`.
- **Carrier module balance.** Play the module numbers and decide whether to keep a fourth slot in [#85](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/85).

## Closed follow-ups (#99)

The [#82][82] playtest follow-ups (quiet automatic empty surveys, explicit order feedback, wrapped Event rows without overlap, support-specific HUD hints, slimmer faded scan ring, heaped barge cargo fill, and isolated EditMode checks) are resolved in [#99][99]. Let [#82][82] code follow-ups stay tracked under [#99][99] or `support` docs ([notes](documentation/issues/93-94-99-snapshot-manifest-polish/README.md)).

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
[99]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/99

# What to do next

Updated 10 Nov 2026 against v0.13.0 and the open GitHub issues. Shipped so far:
direct control vs automation, stance scopes and preset rule cards (#8, #20, #19,
ADR 0016, merged, released in v0.13.0), touch controls and a phone layout (#41, v0.13.0), carrier
modules and the HUD pass (#59, v0.12.0), the emissive glow fix (v0.11.1), offline ore credit (#58), the research tree (#56), logistics, RTS controls
polish, combat, cargo heat, the event log, the Sensors Manager, run structure,
revisitable systems with fleet warp, batched drone rendering, and the WebGL2
fallback for a failed WebGPU start.

## Recommended order

1. **Look at v0.11.1 and tune.** The glows are back (engines, windows, nav
   lights, pirate glow, ore; UVCS cs:46, merged as cs:47), so bloom has
   bright sources again and the game looks different from v0.10.0 and
   v0.11.0. Checked on WebGPU only: look at WebGL2, at pirates and at a
   loaded barge. Then decide whether to keep the 8 h offline cap: a starting
   fleet earns about 20 t/s, so 8 h pays about 290,000 t (constants in
   `FleetSim.Offline.cs`).
2. **[#33 Cross-browser and device testing][33].** Close it out. Left:
   Safari import completion, non-QWERTY hotkeys, the phone and tablet pass,
   and the remaining browser combat cases. Add offline credit on forced
   WebGL2 to the matrix in `documentation/web-shell.md`.
3. **Play the automation pass** (v0.13.0, ADR 0016): do haulers that now
   flee under fire still finish their runs during long waves, and are the
   Safe radii (80 from the carrier, 45 from a squadron) right?
4. **[#24 Hazards][24].** The next gameplay slice that needs no decision
   first: scouts and veins exist, so charted hazards have something to build
   on. Start with one hazard type (debris, damage over time) and the storm
   warning through the existing event log.

## Other tracks

- **Automation, next.** Custom rule cards (conditions, actions, parameters)
  on top of the preset card model from ADR 0016. Needs a new issue.
- **Carrier systems.** [#22 energy pool][22] comes before [#25 gas giants and
  H2][25], which feeds it. [#23 ship modules][23] comes before [#26
  salvage][26], which needs the tractor beam. Build #23 on the
  module model from #59 (`Sim/Systems/Modules.cs`: `ModuleDef` with a `ModuleHost`),
  so ships and the carrier share it.
- **Route.** [#78][78] opened the route past two systems, with a warp
  sequence and a look per system. Next: balance beyond system 2, then the
  [#79 star map overlay][79].
- **Long-term balance.** [#57 prestige][57] stays parked until the research
  tree and offline credit have been played for a while. Use the headless
  scenario runner (`WarpBalanceScenarios.cs`) to measure late-game pacing
  first.
- **Mobile.** [#41][41] is merged (touch gestures per ADR 0015, a compact
  landscape HUD) but tested only with synthetic touches in desktop Chrome.
  On a real Android phone, and iOS Safari if possible, check taps, pinch and
  orbit, fullscreen and frame rate as part of #33. Open points are in
  `documentation/issues/41-touch-input/`.
- **Rendering.** [#30][30] is still open although batched rendering is
  merged. Measure 500 drones against its target (above 50 fps on a mid
  laptop in Chrome, WebGPU and WebGL2), then close it or list what is left.
- **Art.** [#14][14] settled on the Foundry models, imported at edit time
  (ADR 0017). Next: repair and scout ships as new units on the imported
  models. [#29][29] is parked; [#28][28] shrinks to the shared rock mesh pool.

## Housekeeping

- **Umbrella checklists are out of date.** [#35][35], [#36][36], [#37][37]
  and [#38][38] still show closed issues as unticked (for example #15 to #18,
  #21, #27, #31, #32, #34) and don't list #56 to #59.
- **CI runs no C# tests.** The Unity half is in UVCS and Actions has no
  licence, so the EditMode tests only run locally (`scripts/unity-check.sh`)
  before a build.
- **The web shell has no tests.** `save.ts` and `protocol.ts` would take unit
  tests cheaply; fixture saves from versions 2 to 6 would be the most useful.
- **Large files.** `FleetSim.cs` (about 1,600 lines) is worth splitting.
  `HudController.cs` was split by panel in #59.
- **#59 follow-ups.** Play the module numbers and decide whether a fourth
  slot should exist (`documentation/issues/59-carrier-modules-hud/`). Check
  the new HUD on a real phone as part of [#33][33].

[8]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/8
[14]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/14
[19]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/19
[20]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/20
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
[59]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/59
[78]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/78
[79]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79

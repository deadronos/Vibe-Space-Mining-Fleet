# What to do next

Updated 9 Nov 2026 against v0.11.1 and the open GitHub issues. Shipped so far:
the emissive glow fix (v0.11.1), offline ore credit (#58), the research tree (#56), logistics, RTS controls
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
3. **[#8 Direct control vs automation][8].** A decision, not code. ADR 0007
   settled Stop and Hold for miners. Still open: whether combat ships fall
   back to automation after an order, and how stances and rule cards rank
   against a direct order. [#20][20] and [#19][19] wait on this.
4. **[#59 Carrier modules and HUD pass][59].** The largest open item. Split
   it before starting:
   - a short UI plan (mock or notes) for the user to agree;
   - carrier modules (slots, effects, cost, research unlock, saved);
   - the HUD pass itself, checked on WebGPU and WebGL2.
5. **[#24 Hazards][24].** The next gameplay slice that needs no decision
   first: scouts and veins exist, so charted hazards have something to build
   on. Start with one hazard type (debris, damage over time) and the storm
   warning through the existing event log.

## Other tracks

- **Automation, after #8.** [#20 stance scopes][20] first (fleet, class,
  group), then [#19 rule cards][19] with presets only.
- **Carrier systems.** [#22 energy pool][22] comes before [#25 gas giants and
  H2][25], which feeds it. [#23 ship modules][23] comes before [#26
  salvage][26], which needs the tractor beam. Plan #23 together with the
  carrier modules in #59 so ships and the carrier share one module model.
- **Long-term balance.** [#57 prestige][57] stays parked until the research
  tree and offline credit have been played for a while. Use the headless
  scenario runner (`WarpBalanceScenarios.cs`) to measure late-game pacing
  first.
- **Mobile.** [#41][41] follows the device pass in #33. On a real Android
  phone, find out what input the Unity player sees and whether HUD taps
  work, then choose gestures and a compact landscape HUD.
- **Rendering.** [#30][30] is still open although batched rendering is
  merged. Measure 500 drones against its target (above 50 fps on a mid
  laptop in Chrome, WebGPU and WebGL2), then close it or list what is left.
- **Art.** [#14][14] decides between procedural hulls and the Foundry glTF
  models. Try one ship both ways; the result unblocks [#28][28] and
  [#29][29].

## Housekeeping

- **Umbrella checklists are out of date.** [#35][35], [#36][36], [#37][37]
  and [#38][38] still show closed issues as unticked (for example #15 to #18,
  #21, #27, #31, #32, #34) and don't list #56 to #59.
- **CI runs no C# tests.** The Unity half is in UVCS and Actions has no
  licence, so the 119 EditMode tests only run locally before a build.
- **The web shell has no tests.** `save.ts` and `protocol.ts` would take unit
  tests cheaply; fixture saves from versions 2 to 6 would be the most useful.
- **Large files.** `FleetSim.cs` (about 1,600 lines) and `HudController.cs`
  (about 900) are worth splitting before #59.
- `documentation/agents/using-unity-mcp.md` still says the EditMode suite is
  11 tests in about 3 s.

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

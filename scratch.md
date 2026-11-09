# What to do next

Updated 9 Nov 2026 against v0.8.0 and the open GitHub issues. Shipped so far:
logistics, RTS controls polish, combat, cargo heat, the event log, the Sensors
Manager, run structure, and revisitable systems with fleet warp.

## Recommended order

1. **[#44 Firefox 150 WebGPU startup][44].** A real startup failure with a
   known workaround. Add a WebGL2 fallback (or a retry-with-WebGL2 prompt in
   the web shell) when WebGPU initialisation throws. This also unblocks the
   Firefox row of the matrix in [#33][33].
2. **[#33 Cross-browser and device testing][33].** Finish the remaining
   rows (Safari, non-QWERTY hotkeys, phone/tablet) and record them in
   `documentation/web-shell.md`. Close it once the matrix is complete.
3. **[#48 Warp recall, ore and pirate balance][48].** Build the headless
   `FleetSim` scenario runner with fixed seeds, sweep deployments and combat
   pressure, then tune the 90 s charge, ore bonus and pirate scaling. Validate
   in the player.
4. **Pick the next gameplay feature.** The sensors and systems work makes
   [#24 Hazards][24] (debris, radiation, storms) the natural follow-up, since
   scouts and veins now exist. [#22 Carrier energy][22] and [#23 Ship
   modules][23] are the next larger slices.

## Other tracks

- **Mobile.** Use the device pass in [#33][33] to inform [#41][41]. On a
  real Android phone, check what input the Unity player sees and whether HUD
  taps work, then choose gestures and a compact landscape HUD.
- **Automation.** Settle [#8][8] before expanding [#20][20] beyond the
  existing squadron stances or adding [#19][19] rule cards. Stop and Hold
  already have defined behavior in
  [ADR 0007](documentation/agents/decisions/0007-stop-hold-and-escape.md).
- **Decisions settled (ADRs 0011–0014).** Research without resets
  ([#56][56], prestige revisit in [#57][57]), light offline ore credit
  ([#58][58]), hangar types as carrier modules with a Homeworld-style HUD
  pass ([#59][59]), and the Unity build stays committed. [#26][26] salvage
  and [#25][25] gas giants can now be planned against these.
- **Rendering and art.** Start [#30][30] with a 500-drone browser baseline
  on WebGPU and WebGL2. Measure frame time separately from the sim tick
  before implementing instancing or LOD. Use [#14][14] to compare one ship
  both ways before expanding the procedural hull work in [#28][28] or adding
  a runtime glTF dependency in [#29][29].

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
[41]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/41
[44]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/44
[48]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/48
[56]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/56
[57]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/57
[58]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/58
[59]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/59

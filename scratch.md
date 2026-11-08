# What to do next

Updated 9 Nov 2026 against v0.5.0 and the open GitHub issues. Logistics, RTS
controls polish, combat and the deploy smoke check have shipped. The
[combat notes](documentation/issues/16-combat/README.md) record 50 EditMode tests
and a Chrome WebGPU playthrough, with several browser checks still outstanding.

## Recommended order

1. **[#33 Cross-browser and device testing][33].** Start here. Check Chrome
   with forced WebGL2, then Safari and Firefox, and record the actual renderer
   and outcome in the browser matrix. Exercise Export, Import and New, load
   a real v2 save into v0.5.0, and try squadron control groups, the offscreen
   wave marker and carrier loss. File reproducible failures as separate issues.
2. **[#21 Finish cargo heat][21], then [#27 Event log and notifications][27].**
   Combat already scales waves by heat and distance and shows heat in the HUD.
   Check the remaining issue criteria, especially how held ore contributes to
   heat and how heat affects warning time. Reuse the existing combat banners
   for #27 and start with incoming waves, ship losses and full barges. Give
   players a short history they can use to locate trouble in the field.
3. **[#17 Sensors Manager][17].** Make the tactical map usable for selection
   and orders with the current mining and combat fleet. Then add scouts and
   veins so surveying visibly changes where drones mine. Hazard avoidance can
   follow with [#24][24].
4. **[#5 Run structure][5] before [#18 Systems and warp][18].** Settle the
   destination model and fleet carryover before adding per-system save state.
   Use a two-system round trip to verify recall, fleet carryover and field
   persistence.

## Other tracks

- **Mobile.** Use the device pass in [#33][33] to inform [#41][41]. On a
  real Android phone, check what input the Unity player sees and whether HUD
  taps work. Use that evidence to choose gestures and a compact landscape HUD.
- **Automation.** Settle [#8][8] before expanding [#20][20] beyond the
  existing squadron stances or adding [#19][19] rule cards. Stop and Hold
  already have defined behavior in
  [ADR 0007](documentation/agents/decisions/0007-stop-hold-and-escape.md).
- **Rendering and art.** Start [#30][30] with a 500-drone browser baseline
  on WebGPU and WebGL2. Measure frame time separately from the sim tick
  before implementing instancing or LOD. Use [#14][14] to compare one ship
  both ways before expanding the procedural hull work in [#28][28] or adding
  a runtime glTF dependency in [#29][29].

[5]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/5
[8]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/8
[14]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/14
[17]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/17
[18]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/18
[19]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/19
[20]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/20
[21]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/21
[24]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/24
[27]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/27
[28]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/28
[29]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/29
[30]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/30
[33]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/33
[41]: https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/41

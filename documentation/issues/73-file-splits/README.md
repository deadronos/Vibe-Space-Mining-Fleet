# Code quality 3/4: split the large sim and RTS files

[GitHub issue #73](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/73)

The first slice was checked in as cs:63 on `/main/feature-73-file-splits`, based on cs:62, and merged into UVCS `/main` as cs:64.

The save/load, drone, logistics, throughput, and asteroid sections of `FleetSim.cs` now have their own partial files. The moved sections retain their original source text. Unity generated the five script metadata files.

`scripts/unity-check.sh` compiled and passed 169 of 169 EditMode tests on the feature branch and on the UVCS merge result.

## Remaining splits

The remaining splits were checked in as cs:65 on UVCS `/main/feature-73-remaining` and merged into `/main` as cs:66.

- `FleetSim.Squadrons.cs`, `FleetSim.Pirates.cs` and `FleetSim.Damage.cs` take the matching combat sections. Shared queries, tick orchestration, commands and save/load remain in `FleetSim.Combat.cs`.
- `SimSettings.cs`, `SimEntities.cs`, `SimCommands.cs` and `SimEvents.cs` group the former `SimTypes.cs` declarations by responsibility. Source comparison confirmed that the moved combat bodies and sim type declarations match cs:64.
- `UnitPicker` handles projection and picking. `ContextResolver` handles context decisions, and `OrderOverlay` renders the move widget, queued paths and pings. The controllers still coordinate input and issue commands.
- Rebuilt the demo scene through the Unity Editor with the overlay and original visual settings wired in. Restored the equivalent prefab and volume rewrites after checking their scene references.

## Verification of the remaining splits

- `scripts/unity-check.sh` compiled and passed 169 of 169 EditMode tests on the feature branch and on the UVCS merge result.
- The fresh Unity web build succeeded at 10.3 MB. `pnpm run check` and `pnpm run build` passed.
- Chrome WebGL2 desktop at 1280 × 800 rendered the move widget. Mouse selection and right-click orders displayed a path and moved a barge, confirmed from the sim save.
- Chrome WebGL2 at 900 × 550 switched to the touch HUD. Synthetic touch input selected the barge and issued a move order. The path rendered and the sim save confirmed movement. Both runs had zero console errors and five graphics warnings about readback stalls and URP fallbacks.

# Code quality 4/4: reorganise the Scripts folder layout

[GitHub issue #74](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/74)

UVCS branch `/main/feature-74-script-layout` was checked in as cs:67 and merged into `/main` as cs:68.

## Layout

- `Sim/Core` contains the `FleetSim` partials, commands, events, save types, and random state. Settings, entities, and systems each have their own subfolder. The simulation assembly definition stays at the root of `Sim`.
- `Rts/Input` contains selection, order, touch, and picking code. `Rts/Overlay` contains `OrderOverlay`.
- `Views` contains unit views and rendering helpers, including the shared palette and shader property IDs. `World` contains asteroids, starfield, and the camera. `Runtime` contains the runner, commander, performance counters, and notices.

The 51 scripts and their metadata match cs:66 byte for byte. UVCS records 102 moves and 18 additions for the nine new folders and their metadata. The moves preserve GUIDs, history, and assembly boundaries.

## Verification

- `scripts/unity-check.sh` compiled and passed 169 of 169 EditMode tests on the feature branch and the UVCS merge result.
- Unity loaded one scene and six prefabs. All 171 objects were free of missing script components.
- The 10.3 MB verification build booted on Chrome WebGPU, advanced the sim, launched drones, and returned a version 8 save. The console showed zero errors and one graphics readback warning. The verification build was kept out of the layout-only PR.
- `pnpm run check` and `pnpm run build` passed.

# #79 Star map overlay for the system route

GitHub issue: [#79](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/79)

## Where the code lives

| | |
| --- | --- |
| Git branch | `feature/79-star-map` (from `main` @ `38d512e`) |
| UVCS branch | `/main/feature-79-star-map` (`cs:85`, branched from `/main` @ `cs:84`) |

## What changed

### Sim (`Vibe-Space-Mining-Fleet`)

- `Assets/_Game/Scripts/Sim/Core/FleetSim.RouteMap.cs`: added `SystemRouteSummary` and `FleetSim.RouteMapCount`, `RouteSummary(int)`, and `FillRouteSummaries(List<SystemRouteSummary>)` to expose every visited system (`0 .. FurthestSystem`) plus the next uncharted frontier system (`FurthestSystem + 1`, clamped to `MaxSystems - 1`) with distance factor, ore multiplier, charted vein count, pirate threat estimate / wave timer / active count, field depletion, and time since last visit.
- `Assets/_Game/Tests/EditMode/RouteTests.cs`: added `RouteSummary_TracksVisitedDepletionThreatAndUnchartedFrontier`.

### HUD & input (`Vibe-Space-Mining-Fleet`)

- `Assets/_Game/UI/Hud.uxml`, `Assets/_Game/UI/Hud.uss`: added the `Map  N` rail button (`#railMap`) and the `#starMapBackdrop` / `#starMapPanel` UI Toolkit overlay, with desktop, `.hud--compact`, and `.hud--touch` layout rules.
- `Assets/_Game/UI/HudController.RouteMap.cs`: wired `#railMap`, clickable `warpStatus`, backdrop click-away dismissal, `N` toggle, horizontal route node strip, detail readout, and neighbour-only `Warp to Sys N` / `Cancel warp` actions.
- `Assets/_Game/UI/HudController.cs`, `HudController.Manager.cs`, `HudController.Sensors.cs`, `HudController.Keyboard.cs`, `Scripts/Rts/Input/SelectionController.cs`: wired Star Map refresh, `N` hotkey, `Esc` dismissal (`HudController.CloseStarMap()`), modal exclusion with Manager/Sensors, and keyboard cursor scoping while open.

### Web build (`git`)

- `web/public/unity/Build/*`: rebuilt the Unity Web player (`unity.wasm.unityweb` 7,522,189 B, `unity.data.unityweb` 3,175,726 B, `unity.framework.js.unityweb` 74,656 B, `unity.loader.js` 48,916 B).

## Verification

- `./scripts/unity-check.sh`: compiled cleanly; `EditMode 267 of 267 passed`.
- `pnpm run check`: `oxlint` (0 warnings/errors), `oxfmt --check` (22 files), `tsc -p .`, and `node --test web/tests/*.test.mjs` (`6` of `6` passed).
- `Space Mining Fleet/Build Web (into web/public/unity)`: `Succeeded size=10.3MB time=4s errors=0`.
- Browser check against local Vite dev server serving `web/public/unity/`:
  - Desktop `1280×800` (WebGPU): `0` console errors, `0` page errors; `Map  N` renders in the top-right rail clear of the gear button; `N` opens the Route Map showing `HOME` and `SYS 2` (`Tysuia Shoal`); clicking `HOME` switches details to `System 1 · Home` (`Here now` disabled); clicking `SYS 2` then `Warp to Sys 2` closes the modal and starts warp charge (`60 s`, fleet recall active).
  - Compact `844×390` (`?renderer=webgl2`): `0` console errors, `0` page errors; Route Map renders cleanly while warping (`Charging warp to System 2 · Tysuia Shoal: 49 s`, `WARP TARGET`, `Cancel warp`) without clipping or background HUD bleed-through, and `Esc` closes it cleanly.

## Open points

- `Cancel warp` inside the Star Map modal sends `FleetCommandKind.CancelWarp` (same path as the fleet HUD `Cancel warp` button, verified by code inspection; the desktop browser run closed the modal on warp start before clicking `Cancel warp`).
- Active floating warning tags (e.g. `PIRATES 0:21` in `Hud.uxml`) appear after `#starMapBackdrop` in UXML document order and can draw above the backdrop when active on compact viewports.

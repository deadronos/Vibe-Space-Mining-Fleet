# Issues #93, #94, and #99 — Snapshot isolation, build manifest, and v0.15.0 polish

Implements [GitHub #93](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/93), [GitHub #94](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/94), and [GitHub #99](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/99).

## Summary of changes

### #93 — Direct route snapshots and read-only `FleetSim` collections

- Rewrote `FleetSim.CaptureField()` (`FleetSim.cs`) to build `SystemSave` directly from field, wave, hazard, rock (`CaptureRocks`), and pirate (`CapturePirates`) snapshots without calling full-fleet `Save()`.
- Shared `CaptureRocks(List<RockSave>)` and `CapturePirates(List<PirateSave>)` between route capture and `Save()` / `SaveCombat()`.
- Shared `ValidSavedPirate(PirateSave)` alongside `ValidSavedRock(RockSave)` across both active-field (`ValidateCombat` in `FleetSim.Combat.cs`, `Load` in `FleetSim.SaveLoad.cs`) and inactive-field (`ValidateSystems` in `FleetSim.cs`) validation, rejecting malformed or `null` active entries before mutating live state.
- Narrowed `FleetSim` collections (`Drones`, `Asteroids`, `Barges`, `Haulers`, `BuildQueue`, `Squadrons`, `Pirates`, `Supports`) to `IReadOnlyList<T>` properties backed by private `List<T>` fields, updating `FleetSimRunner.Match<TView, TData>` to accept `IReadOnlyList<TData>`.
- Added EditMode tests in `RouteTests.cs` (`FixedSeed_OutboundReturnAndSaveRoundTrips_AreDeterministic`) and `FleetSimTests.cs` (active-field `null` / JSON-`null` rock & pirate rejection + read-only collection property checks).

### #94 — Unity build manifest & CI verification

- Updated `WebBuild.BuildForPages()` (`WebBuild.cs`) to emit `web/public/unity/manifest.json` containing `unityVersion`, `builtAtUtc`, UVCS metadata (`branch`, `changeset`, `dirty`, sorted `dirtyItems`), and sorted SHA-256 digests + byte sizes for every file under `web/public/unity/Build/`.
- Added `scripts/verify-unity-manifest.mjs` (and `--require-clean` for CI), wired it into `.github/workflows/ci.yml`, and added unit tests in `web/tests/manifest.test.mjs` covering clean vs dirty manifests, missing player files, extra un-manifested files, and hash mismatches.
- Updated [documentation/agents/unity-web-build.md](../../agents/unity-web-build.md) and [documentation/web-shell.md](../../web-shell.md).

### #99 — v0.15.0 playtest follow-ups

- **Scout survey notices (`FleetSim.Field.cs`, `FleetSim.Support.cs`, `FleetNotice.cs`, `SupportTests.cs`):** Tagged `SimEventKind.SurveyComplete` with `Amount > 0` for explicit survey orders and `0` for automatic scout scans so `FleetNotice.From` suppresses empty auto-scan spam (`Index == 0 && Amount <= 0`) while keeping automatic vein discoveries and explicit `OrderKind.Survey` feedback intact.
- **Support ship HUD hints (`HudController.Commands.cs`):** Separated `selection.Supports` from `Barges`/`Haulers` so Repair ships, Scouts, and mixed support selections display dedicated role titles and right-click/touch controls (including repair and `V` survey hints) instead of `"LOGISTICS SHIP"`.
- **Events wrapping & modal layering (`Hud.uss`, `Hud.uxml`):** Set `flex-grow: 0; flex-shrink: 0; padding: 4px 8px;` on `.event-log-row` so wrapped multiline event entries do not overlap at narrow/compact widths; moved `#waveMarker` before `#starMapBackdrop` so edge wave markers render behind modals.
- **Scout ring & barge cargo visuals (`MiningFleetSceneBuilder.cs`, `FleetPalette.cs`, `SupportView.cs`):** Thinned `ScanRing` (`widthMultiplier = 0.14f`), lowered alpha (`0.35f` with gentle fade across scan progress), and replaced the flat `CargoFill` box on `Barge.prefab` with a multi-piece heaped ore mound under `CargoPivot`.

## Verification

- **Unity EditMode (`./scripts/unity-check.sh`):** `274 of 274 passed`.
- **UVCS check-in & merge:** `cs:87` on `/main/feature-93-94-99-snapshot-manifest-polish`, merged into `/main` as `cs:88`.
- **Unity Web build + clean manifest:** `Succeeded size=10.3MB errors=0`, `node scripts/verify-unity-manifest.mjs --require-clean` verified `/main@cs:88 (clean), 4 files`.
- **Web shell (`pnpm run check` & `pnpm run build`):** `0` lint warnings/errors, `oxfmt --check` passed, `tsc -p .` passed, `11 of 11` Node tests (`save.test.mjs` + `manifest.test.mjs`) passed, Vite production build succeeded.
- **Browser QA (`http://localhost:5202/`):** Verified `v0.17.0 · WebGPU · Unity 6000.6.8f1` (`1280×800`) and `v0.17.0 · WebGL 2 · Unity 6000.6.8f1` (`844×390`) with `0` console/page errors, confirming support-ship HUD commands/hints, wrapped Events row stacking, Route Map modal layering, scout `ScanRing`, and barge cargo fill.
